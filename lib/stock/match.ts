// One prescription line against the pharmacy's own stock CSV, in the browser. A different product name with the
// same ingredient, form and strength (same YJ-9 group) counts as the same medicine. The verdict is a rough guide --
// the pharmacist decides.
import type { StockRow } from './csv';
import { groupKey, normalizeName, type RealIndex, type RealProduct } from './realdata';

export type DrugLine = {
  name: string;
  generic: boolean;
  amountPerDose: number | null;
  unit: string;
  dosesPerDay: number | null;
  days: number | null;
  prnCount: number | null;
  rawText: string;
};

export type StockVerdict = 'ok' | 'short' | 'none' | 'unknown';

export type DrugMatch = {
  verdict: StockVerdict;
  need: number | null;
  stockQty: number | null;
  stockNames: string[];
  supply: { name: string; status: number }[];
  normalAlternatives: number;
  groupSize: number;
};

export const VERDICT_LABELS: Record<StockVerdict, string> = {
  ok: '在庫あり',
  short: '不足',
  none: '在庫なし',
  unknown: '照合データなし（目で確認）',
};

export function needQuantity(d: DrugLine): number | null {
  if (d.amountPerDose === null) return null;
  if (d.prnCount !== null) return d.amountPerDose * d.prnCount;
  if (d.dosesPerDay === null || d.days === null) return null;
  return d.amountPerDose * d.dosesPerDay * d.days;
}

// The product group for a prescription line: exact name first; for a generic-name line (【般】) the products whose
// names start with it (e.g. テプレノンカプセル50mg -> テプレノンカプセル50mg「サワイ」).
function findGroup(d: DrugLine, idx: RealIndex): RealProduct[] {
  const norm = normalizeName(d.name);
  const exact = idx.byName.get(norm);
  if (exact) return idx.byGroup.get(groupKey(exact)) ?? [exact];
  if (d.generic || norm.length >= 4) {
    const hit = idx.names.find((n) => n.norm.startsWith(norm));
    if (hit) return idx.byGroup.get(groupKey(hit.product)) ?? [hit.product];
  }
  return [];
}

export function matchDrug(d: DrugLine, idx: RealIndex, stock: StockRow[] | null): DrugMatch {
  const need = needQuantity(d);
  const group = findGroup(d, idx);
  const supply = group.map((p) => ({ name: p[1], status: p[4] }));
  const normalAlternatives = group.filter((p) => p[4] === 0).length;
  const base = { need, supply, normalAlternatives, groupSize: group.length };

  if (stock === null) return { ...base, verdict: 'unknown', stockQty: null, stockNames: [] };

  if (group.length === 0) {
    // outside the public data (topicals, injections...): only an exact name match can be shown
    const norm = normalizeName(d.name);
    const rows = stock.filter((s) => normalizeName(s.name) === norm);
    return {
      ...base,
      verdict: 'unknown',
      stockQty: rows.length ? rows.reduce((a, s) => a + s.qty, 0) : null,
      stockNames: rows.map((s) => s.name),
    };
  }

  const key = groupKey(group[0]);
  const rows = stock.filter((s) => {
    const p = idx.byName.get(normalizeName(s.name));
    return p !== undefined && groupKey(p) === key;
  });
  const stockQty = rows.reduce((a, s) => a + s.qty, 0);
  const verdict: StockVerdict = stockQty <= 0 ? 'none' : need === null || stockQty >= need ? 'ok' : 'short';
  return { ...base, verdict, stockQty, stockNames: rows.map((s) => s.name) };
}
