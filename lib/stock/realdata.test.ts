import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { matchDrug } from './match';
import { buildIndex, type RealData } from './realdata';

// The shipped data file (public/pharmacy/realdata.json): the demo's own examples must resolve against it.
const idx = buildIndex(JSON.parse(readFileSync('public/pharmacy/realdata.json', 'utf8')) as RealData);
const line = (name: string, generic = false) => ({ name, generic, amountPerDose: 1, unit: '錠', dosesPerDay: 1, days: 14, prnCount: null, rawText: name });

describe('shipped realdata.json', () => {
  it('finds the generic of アレグラ錠60mg in the same group', () => {
    const r = matchDrug(line('アレグラ錠60mg'), idx, [{ name: 'フェキソフェナジン塩酸塩錠60mg「ケミファ」', qty: 200 }]);
    expect(r.verdict).toBe('ok');
    expect(r.groupSize).toBeGreaterThan(5);
  });

  it('resolves a generic-name line (テプレノンカプセル50mg)', () => {
    const r = matchDrug(line('テプレノンカプセル50mg', true), idx, null);
    expect(r.groupSize).toBeGreaterThan(0);
    // the group is the ingredient + form + strength, so the brand (セルベックス) sits next to the generics
    expect(r.supply.map((s) => s.name)).toContain('テプレノンカプセル50mg「サワイ」');
    expect(r.supply.every((s) => s.name.includes('カプセル'))).toBe(true);
  });
});
