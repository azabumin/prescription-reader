import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { accountProblem, throwClaudeError } from '../src/aiAlert';

const CREDIT = '{"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API."}}';

describe('AI account alert', () => {
  it('tells account problems from passing ones', () => {
    expect(accountProblem(400, CREDIT)).toBe('credit');
    expect(accountProblem(401, '{"error":{"type":"authentication_error"}}')).toBe('key');
    expect(accountProblem(403, '{}')).toBe('key');
    expect(accountProblem(400, '{"error":{"message":"image too large"}}')).toBeNull();
    expect(accountProblem(429, 'rate limited')).toBeNull();
    expect(accountProblem(529, 'overloaded')).toBeNull();
  });

  it('still throws the API error, and alerts at most once while it lasts', async () => {
    await expect(throwClaudeError(env, new Response(CREDIT, { status: 400 }))).rejects.toThrow('Claude API 400');
    const first = await env.RATE_LIMIT_KV.get('ai-alert:credit');
    expect(first).not.toBeNull();
    await expect(throwClaudeError(env, new Response(CREDIT, { status: 400 }))).rejects.toThrow('credit balance');
    expect(await env.RATE_LIMIT_KV.get('ai-alert:credit')).toBe(first); // not sent again
  });

  it('does not alert on passing errors', async () => {
    await expect(throwClaudeError(env, new Response('overloaded', { status: 529 }))).rejects.toThrow('Claude API 529');
    expect(await env.RATE_LIMIT_KV.get('ai-alert:key')).toBeNull();
  });
});
