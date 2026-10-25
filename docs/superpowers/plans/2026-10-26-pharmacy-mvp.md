# 薬局連携MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 患者さんが薬局のQRから会員登録なしで処方箋の写真と初回アンケートを送り、薬局が受付用ブラウザで日本語で受け取り、自分の在庫CSVと照合して、患者さんの言語で返信できるようにする。

**Architecture:** 既存の Cloudflare Worker（`prescription-reader-api`）に「受付（intake）」と「薬局アカウント」のAPIを足し、データは既存の D1 に置く（写真も D1。R2 は使わない）。AI処理（薬の読み取り・自由記述の日本語訳）は受付保存のあと `ctx.waitUntil` で行う。フロントは既存の Expo アプリに、患者さん用 `app/send.tsx`・`app/sent.tsx` と、薬局用 `app/pharmacy/*`（日本語のみ）を足す。在庫照合は薬局のブラウザ内だけで行う純粋なTSモジュール（`lib/stock/*`）。

**Tech Stack:** Expo 57（expo-router, react-native-web）、TypeScript、Cloudflare Workers + D1 + KV + Cron Triggers、Anthropic Messages API（raw fetch）、Resend（メール）、Vitest（root の `lib/stock`）、Vitest + `@cloudflare/vitest-pool-workers`（Worker）。

**Spec:** `docs/superpowers/specs/2026-10-26-pharmacy-mvp-design.md`

## Global Constraints

- 作業はブランチ `pharmacy-memo`（作業ツリー `C:\work\prescription-reader-stage0`）の上。メインのツリー `C:\work\prescription-reader` は触らない。
- **Expo のコードを書く前に** https://docs.expo.dev/versions/v57.0.0/ の該当ページ（expo-router のルート・`useLocalSearchParams`、expo-image-picker、expo-image-manipulator）を読む（AGENTS.md）。
- 患者さん側の文言は11言語：`ja, ko, en, vi, zh, id, tl, th, my, ne, pt`（`types.ts` の `LANGUAGES`）。薬局側の画面は日本語のみ。日本語フォントは Meiryo を優先。
- 患者さんの送信フローは**会員登録なし**。7日間の試用・月額の制限（`canAnalyze`）を掛けない。
- 受付データの保存期間：薬局が「完了」→ 写真・答え・メッセージ・メールアドレスを即削除。完了されなくても**受付から7日**（`INTAKE_TTL_DAYS = 7`）で行ごと削除。
- **在庫CSVはサーバーに送らない**（薬局のブラウザ内だけで読む）。
- 通知メールには薬の名前などの中身を書かない（「薬局から返信がありました」＋リンクのみ）。
- 患者さんに金銭的な特典を示す文言を書かない（「無料」「ポイント」「割引」を前に出さない）。
- 判断は薬剤師。AIの薬の一覧は「参考」と常に表示し、処方箋の写真を必ず並べる。
- 宣伝・UIで「名寄せ」という言葉を使わない（照合の内部処理としては使ってよい）。
- 秘密情報（`RESEND_API_KEY` など）はオーナーが `wrangler secret put <NAME>` の**プロンプト**に入力する。コマンド引数に貼らせない。
- コミットはユーザーの指示があるときだけ（各タスクの Commit ステップは、ユーザーがコミットを了承している場合に実行）。

## Review Focus

1. **アンケート未記入のまま送る患者さん** → 送信はできる（必須は写真と同意だけ）。薬局の画面では未回答の項目を「未回答」と出し、送信前に「アンケートが未記入です」と一度だけ確認する。→ Task 3・Task 9 のテスト。
2. **iPhone の大きな写真（HEIC・12MP）** → 送信前に長辺1600px・JPEG・画質0.7に縮小する。それでも上限（1枚 base64 1,500,000文字）を超えたら、分かりやすいエラーで撮り直しを促す。→ Task 3（サーバー側の上限）・Task 9。
3. **Shift_JIS・見出し行あり・数量が "1,200" のような引用符つきのCSV** → 正しく読む。列の選び直しができる。→ Task 10 のテスト。
4. **期限切れ・削除済みの受付を薬局が開く／患者さんが見る** → 404 を「この受付は削除されました（7日経過または完了）」と表示し、画面が壊れない。→ Task 5・Task 7・Task 9・Task 11。
5. **送信中に通信が切れて患者さんが再送する** → 同じ受付が二重にできない（クライアント生成の `clientRequestId` で冪等）。→ Task 3 のテスト。

---

## File Structure

```
worker/
  migrations/0006_pharmacy_intake.sql      # pharmacies, pharmacy_sessions, intakes, intake_images, intake_messages, intake_events
  src/index.ts                              # ルート追加・scheduled ハンドラ追加（既存）
  src/intake/types.ts                       # 共通型（IntakeStatus, PickupCode, ExtractedDrug, …）
  src/intake/patientRoutes.ts               # GET /p/pharmacy, POST /intakes, GET /intakes/:id
  src/intake/pharmacyAuth.ts                # 設定コード→パスワード設定、ログイン、セッション解決
  src/intake/pharmacyRoutes.ts              # 受信箱・詳細・写真・返信・メッセージ・完了・テンプレート・訳のプレビュー
  src/intake/ai.ts                          # extractDrugs(), translateFieldsToJa(), translateToPatient()
  src/intake/process.ts                     # waitUntil で動く AI 処理（drugs_status の更新）
  src/intake/templates.ts                   # 定型メッセージ（5件×11言語）・受け取り時刻ラベル
  src/intake/notify.ts                      # 状態変化メール（11言語・中身なし）
  src/intake/cleanup.ts                     # 期限切れ削除（Cron）
  src/intake/events.ts                      # 個人情報なしの時刻記録
  scripts/new-pharmacy.mjs                  # 薬局の登録（コード・設定コード発行、wrangler d1 execute）
  scripts/intake-stats.mjs                  # 検証研究の集計
  vitest.config.mts, test/*.test.ts         # Worker のテスト
  wrangler.jsonc                            # triggers.crons 追加
lib/
  intakeApi.ts                              # 患者さん側 API
  intakeStore.ts                            # 送った受付の一覧（AsyncStorage）
  sendStrings.ts                            # 患者さん側の新しい文言（11言語）
  pharmacyApi.ts                            # 薬局側 API（セッションは localStorage）
  stock/csv.ts                              # CSV 読み込み（文字コード判定・列選択）
  stock/realdata.ts                         # 公的データの読み込み・索引
  stock/match.ts                            # 処方の薬 × 在庫の判定
  stock/*.test.ts                           # Vitest
components/
  JapaneseCard.tsx                          # app/pharmacy-card.tsx から切り出し（薬局画面でも使う）
app/
  send.tsx                                  # 患者さん：この薬局に送る
  sent.tsx                                  # 患者さん：送った受付の状態とメッセージ
  pharmacy/_layout.tsx, setup.tsx, login.tsx, index.tsx, [id].tsx   # 薬局（日本語）
  privacy.tsx                               # 薬局へ送る機能の記載（11言語）
public/pharmacy/realdata.json               # 公的データ（薬局画面だけが読み込む）
scripts/build-realdata-json.mjs             # ../pharmacy-stock-check/demo/realdata.js → public/pharmacy/realdata.json
docs/pilot/検証研究の協力に関する同意書_ja.md, 薬局向け案内チラシ_ja.md
```

