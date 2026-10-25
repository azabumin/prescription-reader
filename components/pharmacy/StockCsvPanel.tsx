import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

import { decodeCsvBytes, guessColumns, parseCsv, toStock, type CsvColumns } from '../../lib/stock/csv';
import { clearStock, loadStock, saveStock, type SavedStock } from '../../lib/stock/stockStore';
import { formatJaTime, ph, webData } from './pharmacyUi';

// Reads the pharmacy's stock CSV inside this browser (never uploaded). Stock systems differ, so the pharmacist can
// pick the name/quantity columns and whether the first row is a header before saving.
export function StockCsvPanel({ onChange }: { onChange?: (s: SavedStock | null) => void }) {
  const [saved, setSaved] = useState<SavedStock | null>(() => loadStock());
  const [draft, setDraft] = useState<{ fileName: string; rows: string[][]; cols: CsvColumns } | null>(null);
  const [error, setError] = useState('');

  function pickFile() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    setError('');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const rows = parseCsv(decodeCsvBytes(new Uint8Array(await file.arrayBuffer())));
        if (rows.length === 0) {
          setError('CSVに行がありません。');
          return;
        }
        setDraft({ fileName: file.name, rows, cols: guessColumns(rows) });
      } catch {
        setError('CSVを読み込めませんでした。');
      }
    };
    input.click();
  }

  function confirm() {
    if (!draft) return;
    const rows = toStock(draft.rows, draft.cols);
    if (rows.length === 0) {
      setError('薬品名と在庫数を読み取れた行がありません。列の選び方を確認してください。');
      return;
    }
    const s: SavedStock = { rows, fileName: draft.fileName, loadedAt: new Date().toISOString() };
    saveStock(s);
    setSaved(s);
    setDraft(null);
    onChange?.(s);
  }

  function forget() {
    clearStock();
    setSaved(null);
    onChange?.(null);
  }

  const colCount = draft ? Math.max(...draft.rows.slice(0, 20).map((r) => r.length)) : 0;
  const colChips = (which: 'nameCol' | 'qtyCol') =>
    Array.from({ length: colCount }, (_, i) => (
      <TouchableOpacity
        key={i}
        accessibilityRole="radio"
        aria-checked={draft?.cols[which] === i}
        style={[ph.chip, draft?.cols[which] === i && ph.chipOn]}
        onPress={() => draft && setDraft({ ...draft, cols: { ...draft.cols, [which]: i } })}
      >
        <Text style={[ph.chipText, draft?.cols[which] === i && ph.chipTextOn]}>{i + 1}列目</Text>
      </TouchableOpacity>
    ));

  return (
    <View style={ph.card} {...webData({ noprint: 'true' })}>
      <Text style={ph.h2}>在庫CSV</Text>
      <Text style={ph.small}>CSVはこのブラウザの中だけで読み込みます。インターネットには送りません。</Text>
      {saved ? (
        <Text style={ph.body}>
          {saved.fileName}（{saved.rows.length}品目・{formatJaTime(saved.loadedAt)} 読み込み）
        </Text>
      ) : (
        <Text style={ph.body}>まだ読み込んでいません。読み込むと、届いた処方の薬と在庫をまとめて照合します。</Text>
      )}
      <View style={ph.row}>
        <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={pickFile}>
          <Text style={ph.secondaryText}>{saved ? '読み込み直す' : '在庫CSVを読み込む'}</Text>
        </TouchableOpacity>
        {saved && (
          <TouchableOpacity accessibilityRole="button" onPress={forget}>
            <Text style={ph.link}>このブラウザから消す</Text>
          </TouchableOpacity>
        )}
      </View>
      {draft && (
        <View style={{ gap: 8 }}>
          <Text style={ph.small}>先頭の行（{draft.fileName}）</Text>
          {draft.rows.slice(0, 5).map((r, i) => (
            <Text key={i} style={ph.small} numberOfLines={1}>
              {i + 1}: {r.join(' ｜ ')}
            </Text>
          ))}
          <Text style={ph.body}>薬品名の列</Text>
          <View style={ph.row}>{colChips('nameCol')}</View>
          <Text style={ph.body}>在庫数の列</Text>
          <View style={ph.row}>{colChips('qtyCol')}</View>
          <TouchableOpacity
            accessibilityRole="checkbox"
            aria-checked={draft.cols.hasHeader}
            style={ph.row}
            onPress={() => setDraft({ ...draft, cols: { ...draft.cols, hasHeader: !draft.cols.hasHeader } })}
          >
            <Text style={ph.body}>{draft.cols.hasHeader ? '☑' : '☐'} 1行目は見出し</Text>
          </TouchableOpacity>
          <Text style={ph.small}>読み取れる行：{toStock(draft.rows, draft.cols).length}品目</Text>
          <View style={ph.row}>
            <TouchableOpacity accessibilityRole="button" style={ph.primary} onPress={confirm}>
              <Text style={ph.primaryText}>この内容で使う</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={() => setDraft(null)}>
              <Text style={ph.link}>やめる</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!!error && <Text style={ph.error}>{error}</Text>}
    </View>
  );
}
