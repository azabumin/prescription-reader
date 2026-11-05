#!/usr/bin/env node
// Changes a registered pharmacy's plan (pharmacies normally do this themselves on the plan screen). The pharmacy's
// screen follows on its next open (GET /pharmacy/me). It also counts as chosen, so the plan screen is not forced.
//   A = walk-in stock check, B = patient sending + questionnaire inbox, AB = both.
// Moving to A stops patient sends at once (the patient link then says the code is unknown).
//
// Usage (from worker/):
//   node scripts/set-pharmacy-plan.mjs --code <薬局コード> --plan A|B|AB            # local D1 (wrangler dev)
//   node scripts/set-pharmacy-plan.mjs --code <薬局コード> --plan A|B|AB --remote   # production D1
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const code = arg('code')?.trim();
const plan = arg('plan')?.toUpperCase();
const remote = process.argv.includes('--remote');
if (!code || !/^[a-z0-9]+$/.test(code) || !['A', 'B', 'AB'].includes(plan)) {
  console.error('Usage: node scripts/set-pharmacy-plan.mjs --code <薬局コード> --plan A|B|AB [--remote]');
  process.exit(1);
}

// via a file, like new-pharmacy.mjs: on Windows npx needs a shell, which splits --command at spaces
const dir = mkdtempSync(path.join(tmpdir(), 'set-pharmacy-plan-'));
const file = path.join(dir, 'update.sql');
writeFileSync(file, `UPDATE pharmacies SET plan = '${plan}', plan_chosen_at = COALESCE(plan_chosen_at, '${new Date().toISOString()}') WHERE code = '${code}';\nSELECT code, name, plan FROM pharmacies WHERE code = '${code}';\n`, 'utf8');
try {
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'prescription-reader-db', remote ? '--remote' : '--local', `--file=${file}`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`\nプランを ${plan} にしました（${remote ? '本番' : 'ローカル'}）。上の結果に薬局が出ていなければ、コードを確認してください。`);
