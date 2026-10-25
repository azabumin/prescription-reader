#!/usr/bin/env node
// Builds public/pharmacy/realdata.json (the pharmacy screens' stock-check data) from the demo's realdata.js,
// which tools/build_realdata.py in ../pharmacy-stock-check makes from MHLW's public files.
// Keeps only what the stock check uses: [yjCode, name, ingredient, kind, status] per product, plus the dates.
//
// Usage (repo root): node scripts/build-realdata-json.mjs [path/to/realdata.js]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const src = process.argv[2] ?? path.join('..', 'pharmacy-stock-check', 'demo', 'realdata.js');
const out = path.join('public', 'pharmacy', 'realdata.json');

const js = readFileSync(src, 'utf8');
const start = js.indexOf('{');
const end = js.lastIndexOf('}');
if (!js.startsWith('window.REALDATA=') || start < 0 || end < start) throw new Error(`unexpected format: ${src}`);
const data = JSON.parse(js.slice(start, end + 1));

const products = data.products.map((p) => [p[0], p[1], p[2], p[3], p[4]]);
const json = JSON.stringify({ asof: data.asof, products });
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, json, 'utf8');
console.log(`wrote ${out}: ${products.length} products, ${(Buffer.byteLength(json) / 1024).toFixed(0)} KB, as of`, data.asof);