---

### Task 1: テストの土台と DB マイグレーション

**Files:**
- Create: `worker/vitest.config.mts`, `worker/test/env.d.ts`, `worker/test/apply-migrations.ts`, `worker/test/schema.test.ts`
- Create: `worker/migrations/0006_pharmacy_intake.sql`
- Modify: `worker/package.json`（devDependencies: `vitest`, `@cloudflare/vitest-pool-workers`、script `"test": "vitest run"`）
- Create: `vitest.config.ts`（root、`lib/**/*.test.ts` のみ、environment `node`）、root `package.json` に `vitest` と script `"test": "vitest run"`

**Interfaces:**
- Produces: テーブル
  - `pharmacies(id INTEGER PK, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, login_email TEXT UNIQUE NOT NULL, password_hash TEXT, password_salt TEXT, setup_code_hash TEXT, setup_expires_at TEXT, created_at TEXT NOT NULL, disabled_at TEXT)`
  - `pharmacy_sessions(token TEXT PK, pharmacy_id INTEGER NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)`
  - `intakes(id TEXT PK, pharmacy_id INTEGER NOT NULL, client_request_id TEXT NOT NULL, patient_token_hash TEXT NOT NULL, lang TEXT NOT NULL, pickup TEXT NOT NULL, card_json TEXT, drugs_json TEXT, drugs_status TEXT NOT NULL DEFAULT 'pending', notify_email TEXT, status TEXT NOT NULL DEFAULT 'new', later_time TEXT, created_at TEXT NOT NULL, opened_at TEXT, replied_at TEXT, done_at TEXT, expires_at TEXT NOT NULL, UNIQUE(pharmacy_id, client_request_id))`
  - `intake_images(intake_id TEXT NOT NULL REFERENCES intakes(id) ON DELETE CASCADE, idx INTEGER NOT NULL, media_type TEXT NOT NULL, data_b64 TEXT NOT NULL, PRIMARY KEY(intake_id, idx))`
  - `intake_messages(id INTEGER PK AUTOINCREMENT, intake_id TEXT NOT NULL REFERENCES intakes(id) ON DELETE CASCADE, kind TEXT NOT NULL, template_key TEXT, text_ja TEXT NOT NULL, text_patient TEXT NOT NULL, created_at TEXT NOT NULL)`
  - `intake_events(id INTEGER PK AUTOINCREMENT, pharmacy_id INTEGER NOT NULL, intake_ref TEXT NOT NULL, event TEXT NOT NULL, lang TEXT, drug_count INTEGER, at TEXT NOT NULL)` — 削除の対象外（個人情報なし）
  - インデックス：`intakes(pharmacy_id, created_at)`、`intakes(expires_at)`、`intake_events(pharmacy_id, at)`
- Produces: テスト用ヘルパー `applyAllMigrations(env)`（`readD1Migrations` / `applyD1Migrations` の公式パターン）

- [ ] **Step 1:** `@cloudflare/vitest-pool-workers` の現行ドキュメント（developers.cloudflare.com/workers/testing/vitest-integration/）を読み、対応する `vitest` の版を入れる。`worker/vitest.config.mts` は `wrangler.jsonc` を参照し、テスト用に `PASSWORD_PEPPER='test-pepper'`、`ANTHROPIC_API_KEY='test'`、`ALLOWED_ORIGINS='https://rxhelper.jp'` を miniflare の bindings で渡す。
- [ ] **Step 2: Write the failing test** `worker/test/schema.test.ts` — `it('creates the intake tables')`：マイグレーション適用後 `SELECT name FROM sqlite_master WHERE type='table'` に `pharmacies, pharmacy_sessions, intakes, intake_images, intake_messages, intake_events` がすべて含まれる。
- [ ] **Step 3:** Run `cd worker && npm test` → FAIL（テーブルなし）
- [ ] **Step 4:** `0006_pharmacy_intake.sql` を上の定義どおりに書く（`PRAGMA foreign_keys` は D1 既定で有効）。
- [ ] **Step 5:** Run `cd worker && npm test` → PASS。root でも `npm test` が「テストなし」で失敗しない設定（`passWithNoTests: true`）になっていること。
- [ ] **Step 6: Commit** `git add worker/migrations/0006_pharmacy_intake.sql worker/vitest.config.mts worker/test worker/package.json worker/package-lock.json vitest.config.ts package.json package-lock.json && git commit -m "Pharmacy MVP: intake schema and test harness"`

---

### Task 2: 薬局アカウント（設定コード・ログイン・セッション）と登録スクリプト

