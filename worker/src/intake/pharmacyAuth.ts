// Pharmacy accounts for the intake inbox. The operator registers a pharmacy with a one-time setup
// code (worker/scripts/new-pharmacy.mjs); the pharmacy then sets its own password, so the operator
// never knows it. Sessions are separate from patient sessions (pharmacy_sessions table).
import { extractBearerToken, generateSessionToken, hashPassword, verifyPassword } from '../auth';
import { checkAndBumpAuthAttempts, normalizeEmail } from '../authRoutes';
import { sendPasswordResetEmail } from '../email';
import { jsonResponse } from '../http';
import { bumpDaily } from './patientRoutes';

export const PHARMACY_SESSION_TTL_DAYS = 30;
export const SETUP_TTL_DAYS = 14;
// A "forgot password" link reuses the setup code but only lives an hour (the email says so).
const RESET_TTL_MS = 60 * 60 * 1000;
const RESETS_PER_EMAIL_PER_DAY = 5;
const MIN_PASSWORD_LENGTH = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

// Same alphabet as scripts/new-pharmacy.mjs: no 0/o/1/l, since codes get printed and sometimes typed by hand.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
export function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  // 256 is a multiple of 32, so the modulo keeps every letter equally likely
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

// Links in emails and on the admin screen point at the site the request came from, if it's one of ours.
export function siteBase(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') ?? '';
  return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).includes(origin) ? origin : 'https://rxhelper.jp';
}

export type PharmacyPlan = 'A' | 'B' | 'AB';
// planChosenAt is null until the pharmacy picks its plan on the plan screen (migration 0008).
export type PharmacySession = { id: number; name: string; code: string; plan: PharmacyPlan; planChosenAt: string | null };

// A = walk-in stock check, B = patient sending + questionnaire inbox, AB = both.
export const hasStockCheck = (plan: PharmacyPlan) => plan !== 'B';
export const hasIntake = (plan: PharmacyPlan) => plan !== 'A';
const isPlan = (v: unknown): v is PharmacyPlan => v === 'A' || v === 'B' || v === 'AB';

type PharmacyRow = {
  id: number;
  code: string;
  name: string;
  login_email: string;
  password_hash: string | null;
  password_salt: string | null;
  setup_code_hash: string | null;
  setup_expires_at: string | null;
  disabled_at: string | null;
  plan: PharmacyPlan;
  plan_chosen_at: string | null;
};

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function handlePharmacySetup(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await checkAndBumpAuthAttempts(env, ip))) return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);

  const body = await readJson(request);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const setupCode = typeof body?.setupCode === 'string' ? body.setupCode.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!code || !setupCode) return jsonResponse({ error: 'invalid_setup' }, 400, corsHeaders);

  const row = await env.DB.prepare('SELECT * FROM pharmacies WHERE code = ?').bind(code).first<PharmacyRow>();
  const now = new Date();
  const valid =
    row &&
    !row.disabled_at &&
    row.setup_code_hash !== null &&
    row.setup_expires_at !== null &&
    new Date(row.setup_expires_at) > now &&
    row.setup_code_hash === (await sha256Hex(setupCode));
  if (!valid) return jsonResponse({ error: 'invalid_setup' }, 400, corsHeaders);
  if (password.length < MIN_PASSWORD_LENGTH) return jsonResponse({ error: 'weak_password' }, 400, corsHeaders);

  const { hash, salt } = await hashPassword(password, env.PASSWORD_PEPPER);
  // The setup code is single-use: clearing it in the same statement means a replay finds nothing.
  // A new password (first setup or a reset) also ends every existing login of the pharmacy.
  await env.DB.batch([
    env.DB.prepare(
      'UPDATE pharmacies SET password_hash = ?, password_salt = ?, setup_code_hash = NULL, setup_expires_at = NULL WHERE id = ? AND setup_code_hash IS NOT NULL',
    ).bind(hash, salt, row.id),
    env.DB.prepare('DELETE FROM pharmacy_sessions WHERE pharmacy_id = ?').bind(row.id),
  ]);
  return jsonResponse({ ok: true }, 200, corsHeaders);
}

// "Forgot password": mails a one-hour link to the setup screen. Same answer whether or not the address is registered.
export async function handlePharmacyForgot(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await checkAndBumpAuthAttempts(env, ip))) return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);

  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  if (!email) return jsonResponse({ ok: true }, 200, corsHeaders);

  const today = new Date().toISOString().slice(0, 10);
  if (!(await bumpDaily(env.RATE_LIMIT_KV, `ph-reset:${email}:${today}`, RESETS_PER_EMAIL_PER_DAY))) {
    return jsonResponse({ ok: true }, 200, corsHeaders);
  }
  const row = await env.DB.prepare('SELECT id, code FROM pharmacies WHERE login_email = ? AND disabled_at IS NULL')
    .bind(email)
    .first<{ id: number; code: string }>();
  if (row) {
    const setupCode = randomCode(24);
    await env.DB.prepare('UPDATE pharmacies SET setup_code_hash = ?, setup_expires_at = ? WHERE id = ?')
      .bind(await sha256Hex(setupCode), new Date(Date.now() + RESET_TTL_MS).toISOString(), row.id)
      .run();
    const url = `${siteBase(request, env)}/pharmacy/setup?code=${row.code}&s=${setupCode}`;
    try {
      await sendPasswordResetEmail(email, url, 'ja', env.RESEND_API_KEY);
    } catch (err) {
      console.error('pharmacy_reset_email_failed', err);
    }
  }
  return jsonResponse({ ok: true }, 200, corsHeaders);
}

