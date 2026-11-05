// Patient side of the pharmacy intake: no account. The patient's device keeps the token returned on send
// and uses it to read the pharmacy's replies; only the token's SHA-256 is stored.
import { jsonResponse } from '../http';
import { logEvent } from './events';
import { sha256Hex } from './pharmacyAuth';
import { processIntake } from './process';
import {
  IMAGE_MEDIA_TYPES,
  INTAKE_TTL_DAYS,
  LANGS,
  MAX_CARD_JSON,
  MAX_IMAGE_B64,
  MAX_IMAGES,
  PICKUP_CODES,
  type IntakeStatus,
  type Lang,
  type PickupCode,
} from './types';

const PER_IP_DAILY_SENDS = 10;
const PER_PHARMACY_DAILY_SENDS = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

type ActivePharmacy = { id: number; name: string };

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function findPharmacy(db: D1Database, code: string): Promise<ActivePharmacy | null> {
  if (!code) return null;
  // a plan-A pharmacy only checks walk-in prescriptions, and one that hasn't chosen its plan yet takes nothing:
  // to a patient either looks like an unknown code
  return (
    (await db
      .prepare("SELECT id, name FROM pharmacies WHERE code = ? AND disabled_at IS NULL AND plan != 'A' AND plan_chosen_at IS NOT NULL")
      .bind(code)
      .first<ActivePharmacy>()) ?? null
  );
}

export async function handlePharmacyLookup(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const ph = await findPharmacy(env.DB, url.searchParams.get('code') ?? '');
  return ph ? jsonResponse({ name: ph.name }, 200, corsHeaders) : jsonResponse({ error: 'not_found' }, 404, corsHeaders);
}

