import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { call, insertPharmacy, sendBody, sha256Hex, TINY_JPEG } from './helpers';

async function send(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return call('POST', '/intakes', body, headers);
}

describe('patient send', () => {
  it('looks up the pharmacy name by code', async () => {
    const ph = await insertPharmacy();
    const res = await call('GET', `/p/pharmacy?code=${ph.code}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ name: ph.name });
    expect((await call('GET', '/p/pharmacy?code=nope')).status).toBe(404);
  });

  it('rejects a send without consent', async () => {
    const ph = await insertPharmacy();
    const res = await send(sendBody(ph.code, { consent: false }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid' });
  });

  it('rejects zero and three images', async () => {
    const ph = await insertPharmacy();
    expect((await send(sendBody(ph.code, { images: [] }))).status).toBe(400);
    expect((await send(sendBody(ph.code, { images: [TINY_JPEG, TINY_JPEG, TINY_JPEG] }))).status).toBe(400);
  });

  it('rejects an oversized image', async () => {
    const ph = await insertPharmacy();
    const res = await send(sendBody(ph.code, { images: [{ base64: 'A'.repeat(1_500_001), mediaType: 'image/jpeg' }] }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'image_too_large' });
  });

  it('rejects an unknown pharmacy', async () => {
    const res = await send(sendBody('no-such-pharmacy'));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'pharmacy_not_found' });
  });

  it('accepts an empty questionnaire', async () => {
    const ph = await insertPharmacy();
    const res = await send(sendBody(ph.code));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { intakeId: string; patientToken: string };
    expect(body.intakeId).toMatch(/^[0-9a-f]{32}$/);
    expect(body.patientToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stores only the token hash', async () => {
    const ph = await insertPharmacy();
    const { intakeId, patientToken } = (await (await send(sendBody(ph.code))).json()) as { intakeId: string; patientToken: string };
    const row = await env.DB.prepare('SELECT patient_token_hash FROM intakes WHERE id = ?').bind(intakeId).first<{ patient_token_hash: string }>();
    expect(row!.patient_token_hash).not.toBe(patientToken);
    expect(row!.patient_token_hash).toBe(await sha256Hex(patientToken));
  });

  it('same clientRequestId returns the same intakeId', async () => {
    const ph = await insertPharmacy();
    const body = sendBody(ph.code);
    const a = (await (await send(body)).json()) as { intakeId: string };
    const second = await send(body);
    expect(second.status).toBe(201);
    const b = (await second.json()) as { intakeId: string };
    expect(b.intakeId).toBe(a.intakeId);
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM intakes WHERE pharmacy_id = ?').bind(ph.id).first<{ n: number }>();
    expect(count!.n).toBe(1);
  });

  it('11th send from one IP in a day is 429', async () => {
    const ph = await insertPharmacy();
    const headers = { 'CF-Connecting-IP': '203.0.113.11' };
    for (let i = 0; i < 10; i++) expect((await send(sendBody(ph.code), headers)).status).toBe(201);
    const res = await send(sendBody(ph.code), headers);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
  });

  it('logs a received event without personal data', async () => {
    const ph = await insertPharmacy();
    const { intakeId } = (await (await send(sendBody(ph.code))).json()) as { intakeId: string };
    const { results } = await env.DB.prepare('SELECT * FROM intake_events WHERE pharmacy_id = ?').bind(ph.id).all<{ intake_ref: string; event: string; lang: string }>();
    expect(results).toHaveLength(1);
    expect(results[0].event).toBe('received');
    expect(results[0].lang).toBe('vi');
    expect(results[0].intake_ref).not.toBe(intakeId);
    expect(results[0].intake_ref).not.toContain(intakeId.slice(0, 8));
  });
});

describe('patient status', () => {
  it('GET /intakes/:id with a wrong token is 404, with the right token returns new', async () => {
    const ph = await insertPharmacy();
    const { intakeId, patientToken } = (await (await send(sendBody(ph.code))).json()) as { intakeId: string; patientToken: string };
    expect((await call('GET', `/intakes/${intakeId}`, undefined, { 'X-Intake-Token': 'f'.repeat(64) })).status).toBe(404);
    const ok = await call('GET', `/intakes/${intakeId}`, undefined, { 'X-Intake-Token': patientToken });
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { pharmacyName: string; status: string; laterTime: string | null; messages: unknown[] };
    expect(body.pharmacyName).toBe(ph.name);
    expect(body.status).toBe('new');
    expect(body.laterTime).toBeNull();
    expect(body.messages).toEqual([]);
  });
});