**Files:**
- Create: `worker/src/intake/pharmacyAuth.ts`, `worker/scripts/new-pharmacy.mjs`, `worker/test/pharmacyAuth.test.ts`
- Modify: `worker/src/index.ts`（ルート3つ）

**Interfaces:**
- Consumes: `hashPassword(password, pepper)` と検証関数（既存 `worker/src/auth.ts`。検証関数が非公開なら `verifyPassword(password, hash, salt, pepper): Promise<boolean>` として export する）
- Produces:
  - `POST /pharmacy/setup` body `{ code: string, setupCode: string, password: string }` → 200 `{ ok: true }` ／ 400 `{ error: 'invalid_setup' }`（不一致・期限切れ・使用済み）／ 400 `{ error: 'weak_password' }`（8文字未満）
  - `POST /pharmacy/login` body `{ email: string, password: string }` → 200 `{ token: string, pharmacy: { name: string, code: string } }` ／ 401 `{ error: 'invalid_credentials' }`（停止中の薬局も 401）
  - `POST /pharmacy/logout`（Bearer）→ 200
  - `resolvePharmacySession(request: Request, db: D1Database): Promise<{ id: number; name: string; code: string } | null>`（Bearer トークン、期限内、`disabled_at IS NULL`）
  - セッション期限 `PHARMACY_SESSION_TTL_DAYS = 30`、設定コード期限 `SETUP_TTL_DAYS = 14`
  - `setup_code_hash` は SHA-256（hex）。使ったら `NULL` にする
- Produces: `node worker/scripts/new-pharmacy.mjs --name "○○薬局" --email pharmacy@example.jp [--remote]` → 10文字の薬局コード（英小文字＋数字、紛らわしい `0 o 1 l` を除く）と24文字の設定コードを生成し、`wrangler d1 execute prescription-reader-db [--remote] --command "INSERT …"` を実行して、`https://rxhelper.jp/pharmacy/setup?code=<code>&s=<setupCode>`（薬局用）と `https://rxhelper.jp/send?ph=<code>`（患者さん用）を表示する。運営はパスワードを知らない。

- [ ] **Step 1: Write the failing tests** `worker/test/pharmacyAuth.test.ts`（テスト内で薬局行を直接 INSERT）:
  - `setup sets a password once`：正しいコードで 200 → 同じ設定コードで再実行すると 400 `invalid_setup`
  - `setup rejects an expired code`：`setup_expires_at` を過去にすると 400 `invalid_setup`
  - `setup rejects a short password`：`'1234567'` → 400 `weak_password`
  - `login returns a token and the pharmacy name`：設定後にログイン → 200、`pharmacy.code` が一致
  - `login fails for a disabled pharmacy`：`disabled_at` を入れると 401
  - `resolvePharmacySession rejects an expired session`
- [ ] **Step 2:** Run `cd worker && npm test` → FAIL
- [ ] **Step 3:** `pharmacyAuth.ts` を実装し、`index.ts` に3ルートを足す（既存の CORS ヘッダーを使う）。
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5:** `new-pharmacy.mjs` を書き、ローカル（`--remote` なし）で1件作って SQL が通ることを確認。
- [ ] **Step 6: Commit** `git commit -m "Pharmacy MVP: pharmacy accounts with one-time setup codes"`

---

### Task 3: 患者さんの送信と状態確認（受付の保存）

**Files:**
- Create: `worker/src/intake/types.ts`, `worker/src/intake/patientRoutes.ts`, `worker/src/intake/events.ts`, `worker/test/patientRoutes.test.ts`
- Modify: `worker/src/index.ts`（ルート3つ。`GET /intakes/:id` はパスを分解して判定）

**Interfaces:**
- Produces（`types.ts`）:
  - `type IntakeStatus = 'new' | 'ready' | 'inquiry' | 'later' | 'done'`
  - `type PickupCode = 'today15' | 'today17' | 'today19' | 'tomorrow'`
  - `type ExtractedDrug = { name: string; generic: boolean; amountPerDose: number | null; unit: string; dosesPerDay: number | null; days: number | null; prnCount: number | null; rawText: string }`
  - `INTAKE_TTL_DAYS = 7`、`MAX_IMAGES = 2`、`MAX_IMAGE_B64 = 1_500_000`、`MAX_CARD_JSON = 50_000`
- Produces（`events.ts`）: `logEvent(db, pharmacyId: number, intakeId: string, event: 'received' | 'opened' | 'replied' | 'done' | 'expired', extra?: { lang?: string; drugCount?: number }): Promise<void>` — `intake_ref` は `intakeId` の SHA-256 先頭16文字（元の ID に戻せない）
- Produces（API）:
  - `GET /p/pharmacy?code=<code>` → 200 `{ name }` ／ 404 `{ error: 'not_found' }`（停止中も 404）
  - `POST /intakes` body `{ pharmacyCode, clientRequestId, lang: Lang, pickup: PickupCode, card: PharmacyCard, images: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[], notifyEmail?: string, consent: true }` → 201 `{ intakeId: string, patientToken: string }`
    - 400 `{ error: 'invalid' }`：同意なし／写真0枚・3枚以上／未知の lang・pickup／card が大きすぎる
    - 413 `{ error: 'image_too_large' }`：1枚でも `MAX_IMAGE_B64` 超
    - 404 `{ error: 'pharmacy_not_found' }`
    - 429 `{ error: 'rate_limited' }`：IP ごと1日10件、薬局ごと1日200件（KV キー `intake-ip:<ip>:<date>`、`intake-ph:<id>:<date>`）
    - 同じ `pharmacyCode + clientRequestId` の再送は、新しく作らず**最初の受付と同じ `intakeId`** を返す（`patientToken` は再発行して保存し直す）
    - `intakeId`：32文字の hex、`patientToken`：32バイトの hex。保存するのはトークンの SHA-256 だけ
    - 保存後 `ctx.waitUntil(processIntake(env, intakeId))`（Task 4 で中身を作る。ここでは何もしない関数を置く）と `logEvent(…, 'received', { lang })`
  - `GET /intakes/:id`（ヘッダー `X-Intake-Token`）→ 200 `{ pharmacyName, status: IntakeStatus, laterTime: string | null, createdAt, messages: { textPatient: string; textJa: string; createdAt: string }[] }` ／ 404 `{ error: 'not_found' }`（ID 不明・トークン不一致・削除済みはすべて同じ 404）

