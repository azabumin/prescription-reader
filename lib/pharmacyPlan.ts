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

// What the plan screen (app/pharmacy/plan.tsx) says about each plan. The pharmacy picks one there and can change it later.
export const PLAN_INFO: Record<PharmacyPlan, { name: string; does: string; note: string }> = {
  A: {
    name: 'プランA　窓口の処方箋チェック',
    does: '窓口で受けた処方箋を撮影または取り込むと、AIが薬の名前を読み取り、出荷状況と在庫CSVとの照合を表示します。患者さんからの送信は受け付けません。',
    note: '処方箋の画像は、薬の読み取りのため米国のAIサービス（Anthropic社）に送ります。画像も読み取り結果も保存しません。',
  },
  B: {
    name: 'プランB　初回問診の受信箱',
    does: '外国籍の患者さんが窓口のQRコードから送った処方箋の写真と初回アンケートの答えを、日本語の問診票で受け取り、返信できます。薬の読み取りと在庫照合はありません。',
    note: '窓口に置くQRコードのチラシは、運営からお送りします。',
  },
  AB: {
    name: 'プランAB　AとBの両方',
    does: 'AとBの機能を、1つの受付画面で使います。患者さんから届いた処方箋も、AIが薬を読み取り、在庫CSVと照合します。',
    note: 'AとBの両方の注意があてはまります。',
  },
};
