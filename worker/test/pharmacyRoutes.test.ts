import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { call, insertIntake, loggedInPharmacy } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('pharmacy inbox', () => {
  it("lists only this pharmacy's intakes", async () => {
    const a = await loggedInPharmacy();
    const b = await loggedInPharmacy();
    const mine = await insertIntake(a.id);
    await insertIntake(b.id);
    const res = await call('GET', '/pharmacy/intakes', undefined, auth(a.token));
    expect(res.status).toBe(200);
    const { items } = (await res.json()) as { items: { id: string; status: string; drugsStatus: string; opened: boolean; pickup: string; lang: string }[] };
    expect(items.map((i) => i.id)).toEqual([mine.id]);
    expect(items[0]).toMatchObject({ status: 'new', drugsStatus: 'pending', opened: false, pickup: 'today17', lang: 'vi' });
  });

  it("detail of another pharmacy's intake is 404", async () => {
    const a = await loggedInPharmacy();
    const b = await loggedInPharmacy();
    const theirs = await insertIntake(b.id);
    const res = await call('GET', `/pharmacy/intakes/${theirs.id}`, undefined, auth(a.token));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'gone' });
  });

  it('first open records opened_at and one opened event; second open does not add another', async () => {
    const a = await loggedInPharmacy();
    const it1 = await insertIntake(a.id);
    const first = await call('GET', `/pharmacy/intakes/${it1.id}`, undefined, auth(a.token));
    expect(first.status).toBe(200);
    const body = (await first.json()) as { id: string; card: { lang: string } | null; drugs: unknown; imageCount: number; messages: unknown[] };
    expect(body).toMatchObject({ id: it1.id, imageCount: 1, drugs: null, messages: [] });
    expect(body.card!.lang).toBe('vi');
    await call('GET', `/pharmacy/intakes/${it1.id}`, undefined, auth(a.token));
    const row = await env.DB.prepare('SELECT opened_at FROM intakes WHERE id = ?').bind(it1.id).first<{ opened_at: string | null }>();
    expect(row!.opened_at).not.toBeNull();
    const ev = await env.DB.prepare("SELECT COUNT(*) AS n FROM intake_events WHERE pharmacy_id = ? AND event = 'opened'").bind(a.id).first<{ n: number }>();
    expect(ev!.n).toBe(1);
  });

  it('image endpoint returns the stored bytes with no-store', async () => {
    const a = await loggedInPharmacy();
    const it1 = await insertIntake(a.id);
    const res = await call('GET', `/pharmacy/intakes/${it1.id}/images/0`, undefined, auth(a.token));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(new TextDecoder().decode(await res.arrayBuffer())).toBe('hello');
    expect((await call('GET', `/pharmacy/intakes/${it1.id}/images/5`, undefined, auth(a.token))).status).toBe(404);
  });

  it('unauthenticated requests are 401', async () => {
    expect((await call('GET', '/pharmacy/intakes')).status).toBe(401);
    expect((await call('GET', `/pharmacy/intakes/${'a'.repeat(32)}`)).status).toBe(401);
  });

  it('a deleted intake is 404 gone', async () => {
    const a = await loggedInPharmacy();
    const it1 = await insertIntake(a.id);
    await env.DB.prepare('DELETE FROM intakes WHERE id = ?').bind(it1.id).run();
    const res = await call('GET', `/pharmacy/intakes/${it1.id}`, undefined, auth(a.token));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'gone' });
  });
});
