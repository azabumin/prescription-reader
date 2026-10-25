#!/usr/bin/env node
// Verification-study numbers per pharmacy, from intake_events only (no personal data):
// number of sends, patient languages, and median minutes from send to opened / replied / done.
//
// Usage (from worker/):
//   node scripts/intake-stats.mjs                     # local D1
//   node scripts/intake-stats.mjs --remote --from 2026-12-01
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const remote = process.argv.includes('--remote');
const from = arg('from') ?? '2000-01-01';
if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
  console.error('--from must look like 2026-12-01');
  process.exit(1);
}

// The SQL goes through a file: on Windows npx needs a shell, which would split a --command at its spaces.
function query(sql) {
  const dir = mkdtempSync(path.join(tmpdir(), 'intake-stats-'));
  const file = path.join(dir, 'q.sql');
  writeFileSync(file, sql, 'utf8');
  try {
    const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'prescription-reader-db', remote ? '--remote' : '--local', '--json', `--file=${file}`], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    return JSON.parse(out)[0].results;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const events = query(
  `SELECT e.pharmacy_id, p.name, e.intake_ref, e.event, e.lang, e.at FROM intake_events e LEFT JOIN pharmacies p ON p.id = e.pharmacy_id WHERE e.at >= '${from}' ORDER BY e.at`,
);

const median = (xs) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fmt = (v) => (v === null ? '—' : `${v.toFixed(1)}分`);

const byPharmacy = new Map();
for (const e of events) {
  const ph = byPharmacy.get(e.pharmacy_id) ?? { name: e.name ?? `#${e.pharmacy_id}`, intakes: new Map() };
  const it = ph.intakes.get(e.intake_ref) ?? {};
  it[e.event] = it[e.event] ?? e.at;
  if (e.event === 'received') it.lang = e.lang;
  ph.intakes.set(e.intake_ref, it);
  byPharmacy.set(e.pharmacy_id, ph);
}

if (byPharmacy.size === 0) {
  console.log(`データなし（${remote ? '本番' : 'ローカル'}、${from}以降）`);
  process.exit(0);
}

const minutes = (a, b) => (new Date(b) - new Date(a)) / 60000;
for (const [, ph] of byPharmacy) {
  const its = [...ph.intakes.values()].filter((i) => i.received);
  const langs = {};
  for (const i of its) langs[i.lang ?? '?'] = (langs[i.lang ?? '?'] ?? 0) + 1;
  const gap = (ev) => its.filter((i) => i[ev]).map((i) => minutes(i.received, i[ev]));
  console.log(`\n■ ${ph.name}`);
  console.log(`  受付件数: ${its.length}（言語: ${Object.entries(langs).map(([l, n]) => `${l} ${n}`).join('、')}）`);
  console.log(`  届いてから開くまで（中央値）: ${fmt(median(gap('opened')))}`);
  console.log(`  届いてから返信まで（中央値）: ${fmt(median(gap('replied')))}`);
  console.log(`  届いてから完了まで（中央値）: ${fmt(median(gap('done')))}`);
  console.log(`  完了せずに7日で削除: ${its.filter((i) => i.expired).length}件`);
}
