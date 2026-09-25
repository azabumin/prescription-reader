// ZEUS LinkPoint (リンク（画面遷移）型) integration.
//
// Flow:
//   1. After the 7-day free trial ends the customer confirms the plan on /subscribe (price,
//      renewal, cancellation all shown) and we hand back LinkPoint form params with money=480
//      via POST /payments/checkout. The customer pays on ZEUS's hosted page (3-D Secure) and the
//      sale is processed immediately (売上処理方法: 即時).
//   2. ZEUS calls GET /payments/webhook (registered with ZEUS's sales rep in advance) with the
//      result. A successful money>0 callback flips the user to 'active' right away.
//   3. Renewals are NOT automatic on ZEUS's side: each month the operator schedules the charge by
//      hand under 継続予約登録 in ZEUS's dashboard using the same sendid (see docs/billing-cycle.md),
//      skipping anyone with canceled_at set and every 13th cycle (loyalty free month). ZEUS calls
//      the same webhook again for each of those charges.
//   money=0 callbacks (a card registered without a charge) are still handled for cards registered
//   before this flow existed; those customers just pay from /subscribe like everyone else.

import { canAnalyze, toSessionUser, type UserRow } from './auth';
import { sendPaymentFailedEmail } from './email';
import { jsonResponse } from './http';

const ZEUS_ORDER_URL = 'https://linkpt.cardservice.co.jp/cgi-bin/credit/order.cgi';
// ZEUS's documented CGI-callback source IPs -- checked as a defense-in-depth measure on top
// of the clientip param match, not the sole guard (see handleZeusWebhook).
const ZEUS_CALLBACK_IPS = new Set(['210.164.6.67', '202.221.139.50']);
export const MONTHLY_PRICE_YEN = 480;
// A real charge grants access for a bit longer than one month so a manual continuous-
// reservation renewal that lands a few days late doesn't lock the customer out early.
const SUBSCRIPTION_GRACE_DAYS = 35;
const BILLING_CYCLE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
// Every 13th cycle (1-indexed) is the loyalty free month -- see the tokushoho page's
// "12ヶ月連続でご利用いただいた場合、13ヶ月目のご利用料金が無料になります" copy. The monthly
// "who's due" query (docs/billing-cycle.md) uses this same modulus to decide who to skip.

