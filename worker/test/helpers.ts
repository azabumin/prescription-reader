import { env, exports } from 'cloudflare:workers';

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

let seq = 0;

// Inserts a pharmacy that still has a one-time setup code (no password yet).
export async function insertPharmacy(opts: { setupCode?: string; setupExpiresAt?: string; disabled?: boolean } = {}) {
  seq += 1;
  const code = `testph${seq}${Math.random().toString(36).slice(2, 6)}`;
  const email = `${code}@example.jp`;
  const setupCode = opts.setupCode ?? `setup-${code}`;
  const now = new Date();
  const expires = opts.setupExpiresAt ?? new Date(now.getTime() + 14 * 86400000).toISOString();
  const row = await env.DB.prepare(
    `INSERT INTO pharmacies (code, name, login_email, setup_code_hash, setup_expires_at, created_at, disabled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(code, `テスト薬局${seq}`, email, await sha256Hex(setupCode), expires, now.toISOString(), opts.disabled ? now.toISOString() : null)
    .first<{ id: number }>();
  return { id: row!.id, code, email, setupCode, name: `テスト薬局${seq}` };
}

export function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Response> {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json', Origin: 'https://rxhelper.jp', ...headers } };
  if (body !== undefined) init.body = JSON.stringify(body);
  return exports.default.fetch(new Request(`https://api.test${path}`, init));
}

// Creates a pharmacy, sets its password and logs in. Returns the session token.
export async function loggedInPharmacy() {
  const ph = await insertPharmacy();
  await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: 'correct-horse-1' });
  const res = await call('POST', '/pharmacy/login', { email: ph.email, password: 'correct-horse-1' });
  const { token } = (await res.json()) as { token: string };
  return { ...ph, token };
}
