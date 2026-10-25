import { expect, it } from 'vitest';
import { call } from './helpers';

// /translate-memo shares its Claude call with the intake step; with network disabled it must still reach that call.
it('/translate-memo still validates and reaches the translation call', async () => {
  expect((await call('POST', '/translate-memo', { fields: [] })).status).toBe(400);
  const res = await call('POST', '/translate-memo', { fields: [{ key: 'notes', text: 'xin chào', lang: 'vi' }] });
  expect(res.status).toBe(502);
  expect(await res.json()).toEqual({ error: 'translation_failed' });
});
