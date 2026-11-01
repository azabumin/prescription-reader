// Plan A: the pharmacy photographs or scans a prescription handed in at the counter (外来) and gets the medicines back
// for its stock check, which runs in the browser against the pharmacy's own stock CSV. Nothing is stored: no intake
// row, and the images are dropped once the AI has read them. Only a count row without personal data is kept.
import { jsonResponse } from '../http';
import * as defaultAi from './ai';
import { logEvent } from './events';
import { bumpDaily, parseImages } from './patientRoutes';
import { hasStockCheck, resolvePharmacySession } from './pharmacyAuth';
import type { ExtractedDrug } from './types';

const PER_PHARMACY_DAILY_CHECKS = 300;

export type WalkinAi = Pick<typeof defaultAi, 'extractDrugs'>;

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function handleWalkinCheck(request: Request, env: Env, corsHeaders: Record<string, string>, ai: WalkinAi = defaultAi): Promise<Response> {
  const pharmacy = await resolvePharmacySession(request, env.DB);
  if (!pharmacy) return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
  if (!hasStockCheck(pharmacy.plan)) return jsonResponse({ error: 'plan' }, 403, corsHeaders);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
  }
  const images = parseImages(body && typeof body === 'object' ? (body as Record<string, unknown>).images : undefined);
  if (images === 'invalid') return jsonResponse({ error: 'invalid' }, 400, corsHeaders);
  if (images === 'image_too_large') return jsonResponse({ error: 'image_too_large' }, 413, corsHeaders);

  const today = new Date().toISOString().slice(0, 10);
  if (!(await bumpDaily(env.RATE_LIMIT_KV, `walkin-ph:${pharmacy.id}:${today}`, PER_PHARMACY_DAILY_CHECKS))) {
    return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
  }

  let drugs: ExtractedDrug[];
  try {
    drugs = await ai.extractDrugs(env, images);
  } catch (err) {
    console.error('walkin_extraction_failed', pharmacy.id, err);
    return jsonResponse({ error: 'extraction_failed' }, 502, corsHeaders);
  }
  // a throwaway id: the count row can't be tied to anything, there is nothing else to tie it to
  await logEvent(env.DB, pharmacy.id, randomHex(16), 'walkin_check', { drugCount: drugs.length });
  return jsonResponse({ drugs }, 200, corsHeaders);
}
