// Public data for the stock check, loaded only on the pharmacy screens (public/pharmacy/realdata.json, built by
// scripts/build-realdata-json.mjs from MHLW's 薬価基準 list, 後発医薬品情報 and supply-status list; oral drugs only).
// Products sharing the first 9 characters of the YJ code are the same ingredient, form and strength.

// [yjCode, name, ingredient, kind (0 brand / 1 generic / 2 other), status (0 normal, 1-3 limited, 4 stopped)]
export type RealProduct = [string, string, string, number, number];
export type RealData = { asof: Record<string, string>; products: RealProduct[] };

export type RealIndex = {
  byName: Map<string, RealProduct>;
  byGroup: Map<string, RealProduct[]>;
  names: { norm: string; product: RealProduct }[]; // for prefix lookups (generic-name prescriptions)
  asof: Record<string, string>;
};

// Same normalisation as the demo: full-width -> half-width, no spaces, lower case.
export function normalizeName(s: string): string {
  return String(s ?? '')
    .normalize('NFKC')
    .replace(/[\s　]/g, '')
    .toLowerCase();
}

export function groupKey(p: RealProduct): string {
  return p[0].slice(0, 9);
}

export function buildIndex(rd: RealData): RealIndex {
  const byName = new Map<string, RealProduct>();
  const byGroup = new Map<string, RealProduct[]>();
  const names: { norm: string; product: RealProduct }[] = [];
  for (const p of rd.products) {
    const norm = normalizeName(p[1]);
    if (!byName.has(norm)) byName.set(norm, p);
    names.push({ norm, product: p });
    const g = groupKey(p);
    const list = byGroup.get(g);
    if (list) list.push(p);
    else byGroup.set(g, [p]);
  }
  return { byName, byGroup, names, asof: rd.asof };
}

let cached: Promise<RealIndex> | null = null;

export function loadRealIndex(url = '/pharmacy/realdata.json'): Promise<RealIndex> {
  if (!cached) {
    cached = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`realdata ${r.status}`);
        return r.json() as Promise<RealData>;
      })
      .then(buildIndex)
      .catch((e) => {
        cached = null; // let the next screen retry
        throw e;
      });
  }
  return cached;
}

export const SUPPLY_LABELS = ['通常出荷', '限定出荷（自社の事情）', '限定出荷（他社品の影響）', '限定出荷（その他）', '供給停止'];