- [ ] **Step 1: Write the failing tests** `worker/test/patientRoutes.test.ts`:
  - `rejects a send without consent` → 400 `invalid`
  - `rejects zero and three images` → 400 `invalid`
  - `rejects an oversized image` → 413 `image_too_large`
  - `accepts an empty questionnaire`（`emptyCard` 相当）→ 201
  - `stores only the token hash`：`intakes.patient_token_hash` が返した `patientToken` と一致しない、かつ SHA-256(token) と一致
  - `same clientRequestId returns the same intakeId` かつ `intakes` の行数が1
  - `GET /intakes/:id with a wrong token is 404` と `with the right token returns status 'new'`
  - `11th send from one IP in a day is 429`
  - `logs a received event without personal data`：`intake_events` に1行、`intake_ref` ≠ `intakeId`
- [ ] **Step 2:** Run `cd worker && npm test` → FAIL
- [ ] **Step 3:** `types.ts`・`events.ts`・`patientRoutes.ts` を実装し、`index.ts` の `fetch(request, env, ctx)` に `ctx` を通して3ルートを足す。
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5: Commit** `git commit -m "Pharmacy MVP: patient send and status endpoints"`

---

### Task 4: AI 処理（薬の読み取り・自由記述の日本語訳）

**Files:**
- Create: `worker/src/intake/ai.ts`, `worker/src/intake/process.ts`, `worker/test/process.test.ts`
- Modify: `worker/src/memoTranslate.ts`（翻訳の中核を `translateFields(env, fields: { key: string; text: string; lang: string }[]): Promise<Record<string, string>>` として export し、既存の `/translate-memo` もそれを使う。挙動は変えない）

**Interfaces:**
- Produces（`ai.ts`）:
  - `extractDrugs(env, images: { base64: string; mediaType: string }[]): Promise<ExtractedDrug[]>` — Anthropic Messages API、JSON schema 出力。モデルは `claude-opus-5-5`（`output_config: { effort: 'low', format: { type: 'json_schema', schema } }`、`fallbacks: 'default'` とヘッダー `anthropic-beta: server-side-fallback-2026-07-01`。既存 `memoTranslate.ts` と同じ書き方）。プロンプトの要点：印刷どおりの薬品名（【般】は `generic: true`、名前から【般】は外す）、1回量・単位・1日回数・日数、頓服は `prnCount`、読めない項目は `null`、推測しない。
  - `translateFieldsToJa(env, card: PharmacyCard): Promise<PharmacyCard>` — `untranslatedFields` 相当の自由記述（`FREE_TEXT_FIELDS`）のうち、`textLang` が `ja` でなく、`translations[field]?.src` が現在の本文と一致しないものを `translateFields` で訳し、`translations[field] = { src, ja }` を埋めて返す
  - `translateToPatient(env, textJa: string, lang: Lang): Promise<string>` — 日本語→患者さんの言語（`ja` ならそのまま返す）
- Produces（`process.ts`）: `processIntake(env, intakeId: string): Promise<void>` — 写真を読み `extractDrugs` → `drugs_json` 保存・`drugs_status='done'`。失敗したら `drugs_status='failed'`（写真と答えは残す）。カードの訳を `translateFieldsToJa` で埋めて `card_json` を更新（訳の失敗はカードをそのまま残す）。どちらも受付が削除済みなら何もしない。
- Worker の `PharmacyCard` 型：`lib/pharmacyCard.ts` から型だけコピーした `worker/src/intake/cardType.ts` を置く（「`lib/pharmacyCard.ts` と同期」コメント。既存の LANGUAGE_NAMES と同じ流儀）。

- [ ] **Step 1: Write the failing tests** `worker/test/process.test.ts`（`vi.mock('../src/intake/ai')` で AI を差し替える）:
  - `stores extracted drugs and marks done`
  - `marks failed when extraction throws, keeps images and card`
  - `fills ja translations for non-Japanese free text only`：`notes`（`textLang.notes='vi'`）は訳され、`textLang.adrDrug='ja'` の項目は訳されない
  - `does nothing for a deleted intake`
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** 実装。Task 3 の空の `processIntake` を置き換える。`/translate-memo` の既存の動作確認（手動で1回呼ぶ）も行う。
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5: Commit** `git commit -m "Pharmacy MVP: AI drug extraction and Japanese translation after send"`

---

### Task 5: 薬局の受信箱・詳細・写真

**Files:**
- Create: `worker/src/intake/pharmacyRoutes.ts`, `worker/test/pharmacyRoutes.test.ts`
- Modify: `worker/src/index.ts`

**Interfaces:**
- Consumes: `resolvePharmacySession`（Task 2）、`logEvent`（Task 3）
- Produces（すべて Bearer 必須、他の薬局の受付は 404）:
  - `GET /pharmacy/intakes` → `{ items: { id, createdAt, lang, pickup: PickupCode, status: IntakeStatus, drugsStatus: 'pending' | 'done' | 'failed', opened: boolean }[] }`（新しい順、`status != 'done'` を先に、最大100件）
  - `GET /pharmacy/intakes/:id` → `{ id, createdAt, lang, pickup, status, laterTime, drugsStatus, drugs: ExtractedDrug[] | null, card: PharmacyCard | null, imageCount: number, messages: { kind, textJa, textPatient, createdAt }[] }`。初回だけ `opened_at` を入れ `logEvent('opened')`
  - `GET /pharmacy/intakes/:id/images/:idx` → 画像のバイナリ（`Content-Type` は保存した型、`Cache-Control: no-store`）
  - 削除済み・期限切れ → 404 `{ error: 'gone' }`

