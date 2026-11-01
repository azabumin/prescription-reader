import { Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';
import type { ExtractedDrug } from '../../lib/pharmacyApi';
import { matchDrug, needQuantity, VERDICT_LABELS } from '../../lib/stock/match';
import { SUPPLY_LABELS, type RealIndex } from '../../lib/stock/realdata';
import type { SavedStock } from '../../lib/stock/stockStore';
import { ph } from './pharmacyUi';

const VERDICT_COLOR = { ok: COLORS.primary, short: '#B7791F', none: COLORS.danger, unknown: COLORS.textMuted } as const;

// The medicines the AI read, each matched against the stock CSV (kept in this browser) and the MHLW supply data.
// Shared by a patient's intake (app/pharmacy/intake.tsx) and the walk-in check (app/pharmacy/check.tsx).
export function DrugStockList({ drugs, index, stock }: { drugs: ExtractedDrug[]; index: RealIndex | null; stock: SavedStock | null }) {
  return (
    <>
      {drugs.map((d, i) => {
        const m = index ? matchDrug(d, index, stock?.rows ?? null) : null;
        const need = needQuantity(d);
        return (
          <View key={i} style={{ borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, gap: 2 }}>
            <View style={[ph.row, { justifyContent: 'space-between' }]}>
              <Text style={[ph.body, { fontWeight: '700', flexShrink: 1 }]}>
                {d.generic ? '【般】' : ''}
                {d.name}
              </Text>
              {m && stock && <Text style={{ color: VERDICT_COLOR[m.verdict], fontWeight: '800' }}>{VERDICT_LABELS[m.verdict]}</Text>}
            </View>
            <Text style={ph.small}>{d.rawText}</Text>
            <Text style={ph.small}>
              必要量：{need === null ? '—' : `${need}${d.unit}`}
              {m && m.stockQty !== null ? `　在庫：${m.stockQty}${d.unit}` : ''}
              {m && m.stockNames.length > 0 ? `（${m.stockNames.join('、')}）` : ''}
            </Text>
            {m && m.supply.length > 0 && (
              <Text style={ph.small}>
                出荷状況：
                {m.supply
                  .filter((s) => s.status !== 0)
                  .slice(0, 3)
                  .map((s) => `${s.name} ${SUPPLY_LABELS[s.status]}`)
                  .join('、') || 'すべて通常出荷'}
                　／　通常出荷の製品 {m.normalAlternatives}／{m.groupSize}件
              </Text>
            )}
            {m && m.groupSize === 0 && <Text style={ph.small}>照合用データにない薬です（外用薬・注射薬など）。目で確認してください。</Text>}
          </View>
        );
      })}
      {index && <Text style={ph.small}>照合用データ：厚労省 薬価基準（{index.asof.yakka}）・供給状況（{index.asof.supply}取得）</Text>}
    </>
  );
}
