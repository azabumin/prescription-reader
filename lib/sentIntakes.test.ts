import { describe, expect, it } from 'vitest';
import { pruneSent, upsertSent, type SentIntake } from './sentIntakes';

const now = new Date('2026-11-10T12:00:00Z');
const item = (id: string, daysAgo: number): SentIntake => ({
  intakeId: id,
  token: `t-${id}`,
  pharmacyName: 'テスト薬局',
  createdAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
});

describe('sent intakes list', () => {
  it('drops entries older than 8 days and keeps newer ones, newest first', () => {
    const out = pruneSent([item('a', 9), item('b', 1), item('c', 7.9)], now);
    expect(out.map((x) => x.intakeId)).toEqual(['b', 'c']);
  });

  it('upsert replaces an entry with the same intakeId (resend gives a fresh token)', () => {
    const out = upsertSent([item('a', 1)], { ...item('a', 1), token: 'new-token' }, now);
    expect(out).toHaveLength(1);
    expect(out[0].token).toBe('new-token');
  });
});