- [ ] **Step 1: Write the failing tests**:
  - `lists only this pharmacy's intakes`（2薬局を作り、Aのトークンで Bの受付が見えない）
  - `detail of another pharmacy's intake is 404`
  - `first open records opened_at and one opened event; second open does not add another`
  - `image endpoint returns the stored bytes with no-store`
  - `unauthenticated requests are 401`
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** 実装
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5: Commit** `git commit -m "Pharmacy MVP: pharmacy inbox, detail and photos"`

---

### Task 6: 返信・定型メッセージ・自由入力の訳・メール通知

**Files:**
- Create: `worker/src/intake/templates.ts`, `worker/src/intake/notify.ts`, `worker/test/replies.test.ts`
- Modify: `worker/src/intake/pharmacyRoutes.ts`, `worker/src/index.ts`

**Interfaces:**
- Produces（`templates.ts`）:
  - `REPLY_TEMPLATES: { key: 't1' | 't2' | 't3' | 't4' | 't5'; text: Record<Lang, string> }[]` — 日本語はデモの5文をそのまま：
    - t1「在庫が足りないため、一部のお薬は明日以降のお渡しになります。」
    - t2「保険証（マイナ保険証）とお薬手帳を持ってきてください。」
    - t3「ジェネリック医薬品（後発品）に変えてもよろしいですか。来局時にお聞かせください。」
    - t4「お薬の飲み方について、来局時にご説明します。少しお時間をください。」
    - t5「本日は19時で閉局します。それまでにお越しください。」
    ko/en/zh/vi はデモ（`C:\work\pharmacy-stock-check\demo\stock-check-demo.html` の `QMSG`）から、id/tl/th/my/ne/pt は新しく訳す
  - `STATUS_TEXT: Record<'ready' | 'inquiry' | 'later', Record<Lang, string>>`（`later` は `{time}` を含む。日本語：「薬の準備ができました。」「薬剤師が処方内容を確認しています。お渡しまで少しお待ちください。」「{time}以降にご用意できます。」）
- Produces（API、Bearer 必須）:
  - `GET /pharmacy/templates` → `{ items: { key, textJa }[] }`
  - `POST /pharmacy/intakes/:id/reply` body `{ status: 'ready' | 'inquiry' | 'later', laterTime?: '17:00' | '18:00' | '19:00' | '20:00' }` → 200。`replied_at` は初回だけ記録、`logEvent('replied')` も初回だけ。`notify_email` があれば `sendStatusEmail`
  - `POST /pharmacy/translate-preview` body `{ textJa: string, lang: Lang }` → `{ textPatient }`（1日の上限：薬局ごと200回、KV）
  - `POST /pharmacy/intakes/:id/messages` body `{ kind: 'template', templateKey }` または `{ kind: 'free', textJa, textPatient }` → 201。テンプレートは `text_patient = REPLY_TEMPLATES[key].text[lang]`。自由入力は薬局が確認した `textPatient` をそのまま保存（サーバーで訳し直さない）。メール通知あり
- Produces（`notify.ts`）: `sendStatusEmail(env, to: string, lang: Lang, intakeId: string): Promise<void>` — 件名・本文は11言語、本文は「薬局から返信がありました。アプリで確認してください。」の意味＋`https://rxhelper.jp/sent?i=<intakeId>` のみ。`RESEND_API_KEY` 未設定ならログだけ（既存 `email.ts` と同じ）

- [ ] **Step 1: Write the failing tests**:
  - `reply 'later' requires laterTime` → 400
  - `reply updates status and records replied once`（2回返信しても `replied` イベントは1件）
  - `template message stores the patient-language text`（lang `vi` の受付に t1 → `text_patient` が `REPLY_TEMPLATES[0].text.vi`）
  - `patient status shows the message`（Task 3 の `GET /intakes/:id` に textPatient と textJa が出る）
  - `email is sent only when notify_email is set and never contains drug names`（`fetch` をスパイし、本文に `drugs_json` の薬品名が含まれない）
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** 実装。`STATUS_TEXT` の文言は患者さん側の状態表示（Task 9）でも使うので、`lib/sendStrings.ts` に同じ文を置く（「worker/src/intake/templates.ts と同期」コメント）。
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5: Commit** `git commit -m "Pharmacy MVP: replies, translated messages and status emails"`

---

### Task 7: 完了・自動削除（Cron）・集計スクリプト

**Files:**
- Create: `worker/src/intake/cleanup.ts`, `worker/scripts/intake-stats.mjs`, `worker/test/cleanup.test.ts`
- Modify: `worker/src/intake/pharmacyRoutes.ts`, `worker/src/index.ts`（`scheduled` ハンドラ）, `worker/wrangler.jsonc`（`"triggers": { "crons": ["0 * * * *"] }`）

**Interfaces:**
- Produces:
  - `POST /pharmacy/intakes/:id/done`（Bearer）→ 200。`intake_images`・`intake_messages` を削除し、`card_json`・`drugs_json`・`notify_email` を `NULL`、`status='done'`、`done_at` を記録、`logEvent('done')`。行そのものは `expires_at` まで残す（患者さんの画面で「完了」と出すため）
  - `purgeExpired(db, now: Date): Promise<number>` — `expires_at < now` の受付を行ごと削除（CASCADE）。完了していなかったものは削除前に `logEvent('expired')`。戻り値は削除件数
  - `scheduled(event, env, ctx)` → `ctx.waitUntil(purgeExpired(env.DB, new Date()))`
  - `node worker/scripts/intake-stats.mjs [--remote] [--from 2026-12-01]` → 薬局ごと：受付件数、言語の内訳、届いてから開くまで・返信まで・完了までの中央値（分）。`intake_events` だけを使う

