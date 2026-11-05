// Feedback a pharmacy sends from its console (app/pharmacy/feedback.tsx). Stored for the operator's admin screen and
// mailed to OPERATOR_EMAIL. The screen asks not to write anything that identifies a patient.
import { sendOperatorMail } from '../email';
import { jsonResponse } from '../http';
import { resolvePharmacySession } from './pharmacyAuth';
import { bumpDaily } from './patientRoutes';

export const MAX_FEEDBACK_CHARS = 2000;
const PER_PHARMACY_DAILY = 20;
const PLAN_JA = { A: 'プランA', B: 'プランB', AB: 'プランAB' } as const;

export async function handlePharmacyFeedback(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const pharmacy = await resolvePharmacySession(request, env.DB);
  if (!pharmacy) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);

  let body: unknown;
  try {
    body = ((await request.json()) as { body?: unknown })?.body;
  } catch {
    body = undefined;
  }
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text || text.length > MAX_FEEDBACK_CHARS) return jsonResponse({ error: 'invalid_feedback' }, 400, corsHeaders);

  const today = new Date().toISOString().slice(0, 10);
  if (!(await bumpDaily(env.RATE_LIMIT_KV, `ph-feedback:${pharmacy.id}:${today}`, PER_PHARMACY_DAILY))) {
    return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
  }

  await env.DB.prepare('INSERT INTO pharmacy_feedback (pharmacy_id, created_at, body) VALUES (?, ?, ?)')
    .bind(pharmacy.id, new Date().toISOString(), text)
    .run();

  if (env.OPERATOR_EMAIL) {
    try {
      await sendOperatorMail(
        env.OPERATOR_EMAIL,
        `【処方箋ヘルパー】${pharmacy.name}からご意見が届きました`,
        `${pharmacy.name}（${PLAN_JA[pharmacy.plan]}）から、受付画面でご意見が届きました。\n\n${text}\n\n管理画面：https://rxhelper.jp/admin`,
        env.RESEND_API_KEY,
      );
    } catch (err) {
      // stored already; the operator still sees it on the admin screen
      console.error('feedback_mail_failed', err);
    }
  }
  return jsonResponse({ ok: true }, 201, corsHeaders);
}
