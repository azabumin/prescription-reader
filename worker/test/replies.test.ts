import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildStatusEmail } from '../src/intake/notify';
import { REPLY_TEMPLATES } from '../src/intake/templates';
import { call, insertIntake, loggedInPharmacy } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('pharmacy replies', () => {
  afterEach(() => vi.restoreAllMocks());

  it("reply 'later' requires laterTime", async () => {
    const ph = await loggedInPharmacy();
    const it1 = await insertIntake(ph.id);
    const bad = await call('POST', `/pharmacy/intakes/${it1.id}/reply`, { status: 'later' }, auth(ph.token));
    expect(bad.status).toBe(400);
    const ok = await call('POST', `/pharmacy/intakes/${it1.id}/reply`, { status: 'later', laterTime: '18:00' }, auth(ph.token));
    expect(ok.status).toBe(200);
    const row = await env.DB.prepare('SELECT status, later_time FROM intakes WHERE id = ?').bind(it1.id).first<{ status: string; later_time: string }>();
    expect(row).toEqual({ status: 'later', later_time: '18:00' });
  });

  it('reply updates status and records replied once', async () => {
    const ph = await loggedInPharmacy();
    const it1 = await insertIntake(ph.id);
    await call('POST', `/pharmacy/intakes/${it1.id}/reply`, { status: 'inquiry' }, auth(ph.token));
    await call('POST', `/pharmacy/intakes/${it1.id}/reply`, { status: 'ready' }, auth(ph.token));
    const row = await env.DB.prepare('SELECT status, later_time, replied_at FROM intakes WHERE id = ?').bind(it1.id).first<{ status: string; later_time: string | null; replied_at: string | null }>();
    expect(row!.status).toBe('ready');
    expect(row!.later_time).toBeNull();
    expect(row!.replied_at).not.toBeNull();
    const ev = await env.DB.prepare("SELECT COUNT(*) AS n FROM intake_events WHERE pharmacy_id = ? AND event = 'replied'").bind(ph.id).first<{ n: number }>();
    expect(ev!.n).toBe(1);
  });

  it('template message stores the patient-language text', async () => {
    const ph = await loggedInPharmacy();
    const it1 = await insertIntake(ph.id, { lang: 'vi' });
    const res = await call('POST', `/pharmacy/intakes/${it1.id}/messages`, { kind: 'template', templateKey: 't1' }, auth(ph.token));
    expect(res.status).toBe(201);
    const m = await env.DB.prepare('SELECT kind, template_key, text_ja, text_patient FROM intake_messages WHERE intake_id = ?').bind(it1.id).first();
    expect(m).toEqual({ kind: 'template', template_key: 't1', text_ja: REPLY_TEMPLATES[0].text.ja, text_patient: REPLY_TEMPLATES[0].text.vi });
  });

  it('free message stores the text the pharmacist confirmed', async () => {
    const ph = await loggedInPharmacy();
    const it1 = await insertIntake(ph.id, { lang: 'en' });
    const res = await call('POST', `/pharmacy/intakes/${it1.id}/messages`, { kind: 'free', textJa: '明日の10時以降にお越しください。', textPatient: 'Please come after 10 a.m. tomorrow.' }, auth(ph.token));
    expect(res.status).toBe(201);
    expect((await call('POST', `/pharmacy/intakes/${it1.id}/messages`, { kind: 'free', textJa: '', textPatient: 'x' }, auth(ph.token))).status).toBe(400);
  });

  it('patient status shows the message and the new status', async () => {
    const ph = await loggedInPharmacy();
    const it1 = await insertIntake(ph.id, { lang: 'vi' });
    await call('POST', `/pharmacy/intakes/${it1.id}/messages`, { kind: 'template', templateKey: 't2' }, auth(ph.token));
    await call('POST', `/pharmacy/intakes/${it1.id}/reply`, { status: 'ready' }, auth(ph.token));
    const res = await call('GET', `/intakes/${it1.id}`, undefined, { 'X-Intake-Token': it1.patientToken });
    const body = (await res.json()) as { status: string; messages: { textPatient: string; textJa: string }[] };
    expect(body.status).toBe('ready');
    expect(body.messages).toEqual([expect.objectContaining({ textPatient: REPLY_TEMPLATES[1].text.vi, textJa: REPLY_TEMPLATES[1].text.ja })]);
  });

  it('lists the templates in Japanese', async () => {
    const ph = await loggedInPharmacy();
    const res = await call('GET', '/pharmacy/templates', undefined, auth(ph.token));
    const { items } = (await res.json()) as { items: { key: string; textJa: string }[] };
    expect(items.map((i) => i.key)).toEqual(['t1', 't2', 't3', 't4', 't5']);
    expect(items[0].textJa).toBe('在庫が足りないため、一部のお薬は明日以降のお渡しになります。');
  });

  it('every template and status email exists in all 11 languages', () => {
    const langs = ['ja', 'ko', 'en', 'vi', 'zh', 'id', 'tl', 'th', 'my', 'ne', 'pt'];
    for (const t of REPLY_TEMPLATES) for (const l of langs) expect(t.text[l as 'ja'].length).toBeGreaterThan(0);
    for (const l of langs) expect(buildStatusEmail(l as 'ja', 'abc').subject.length).toBeGreaterThan(0);
  });

  it('status email carries only a link, never drug names', () => {
    const mail = buildStatusEmail('vi', '0123456789abcdef0123456789abcdef');
    expect(mail.text).toContain('https://rxhelper.jp/sent?i=0123456789abcdef0123456789abcdef');
    expect(mail.text).not.toMatch(/錠|mg|カプセル/);
  });

  it('email is sent only when notify_email is set', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const ph = await loggedInPharmacy();
    const withMail = await insertIntake(ph.id);
    await env.DB.prepare("UPDATE intakes SET notify_email = 'patient@example.com' WHERE id = ?").bind(withMail.id).run();
    const without = await insertIntake(ph.id);
    await call('POST', `/pharmacy/intakes/${without.id}/reply`, { status: 'ready' }, auth(ph.token));
    expect(fetchSpy.mock.calls.filter(([u]) => String(u instanceof Request ? u.url : u).includes('api.resend.com'))).toHaveLength(0);
    await call('POST', `/pharmacy/intakes/${withMail.id}/reply`, { status: 'ready' }, auth(ph.token));
    const resendCalls = fetchSpy.mock.calls.filter(([u]) => String(u instanceof Request ? u.url : u).includes('api.resend.com'));
    expect(resendCalls).toHaveLength(1);
    expect(String(resendCalls[0][1]?.body)).toContain('patient@example.com');
  });
});
