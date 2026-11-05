import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { estimateUsd, recordUsage } from '../src/aiUsage';
import { call, loggedInPharmacy } from './helpers';

const ADMIN = { Authorization: 'Bearer test-admin-token-0123456789' };

describe('AI usage', () => {
  it('prices tokens by model and leaves unknown models out', () => {
    const t = { inputTokens: 1_000_000, outputTokens: 100_000, cacheReadTokens: 0, cacheWriteTokens: 0 };
    expect(estimateUsd('claude-opus-5-5', t)).toBeCloseTo(4 + 2);
    expect(estimateUsd('claude-haiku-4-5', t)).toBeCloseTo(1 + 0.5);
    expect(estimateUsd('some-other-model', t)).toBeNull();
  });

  it('adds calls up per day, pharmacy, feature and model', async () => {
    const ph = await loggedInPharmacy('A');
    await recordUsage(env, { feature: 'walkin', pharmacyId: ph.id }, 'claude-opus-5-5', { input_tokens: 1000, output_tokens: 200 });
    await recordUsage(env, { feature: 'walkin', pharmacyId: ph.id }, 'claude-opus-5-5', { input_tokens: 500, output_tokens: 100, cache_read_input_tokens: 50 });
    await recordUsage(env, { feature: 'walkin', pharmacyId: ph.id }, 'claude-opus-5-5', undefined); // no usage: nothing recorded
    const row = await env.DB.prepare('SELECT calls, input_tokens, output_tokens, cache_read_tokens FROM ai_usage_daily WHERE pharmacy_id = ? AND feature = ?')
      .bind(ph.id, 'walkin')
      .first();
    expect(row).toEqual({ calls: 2, input_tokens: 1500, output_tokens: 300, cache_read_tokens: 50 });
  });

  it('shows per-pharmacy and per-feature totals on the admin API', async () => {
    const ph = await loggedInPharmacy('AB');
    await recordUsage(env, { feature: 'intake_read', pharmacyId: ph.id }, 'claude-opus-5-5', { input_tokens: 250_000, output_tokens: 50_000 });
    await recordUsage(env, { feature: 'reader' }, 'claude-haiku-4-5', { input_tokens: 100_000, output_tokens: 20_000 });

    const list = (await (await call('GET', '/admin/pharmacies', undefined, ADMIN)).json()) as { items: { code: string; ai30: { calls: number; usd: number } }[] };
    const mine = list.items.find((i) => i.code === ph.code)!;
    expect(mine.ai30.calls).toBe(1);
    expect(mine.ai30.usd).toBeCloseTo(1 + 1); // 0.25M in x $4 + 0.05M out x $20

    const usage = (await (await call('GET', '/admin/ai-usage', undefined, ADMIN)).json()) as {
      days: number;
      features: { feature: string; calls: number; usd: number }[];
      total: { calls: number; usd: number; unpriced: string[] };
    };
    expect(usage.days).toBe(30);
    expect(usage.features.find((f) => f.feature === 'reader')!.usd).toBeCloseTo(0.1 + 0.1);
    expect(usage.total.calls).toBeGreaterThanOrEqual(2);
    expect((await call('GET', '/admin/ai-usage')).status).toBe(401);
  });
});
