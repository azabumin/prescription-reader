// Pharmacy side of the intake: inbox, detail, photos. Every route needs a pharmacy session, and a pharmacy only
// ever sees its own intakes (another pharmacy's intake looks exactly like a deleted one).
import { jsonResponse } from '../http';
import { translateToPatient } from './ai';
import type { PharmacyCard } from './cardType';
import { logEvent } from './events';
import { sendStatusEmail } from './notify';
import { hasIntake, resolvePharmacySession, type PharmacySession } from './pharmacyAuth';
import { LATER_TIMES, REPLY_TEMPLATES } from './templates';
import { LANGS, type ExtractedDrug, type IntakeStatus, type Lang, type PickupCode } from './types';

const INBOX_LIMIT = 100;
const MAX_MESSAGE_CHARS = 500;
const PREVIEW_DAILY_LIMIT = 200;

type IntakeRow = {
  id: string;
  pharmacy_id: number;
  lang: string;
  pickup: PickupCode;
  card_json: string | null;
  drugs_json: string | null;
  drugs_status: 'pending' | 'done' | 'failed' | 'skipped';
  notify_email: string | null;
  status: IntakeStatus;
  later_time: string | null;
  created_at: string;
  opened_at: string | null;
  replied_at: string | null;
};

export type PharmacyRouteContext = { request: Request; env: Env; corsHeaders: Record<string, string>; pharmacy: PharmacySession };

export function gone(corsHeaders: Record<string, string>): Response {
  return jsonResponse({ error: 'gone' }, 404, corsHeaders);
}

export async function loadOwnIntake(env: Env, pharmacy: PharmacySession, intakeId: string): Promise<IntakeRow | null> {
  if (!/^[0-9a-f]{32}$/.test(intakeId)) return null;
  return (await env.DB.prepare('SELECT * FROM intakes WHERE id = ? AND pharmacy_id = ?').bind(intakeId, pharmacy.id).first<IntakeRow>()) ?? null;
}

