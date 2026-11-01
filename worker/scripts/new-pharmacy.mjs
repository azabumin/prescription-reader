#!/usr/bin/env node
// Registers a pharmacy and prints its links:
//   - the setup link for the pharmacy (one-time, sets their own password; valid 14 days)
//   - the patient link that goes into the counter QR code (not for plan A, which takes no patient sends)
// The operator never sees or sets the pharmacy's password.
// Plans: A = walk-in stock check, B = patient sending + questionnaire inbox, AB = both (default).
// Change a plan later with scripts/set-pharmacy-plan.mjs.
//
// Usage (from worker/):
//   node scripts/new-pharmacy.mjs --name "○○薬局" --email pharmacy@example.jp [--plan A|B|AB]          # local D1 (wrangler dev)
//   node scripts/new-pharmacy.mjs --name "○○薬局" --email pharmacy@example.jp [--plan A|B|AB] --remote # production D1
import { execFileSync } from 'node:child_process';
import { createHash, randomInt } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SETUP_TTL_DAYS = 14; // keep in sync with worker/src/intake/pharmacyAuth.ts
const SITE = 'https://rxhelper.jp';
// no 0/o/1/l: the code is printed on paper and sometimes typed by hand
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const PLANS = ['A', 'B', 'AB'];
const PLAN_JA = { A: 'A（窓口の処方箋の在庫照合）', B: 'B（初回問診の受付）', AB: 'A+B' };

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function randomString(length) {
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

const name = arg('name');
const email = arg('email')?.trim().toLowerCase();
const plan = (arg('plan') ?? 'AB').toUpperCase();
const remote = process.argv.includes('--remote');
if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !PLANS.includes(plan)) {
  console.error('Usage: node scripts/new-pharmacy.mjs --name "薬局名" --email login@example.jp [--plan A|B|AB] [--remote]');
  process.exit(1);
}

const code = randomString(10);
const setupCode = randomString(24);
const now = new Date();
const expires = new Date(now.getTime() + SETUP_TTL_DAYS * 86400000);
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sql = `INSERT INTO pharmacies (code, name, login_email, setup_code_hash, setup_expires_at, created_at, plan) VALUES (${q(code)}, ${q(name)}, ${q(email)}, ${q(createHash('sha256').update(setupCode).digest('hex'))}, ${q(expires.toISOString())}, ${q(now.toISOString())}, ${q(plan)});`;

// Written to a file (not passed on the command line) so Japanese names survive the Windows console.
const dir = mkdtempSync(path.join(tmpdir(), 'new-pharmacy-'));
const file = path.join(dir, 'insert.sql');
writeFileSync(file, sql, 'utf8');
try {
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'prescription-reader-db', remote ? '--remote' : '--local', `--file=${file}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log('\n薬局を登録しました:', name, `(${remote ? '本番' : 'ローカル'})`);
console.log('薬局コード      :', code);
console.log('ログイン用メール:', email);
console.log('プラン          :', PLAN_JA[plan]);
console.log(`初回設定のリンク（薬局に渡す・${SETUP_TTL_DAYS}日有効・1回限り）:`);
console.log(`  ${SITE}/pharmacy/setup?code=${code}&s=${setupCode}`);
if (plan === 'A') {
  console.log('患者さん用のリンク: なし（Aプランは患者さんからの送信を受け付けません）');
} else {
  console.log('患者さん用のリンク（窓口のQRコードにする）:');
  console.log(`  ${SITE}/send?ph=${code}`);
}
