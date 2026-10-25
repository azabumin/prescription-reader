import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';

it('creates the intake tables', async () => {
  const { results } = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all<{ name: string }>();
  const names = results.map((r) => r.name);
  for (const t of ['pharmacies', 'pharmacy_sessions', 'intakes', 'intake_images', 'intake_messages', 'intake_events']) {
    expect(names).toContain(t);
  }
});
