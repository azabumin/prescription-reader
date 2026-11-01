import { describe, expect, it } from 'vitest';
import { normalizeCard } from './cardShape';

const EMPTY = { notes: '', lang: 'ja', allergyYes: null as boolean | null, meds: [] as string[], textLang: {} as Record<string, string>, child: false };

describe('normalizeCard', () => {
  it('fills missing fields from the empty card', () => {
    expect(normalizeCard({ lang: 'vi', notes: 'xin chào' }, EMPTY)).toEqual({ ...EMPTY, lang: 'vi', notes: 'xin chào' });
  });

  it('drops values of the wrong type', () => {
    expect(normalizeCard({ notes: 3, meds: 'x', textLang: [], child: 'yes', allergyYes: true }, EMPTY)).toEqual({ ...EMPTY, allergyYes: true });
  });

  it('keeps only strings in lists', () => {
    expect(normalizeCard({ meds: ['a', 1, null, 'b'] }, EMPTY).meds).toEqual(['a', 'b']);
  });

  it('returns the empty card for anything that is not an object', () => {
    expect(normalizeCard(null, EMPTY)).toEqual(EMPTY);
    expect(normalizeCard(['x'], EMPTY)).toEqual(EMPTY);
  });
});
