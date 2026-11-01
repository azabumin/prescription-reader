import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { resolvePharmacySession } from '../src/intake/pharmacyAuth';
import { call, insertPharmacy } from './helpers';

describe('pharmacy setup and login', () => {
  it('setup sets a password once', async () => {
    const ph = await insertPharmacy();
    const first = await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: 'correct-horse-1' });
    expect(first.status).toBe(200);
    const again = await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: 'another-pass-2' });
    expect(again.status).toBe(400);
    expect(await again.json()).toEqual({ error: 'invalid_setup' });
  });

  it('setup rejects an expired code', async () => {
    const ph = await insertPharmacy({ setupExpiresAt: new Date(Date.now() - 1000).toISOString() });
    const res = await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: 'correct-horse-1' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_setup' });
  });

  it('setup rejects a short password', async () => {
    const ph = await insertPharmacy();
    const res = await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: '1234567' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'weak_password' });
  });

  it('login returns a token and the pharmacy name', async () => {
    const ph = await insertPharmacy();
    await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: 'correct-horse-1' });
    const res = await call('POST', '/pharmacy/login', { email: ph.email, password: 'correct-horse-1' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; pharmacy: { name: string; code: string; plan: string } };
    expect(body.token).toMatch(/^[0-9a-f]{64}$/);
    expect(body.pharmacy).toEqual({ name: ph.name, code: ph.code, plan: 'AB' });
  });

  it('login fails for a disabled pharmacy', async () => {
    const ph = await insertPharmacy();
    await call('POST', '/pharmacy/setup', { code: ph.code, setupCode: ph.setupCode, password: 'correct-horse-1' });
    await env.DB.prepare('UPDATE pharmacies SET disabled_at = ? WHERE id = ?').bind(new Date().toISOString(), ph.id).run();
    const res = await call('POST', '/pharmacy/login', { email: ph.email, password: 'correct-horse-1' });
    expect(res.status).toBe(401);
  });

  it('resolvePharmacySession rejects an expired session', async () => {
    const ph = await insertPharmacy();
    await env.DB.prepare('INSERT INTO pharmacy_sessions (token, pharmacy_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind('a'.repeat(64), ph.id, new Date().toISOString(), new Date(Date.now() - 1000).toISOString())
      .run();
    const req = new Request('https://api.test/pharmacy/intakes', { headers: { Authorization: `Bearer ${'a'.repeat(64)}` } });
    expect(await resolvePharmacySession(req, env.DB)).toBeNull();
  });
});