async function listIntakes({ env, corsHeaders, pharmacy }: PharmacyRouteContext): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT id, created_at, lang, pickup, status, drugs_status, opened_at FROM intakes WHERE pharmacy_id = ?
     ORDER BY CASE WHEN status = 'done' THEN 1 ELSE 0 END, created_at DESC LIMIT ?`,
  )
    .bind(pharmacy.id, INBOX_LIMIT)
    .all<Pick<IntakeRow, 'id' | 'created_at' | 'lang' | 'pickup' | 'status' | 'drugs_status' | 'opened_at'>>();
  return jsonResponse(
    {
      items: results.map((r) => ({
        id: r.id,
        createdAt: r.created_at,
        lang: r.lang,
        pickup: r.pickup,
        status: r.status,
        drugsStatus: r.drugs_status,
        opened: r.opened_at !== null,
      })),
    },
    200,
    corsHeaders,
  );
}

async function intakeDetail({ env, corsHeaders, pharmacy }: PharmacyRouteContext, intakeId: string): Promise<Response> {
  const row = await loadOwnIntake(env, pharmacy, intakeId);
  if (!row) return gone(corsHeaders);
  if (!row.opened_at) {
    const opened = await env.DB.prepare('UPDATE intakes SET opened_at = ? WHERE id = ? AND opened_at IS NULL').bind(new Date().toISOString(), row.id).run();
    if (opened.meta.changes > 0) await logEvent(env.DB, pharmacy.id, row.id, 'opened', { lang: row.lang });
  }
  const [images, messages] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM intake_images WHERE intake_id = ?').bind(row.id).first<{ n: number }>(),
    env.DB.prepare('SELECT kind, text_ja, text_patient, created_at FROM intake_messages WHERE intake_id = ? ORDER BY id')
      .bind(row.id)
      .all<{ kind: string; text_ja: string; text_patient: string; created_at: string }>(),
  ]);
  return jsonResponse(
    {
      id: row.id,
      createdAt: row.created_at,
      lang: row.lang,
      pickup: row.pickup,
      status: row.status,
      laterTime: row.later_time,
      drugsStatus: row.drugs_status,
      drugs: row.drugs_json ? (JSON.parse(row.drugs_json) as ExtractedDrug[]) : null,
      card: row.card_json ? (JSON.parse(row.card_json) as PharmacyCard) : null,
      imageCount: images?.n ?? 0,
      messages: messages.results.map((m) => ({ kind: m.kind, textJa: m.text_ja, textPatient: m.text_patient, createdAt: m.created_at })),
    },
    200,
    corsHeaders,
  );
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function intakeImage({ env, corsHeaders, pharmacy }: PharmacyRouteContext, intakeId: string, idx: number): Promise<Response> {
  const row = await loadOwnIntake(env, pharmacy, intakeId);
  if (!row) return gone(corsHeaders);
  const img = await env.DB.prepare('SELECT media_type, data_b64 FROM intake_images WHERE intake_id = ? AND idx = ?').bind(row.id, idx).first<{
    media_type: string;
    data_b64: string;
  }>();
  if (!img) return gone(corsHeaders);
  return new Response(base64ToBytes(img.data_b64), {
    status: 200,
    headers: { 'Content-Type': img.media_type, 'Cache-Control': 'no-store', ...corsHeaders },
  });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await request.json();
    return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function notifyPatient(env: Env, row: IntakeRow): Promise<void> {
  if (row.notify_email) await sendStatusEmail(env, row.notify_email, row.lang as Lang, row.id);
}

async function reply({ request, env, corsHeaders, pharmacy }: PharmacyRouteContext, intakeId: string): Promise<Response> {
  const row = await loadOwnIntake(env, pharmacy, intakeId);
  if (!row) return gone(corsHeaders);
  if (row.status === 'done') return jsonResponse({ error: 'done' }, 409, corsHeaders);
  const body = await readBody(request);
  const status = body?.status;
  if (status !== 'ready' && status !== 'inquiry' && status !== 'later') return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
  const laterTime = status === 'later' ? body?.laterTime : null;
  if (status === 'later' && !LATER_TIMES.includes(laterTime as (typeof LATER_TIMES)[number])) return jsonResponse({ error: 'invalid' }, 400, corsHeaders);

  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE intakes SET status = ?, later_time = ?, replied_at = COALESCE(replied_at, ?) WHERE id = ?')
    .bind(status, laterTime ?? null, now, row.id)
    .run();
  if (!row.replied_at) await logEvent(env.DB, pharmacy.id, row.id, 'replied', { lang: row.lang });
  await notifyPatient(env, row);
  return jsonResponse({ ok: true }, 200, corsHeaders);
}

async function postMessage({ request, env, corsHeaders, pharmacy }: PharmacyRouteContext, intakeId: string): Promise<Response> {
  const row = await loadOwnIntake(env, pharmacy, intakeId);
  if (!row) return gone(corsHeaders);
  if (row.status === 'done') return jsonResponse({ error: 'done' }, 409, corsHeaders);
  const body = await readBody(request);
  let textJa: string;
  let textPatient: string;
  let templateKey: string | null = null;
  if (body?.kind === 'template') {
    const t = REPLY_TEMPLATES.find((x) => x.key === body.templateKey);
    if (!t) return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
    templateKey = t.key;
    textJa = t.text.ja;
    textPatient = t.text[row.lang as Lang] ?? t.text.ja;
  } else if (body?.kind === 'free') {
    // the pharmacist has seen and confirmed this translation (translate-preview); store it as confirmed
    textJa = typeof body.textJa === 'string' ? body.textJa.trim() : '';
    textPatient = typeof body.textPatient === 'string' ? body.textPatient.trim() : '';
    if (!textJa || !textPatient || textJa.length > MAX_MESSAGE_CHARS || textPatient.length > MAX_MESSAGE_CHARS * 3) {
      return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
    }
  } else {
    return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
  }
  await env.DB.prepare('INSERT INTO intake_messages (intake_id, kind, template_key, text_ja, text_patient, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(row.id, body.kind, templateKey, textJa, textPatient, new Date().toISOString())
    .run();
  await notifyPatient(env, row);
  return jsonResponse({ ok: true }, 201, corsHeaders);
}

// 完了: the pharmacy is finished with this patient, so the personal data goes now. The row (status only) stays until
// expires_at so the patient's screen can still say the intake is complete.
async function markDone({ env, corsHeaders, pharmacy }: PharmacyRouteContext, intakeId: string): Promise<Response> {
  const row = await loadOwnIntake(env, pharmacy, intakeId);
  if (!row) return gone(corsHeaders);
  if (row.status !== 'done') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM intake_images WHERE intake_id = ?').bind(row.id),
      env.DB.prepare('DELETE FROM intake_messages WHERE intake_id = ?').bind(row.id),
      env.DB.prepare("UPDATE intakes SET status = 'done', card_json = NULL, drugs_json = NULL, notify_email = NULL, done_at = ? WHERE id = ?").bind(
        new Date().toISOString(),
        row.id,
      ),
    ]);
    await logEvent(env.DB, pharmacy.id, row.id, 'done', { lang: row.lang });
  }
  return jsonResponse({ ok: true }, 200, corsHeaders);
}

function listTemplates({ corsHeaders }: PharmacyRouteContext): Response {
  return jsonResponse({ items: REPLY_TEMPLATES.map((t) => ({ key: t.key, textJa: t.text.ja })) }, 200, corsHeaders);
}

async function translatePreview({ request, env, corsHeaders, pharmacy }: PharmacyRouteContext): Promise<Response> {
  const body = await readBody(request);
  const textJa = typeof body?.textJa === 'string' ? body.textJa.trim() : '';
  const lang = body?.lang as Lang;
  if (!textJa || textJa.length > MAX_MESSAGE_CHARS || !LANGS.includes(lang)) return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
  const key = `preview-ph:${pharmacy.id}:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt((await env.RATE_LIMIT_KV.get(key)) ?? '0', 10);
  if (count >= PREVIEW_DAILY_LIMIT) return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 60 * 60 * 26 });
  try {
    return jsonResponse({ textPatient: await translateToPatient(env, textJa, lang, { feature: 'message', pharmacyId: pharmacy.id }) }, 200, corsHeaders);
  } catch (err) {
    console.error('translate_preview_failed', err);
    return jsonResponse({ error: 'translation_failed' }, 502, corsHeaders);
  }
}