export async function handleCheckoutStart(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  userId: number
): Promise<Response> {
  let body: { phone?: unknown; chargeNow?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
  }

  // A stale cached page still shows the old "no charge will be made now" wording and sends no
  // flag -- refuse rather than charge someone under copy that says the opposite.
  if (body.chargeNow !== true) {
    return jsonResponse({ error: 'outdated_client' }, 400, corsHeaders);
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!/^0\d{9,10}$/.test(phone)) {
    return jsonResponse({ error: 'invalid_phone' }, 400, corsHeaders);
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
  if (!user) {
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }

  // Never take a payment from someone who can already use the service (still in trial, or
  // already paid up) -- that would be a double charge.
  if (canAnalyze(toSessionUser(user))) {
    return jsonResponse({ error: 'already_active' }, 409, corsHeaders);
  }

  await env.DB.prepare('UPDATE users SET phone = ? WHERE id = ?').bind(phone, userId).run();

  const origin = request.headers.get('Origin') ?? 'https://rxhelper.jp';
  return jsonResponse(
    {
      action: ZEUS_ORDER_URL,
      params: {
        clientip: env.ZEUS_IP_CODE,
        money: String(MONTHLY_PRICE_YEN),
        sendid: String(user.id),
        telno: phone,
        email: user.email,
        success_url: `${origin}/payment-result?status=success`,
        success_str: 'アプリに戻る',
        failure_url: `${origin}/payment-result?status=failure`,
        failure_str: 'アプリに戻る',
      },
    },
    200,
    corsHeaders
  );
}

// GET callback ZEUS calls server-to-server after every card registration or charge.
// Must always answer 200 with body "successok" (a non-200 or wrong body makes ZEUS retry and
// eventually email us a CGI-error notice) -- so we ack first and only update our own state.
export async function handleZeusWebhook(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const result = url.searchParams.get('result');
  const clientip = url.searchParams.get('clientip');
  const money = url.searchParams.get('money');
  const sendid = url.searchParams.get('sendid');
  const userId = sendid && /^\d+$/.test(sendid) ? Number(sendid) : null;
  // ZEUS-issued unique transaction id. Retried CGI calls for the *same* transaction (their own
  // docs: auto-retry up to 5x on timeout/disconnect) repeat this same value -- used below so a
  // retry doesn't get double-counted as a second month of billing.
  const ordd = url.searchParams.get('ordd');

  const sourceIp = request.headers.get('CF-Connecting-IP') ?? '';
  const knownSource = ZEUS_CALLBACK_IPS.has(sourceIp);
  const knownAccount = !!clientip && clientip === env.ZEUS_IP_CODE;

  if (knownSource && knownAccount && userId && (result === 'OK' || result === 'NG')) {
    const user = await env.DB.prepare(
      'SELECT email, trial_ends_at, subscription_status, subscription_expires_at, next_charge_due_at, canceled_at, billing_cycle_number, last_processed_ordd FROM users WHERE id = ?'
    )
      .bind(userId)
      .first<
        Pick<
          UserRow,
          'trial_ends_at' | 'subscription_status' | 'subscription_expires_at' | 'next_charge_due_at' | 'canceled_at'
        > & { email: string; billing_cycle_number: number; last_processed_ordd: string | null }
      >();

    const alreadyProcessed = !user || (!!ordd && ordd === user.last_processed_ordd);

    if (alreadyProcessed) {
      // Unknown user, or this exact transaction was already processed (a ZEUS retry) -- ack
      // without touching state again.
    } else if (result === 'NG') {
      // A payment or scheduled renewal failed -- let the customer know so they can try again
      // (or update their card before the grace period runs out).
      await env.DB.prepare('UPDATE users SET last_processed_ordd = ? WHERE id = ?').bind(ordd, userId).run();
      try {
        await sendPaymentFailedEmail(user.email, env.RESEND_API_KEY);
      } catch (err) {
        console.error('payment_failed_email_error', err);
      }
    } else if (money === '0') {
      // Card registration without a charge (only cards registered before the pay-now flow).
      // Never downgrade someone who is already paid up.
      await env.DB.prepare(
        "UPDATE users SET subscription_status = CASE WHEN subscription_status = 'active' THEN 'active' ELSE 'registered' END, next_charge_due_at = CASE WHEN subscription_status = 'active' THEN next_charge_due_at ELSE ? END, last_processed_ordd = ? WHERE id = ?"
      )
        .bind(user.trial_ends_at, ordd, userId)
        .run();
    } else {
      // A real charge succeeded: either the customer's pay-now checkout or a monthly renewal
      // the operator scheduled by hand. Grant access and set the next due date.
      const now = new Date();
      const paidAccessLapsed =
        user.subscription_status !== 'active' ||
        !user.subscription_expires_at ||
        new Date(user.subscription_expires_at).getTime() <= now.getTime();
      const expiresAt = new Date(now.getTime() + SUBSCRIPTION_GRACE_DAYS * DAY_MS).toISOString();
      // An on-time renewal keeps its cadence (due date + 30d); a first or late payment counts
      // 30 days from today instead of from a due date that is already in the past.
      const dueBaseline =
        !paidAccessLapsed && user.next_charge_due_at && new Date(user.next_charge_due_at).getTime() > now.getTime()
          ? new Date(user.next_charge_due_at)
          : now;
      const nextDue = new Date(dueBaseline.getTime() + BILLING_CYCLE_DAYS * DAY_MS).toISOString();
      // Paying again after the access had lapsed starts a fresh subscription and a fresh
      // "12 months in a row" streak. A stray charge while a cancellation is still pending (the
      // ZEUS reservation wasn't deleted) still pays for a month but must not undo the cancellation.
      const canceledAt = paidAccessLapsed ? null : user.canceled_at;
      const cycle = paidAccessLapsed ? 1 : user.billing_cycle_number + 1;
      await env.DB.prepare(
        "UPDATE users SET subscription_status = 'active', subscription_expires_at = ?, billing_cycle_number = ?, next_charge_due_at = ?, canceled_at = ?, last_processed_ordd = ? WHERE id = ?"
      )
        .bind(expiresAt, cycle, nextDue, canceledAt, ordd, userId)
        .run();
    }
  } else if (result === 'OK' || result === 'NG') {
    // Ack it (ZEUS shouldn't retry), but the IP/account check failed -- worth knowing about.
    console.error('zeus_webhook_untrusted', { sourceIp, clientip, sendid });
  }

  return new Response('successok', { status: 200 });
}
