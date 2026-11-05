import { env, exports } from 'cloudflare:workers';

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

let seq = 0;

// Inserts a pharmacy that still has a one-time setup code (no password yet).
// planChosen: false = registered without --plan, so the pharmacy has not picked its plan yet
export async function insertPharmacy(
  opts: { setupCode?: string; setupExpiresAt?: string; disabled?: boolean; plan?: 'A' | 'B' | 'AB'; planChosen?: boolean } = {},
) {
  seq += 1;
  const code = `testph${seq}${Math.random().toString(36).slice(2, 6)}`;
  const email = `${code}@example.jp`;
  const setupCode = opts.setupCode ?? `setup-${code}`;
  const now = new Date();
  const expires = opts.setupExpiresAt ?? new Date(now.getTime() + 14 * 86400000).toISOString();
  const row = await env.DB.prepare(
    `INSERT INTO pharmacies (code, name, login_email, setup_code_hash, setup_expires_at, created_at, disabled_at, plan, plan_chosen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  )
    .bind(
      code,
      `テスト薬局${seq}`,
      email,
      await sha256Hex(setupCode),
      expires,
      now.toISOString(),
      opts.disabled ? now.toISOString() : null,
      opts.plan ?? 'AB',
      opts.planChosen === false ? null : now.toISOString(),
    )
    .first<{ id: number }>();
  return { id: row!.id, code, email, setupCode, name: `テスト薬局${seq}` };
}

export function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Response> {
  // A fresh client IP per call unless the test pins one, so per-IP rate limits don't leak between tests.
  const ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}-${Math.random().toString(36).slice(2, 8)}`;
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'https://rxhelper.jp', 'CF-Connecting-IP': ip, ...headers },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  return exports.default.fetch(new Request(`https://api.test${path}`, init));
}

// Creates a pharmacy, sets its password and logs in. Returns the session token.
export async function loggedInPharmacy(plan: 'A' | 'B' | 'AB' = 'AB', planChosen = true) {
  const ph = await insertPharmacy({ plan, planChosen });
  await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: 'correct-horse-1' });
  const res = await call('POST', '/pharmacy/login', { email: ph.email, password: 'correct-horse-1' });
  const { token } = (await res.json()) as { token: string };
  return { ...ph, token };
}

export const TINY_JPEG = { base64: 'aGVsbG8gd29ybGQ=', mediaType: 'image/jpeg' as const };

export function sendBody(pharmacyCode: string, overrides: Record<string, unknown> = {}) {
  return {
    pharmacyCode,
    clientRequestId: crypto.randomUUID(),
    lang: 'vi',
    pickup: 'today17',
    card: { lang: 'vi', notes: '', textLang: {}, translations: {} },
    images: [TINY_JPEG],
    consent: true,
    ...overrides,
  };
}

// Inserts an intake row (plus one photo) directly, bypassing the send endpoint.
export async function insertIntake(pharmacyId: number, opts: { card?: unknown; lang?: string; createdAt?: Date; status?: string } = {}) {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const created = opts.createdAt ?? new Date();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO intakes (id, pharmacy_id, client_request_id, patient_token_hash, lang, pickup, card_json, status, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'today17', ?, ?, ?, ?)`,
    ).bind(
      id,
      pharmacyId,
      crypto.randomUUID(),
      await sha256Hex(`token-${id}`),
      opts.lang ?? 'vi',
      JSON.stringify(opts.card ?? { lang: 'vi', notes: '', textLang: {}, translations: {} }),
      opts.status ?? 'new',
      created.toISOString(),
      new Date(created.getTime() + 7 * 86400000).toISOString(),
    ),
    env.DB.prepare("INSERT INTO intake_images (intake_id, idx, media_type, data_b64) VALUES (?, 0, 'image/jpeg', 'aGVsbG8=')").bind(id),
  ]);
  return { id, patientToken: `token-${id}` };
}
