// Pharmacy accounts for the intake inbox. The operator registers a pharmacy with a one-time setup
// code (worker/scripts/new-pharmacy.mjs); the pharmacy then sets its own password, so the operator
// never knows it. Sessions are separate from patient sessions (pharmacy_sessions table).
import { extractBearerToken, generateSessionToken, hashPassword, verifyPassword } from '../auth';
import { checkAndBumpAuthAttempts, normalizeEmail } from '../authRoutes';
import { jsonResponse } from '../http';

export const PHARMACY_SESSION_TTL_DAYS = 30;
export const SETUP_TTL_DAYS = 14;
const MIN_PASSWORD_LENGTH = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

export type PharmacyPlan = 'A' | 'B' | 'AB';
export type PharmacySession = { id: number; name: string; code: string; plan: PharmacyPlan };

// A = walk-in stock check, B = patient sending + questionnaire inbox, AB = both.
export const hasStockCheck = (plan: PharmacyPlan) => plan !== 'B';
export const hasIntake = (plan: PharmacyPlan) => plan !== 'A';

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
  await env.DB.prepare(
    'UPDATE pharmacies SET password_hash = ?, password_salt = ?, setup_code_hash = NULL, setup_expires_at = NULL WHERE id = ? AND setup_code_hash IS NOT NULL',
  )
    .bind(hash, salt, row.id)
    .run();
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
  await env.DB.prepare('INSERT INTO pharmacy_sessions (token, pharmacy_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(token, row.id, now.toISOString(), new Date(now.getTime() + PHARMACY_SESSION_TTL_DAYS * DAY_MS).toISOString())
    .run();
  return jsonResponse({ token, pharmacy: { name: row.name, code: row.code, plan: row.plan } }, 200, corsHeaders);
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
      `SELECT p.id, p.name, p.code, p.plan FROM pharmacy_sessions s JOIN pharmacies p ON p.id = s.pharmacy_id
       WHERE s.token = ? AND s.expires_at > ? AND p.disabled_at IS NULL`,
    )
    .bind(token, new Date().toISOString())
    .first<PharmacySession>();
  return row ?? null;
}

// The console asks on every open: sessions saved before plans existed don't know theirs, and the operator may change it.
export async function handlePharmacyMe(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const pharmacy = await resolvePharmacySession(request, env.DB);
  if (!pharmacy) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  return jsonResponse({ name: pharmacy.name, code: pharmacy.code, plan: pharmacy.plan }, 200, corsHeaders);
}