export async function handlePharmacyLogin(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await checkAndBumpAuthAttempts(env, ip))) return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);

  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return jsonResponse({ error: 'invalid_credentials' }, 401, corsHeaders);

  const row = await env.DB.prepare('SELECT * FROM pharmacies WHERE login_email = ?').bind(email).first<PharmacyRow>();
  const ok =
    row && !row.disabled_at && row.password_hash && row.password_salt
      ? await verifyPassword(password, row.password_hash, row.password_salt, env.PASSWORD_PEPPER)
      : false;
  if (!row || !ok) return jsonResponse({ error: 'invalid_credentials' }, 401, corsHeaders);

  const token = generateSessionToken();
  const now = new Date();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO pharmacy_sessions (token, pharmacy_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(
      token,
      row.id,
      now.toISOString(),
      new Date(now.getTime() + PHARMACY_SESSION_TTL_DAYS * DAY_MS).toISOString(),
    ),
    env.DB.prepare('UPDATE pharmacies SET last_login_at = ? WHERE id = ?').bind(now.toISOString(), row.id),
  ]);
  return jsonResponse(
    { token, pharmacy: { name: row.name, code: row.code, plan: row.plan, planChosen: row.plan_chosen_at !== null } },
    200,
    corsHeaders,
  );
}

export async function handlePharmacyLogout(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const token = extractBearerToken(request);
  if (token) await env.DB.prepare('DELETE FROM pharmacy_sessions WHERE token = ?').bind(token).run();
  return jsonResponse({ ok: true }, 200, corsHeaders);
}

export async function resolvePharmacySession(request: Request, db: D1Database): Promise<PharmacySession | null> {
  const token = extractBearerToken(request);
  if (!token) return null;
  const row = await db
    .prepare(
      `SELECT p.id, p.name, p.code, p.plan, p.plan_chosen_at AS planChosenAt FROM pharmacy_sessions s JOIN pharmacies p ON p.id = s.pharmacy_id
       WHERE s.token = ? AND s.expires_at > ? AND p.disabled_at IS NULL`,
    )
    .bind(token, new Date().toISOString())
    .first<PharmacySession>();
  return row ?? null;
}

// The console asks on every open: sessions saved before plans existed don't know theirs, and the plan may have been
// changed from another device or by the operator.
export async function handlePharmacyMe(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const pharmacy = await resolvePharmacySession(request, env.DB);
  if (!pharmacy) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  return jsonResponse(
    { name: pharmacy.name, code: pharmacy.code, plan: pharmacy.plan, planChosen: pharmacy.planChosenAt !== null },
    200,
    corsHeaders,
  );
}

// The pharmacy picks or changes its own plan. Moving to A while patient sends are still open is refused: plan A has no
// inbox, so they would vanish from the screen until they expire.
export async function handlePharmacySetPlan(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const pharmacy = await resolvePharmacySession(request, env.DB);
  if (!pharmacy) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  const body = await readJson(request);
  const plan = body?.plan;
  if (!isPlan(plan)) return jsonResponse({ error: 'invalid_plan' }, 400, corsHeaders);
  const open = await changePlan(env.DB, pharmacy.id, pharmacy.plan, plan);
  if (open > 0) return jsonResponse({ error: 'open_intakes', count: open }, 409, corsHeaders);
  return jsonResponse({ plan, planChosen: true }, 200, corsHeaders);
}

export const openIntakeCount = async (db: D1Database, pharmacyId: number): Promise<number> =>
  (await db
    .prepare("SELECT COUNT(*) AS n FROM intakes WHERE pharmacy_id = ? AND status != 'done' AND expires_at > ?")
    .bind(pharmacyId, new Date().toISOString())
    .first<{ n: number }>())?.n ?? 0;

// Saves the plan (and marks it chosen) unless that would hide open patient sends; returns how many are open then
// (0 = saved). Shared by the pharmacy's own plan screen and the operator's admin screen.
export async function changePlan(db: D1Database, pharmacyId: number, from: PharmacyPlan, to: PharmacyPlan): Promise<number> {
  if (!hasIntake(to) && hasIntake(from)) {
    const open = await openIntakeCount(db, pharmacyId);
    if (open > 0) return open;
  }
  await db.prepare('UPDATE pharmacies SET plan = ?, plan_chosen_at = ? WHERE id = ?').bind(to, new Date().toISOString(), pharmacyId).run();
  return 0;
}

export { isPlan };
