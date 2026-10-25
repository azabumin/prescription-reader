import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { purgeExpired } from '../src/intake/cleanup';
import { intakeRef } from '../src/intake/events';
import { call, insertIntake, insertPharmacy, loggedInPharmacy } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const DAY = 86400000;

async function count(sql: string, ...args: unknown[]) {
  return (await env.DB.prepare(sql).bind(...args).first<{ n: number }>())!.n;
}

describe('completion', () => {
  it('done removes photos, answers, messages and email but keeps the row', async () => {
    const ph = await loggedInPharmacy();
    const it1 = await insertIntake(ph.id);
    await env.DB.prepare("UPDATE intakes SET notify_email = 'a@example.com', drugs_json = '[]' WHERE id = ?").bind(it1.id).run();
    await call('POST', `/pharmacy/intakes/${it1.id}/messages`, { kind: 'template', templateKey: 't1' }, auth(ph.token));
    const res = await call('POST', `/pharmacy/intakes/${it1.id}/done`, undefined, auth(ph.token));
    expect(res.status).toBe(200);
    const row = await env.DB.prepare('SELECT status, card_json, drugs_json, notify_email, done_at FROM intakes WHERE id = ?').bind(it1.id).first<Record<string, unknown>>();
    expect(row).toMatchObject({ status: 'done', card_json: null, drugs_json: null, notify_email: null });
    expect(row!.done_at).not.toBeNull();
    expect(await count('SELECT COUNT(*) AS n FROM intake_images WHERE intake_id = ?', it1.id)).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM intake_messages WHERE intake_id = ?', it1.id)).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM intake_events WHERE pharmacy_id = ? AND event = 'done'", ph.id)).toBe(1);
  });

  it("patient sees status 'done' after completion", async () => {
    const ph = await loggedInPharmacy();
    const it1 = await insertIntake(ph.id);
    await call('POST', `/pharmacy/intakes/${it1.id}/done`, undefined, auth(ph.token));
    const res = await call('GET', `/intakes/${it1.id}`, undefined, { 'X-Intake-Token': it1.patientToken });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { status: string }).status).toBe('done');
  });
});

describe('purgeExpired', () => {
  it('deletes rows past 7 days and logs expired for unfinished ones', async () => {
    const ph = await insertPharmacy();
    const old = await insertIntake(ph.id, { createdAt: new Date(Date.now() - 8 * DAY) });
    const oldDone = await insertIntake(ph.id, { createdAt: new Date(Date.now() - 8 * DAY), status: 'done' });
    const n = await purgeExpired(env.DB, new Date());
    expect(n).toBeGreaterThanOrEqual(2);
    expect(await count('SELECT COUNT(*) AS n FROM intakes WHERE id IN (?, ?)', old.id, oldDone.id)).toBe(0);
    expect(await count('SELECT COUNT(*) AS n FROM intake_images WHERE intake_id = ?', old.id)).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM intake_events WHERE intake_ref = ? AND event = 'expired'", await intakeRef(old.id))).toBe(1);
    expect(await count("SELECT COUNT(*) AS n FROM intake_events WHERE intake_ref = ? AND event = 'expired'", await intakeRef(oldDone.id))).toBe(0);
  });

  it('keeps rows within 7 days', async () => {
    const ph = await insertPharmacy();
    const recent = await insertIntake(ph.id, { createdAt: new Date(Date.now() - 6 * DAY) });
    await purgeExpired(env.DB, new Date());
    expect(await count('SELECT COUNT(*) AS n FROM intakes WHERE id = ?', recent.id)).toBe(1);
  });

  it('events survive the purge', async () => {
    const ph = await loggedInPharmacy();
    const sent = await call('POST', '/intakes', {
      pharmacyCode: ph.code, clientRequestId: crypto.randomUUID(), lang: 'en', pickup: 'today15',
      card: { lang: 'en' }, images: [{ base64: 'aGVsbG8=', mediaType: 'image/jpeg' }], consent: true,
    });
    const { intakeId } = (await sent.json()) as { intakeId: string };
    await env.DB.prepare('UPDATE intakes SET expires_at = ? WHERE id = ?').bind(new Date(Date.now() - 1000).toISOString(), intakeId).run();
    await purgeExpired(env.DB, new Date());
    expect(await count('SELECT COUNT(*) AS n FROM intakes WHERE id = ?', intakeId)).toBe(0);
    expect(await count("SELECT COUNT(*) AS n FROM intake_events WHERE intake_ref = ? AND event = 'received'", await intakeRef(intakeId))).toBe(1);
  });
});