// Returns a response for any authenticated /pharmacy/... route, or null when the path isn't one of them.
export async function routePharmacyIntakes(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/pharmacy/intakes') && path !== '/pharmacy/templates' && path !== '/pharmacy/translate-preview') return null;
  const pharmacy = await resolvePharmacySession(request, env.DB);
  if (!pharmacy) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  if (!hasIntake(pharmacy.plan)) return jsonResponse({ error: 'plan' }, 403, corsHeaders);
  const c: PharmacyRouteContext = { request, env, corsHeaders, pharmacy };

  if (request.method === 'GET' && path === '/pharmacy/intakes') return listIntakes(c);
  if (request.method === 'GET' && path === '/pharmacy/templates') return listTemplates(c);
  if (request.method === 'POST' && path === '/pharmacy/translate-preview') return translatePreview(c);
  let m = path.match(/^\/pharmacy\/intakes\/([^/]+)$/);
  if (m && request.method === 'GET') return intakeDetail(c, m[1]);
  m = path.match(/^\/pharmacy\/intakes\/([^/]+)\/images\/(\d+)$/);
  if (m && request.method === 'GET') return intakeImage(c, m[1], Number(m[2]));
  m = path.match(/^\/pharmacy\/intakes\/([^/]+)\/(reply|messages|done)$/);
  if (m && request.method === 'POST') return m[2] === 'reply' ? reply(c, m[1]) : m[2] === 'messages' ? postMessage(c, m[1]) : markDone(c, m[1]);
  return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
}
