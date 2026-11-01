// What a pharmacy has signed up for (worker/src/intake/pharmacyAuth.ts has the same rules and enforces them):
//   A  = 在庫・欠品・出荷調整チェック of walk-in prescriptions (stock CSV + /pharmacy/check), no patient sends
//   B  = patient sends + questionnaire inbox and replies, no medicine reading or stock check
//   AB = both
export type PharmacyPlan = 'A' | 'B' | 'AB';

export const hasStockCheck = (plan: PharmacyPlan) => plan !== 'B';
export const hasIntake = (plan: PharmacyPlan) => plan !== 'A';

export function parsePlan(v: unknown): PharmacyPlan | null {
  return v === 'A' || v === 'B' || v === 'AB' ? v : null;
}
