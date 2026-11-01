# 実装計画：薬局プラン A・B

設計書：`docs/superpowers/specs/2026-11-01-pharmacy-ab-plans-design.md`
進め方：インライン実行・TDD・ローカルコミットのみ（push なし）。本番作業はオーナーの確認後。
テスト：`cd worker && npx vitest run`（Worker）、`npx vitest run && npx tsc --noEmit -p tsconfig.json`（ルート）

## Task 1 — Worker：プランの保存と受け渡し
- `worker/migrations/0007_pharmacy_plan.sql`（`plan` 列＋CHECK）
- `pharmacyAuth.ts`：`PharmacySession.plan`、ログイン応答に `plan`、`GET /pharmacy/me`
- テスト：既定値が AB、不正な値は入らない、ログインと /me がプランを返す

## Task 2 — Worker：プランでの制限
- `patientRoutes.ts`：プランAの薬局は `findPharmacy` で見つからない扱い（404）
- `pharmacyRoutes.ts`：受信箱系はBを含むプランだけ（他は 403 `plan`）
- `process.ts`：プランBは `extractDrugs` を呼ばず `drugs_status='skipped'`。成功時に `received` 行へ `drug_count`
- テスト：各プランの可否、Bで AI の読み取り関数が呼ばれない、drug_count が入る

## Task 3 — Worker：窓口照合 `POST /pharmacy/check`
- `worker/src/intake/walkinCheck.ts`（AI関数は差し替え可能な引数）。画像の検証は送信と同じ上限
- Aを含むプランだけ／1日300回／何も保存しない（`walkin_check` の件数行だけ）
- テスト：成功で薬のリスト・DBに画像や受付が増えない・件数行に drug_count、Bは 403、上限で 429、AI失敗で 502

## Task 4 — 運営スクリプト
- `new-pharmacy.mjs --plan`、`set-pharmacy-plan.mjs`

## Task 5 — Web：共通部品とプランの判定
- `lib/pharmacyPlan.ts`（`hasStockCheck` / `hasIntake`、未知の値の扱い）＋テスト
- `lib/pharmacyApi.ts`：`plan`、`getMe()`、`checkWalkin()`、`drugsStatus` に `skipped`
- `components/pharmacy/DrugStockList.tsx`：詳細画面の「処方の内容と在庫」の表を切り出す
- `lib/photoPrep.ts`：送信画面の縮小処理を共通化（幅・高さが 0 のときは測る）

## Task 6 — Web：画面
- `app/pharmacy/check.tsx`（撮影／画像を選ぶ・初回確認・読み取る・表・印刷・次の処方箋へ）
- `app/pharmacy/index.tsx`：`getMe()` でプランを更新し、A／B／AB で出し分け
- `app/pharmacy/intake.tsx`：共通の表に置き換え、Bでは薬の欄を隠す、問診票を既定値で補う

## Task 7 — ブラウザで確認
- ローカル Worker :8787 ＋ Web :8096（rx-stage0-* の起動設定）。A／B／AB の3薬局をローカルに作って画面を確認
- 窓口照合はローカルにAIキーがないため、エラー表示の経路まで。読み取り成功の表示は Worker のテストで確認
- 既存の流れ（患者さんの送信 → AB薬局の受信箱 → 詳細）の回帰確認
