import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logEvent } from '../src/intake/events';
import { processIntake } from '../src/intake/process';
import { handleWalkinCheck } from '../src/intake/walkinCheck';
import { call, insertIntake, insertPharmacy, loggedInPharmacy, sendBody, TINY_JPEG } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const CORS = { 'Access-Control-Allow-Origin': 'https://rxhelper.jp' };
const DRUG = { name: 'アレグラ錠60mg', generic: false, amountPerDose: 1, unit: '錠', dosesPerDay: 2, days: 14, prnCount: null, rawText: 'アレグラ錠60mg 1錠 1日2回 14日分' };

function checkRequest(token: string, body: unknown): Request {
  return new Request('https://api.test/pharmacy/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(body),
  });
}

async function count(sql: string, ...args: unknown[]): Promise<number> {
  return (await env.DB.prepare(sql).bind(...args).first<{ n: number }>())!.n;
}

describe('pharmacy plan', () => {
  it("defaults to 'AB' and rejects unknown values", async () => {
    const ph = await insertPharmacy();
    const row = await env.DB.prepare(
      "INSERT INTO pharmacies (code, name, login_email, created_at) VALUES ('plandefault1', 'x', 'plandefault1@example.jp', '2026-11-01') RETURNING plan",
    ).first<{ plan: string }>();
    expect(row!.plan).toBe('AB');
    await expect(env.DB.prepare("UPDATE pharmacies SET plan = 'C' WHERE id = ?").bind(ph.id).run()).rejects.toThrow();
  });

  it('login and /pharmacy/me return the plan', async () => {
    const ph = await loggedInPharmacy('A');
    const me = await call('GET', '/pharmacy/me', undefined, auth(ph.token));
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ name: ph.name, code: ph.code, plan: 'A' });
    expect((await call('GET', '/pharmacy/me')).status).toBe(401);
  });
});

describe('plan A (stock check only)', () => {
  it('patients cannot find or send to the pharmacy', async () => {
    const ph = await insertPharmacy({ plan: 'A' });
    expect((await call('GET', `/p/pharmacy?code=${ph.code}`)).status).toBe(404);
    const res = await call('POST', '/intakes', sendBody(ph.code));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'pharmacy_not_found' });
    expect(await count('SELECT COUNT(*) AS n FROM intakes WHERE pharmacy_id = ?', ph.id)).toBe(0);
  });

  it('inbox, templates and translate preview are refused', async () => {
    const ph = await loggedInPharmacy('A');
    for (const [method, path, body] of [
      ['GET', '/pharmacy/intakes', undefined],
      ['GET', `/pharmacy/intakes/${'a'.repeat(32)}`, undefined],
      ['GET', '/pharmacy/templates', undefined],
      ['POST', '/pharmacy/translate-preview', { textJa: 'こんにちは', lang: 'vi' }],
    ] as const) {
      const res = await call(method, path, body, auth(ph.token));
      expect(res.status, path).toBe(403);
      expect(await res.json()).toEqual({ error: 'plan' });
    }
  });
});

describe('plan B (questionnaire only)', () => {
  it('patients can send and the inbox works', async () => {
    const ph = await loggedInPharmacy('B');
    expect((await call('GET', `/p/pharmacy?code=${ph.code}`)).status).toBe(200);
    expect((await call('POST', '/intakes', sendBody(ph.code))).status).toBe(201);
    expect((await call('GET', '/pharmacy/intakes', undefined, auth(ph.token))).status).toBe(200);
  });

  it('the walk-in check is refused', async () => {
    const ph = await loggedInPharmacy('B');
    const res = await call('POST', '/pharmacy/check', { images: [TINY_JPEG] }, auth(ph.token));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'plan' });
  });
});

