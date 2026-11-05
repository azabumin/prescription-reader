import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { sha256Hex } from '../src/intake/pharmacyAuth';
import { call, insertIntake, insertPharmacy, loggedInPharmacy } from './helpers';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
const ADMIN = auth('test-admin-token-0123456789');

const pharmacyRow = (id: number) =>
  env.DB.prepare('SELECT setup_code_hash, setup_expires_at, last_login_at, disabled_at, plan, plan_chosen_at FROM pharmacies WHERE id = ?')
    .bind(id)
    .first<{ setup_code_hash: string | null; setup_expires_at: string | null; last_login_at: string | null; disabled_at: string | null; plan: string; plan_chosen_at: string | null }>();

describe('forgot password (POST /pharmacy/forgot)', () => {
  it('gives the same answer for unknown addresses and changes nothing', async () => {
    const res = await call('POST', '/pharmacy/forgot', { email: 'nobody@example.jp' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('sets a fresh one-hour setup code for a registered pharmacy', async () => {
    const ph = await loggedInPharmacy('AB');
    expect((await pharmacyRow(ph.id))!.setup_code_hash).toBeNull(); // used by the first setup
    const res = await call('POST', '/pharmacy/forgot', { email: ph.email.toUpperCase() });
    expect(await res.json()).toEqual({ ok: true });
    const row = (await pharmacyRow(ph.id))!;
    expect(row.setup_code_hash).toMatch(/^[0-9a-f]{64}$/);
    const minutes = (new Date(row.setup_expires_at!).getTime() - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(55);
    expect(minutes).toBeLessThanOrEqual(60);
  });

  it('does nothing for a stopped pharmacy', async () => {
    const ph = await insertPharmacy({ disabled: true });
    await env.DB.prepare('UPDATE pharmacies SET setup_code_hash = NULL WHERE id = ?').bind(ph.id).run();
    await call('POST', '/pharmacy/forgot', { email: ph.email });
    expect((await pharmacyRow(ph.id))!.setup_code_hash).toBeNull();
  });

  it('setting a new password ends every existing login', async () => {
    const ph = await loggedInPharmacy('AB');
    expect((await call('GET', '/pharmacy/me', undefined, auth(ph.token))).status).toBe(200);
    await env.DB.prepare('UPDATE pharmacies SET setup_code_hash = ?, setup_expires_at = ? WHERE id = ?')
      .bind(await sha256Hex('reset-code'), new Date(Date.now() + 3600000).toISOString(), ph.id)
      .run();
    expect((await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: 'reset-code', password: 'new-password-1' })).status).toBe(200);
    expect((await call('GET', '/pharmacy/me', undefined, auth(ph.token))).status).toBe(401);
    expect((await call('POST', '/pharmacy/login', { email: ph.email, password: 'new-password-1' })).status).toBe(200);
  });

  it('login records the time', async () => {
    const ph = await loggedInPharmacy('A');
    expect((await pharmacyRow(ph.id))!.last_login_at).not.toBeNull();
  });
});

describe('feedback (POST /pharmacy/feedback)', () => {
  it('stores it for the operator', async () => {
    const ph = await loggedInPharmacy('B');
    const res = await call('POST', '/pharmacy/feedback', { body: '  受信箱の文字を大きくしてほしい  ' }, auth(ph.token));
    expect(res.status).toBe(201);
    const row = await env.DB.prepare('SELECT body, read_at FROM pharmacy_feedback WHERE pharmacy_id = ?').bind(ph.id).first();
    expect(row).toEqual({ body: '受信箱の文字を大きくしてほしい', read_at: null });
  });

  it('needs a session and 1 to 2000 characters', async () => {
    const ph = await loggedInPharmacy('A');
    expect((await call('POST', '/pharmacy/feedback', { body: 'x' })).status).toBe(401);
    for (const body of ['', '   ', 'あ'.repeat(2001), 42]) {
      expect((await call('POST', '/pharmacy/feedback', { body }, auth(ph.token))).status).toBe(400);
    }
  });
});

describe('admin (/admin/*)', () => {
  it('refuses requests without the right key', async () => {
    expect((await call('GET', '/admin/pharmacies')).status).toBe(401);
    expect((await call('GET', '/admin/pharmacies', undefined, auth('wrong'))).status).toBe(401);
  });

  it('registers a pharmacy whose setup link works and which then chooses its own plan', async () => {
    const email = `admin-new-${Date.now()}@example.jp`;
    const res = await call('POST', '/admin/pharmacies', { name: '管理画面の薬局', email }, ADMIN);
    expect(res.status).toBe(201);
    const made = (await res.json()) as { id: number; code: string; setupUrl: string; patientUrl: string };
    expect(made.patientUrl).toBe(`https://rxhelper.jp/send?ph=${made.code}`);
    const setup = new URL(made.setupUrl);
    expect(setup.pathname).toBe('/pharmacy/setup');
    expect(
      (await call('POST', '/pharmacy/setup', { code: setup.searchParams.get('code'), setupCode: setup.searchParams.get('s'), password: 'admin-made-1' })).status,
    ).toBe(200);
    const login = await call('POST', '/pharmacy/login', { email, password: 'admin-made-1' });
    expect(((await login.json()) as { pharmacy: { planChosen: boolean } }).pharmacy.planChosen).toBe(false);

    expect((await call('POST', '/admin/pharmacies', { name: 'x', email }, ADMIN)).status).toBe(409);
    expect((await call('POST', '/admin/pharmacies', { name: '', email: 'a@b.jp' }, ADMIN)).status).toBe(400);
    expect((await call('POST', '/admin/pharmacies', { name: 'x', email: 'c@d.jp', plan: 'C' }, ADMIN)).status).toBe(400);
  });

  it('lists pharmacies with counts but no patient content', async () => {
    const ph = await loggedInPharmacy('AB');
    await insertIntake(ph.id, { status: 'new' });
    await call('POST', '/pharmacy/feedback', { body: 'テスト' }, auth(ph.token));
    const res = await call('GET', '/admin/pharmacies', undefined, ADMIN);
    expect(res.status).toBe(200);
    const item = ((await res.json()) as { items: Record<string, unknown>[] }).items.find((i) => i.code === ph.code)!;
    expect(item).toMatchObject({ name: ph.name, email: ph.email, plan: 'AB', planChosen: true, disabled: false, passwordSet: true, openIntakes: 1, unreadFeedback: 1 });
    expect(Object.keys(item)).not.toContain('card');
  });

  it('reissues a setup link, changes the plan by the same rule, and stops a pharmacy', async () => {
    const ph = await loggedInPharmacy('AB');
    const link = await call('POST', `/admin/pharmacies/${ph.id}/setup-link`, undefined, ADMIN);
    expect(((await link.json()) as { setupUrl: string }).setupUrl).toContain(`code=${ph.code}`);

    await insertIntake(ph.id, { status: 'new' });
    const refused = await call('POST', `/admin/pharmacies/${ph.id}/plan`, { plan: 'A' }, ADMIN);
    expect(refused.status).toBe(409);
    expect((await call('POST', `/admin/pharmacies/${ph.id}/plan`, { plan: 'B' }, ADMIN)).status).toBe(200);
    expect((await pharmacyRow(ph.id))!.plan).toBe('B');

    expect((await call('POST', `/admin/pharmacies/${ph.id}/disabled`, { disabled: true }, ADMIN)).status).toBe(200);
    expect((await call('GET', '/pharmacy/me', undefined, auth(ph.token))).status).toBe(401);
    expect((await call('POST', '/pharmacy/login', { email: ph.email, password: 'correct-horse-1' })).status).toBe(401);
    expect((await call('POST', `/admin/pharmacies/${ph.id}/disabled`, { disabled: false }, ADMIN)).status).toBe(200);
    expect((await call('POST', '/pharmacy/login', { email: ph.email, password: 'correct-horse-1' })).status).toBe(200);

    expect((await call('POST', '/admin/pharmacies/999999/setup-link', undefined, ADMIN)).status).toBe(404);
  });

  it('lists feedback and marks it read', async () => {
    const ph = await loggedInPharmacy('A');
    await call('POST', '/pharmacy/feedback', { body: '照合が速くて助かる' }, auth(ph.token));
    const list = (await (await call('GET', '/admin/feedback', undefined, ADMIN)).json()) as { items: { id: number; body: string; read: boolean; pharmacyName: string }[] };
    const mine = list.items.find((i) => i.body === '照合が速くて助かる')!;
    expect(mine).toMatchObject({ read: false, pharmacyName: ph.name });
    expect((await call('POST', `/admin/feedback/${mine.id}/read`, undefined, ADMIN)).status).toBe(200);
    const again = (await (await call('GET', '/admin/feedback', undefined, ADMIN)).json()) as { items: { id: number; read: boolean }[] };
    expect(again.items.find((i) => i.id === mine.id)!.read).toBe(true);
  });
});
