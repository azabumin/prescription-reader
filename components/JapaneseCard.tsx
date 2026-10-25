import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { currentTranslation, type FreeTextField, type PharmacyCard } from '../lib/pharmacyCard';
import {
  ADR_OPTIONS,
  ALLERGY_OPTIONS,
  AVOID_OPTIONS,
  CONDITION_OPTIONS,
  CONSTITUTION_OPTIONS,
  DIET_OPTIONS,
  FORM_OPTIONS,
  GENERIC_OPTIONS,
  INTAKE_OPTIONS,
  JA_CARD,
  LANG_NAME_JA,
  LIFESTYLE_OPTIONS,
  NOTEBOOK_OPTIONS,
  optionLabel,
  PREGNANCY_OPTIONS,
  type CardOption,
} from '../lib/pharmacyCardStrings';
import type { Lang } from '../types';

// Shared by the patient's memo screen (app/pharmacy-card.tsx) and the pharmacy inbox (app/pharmacy/[id].tsx).
// The part the pharmacist reads: always Japanese, large type, answers as a label/value list.
export function JapaneseCard({ card }: { card: PharmacyCard }) {
  // one item per line with a leading bullet, so several answers are easy to scan at the counter
  const bulletList = (names: string[]) => names.map((n) => `・${n}`).join('\n');
  const ja = (list: CardOption[], codes: string[]) => bulletList(codes.map((c) => optionLabel(list, c, 'ja')));
  const langJa = LANG_NAME_JA[card.lang];
  let anyTranslated = false;
  // A free-text answer: Japanese as written, the AI translation with the original under it, or (not translated yet)
  // the original labelled as untranslated. `prefix` names the sub-item, e.g. 成分名.
  const original = (field: FreeTextField, prefix?: string) => {
    const text = card[field].trim();
    if (!text) return null;
    const fieldLang = card.textLang[field] ?? card.lang;
    const lead = prefix ? `${prefix}｜` : '';
    if (fieldLang === 'ja') {
      return (
        <Text key={field} style={styles.cardOriginal}>
          {lead}
          {JA_CARD.originalJa}：{text}
        </Text>
      );
    }
    const ja = currentTranslation(card, field);
    if (ja) {
      anyTranslated = true;
      return (
        <View key={field} style={styles.cardTranslated}>
          <Text style={styles.cardAiLabel}>
            {lead}
            {JA_CARD.aiLabel(LANG_NAME_JA[fieldLang])}
          </Text>
          <Text style={styles.cardTranslatedText}>{ja}</Text>
          <Text style={styles.cardOriginalSmall}>
            {JA_CARD.originalShort(LANG_NAME_JA[fieldLang])}：{text}
          </Text>
        </View>
      );
    }
    return (
      <Text key={field} style={styles.cardOriginal}>
        {lead}
        {JA_CARD.original(LANG_NAME_JA[fieldLang])}：{text}
      </Text>
    );
  };
  const yesNoValue = (yes: boolean | null, list: CardOption[], codes: string[]) =>
    yes === null ? JA_CARD.unanswered : !yes ? JA_CARD.none : codes.length ? ja(list, codes) : JA_CARD.yesUnspecified;
  const rows: { label: string; value: string; extra?: ReactNode; strong?: boolean }[] = [];

  const list = (opts: CardOption[], codes: string[], label: string, special?: (code: string) => string | null) => {
    if (!codes.length) return;
    rows.push({ label, value: bulletList(codes.map((c) => special?.(c) ?? optionLabel(opts, c, 'ja'))) });
  };
  if (card.jpLevel) rows.push({ label: JA_CARD.jp, value: JA_CARD.jpLevel[card.jpLevel] });
  if (card.notebook) rows.push({ label: JA_CARD.notebook, value: optionLabel(NOTEBOOK_OPTIONS, card.notebook, 'ja') });
  const body = [card.heightCm.trim() && JA_CARD.height(card.heightCm.trim()), card.weight.trim() && JA_CARD.weight(card.weight.trim())].filter(Boolean);
  if (body.length) rows.push({ label: JA_CARD.body, value: body.join('　') });
  if (card.generic) rows.push({ label: JA_CARD.generic, value: optionLabel(GENERIC_OPTIONS, card.generic, 'ja') });
  rows.push({
    label: JA_CARD.conditions,
    value: card.conditions.length ? ja(CONDITION_OPTIONS, card.conditions) : card.conditionsOther.trim() ? '' : JA_CARD.noneEntered,
    extra: original('conditionsOther'),
  });
  rows.push({
    label: JA_CARD.allergy,
    value: card.allergyYes && !card.allergy.length && card.allergyOther.trim() ? '' : yesNoValue(card.allergyYes, ALLERGY_OPTIONS, card.allergy),
    extra: card.allergyYes ? original('allergyOther') : null,
    strong: !!card.allergyYes,
  });
  rows.push({
    label: JA_CARD.adr,
    value: yesNoValue(card.adrYes, ADR_OPTIONS, card.adr),
    extra: card.adrYes ? original('adrDrug') : null,
    strong: !!card.adrYes,
  });
  // Japanese names read as-is; the rest are grouped under the language they are written in. Memos saved before
  // medsLang existed fall back to: kana in the name = Japanese, otherwise the memo's language.
  const medLang = (name: string): Lang => card.medsLang[name] ?? (/[\u3040-\u30ff]/.test(name) ? 'ja' : card.lang);
  const jaMeds = card.meds.filter((n) => medLang(n) === 'ja');
  const otherLangs = [...new Set(card.meds.map(medLang).filter((l) => l !== 'ja'))];
  rows.push({
    label: JA_CARD.meds,
    value: bulletList(jaMeds) || (card.meds.length || card.medsOther.trim() || card.medsOtherIngredient.trim() ? '' : JA_CARD.noneEntered),
    extra: (
      <>
        {otherLangs.map((l) => (
          <Text key={l} style={styles.cardOriginal}>
            {JA_CARD.fromHistory(LANG_NAME_JA[l])}
            {'\n'}
            {bulletList(card.meds.filter((n) => medLang(n) === l))}
          </Text>
        ))}
        {original('medsOther')}
        {original('medsOtherIngredient', JA_CARD.ingredient)}
      </>
    ),
  });
  if (card.otherRx !== null)
    rows.push({ label: JA_CARD.otherRx, value: card.otherRx ? JA_CARD.otherRxYes + (card.otherRxNotebook ? JA_CARD.inNotebook : '') : JA_CARD.otherRxNo });
  if (card.otcYes !== null)
    rows.push({ label: JA_CARD.otc, value: card.otcYes ? JA_CARD.yes : JA_CARD.none, extra: card.otcYes ? original('otcText') : null });
  if (card.pregnancy.length) {
    const preg = card.pregnancy.map((c) =>
      c === 'pregnant'
        ? JA_CARD.pregnant(card.pregnancyWeek) + (card.pregnancyDue ? `　${JA_CARD.due(card.pregnancyDue)}` : '')
        : c === 'breastfeeding'
          ? JA_CARD.nursing(card.nursingChildAge)
          : optionLabel(PREGNANCY_OPTIONS, c, 'ja')
    );
    rows.push({ label: JA_CARD.pregnancy, value: bulletList(preg), strong: true });
  }
  list(LIFESTYLE_OPTIONS, card.lifestyle, JA_CARD.lifestyle, (c) => (c === 'smoking' && card.smokingPerDay ? JA_CARD.smoking(card.smokingPerDay) : null));
  list(INTAKE_OPTIONS, card.intake, JA_CARD.intake);
  list(CONSTITUTION_OPTIONS, card.constitution, JA_CARD.constitution);
  list(DIET_OPTIONS, card.diet, JA_CARD.diet);
  list(FORM_OPTIONS, card.forms, JA_CARD.forms);
  if (card.avoid.length || card.avoidOther.trim())
    rows.push({ label: JA_CARD.avoid, value: card.avoid.length ? ja(AVOID_OPTIONS, card.avoid) : '', extra: original('avoidOther') });
  if (card.child) rows.push({ label: JA_CARD.child, value: JA_CARD.childYes, strong: true });
  if (card.notes.trim()) rows.push({ label: JA_CARD.notes, value: '', extra: original('notes') });

  let updated = '';
  if (card.updatedAt) {
    try {
      updated = new Date(card.updatedAt).toLocaleString('ja-JP');
    } catch {
      updated = card.updatedAt;
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>{JA_CARD.heading}</Text>
      <Text style={styles.cardLead}>{card.lang === 'ja' ? JA_CARD.leadJa : JA_CARD.lead(langJa)}</Text>
      {rows.map((r) => (
        <View key={r.label} style={styles.cardRow}>
          <Text style={styles.cardLabel}>{r.label}</Text>
          {!!r.value && <Text style={[styles.cardValue, r.strong && styles.cardValueStrong]}>{r.value}</Text>}
          {r.extra}
        </View>
      ))}
      <Text style={styles.cardFoot}>{JA_CARD.foot}</Text>
      {anyTranslated && <Text style={styles.cardFoot}>{JA_CARD.aiFoot}</Text>}
      {!!updated && <Text style={styles.cardFoot}>{JA_CARD.updated(updated)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFDF6',
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  cardLead: {
    fontSize: FONT.label,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  cardRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    gap: 2,
  },
  cardLabel: {
    fontSize: FONT.label,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  cardValue: {
    fontSize: 20,
    color: COLORS.text,
    lineHeight: 28,
  },
  cardValueStrong: {
    fontWeight: '800',
    color: COLORS.danger,
  },
  cardNote: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
  },
  cardOriginal: {
    fontSize: FONT.label + 1,
    color: COLORS.text,
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: 2,
  },
  cardFoot: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  cardTranslated: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: 2,
    gap: 2,
  },
  cardAiLabel: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  cardTranslatedText: {
    fontSize: FONT.label + 2,
    color: COLORS.text,
    lineHeight: 24,
  },
  cardOriginalSmall: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
  },
});