describe('processIntake by plan', () => {
  const ai = { extractDrugs: vi.fn(), translateFields: vi.fn() };
  beforeEach(() => {
    ai.extractDrugs.mockReset().mockResolvedValue([DRUG, DRUG]);
    ai.translateFields.mockReset().mockResolvedValue({ notes: 'こんにちは' });
  });

  it('plan B skips reading the medicines but still translates', async () => {
    const ph = await insertPharmacy({ plan: 'B' });
    const { id } = await insertIntake(ph.id, { card: { lang: 'vi', notes: 'xin chào', textLang: { notes: 'vi' }, translations: {} } });
    await processIntake(env, id, ai);
    expect(ai.extractDrugs).not.toHaveBeenCalled();
    const r = await env.DB.prepare('SELECT drugs_status, drugs_json, card_json FROM intakes WHERE id = ?').bind(id).first<{
      drugs_status: string;
      drugs_json: string | null;
      card_json: string;
    }>();
    expect(r!.drugs_status).toBe('skipped');
    expect(r!.drugs_json).toBeNull();
    expect(JSON.parse(r!.card_json).translations.notes).toEqual({ src: 'xin chào', ja: 'こんにちは' });
  });

  it("writes the number of medicines onto the intake's received event", async () => {
    const ph = await insertPharmacy({ plan: 'AB' });
    const { id } = await insertIntake(ph.id);
    await logEvent(env.DB, ph.id, id, 'received', { lang: 'vi' });
    await processIntake(env, id, ai);
    const ev = await env.DB.prepare("SELECT drug_count FROM intake_events WHERE pharmacy_id = ? AND event = 'received'").bind(ph.id).first<{ drug_count: number | null }>();
    expect(ev!.drug_count).toBe(2);
  });
});

describe('walk-in check (POST /pharmacy/check)', () => {
  it('returns the medicines and stores nothing but a count row', async () => {
    const ph = await loggedInPharmacy('A');
    const extractDrugs = vi.fn().mockResolvedValue([DRUG, DRUG]);
    const res = await handleWalkinCheck(checkRequest(ph.token, { images: [TINY_JPEG, TINY_JPEG] }), env, CORS, { extractDrugs });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ drugs: [DRUG, DRUG] });
    expect(extractDrugs.mock.calls[0][1]).toEqual([TINY_JPEG, TINY_JPEG]);
    expect(await count('SELECT COUNT(*) AS n FROM intakes WHERE pharmacy_id = ?', ph.id)).toBe(0);
    const { results } = await env.DB.prepare('SELECT event, lang, drug_count FROM intake_events WHERE pharmacy_id = ?').bind(ph.id).all();
    expect(results).toEqual([{ event: 'walkin_check', lang: null, drug_count: 2 }]);
  });

  it('works for plan AB too', async () => {
    const ph = await loggedInPharmacy('AB');
    const res = await handleWalkinCheck(checkRequest(ph.token, { images: [TINY_JPEG] }), env, CORS, { extractDrugs: vi.fn().mockResolvedValue([]) });
    expect(res.status).toBe(200);
  });

  it('needs a pharmacy session', async () => {
    expect((await call('POST', '/pharmacy/check', { images: [TINY_JPEG] })).status).toBe(401);
  });

  it('rejects bad images', async () => {
    const ph = await loggedInPharmacy('A');
    const extractDrugs = vi.fn();
    for (const images of [[], [TINY_JPEG, TINY_JPEG, TINY_JPEG], [{ base64: 'aGVsbG8=', mediaType: 'application/pdf' }], 'x']) {
      const res = await handleWalkinCheck(checkRequest(ph.token, { images }), env, CORS, { extractDrugs });
      expect(res.status).toBe(400);
    }
    const big = await handleWalkinCheck(checkRequest(ph.token, { images: [{ base64: 'a'.repeat(1_500_001), mediaType: 'image/jpeg' }] }), env, CORS, { extractDrugs });
    expect(big.status).toBe(413);
    expect(extractDrugs).not.toHaveBeenCalled();
  });

  it('is limited per pharmacy per day', async () => {
    const ph = await loggedInPharmacy('A');
    await env.RATE_LIMIT_KV.put(`walkin-ph:${ph.id}:${new Date().toISOString().slice(0, 10)}`, '300');
    const extractDrugs = vi.fn();
    const res = await handleWalkinCheck(checkRequest(ph.token, { images: [TINY_JPEG] }), env, CORS, { extractDrugs });
    expect(res.status).toBe(429);
    expect(extractDrugs).not.toHaveBeenCalled();
  });

  it('says so when the AI fails (network is off in tests)', async () => {
    const ph = await loggedInPharmacy('A');
    const res = await call('POST', '/pharmacy/check', { images: [TINY_JPEG] }, auth(ph.token));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'extraction_failed' });
    expect(await count("SELECT COUNT(*) AS n FROM intake_events WHERE pharmacy_id = ?", ph.id)).toBe(0);
  });
});
