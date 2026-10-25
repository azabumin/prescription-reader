// Shared look for the pharmacy screens (app/pharmacy/*): Japanese only, used on a reception PC or tablet.
import { Platform, StyleSheet } from 'react-native';

import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';

let cssInjected = false;

// Meiryo first for Japanese text, and a print stylesheet that hides the controls (buttons, inputs) so the
// 問診票 prints as a clean sheet. RN components opt out of print with dataSet={{ noprint: 'true' }}.
export function injectPharmacyCss(): void {
  if (Platform.OS !== 'web' || cssInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    [data-pharmacy-root] * { font-family: Meiryo, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif; }
    @media print {
      [data-noprint="true"] { display: none !important; }
      body { background: #FFFFFF !important; }
    }`;
  document.head.appendChild(style);
  cssInjected = true;
}

// react-native-web's dataSet (-> data-* attributes) isn't in React Native's types; spread this into a View's props.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function webData(d: Record<string, string>): {} {
  return Platform.OS === 'web' ? { dataSet: d } : {};
}

export const ph = StyleSheet.create({
  page: { padding: SPACING.lg, gap: SPACING.md, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  narrow: { padding: SPACING.lg, gap: SPACING.md, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: FONT.title - 6, fontWeight: '800', color: COLORS.text },
  h2: { fontSize: FONT.subtitle, fontWeight: '800', color: COLORS.text },
  body: { fontSize: FONT.body, color: COLORS.text, lineHeight: FONT.body * 1.5 },
  small: { fontSize: FONT.small, color: COLORS.textMuted, lineHeight: FONT.small * 1.6 },
  error: { fontSize: FONT.label, color: COLORS.danger, fontWeight: '700' },
  ok: { fontSize: FONT.label, color: COLORS.primaryDark, fontWeight: '700' },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT.body,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  primary: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.lg, alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT.label + 1 },
  secondary: { backgroundColor: COLORS.chipBg, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, alignItems: 'center' },
  secondaryText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: FONT.label },
  danger: { backgroundColor: COLORS.danger, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, alignItems: 'center' },
  dangerText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT.label },
  disabled: { backgroundColor: COLORS.disabled },
  chip: { paddingVertical: SPACING.xs + 2, paddingHorizontal: SPACING.md, borderRadius: RADIUS.pill, backgroundColor: COLORS.chipBg },
  chipOn: { backgroundColor: COLORS.primary },
  chipText: { fontSize: FONT.label, color: COLORS.primaryDark },
  chipTextOn: { color: '#FFFFFF', fontWeight: '700' },
  link: { color: COLORS.accent, fontSize: FONT.label },
});

export const STATUS_JA: Record<string, string> = {
  new: '未返信',
  ready: '準備できました',
  inquiry: '疑義照会中',
  later: '時刻を連絡済み',
  done: '完了',
};

export function formatJaTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