// Returns false when the counter for `key` already reached `limit` today; otherwise counts this request.
export async function bumpDaily(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  const count = parseInt((await kv.get(key)) ?? '0', 10);
  if (count >= limit) return false;
  await kv.put(key, String(count + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

// 1..MAX_IMAGES prescription photos as base64. Shared with the walk-in check (walkinCheck.ts).
export function parseImages(value: unknown): { base64: string; mediaType: string }[] | 'invalid' | 'image_too_large' {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_IMAGES) return 'invalid';
  const images: { base64: string; mediaType: string }[] = [];
  for (const img of value) {
    if (!img || typeof img !== 'object') return 'invalid';
    const { base64, mediaType } = img as Record<string, unknown>;
    if (typeof base64 !== 'string' || !base64 || !IMAGE_MEDIA_TYPES.includes(mediaType as (typeof IMAGE_MEDIA_TYPES)[number])) return 'invalid';
    if (base64.length > MAX_IMAGE_B64) return 'image_too_large';
    images.push({ base64, mediaType: mediaType as string });
  }
  return images;
}

type SendInput = {
  pharmacyCode: string;
  clientRequestId: string;
  lang: Lang;
  pickup: PickupCode;
  cardJson: string;
  images: { base64: string; mediaType: string }[];
  notifyEmail: string | null;
};

// 'invalid' | 'image_too_large' | parsed input
function parseSend(body: unknown): SendInput | 'invalid' | 'image_too_large' {
  if (!body || typeof body !== 'object') return 'invalid';
  const b = body as Record<string, unknown>;
  if (b.consent !== true) return 'invalid';
  if (typeof b.pharmacyCode !== 'string' || typeof b.clientRequestId !== 'string') return 'invalid';
  if (!b.clientRequestId || b.clientRequestId.length > 100) return 'invalid';
  if (!LANGS.includes(b.lang as Lang) || !PICKUP_CODES.includes(b.pickup as PickupCode)) return 'invalid';
  if (!b.card || typeof b.card !== 'object' || Array.isArray(b.card)) return 'invalid';
  const cardJson = JSON.stringify(b.card);
  if (cardJson.length > MAX_CARD_JSON) return 'invalid';
  const images = parseImages(b.images);
  if (typeof images === 'string') return images;
  let notifyEmail: string | null = null;
  if (b.notifyEmail !== undefined && b.notifyEmail !== null && b.notifyEmail !== '') {
    if (typeof b.notifyEmail !== 'string') return 'invalid';
    const e = b.notifyEmail.trim().toLowerCase();
    if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'invalid';
    notifyEmail = e;
  }
  return {
    pharmacyCode: b.pharmacyCode.trim(),
    clientRequestId: b.clientRequestId,
    lang: b.lang as Lang,
    pickup: b.pickup as PickupCode,
    cardJson,
    images,
    notifyEmail,
  };
}

export async function handleSendIntake(request: Request, env: Env, ctx: ExecutionContext, corsHeaders: Record<string, string>): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
  }
  const input = parseSend(body);
  if (input === 'invalid') return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
  if (input === 'image_too_large') return jsonResponse({ error: 'image_too_large' }, 413, corsHeaders);

  const ph = await findPharmacy(env.DB, input.pharmacyCode);
  if (!ph) return jsonResponse({ error: 'pharmacy_not_found' }, 404, corsHeaders);

  const patientToken = randomHex(32);
  const tokenHash = await sha256Hex(patientToken);

  // A resend after a dropped connection: hand back the same intake with a fresh token.
  const existing = await env.DB.prepare('SELECT id FROM intakes WHERE pharmacy_id = ? AND client_request_id = ?')
    .bind(ph.id, input.clientRequestId)
    .first<{ id: string }>();
  if (existing) {
    await env.DB.prepare('UPDATE intakes SET patient_token_hash = ? WHERE id = ?').bind(tokenHash, existing.id).run();
    return jsonResponse({ intakeId: existing.id, patientToken }, 201, corsHeaders);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const today = new Date().toISOString().slice(0, 10);
  if (!(await bumpDaily(env.RATE_LIMIT_KV, `intake-ip:${ip}:${today}`, PER_IP_DAILY_SENDS))) {
    return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
  }
  if (!(await bumpDaily(env.RATE_LIMIT_KV, `intake-ph:${ph.id}:${today}`, PER_PHARMACY_DAILY_SENDS))) {
    return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
  }

  const intakeId = randomHex(16);
  const now = new Date();
  const stmts = [
    env.DB.prepare(
      `INSERT INTO intakes (id, pharmacy_id, client_request_id, patient_token_hash, lang, pickup, card_json, notify_email, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      intakeId,
      ph.id,
      input.clientRequestId,
      tokenHash,
      input.lang,
      input.pickup,
      input.cardJson,
      input.notifyEmail,
      now.toISOString(),
      new Date(now.getTime() + INTAKE_TTL_DAYS * DAY_MS).toISOString(),
    ),
    ...input.images.map((img, idx) =>
      env.DB.prepare('INSERT INTO intake_images (intake_id, idx, media_type, data_b64) VALUES (?, ?, ?, ?)').bind(intakeId, idx, img.mediaType, img.base64),
    ),
  ];
  await env.DB.batch(stmts);
  await logEvent(env.DB, ph.id, intakeId, 'received', { lang: input.lang });
  ctx.waitUntil(processIntake(env, intakeId));
  return jsonResponse({ intakeId, patientToken }, 201, corsHeaders);
}

export async function handleIntakeStatus(intakeId: string, request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const token = request.headers.get('X-Intake-Token') ?? '';
  const notFound = () => jsonResponse({ error: 'not_found' }, 404, corsHeaders);
  if (!/^[0-9a-f]{32}$/.test(intakeId) || !token) return notFound();
  const row = await env.DB.prepare(
    `SELECT i.status, i.later_time, i.created_at, i.patient_token_hash, p.name AS pharmacy_name
     FROM intakes i JOIN pharmacies p ON p.id = i.pharmacy_id WHERE i.id = ?`,
  )
    .bind(intakeId)
    .first<{ status: IntakeStatus; later_time: string | null; created_at: string; patient_token_hash: string; pharmacy_name: string }>();
  if (!row || row.patient_token_hash !== (await sha256Hex(token))) return notFound();
  const { results } = await env.DB.prepare('SELECT text_patient, text_ja, created_at FROM intake_messages WHERE intake_id = ? ORDER BY id')
    .bind(intakeId)
    .all<{ text_patient: string; text_ja: string; created_at: string }>();
  return jsonResponse(
    {
      pharmacyName: row.pharmacy_name,
      status: row.status,
      laterTime: row.later_time,
      createdAt: row.created_at,
      messages: results.map((m) => ({ textPatient: m.text_patient, textJa: m.text_ja, createdAt: m.created_at })),
    },
    200,
    corsHeaders,
  );
}