- [ ] **Step 1: Write the failing tests**:
  - `done removes photos, answers, messages and email but keeps the row`
  - `patient sees status 'done' after completion`
  - `purgeExpired deletes rows past 7 days and logs expired for unfinished ones`
  - `purgeExpired keeps rows within 7 days`
  - `events survive the purge`
- [ ] **Step 2:** Run → FAIL
- [ ] **Step 3:** 実装
- [ ] **Step 4:** Run → PASS
- [ ] **Step 5: Commit** `git commit -m "Pharmacy MVP: completion, 7-day purge and study stats"`

---

### Task 8: フロントの共通部品（日本語カードの切り出し・API・送った受付の保存）

**Files:**
- Create: `components/JapaneseCard.tsx`, `lib/intakeApi.ts`, `lib/intakeStore.ts`, `lib/pharmacyApi.ts`
- Modify: `app/pharmacy-card.tsx`（`JapaneseCard` を import に置き換えるだけ。表示は変えない）

**Interfaces:**
- Produces:
  - `JapaneseCard({ card }: { card: PharmacyCard })`（今の `app/pharmacy-card.tsx:545` の関数をそのまま移す）
  - `lib/intakeApi.ts`：`getPharmacyName(code: string): Promise<string | null>`、`sendIntake(input: SendIntakeInput): Promise<{ intakeId: string; patientToken: string }>`、`getIntakeStatus(intakeId: string, token: string): Promise<IntakeStatusView | null>`（404→`null`）、エラーは `IntakeError(code: 'network' | 'invalid' | 'image_too_large' | 'rate_limited' | 'pharmacy_not_found' | 'server')`
  - `lib/intakeStore.ts`：`type SentIntake = { intakeId: string; token: string; pharmacyName: string; createdAt: string }`、`listSent(): Promise<SentIntake[]>`、`addSent(x: SentIntake): Promise<void>`、`removeSent(intakeId: string): Promise<void>`。AsyncStorage キー `rxhelper.sentIntakes.v1`。8日より古いものは `listSent` で自動的に落とす
  - `lib/pharmacyApi.ts`：Task 2・5・6・7 の各エンドポイントに対応する関数（`setupPharmacy`、`loginPharmacy`、`logoutPharmacy`、`listIntakes`、`getIntake`、`getIntakeImageUrl`（blob URL を返す）、`reply`、`listTemplates`、`previewTranslation`、`postMessage`、`markDone`）。セッションは `localStorage` キー `rxhelper.pharmacySession.v1`（薬局画面は web のみ）。401 を受けたらセッションを消して `PharmacyAuthError` を投げる

- [ ] **Step 1:** Expo v57 のドキュメントで expo-router の動的ルートと `useLocalSearchParams` を確認する。
- [ ] **Step 2:** `JapaneseCard` を切り出し、`npx tsc --noEmit` が通ること、既存の「薬局で見せるメモ」画面の表示が変わらないこと（dev サーバーで目視）を確認。
- [ ] **Step 3:** 3つの lib を書く（型は Worker の API 定義に合わせる）。`npx tsc --noEmit` → エラーなし。
- [ ] **Step 4: Commit** `git commit -m "Pharmacy MVP: shared JapaneseCard and API clients"`

---

### Task 9: 患者さんの画面（送る・状態）とプライバシーポリシー

**Files:**
- Create: `app/send.tsx`, `app/sent.tsx`, `lib/sendStrings.ts`
- Modify: `app/_layout.tsx`（`send`、`sent`、`pharmacy` を Stack に追加）, `app/index.tsx`（送った受付があれば「送った処方箋」への入口）, `app/pharmacy-card.tsx`（`?returnTo=send` で保存後に送信画面へ戻る）, `app/privacy.tsx`（11言語）

**Interfaces:**
- Consumes: Task 8 の `intakeApi`・`intakeStore`、既存の `loadCard()`（`lib/pharmacyCard.ts`）、expo-image-picker・expo-image-manipulator
- Produces（画面の振る舞い）:
  - `/send?ph=<code>`：薬局名を表示（不明なら「このQRコードは使えません」）→「初回アンケート」：保存済みのメモがあれば「回答済み（○項目）」、なければ「回答する」で `/pharmacy-card?returnTo=send` → 処方箋の写真（1〜2枚。電子処方箋は「控え」でよいと案内）→ 受け取りの希望時刻（`today15/today17/today19/tomorrow`）→ メール（任意）→ 同意（3点を明記：選んだ薬局に送る／AI（海外のサーバー）が処方箋を読み自由記述を訳す／薬局が確認したあと自動で消える・確認されなくても7日で消える）→ 送信
  - 写真は送信前に `manipulateAsync` で長辺1600px・JPEG・`compress: 0.7`。`clientRequestId` は画面を開いたときに1つ作り、再送でも同じ値を使う
  - アンケート未記入なら送信前に一度だけ「アンケートが未記入です。このまま送りますか？」
  - 送信成功 → `addSent` → `/sent?i=<intakeId>`
  - `/sent`：`listSent` の一覧。各受付を開いたとき・30秒ごとに `getIntakeStatus`。状態は `STATUS_TEXT`（Task 6 と同じ文）、メッセージは患者さんの言語＋その下に日本語の原文。`null`（404）なら「この受付は削除されました（7日経過または完了）」と出して一覧から消せる。受け取りの案内（処方箋の原本・お薬手帳かマイナ保険証）を常に表示
  - プライバシーポリシー：「薬局へ送る機能」の節（送り先、保存期間7日・完了で削除、AI（米国）、メールは任意で中身を書かない）を11言語で追加
- 文言は `lib/sendStrings.ts` に11言語。「無料」「ポイント」は書かない。状態の文は `STATUS_TEXT`（ready/inquiry/later）に加えて、`new`「薬局が確認しています。」と `done`「受付は完了しました。」も11言語で持つ。

