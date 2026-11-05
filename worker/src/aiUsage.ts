// Token usage of every Anthropic API call, added up per day / pharmacy / feature / model (ai_usage_daily), so the
// operator can see roughly what each pharmacy costs on the admin screen. Only counts are kept, never content.

export type AiFeature = 'reader' | 'memo' | 'intake_read' | 'intake_translate' | 'walkin' | 'message';
// pharmacyId absent = not tied to a pharmacy (the reader on rxhelper.jp, the pharmacy memo translation)
export type UsageTag = { feature: AiFeature; pharmacyId?: number };

export type ApiUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
};

// USD per million tokens, Anthropic's first-party list prices as of 2026-10. Output includes thinking tokens.
// Cache writes are priced at 1.25x input (5-minute cache); the app doesn't use prompt caching today.
// A model missing here (e.g. a refusal fallback model) is counted but left out of the estimate.
export const PRICES_PER_MTOK: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

export type TokenTotals = { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };

export function estimateUsd(model: string, t: TokenTotals): number | null {
  const p = PRICES_PER_MTOK[model];
  if (!p) return null;
  return (t.inputTokens * p.input + t.outputTokens * p.output + t.cacheReadTokens * p.cacheRead + t.cacheWriteTokens * p.cacheWrite) / 1e6;
}

// Best effort: a failed write never fails the request that used the AI.
export async function recordUsage(env: Env, tag: UsageTag, model: string, usage: ApiUsage | undefined): Promise<void> {
  if (!usage) return;
  try {
    await env.DB.prepare(
      `INSERT INTO ai_usage_daily (day, pharmacy_id, feature, model, calls, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT (day, pharmacy_id, feature, model) DO UPDATE SET
         calls = calls + 1,
         input_tokens = input_tokens + excluded.input_tokens,
         output_tokens = output_tokens + excluded.output_tokens,
         cache_read_tokens = cache_read_tokens + excluded.cache_read_tokens,
         cache_write_tokens = cache_write_tokens + excluded.cache_write_tokens`,
    )
      .bind(
        new Date().toISOString().slice(0, 10),
        tag.pharmacyId ?? 0,
        tag.feature,
        model,
        usage.input_tokens ?? 0,
        usage.output_tokens ?? 0,
        usage.cache_read_input_tokens ?? 0,
        usage.cache_creation_input_tokens ?? 0,
      )
      .run();
  } catch (err) {
    console.error('ai_usage_record_failed', err);
  }
}
