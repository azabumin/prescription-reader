import { describe, expect, it } from 'vitest';
import type { PharmacyCard } from './pharmacyCard';
import { answeredCount, longEdgeResize, newClientRequestId } from './sendLogic';

const empty: PharmacyCard = {
  jpLevel: null, notebook: null, heightCm: '', generic: null, allergyYes: null, allergy: [], allergyOther: '', adrYes: null, adr: [],
  adrDrug: '', conditions: [], conditionsOther: '', pregnancy: [], pregnancyWeek: '', nursingChildAge: '', avoid: [], avoidOther: '',
  meds: [], medsLang: {}, hiddenMeds: [], medsOther: '', medsOtherIngredient: '', otherRx: null, otherRxNotebook: false, otcYes: null,
  otcText: '', pregnancyDue: '', lifestyle: [], smokingPerDay: '', intake: [], constitution: [], diet: [], forms: [], child: false,
  weight: '', notes: '', lang: 'vi', textLang: {}, translations: {}, updatedAt: null,
};

describe('answeredCount', () => {
  it('is 0 for an empty questionnaire', () => {
    expect(answeredCount({ ...empty })).toBe(0);
  });

  it('counts each answered question once (a "no" counts as an answer)', () => {
    expect(answeredCount({ ...empty, conditions: ['hypertension'], conditionsOther: 'gout', allergyYes: false, notes: 'x', weight: '52' })).toBe(4);
  });
});

describe('longEdgeResize', () => {
  // only the long edge is given: expo-image-manipulator's web resize treats null as 0 (only undefined means "keep ratio")
  it('shrinks the long edge to 1568 and omits the other side', () => {
    expect(longEdgeResize(3024, 4032)).toStrictEqual({ height: 1568 });
    expect(longEdgeResize(4032, 3024)).toStrictEqual({ width: 1568 });
  });

  it('leaves small photos alone', () => {
    expect(longEdgeResize(1200, 900)).toBeNull();
  });
});

describe('newClientRequestId', () => {
  it('returns a different id each time', () => {
    expect(newClientRequestId()).not.toBe(newClientRequestId());
  });
});