- [ ] **Step 1:** 文言ファイル `lib/sendStrings.ts` を作る（11言語、`ja` を先に書き、ほかは訳）。`npx tsc --noEmit` で全言語のキーがそろっていること（`Record<Lang, SendStrings>` 型で保証）。
- [ ] **Step 2:** `app/send.tsx`・`app/sent.tsx`・`_layout.tsx`・`index.tsx`・`pharmacy-card.tsx` を実装。
- [ ] **Step 3:** dev サーバーで確認：ローカル Worker（`wrangler dev`）と Task 2 のスクリプトで作った薬局コードで、日本語と ベトナム語の2通り、送信 → `/sent` に「確認しています」まで。写真なし・同意なしでは送信ボタンが押せないこと、未記入確認が1回だけ出ること、404 の受付で削除メッセージが出ること。
- [ ] **Step 4:** プライバシーポリシーを更新し、表示を確認。
- [ ] **Step 5: Commit** `git commit -m "Pharmacy MVP: patient send and status screens, privacy policy"`

---

### Task 10: 在庫照合ロジック（CSV・公的データ・判定）

**Files:**
- Create: `scripts/build-realdata-json.mjs`, `public/pharmacy/realdata.json`, `lib/stock/csv.ts`, `lib/stock/realdata.ts`, `lib/stock/match.ts`, `lib/stock/csv.test.ts`, `lib/stock/match.test.ts`

**Interfaces:**
- Produces:
  - `scripts/build-realdata-json.mjs`：`C:\work\pharmacy-stock-check\demo\realdata.js`（`window.REALDATA={…}`）から JSON を取り出して `public/pharmacy/realdata.json` に書く。商品の配列は `[yjCode, name, ingredient, kind, status, statusDate, inFormulary, price]`（`kind` 0=先発 1=後発、`status` 0=通常出荷 1〜3=限定出荷 4=供給停止）
  - `lib/stock/csv.ts`：`decodeCsvBytes(bytes: Uint8Array): string`（UTF-8 として不正なら `shift_jis` で `TextDecoder`）、`parseCsv(text: string): string[][]`（引用符・カンマ入り数値・CRLF 対応）、`guessColumns(rows: string[][]): { nameCol: number; qtyCol: number; hasHeader: boolean }`（既定 0/1。1行目の数量列が数値でなければ見出し行）、`toStock(rows, cols): { name: string; qty: number }[]`（`"1,200"`→1200、数値でない行は捨てる）
  - `lib/stock/realdata.ts`：`type RealData`、`loadRealData(): Promise<RealData>`（`/pharmacy/realdata.json` を fetch、1回だけ）、`normalizeName(s: string): string`（NFKC・空白除去・小文字。デモの `RN` と同じ）、`buildIndex(rd: RealData): RealIndex`（正規化名→商品、YJ先頭9桁→同じ成分・規格の商品の配列）
  - `lib/stock/match.ts`：
    - `needQuantity(d: ExtractedDrug): number | null` = `amountPerDose × (prnCount ?? dosesPerDay × days)`、どれかが `null` なら `null`
    - `type StockVerdict = 'ok' | 'short' | 'none' | 'unknown'`
    - `matchDrug(d: ExtractedDrug, idx: RealIndex, stock: { name: string; qty: number }[] | null): { verdict: StockVerdict; need: number | null; stockQty: number | null; stockNames: string[]; supply: { name: string; status: number }[]; normalAlternatives: number; groupSize: number }`
    - 判定：処方の薬を正規化名で探す（`generic: true` なら成分名の一致も見る）→ 見つかればその YJ9 グループ。在庫CSVの各行も正規化名で商品を引き、同じ YJ9 の数量を合計 → `stockQty >= need` で `ok`、`0 < stockQty < need` で `short`、`stockQty = 0` で `none`。`need` が `null` で在庫ありなら `ok`。グループが見つからないとき（内用薬以外など）は `unknown`。そのときも在庫CSVの名前の完全一致（正規化）があれば `stockQty` を出す。CSV なし（`null`）なら `verdict='unknown'` で `supply` だけ返す
    - 表示ラベル（薬局画面で使う）：`ok`「在庫あり」、`short`「不足」、`none`「在庫なし」、`unknown`「照合データなし（目で確認）」。供給：0「通常出荷」、1「限定出荷（自社の事情）」、2「限定出荷（他社品の影響）」、3「限定出荷（その他）」、4「供給停止」

- [ ] **Step 1: Write the failing tests** `lib/stock/csv.test.ts`:
  - `decodes Shift_JIS`：「カロナール錠200,300」を Shift_JIS にしたバイト列 → `"カロナール錠200,300"`
  - `parses quoted numbers with commas`：`'"アムロジピン錠5mg「サワイ」","1,200"'` → qty 1200
  - `detects a header row`：1行目 `薬品名,在庫数` → `hasHeader: true`
  - `drops rows without a number`
- [ ] **Step 2: Write the failing tests** `lib/stock/match.test.ts`（小さな手書きの RealData を使う）:
  - `needQuantity: 1錠×2回×7日 = 14`、`頓服 2錠×5回 = 10`、`days が null なら null`
  - `brand on the prescription, generic in stock → ok when enough`（アレグラ錠60mg 28 必要、フェキソフェナジン塩酸塩錠60mg「ケミファ」200 → `ok`, `stockQty` 200）
  - `short when stock is below need`（モンテルカスト 14 必要・在庫 8 → `short`）
  - `none when the group is in the data but not in stock`
  - `unknown for a topical drug outside the data, with exact-name stock shown`
  - `generic-name prescription (【般】) matches by ingredient`
  - `no CSV → unknown verdict but supply status listed`
- [ ] **Step 3:** Run `npm test` → FAIL
- [ ] **Step 4:** 実装し、`node scripts/build-realdata-json.mjs` で `public/pharmacy/realdata.json` を作る（約1MB）。患者さんの画面のバンドルに入らないこと（fetch で読む）。
- [ ] **Step 5:** Run `npm test` → PASS
- [ ] **Step 6: Commit** `git commit -m "Pharmacy MVP: in-browser stock CSV matching"`

---

