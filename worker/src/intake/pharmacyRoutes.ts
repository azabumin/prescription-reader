// Pharmacy side of the intake: inbox, detail, photos. Every route needs a pharmacy session, and a pharmacy only
// ever sees its own intakes (another pharmacy's intake looks exactly like a deleted one).
import { jsonResponse } from '../http';
import type { PharmacyCard } from './cardType';
import { logEvent } from './events';
import { resolvePharmacySession, type PharmacySession } from './pharmacyAuth';
import type { ExtractedDrug, IntakeStatus, PickupCode } from './types';

const INBOX_LIMIT = 100;

type IntakeRow = {
  id: string;
  pharmacy_id: number;
  lang: string;
  pickup: PickupCode;
  card_json: string | null;
  drugs_json: string | null;
  drugs_status: 'pending' | 'done' | 'failed';
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

// Returns a response for any /pharmacy/intakes... route, or null when the path isn't one of them.
export async function routePharmacyIntakes(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/pharmacy/intakes')) return null;
  const pharmacy = await resolvePharmacySession(request, env.DB);
  if (!pharmacy) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  const c: PharmacyRouteContext = { request, env, corsHeaders, pharmacy };

  if (request.method === 'GET' && path === '/pharmacy/intakes') return listIntakes(c);
  let m = path.match(/^\/pharmacy\/intakes\/([^/]+)$/);
  if (m && request.method === 'GET') return intakeDetail(c, m[1]);
  m = path.match(/^\/pharmacy\/intakes\/([^/]+)\/images\/(\d+)$/);
  if (m && request.method === 'GET') return intakeImage(c, m[1], Number(m[2]));
  return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
}
