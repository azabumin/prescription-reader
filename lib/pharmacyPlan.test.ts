import { describe, expect, it } from 'vitest';
import { hasIntake, hasStockCheck, parsePlan } from './pharmacyPlan';

describe('pharmacy plan', () => {
  it('A is the stock check only, B the inbox only, AB both', () => {
    expect([hasStockCheck('A'), hasIntake('A')]).toEqual([true, false]);
    expect([hasStockCheck('B'), hasIntake('B')]).toEqual([false, true]);
    expect([hasStockCheck('AB'), hasIntake('AB')]).toEqual([true, true]);
  });

  it('parses only the three known plans', () => {
    expect(parsePlan('A')).toBe('A');
    expect(parsePlan('AB')).toBe('AB');
    expect(parsePlan('ab')).toBeNull();
    expect(parsePlan(undefined)).toBeNull();
  });
});