### Task 11: 薬局の画面（設定・ログイン・受信箱・詳細・照合・返信・完了）

**Files:**
- Create: `app/pharmacy/_layout.tsx`, `app/pharmacy/setup.tsx`, `app/pharmacy/login.tsx`, `app/pharmacy/index.tsx`, `app/pharmacy/[id].tsx`

**Interfaces:**
- Consumes: Task 8 の `pharmacyApi`・`JapaneseCard`、Task 10 の `lib/stock/*`
- Produces（画面の振る舞い、すべて日本語）:
  - `/pharmacy/setup?code=&s=`：パスワード（8文字以上・確認入力）→ 設定後 `/pharmacy/login` へ
  - `/pharmacy/login`：メール・パスワード
  - `/pharmacy`（受信箱）：一覧（受付時刻・言語名・受け取り希望・状態・AI読み取り中／完了／失敗・未読）。30秒ごとに再読み込み、新着があれば画面上部に「新しい受付が N 件あります」。右上に「在庫CSVを読み込む」（読み込んだ件数と日時を表示、`localStorage` キー `rxhelper.pharmacyStock.v1` に保存）とログアウト
  - CSV 読み込み：`decodeCsvBytes`→`parseCsv`→`guessColumns`。プレビュー（先頭5行）と「薬品名の列」「在庫数の列」「1行目は見出し」を選び直せる。**サーバーには送らない**旨を表示
  - `/pharmacy/[id]`（詳細）：
    - 左：処方箋の写真（拡大）。右：AIが読んだ薬の一覧（「参考：判断は写真で確認してください」）と、薬ごとの照合結果（判定ラベル・必要量・在庫数・在庫の商品名・供給状況・通常出荷の代替の数）。`drugsStatus='pending'` なら「AIが読み取り中」（数秒ごとに再取得）、`failed` なら「読み取れませんでした。写真で確認してください」
    - 初回アンケート：`JapaneseCard`（未回答の項目は「未回答」）。「問診票（日本語）を印刷」（`window.print()` と印刷用のスタイル）
    - 返信：準備できました／疑義照会中／○時以降（17:00〜20:00）。定型メッセージの選択→送信。自由入力→「訳を確認」（`previewTranslation`）→訳文を表示→「この内容で送る」
    - 「完了（データを削除）」：確認ダイアログ「写真と回答を削除します。元に戻せません。」
    - 404 → 「この受付は削除されました（7日経過または完了）」と受信箱へ戻るボタン
- 薬局画面は web 前提。狭い画面（タブレット縦）では写真と照合を縦に並べる。

- [ ] **Step 1:** 画面を実装（Task 9 と同じく Expo v57 の docs を確認済みであること）。
- [ ] **Step 2:** dev サーバー＋ローカル Worker で通し確認：Task 9 で送った2件（日本語・ベトナム語）を受信 → サンプル在庫CSV（Shift_JIS・見出し行あり・`"1,200"` を含む）を読み込み → 判定が出る → 定型メッセージ（ベトナム語の受付）→ 患者さん画面でベトナム語＋日本語の原文 → 「○時以降」→ 状態が変わる → 完了 → 患者さん画面で完了、薬局の詳細を開き直すと削除メッセージ。
- [ ] **Step 3:** 印刷プレビューで問診票が1〜2ページに収まること。
- [ ] **Step 4: Commit** `git commit -m "Pharmacy MVP: pharmacy console"`

---

### Task 12: 本番への反映と実機での通し確認・検証研究の書類

**Files:**
- Create: `docs/pilot/検証研究の協力に関する同意書_ja.md`, `docs/pilot/薬局向け案内チラシ_ja.md`（窓口に置くQRチラシの文面。金銭的な特典の表現なし）
- Modify: なし（デプロイのみ）

**Interfaces:**
- Consumes: すべて

- [ ] **Step 1:** マイグレーションを本番へ：`cd worker && npx wrangler d1 migrations apply prescription-reader-db --remote`（実行前にユーザーへ確認。本番DBの変更）
- [ ] **Step 2:** Worker をデプロイ（`npx wrangler deploy`。Cron が登録されたことを出力で確認）
- [ ] **Step 3:** `RESEND_API_KEY` の有無を `npx wrangler secret list` で確認。未設定ならオーナーに Resend の登録手順（`worker/src/email.ts` の冒頭コメント）を伝え、キーは `wrangler secret put RESEND_API_KEY` の**プロンプト**に入力してもらう
- [ ] **Step 4:** フロントをデプロイ（`npm run deploy`。`dist/pharmacy/realdata.json` が含まれること）
- [ ] **Step 5:** テスト用の薬局を `node worker/scripts/new-pharmacy.mjs --name "テスト薬局（Priamos）" --email <オーナーの指定> --remote` で作る
- [ ] **Step 6:** オーナーの実機（スマホ＋パソコン）で通し確認：日本語・外国語の2通り、メール通知、完了で削除。本番の結果をスクリーンショットで共有してもらう
- [ ] **Step 7:** 同意書・チラシの文面（日本語）を作り、PDF も `MY_PROJECT\처방전도우미\薬局在庫照合_提案\` に置く（既存ファイルは上書きしない）
- [ ] **Step 8: Commit** `git commit -m "Pharmacy MVP: pilot documents"`（ユーザーの了承後）

---

## Self-Review メモ

- 仕様の対応：ゴール1→Task 3・9、2→Task 4・5・11、3→Task 10・11、4→Task 6・11、5→Task 6・9、6→Task 7、7→Task 3・5・6・7。法務（プライバシーポリシー→Task 9、同意書・チラシ→Task 12）。Cloudflare Pages への移行と料金・請求は仕様どおり MVP の範囲外（2027年1月）。
- 型の一致：`IntakeStatus`・`PickupCode`・`ExtractedDrug` は Task 3 で定義し、Task 5・6・8・10・11 が同じ名前を使う。`STATUS_TEXT` は Worker と `lib/sendStrings.ts` に同じ文（同期コメント）。
