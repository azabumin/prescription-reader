import { describe, expect, it } from 'vitest';
import { matchDrug, needQuantity, type DrugLine } from './match';
import { buildIndex, type RealData } from './realdata';

// [yjCode, name, ingredient, kind (0 brand / 1 generic / 2 other), status (0 normal ... 4 stopped)]
const RD: RealData = {
  asof: { supply: '2026-10-10', yakka: '2026-08-13' },
  products: [
    ['4490023F1024', 'アレグラ錠60mg', 'フェキソフェナジン塩酸塩', 0, 0],
    ['4490023F1091', 'フェキソフェナジン塩酸塩錠60mg「ケミファ」', 'フェキソフェナジン塩酸塩', 1, 0],
    ['4490026F2067', 'モンテルカスト錠10mg「KM」', 'モンテルカストナトリウム', 1, 0],
    ['4490026F2075', 'モンテルカスト錠10mg「タカタ」', 'モンテルカストナトリウム', 1, 1],
    ['2329021M1099', 'テプレノンカプセル50mg「サワイ」', 'テプレノン', 1, 4],
    ['1141007F1063', 'カロナール錠200', 'アセトアミノフェン', 2, 0],
  ],
};
const idx = buildIndex(RD);
const drug = (name: string, extra: Partial<DrugLine> = {}): DrugLine => ({
  name, generic: false, amountPerDose: 1, unit: '錠', dosesPerDay: 2, days: 14, prnCount: null, rawText: name, ...extra,
});

describe('needQuantity', () => {
  it('multiplies dose × times a day × days', () => {
    expect(needQuantity(drug('x', { amountPerDose: 1, dosesPerDay: 2, days: 7 }))).toBe(14);
  });
  it('uses the number of doses for as-needed lines', () => {
    expect(needQuantity(drug('x', { amountPerDose: 2, dosesPerDay: null, days: null, prnCount: 5 }))).toBe(10);
  });
  it('is null when a value is missing', () => {
    expect(needQuantity(drug('x', { days: null }))).toBeNull();
  });
});

describe('matchDrug', () => {
  it('brand on the prescription, generic in stock → ok when enough', () => {
    const r = matchDrug(drug('アレグラ錠60mg'), idx, [{ name: 'フェキソフェナジン塩酸塩錠60mg「ケミファ」', qty: 200 }]);
    expect(r).toMatchObject({ verdict: 'ok', need: 28, stockQty: 200, stockNames: ['フェキソフェナジン塩酸塩錠60mg「ケミファ」'], groupSize: 2 });
  });

  it('short when stock is below need', () => {
    const r = matchDrug(drug('モンテルカスト錠10mg「KM」', { dosesPerDay: 1 }), idx, [{ name: 'モンテルカスト錠10mg「KM」', qty: 8 }]);
    expect(r).toMatchObject({ verdict: 'short', need: 14, stockQty: 8 });
  });

  it('none when the group is in the data but not in stock', () => {
    const r = matchDrug(drug('カロナール錠200', { amountPerDose: 2, dosesPerDay: null, days: null, prnCount: 5 }), idx, [{ name: 'モンテルカスト錠10mg「KM」', qty: 8 }]);
    expect(r).toMatchObject({ verdict: 'none', need: 10, stockQty: 0 });
  });

  it('unknown for a topical drug outside the data, with exact-name stock shown', () => {
    const r = matchDrug(drug('ロキソニンテープ100mg', { amountPerDose: null }), idx, [{ name: 'ロキソニンテープ１００ｍｇ', qty: 5 }]);
    expect(r).toMatchObject({ verdict: 'unknown', stockQty: 5, groupSize: 0 });
  });

  it('generic-name prescription (【般】) matches the products starting with that name', () => {
    const r = matchDrug(drug('テプレノンカプセル50mg', { generic: true, dosesPerDay: 3, unit: 'カプセル' }), idx, [{ name: 'テプレノンカプセル50mg「サワイ」', qty: 100 }]);
    expect(r).toMatchObject({ verdict: 'ok', need: 42, stockQty: 100 });
    expect(r.supply).toEqual([{ name: 'テプレノンカプセル50mg「サワイ」', status: 4 }]);
    expect(r.normalAlternatives).toBe(0);
  });

  it('no CSV → unknown verdict but supply status listed', () => {
    const r = matchDrug(drug('モンテルカスト錠10mg「KM」'), idx, null);
    expect(r.verdict).toBe('unknown');
    expect(r.stockQty).toBeNull();
    expect(r.supply).toEqual([
      { name: 'モンテルカスト錠10mg「KM」', status: 0 },
      { name: 'モンテルカスト錠10mg「タカタ」', status: 1 },
    ]);
    expect(r.normalAlternatives).toBe(1);
  });

  it('in stock with an unknown quantity needed counts as ok', () => {
    const r = matchDrug(drug('アレグラ錠60mg', { days: null }), idx, [{ name: 'アレグラ錠60mg', qty: 3 }]);
    expect(r).toMatchObject({ verdict: 'ok', need: null, stockQty: 3 });
  });
});
