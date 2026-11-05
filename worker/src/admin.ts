// The operator's admin screen (app/admin/index.tsx). One operator, one long random key: ADMIN_TOKEN, set with
// `wrangler secret put ADMIN_TOKEN`. Without it every /admin route is a 404. Patients' prescriptions and answers are
// never shown here -- only counts.
import { checkAndBumpAuthAttempts, normalizeEmail } from './authRoutes';
import { jsonResponse } from './http';
import { changePlan, isPlan, randomCode, SETUP_TTL_DAYS, sha256Hex, siteBase } from './intake/pharmacyAuth';

const DAY_MS = 24 * 60 * 60 * 1000;
const STATS_DAYS = 30;

type Pharmacy = {
  id: number;
  code: string;
  name: string;
  login_email: string;
  plan: 'A' | 'B' | 'AB';
  plan_chosen_at: string | null;
  created_at: string;
  disabled_at: string | null;
  last_login_at: string | null;
  password_set: number;
  setup_expires_at: string | null;
};

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Compares hashes, so the time taken doesn't depend on how much of the key matched.
async function isAdmin(request: Request, env: Env): Promise<boolean> {
  const header = request.headers.get('Authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!given || !env.ADMIN_TOKEN) return false;
  return (await sha256Hex(given)) === (await sha256Hex(env.ADMIN_TOKEN));
}

async function newSetupLink(request: Request, env: Env, pharmacyId: number, code: string): Promise<string> {
  const setupCode = randomCode(24);
  await env.DB.prepare('UPDATE pharmacies SET setup_code_hash = ?, setup_expires_at = ? WHERE id = ?')
    .bind(await sha256Hex(setupCode), new Date(Date.now() + SETUP_TTL_DAYS * DAY_MS).toISOString(), pharmacyId)
    .run();
  return `${siteBase(request, env)}/pharmacy/setup?code=${code}&s=${setupCode}`;
}

async function listPharmacies(env: Env): Promise<unknown[]> {
  const since = new Date(Date.now() - STATS_DAYS * DAY_MS).toISOString();
  const now = new Date().toISOString();
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.code, p.name, p.login_email, p.plan, p.plan_chosen_at, p.created_at, p.disabled_at, p.last_login_at,
            p.password_hash IS NOT NULL AS password_set, p.setup_expires_at,
            (SELECT COUNT(*) FROM intake_events e WHERE e.pharmacy_id = p.id AND e.event = 'received' AND e.at >= ?1) AS sends30,
            (SELECT COUNT(*) FROM intake_events e WHERE e.pharmacy_id = p.id AND e.event = 'walkin_check' AND e.at >= ?1) AS checks30,
            (SELECT MAX(e.at) FROM intake_events e WHERE e.pharmacy_id = p.id) AS last_activity_at,
            (SELECT COUNT(*) FROM intakes i WHERE i.pharmacy_id = p.id AND i.status != 'done' AND i.expires_at > ?2) AS open_intakes,
            (SELECT COUNT(*) FROM pharmacy_feedback f WHERE f.pharmacy_id = p.id AND f.read_at IS NULL) AS unread_feedback
       FROM pharmacies p ORDER BY p.created_at DESC`,
  )
    .bind(since, now)
    .all<Pharmacy & Record<string, unknown>>();
  return results.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    email: r.login_email,
    plan: r.plan,
    planChosen: r.plan_chosen_at !== null,
    createdAt: r.created_at,
    disabled: r.disabled_at !== null,
    lastLoginAt: r.last_login_at,
    passwordSet: r.password_set === 1,
    setupLinkValid: r.setup_expires_at !== null && r.setup_expires_at > now,
    sends30: r.sends30,
    checks30: r.checks30,
    lastActivityAt: r.last_activity_at,
    openIntakes: r.open_intakes,
    unreadFeedback: r.unread_feedback,
  }));
}

export async function routeAdmin(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/admin/')) return null;
  if (!env.ADMIN_TOKEN) return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
  if (!(await isAdmin(request, env))) {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    if (!(await checkAndBumpAuthAttempts(env, ip))) return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
    return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  }
  const route = `${request.method} ${url.pathname}`;

  if (route === 'GET /admin/pharmacies') return jsonResponse({ items: await listPharmacies(env) }, 200, corsHeaders);

  if (route === 'POST /admin/pharmacies') {
    const body = await readJson(request);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(body.email);
    const plan = body.plan === undefined || body.plan === null || body.plan === '' ? null : body.plan;
    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (plan !== null && !isPlan(plan))) {
      return jsonResponse({ error: 'invalid_pharmacy' }, 400, corsHeaders);
    }
    const taken = await env.DB.prepare('SELECT 1 FROM pharmacies WHERE login_email = ?').bind(email).first();
    if (taken) return jsonResponse({ error: 'email_taken' }, 409, corsHeaders);
    const code = randomCode(10);
    const now = new Date().toISOString();
    const row = await env.DB.prepare(
      'INSERT INTO pharmacies (code, name, login_email, created_at, plan, plan_chosen_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
    )
      .bind(code, name, email, now, plan ?? 'AB', plan ? now : null)
      .first<{ id: number }>();
    const setupUrl = await newSetupLink(request, env, row!.id, code);
    return jsonResponse({ id: row!.id, code, setupUrl, patientUrl: `${siteBase(request, env)}/send?ph=${code}` }, 201, corsHeaders);
  }

  const one = url.pathname.match(/^\/admin\/pharmacies\/(\d+)\/(setup-link|plan|disabled)$/);
  if (one && request.method === 'POST') {
    const id = Number(one[1]);
    const ph = await env.DB.prepare('SELECT id, code, plan FROM pharmacies WHERE id = ?').bind(id).first<Pick<Pharmacy, 'id' | 'code' | 'plan'>>();
    if (!ph) return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
    if (one[2] === 'setup-link') return jsonResponse({ setupUrl: await newSetupLink(request, env, ph.id, ph.code) }, 200, corsHeaders);
    const body = await readJson(request);
    if (one[2] === 'plan') {
      if (!isPlan(body.plan)) return jsonResponse({ error: 'invalid_plan' }, 400, corsHeaders);
      const open = await changePlan(env.DB, ph.id, ph.plan, body.plan);
      if (open > 0) return jsonResponse({ error: 'open_intakes', count: open }, 409, corsHeaders);
      return jsonResponse({ ok: true }, 200, corsHeaders);
    }
    if (typeof body.disabled !== 'boolean') return jsonResponse({ error: 'invalid_disabled' }, 400, corsHeaders);
    // stopping a pharmacy also ends its logins; patients already can't reach a disabled pharmacy
    await env.DB.batch([
      env.DB.prepare('UPDATE pharmacies SET disabled_at = ? WHERE id = ?').bind(body.disabled ? new Date().toISOString() : null, ph.id),
      ...(body.disabled ? [env.DB.prepare('DELETE FROM pharmacy_sessions WHERE pharmacy_id = ?').bind(ph.id)] : []),
    ]);
    return jsonResponse({ ok: true }, 200, corsHeaders);
  }

  if (route === 'GET /admin/feedback') {
    const { results } = await env.DB.prepare(
      `SELECT f.id, f.created_at AS createdAt, f.body, f.read_at IS NOT NULL AS read, p.name AS pharmacyName, p.plan
         FROM pharmacy_feedback f JOIN pharmacies p ON p.id = f.pharmacy_id ORDER BY f.created_at DESC LIMIT 200`,
    ).all<{ id: number; createdAt: string; body: string; read: number; pharmacyName: string; plan: string }>();
    return jsonResponse({ items: results.map((r) => ({ ...r, read: r.read === 1 })) }, 200, corsHeaders);
  }

  const read = url.pathname.match(/^\/admin\/feedback\/(\d+)\/read$/);
  if (read && request.method === 'POST') {
    await env.DB.prepare('UPDATE pharmacy_feedback SET read_at = COALESCE(read_at, ?) WHERE id = ?').bind(new Date().toISOString(), Number(read[1])).run();
    return jsonResponse({ ok: true }, 200, corsHeaders);
  }

  return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
}
