import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';

import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref, saveLangPref } from '../lib/langPref';
import {
  clearCard,
  emptyCard,
  historyMedicationNames,
  isCardEmpty,
  loadCard,
  saveCard,
  type FreeTextField,
  type HistoryMedication,
  type JpLevel,
  type PharmacyCard,
} from '../lib/pharmacyCard';
import {
  ADR_OPTIONS,
  ALLERGY_OPTIONS,
  AVOID_OPTIONS,
  CARD_UI,
  CONDITION_OPTIONS,
  JA_CARD,
  LANG_NAME_JA,
  optionLabel,
  PREGNANCY_OPTIONS,
  type CardOption,
} from '../lib/pharmacyCardStrings';
import { LANGUAGES } from '../types';
import type { Lang } from '../types';

// A memo the patient fills in their own language and shows on their phone at the pharmacy
// counter, where it reads in Japanese. Everything stays on this device (no server calls).

function Chip({ label, tag, selected, onPress, radio }: { label: string; tag?: string; selected: boolean; onPress: () => void; radio?: boolean }) {
  return (
    <TouchableOpacity
      accessibilityRole={radio ? 'radio' : 'checkbox'}
      accessibilityState={radio ? { selected } : { checked: selected }}
      style={[styles.chip, selected && styles.chipOn]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>
        {label}
        {!!tag && <Text style={[styles.chipTag, selected && styles.chipTextOn]}>{'  '}{tag}</Text>}
      </Text>
    </TouchableOpacity>
  );
}

function toggled(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
}

export default function PharmacyCardScreen() {
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  const [card, setCard] = useState<PharmacyCard | null>(null);
  const [mode, setMode] = useState<'edit' | 'show'>('edit');
  const [historyNames, setHistoryNames] = useState<HistoryMedication[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const ui = CARD_UI[lang];

  useEffect(() => {
    loadLangPref().then((saved) => {
      const l = saved && LANGUAGES.some((x) => x.code === saved) ? saved : detectDefaultLang();
      setLang(l);
      loadCard(l).then(setCard);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      historyMedicationNames().then(setHistoryNames);
    }, [])
  );

  function update(patch: Partial<PharmacyCard>) {
    setNotice('');
    setCard((prev) => {
      const base = prev ?? emptyCard(lang);
      const textLang = { ...base.textLang };
      (['adrDrug', 'medsOther', 'notes'] as FreeTextField[]).forEach((f) => {
        if (f in patch) textLang[f] = lang;
      });
      const next = { ...base, ...patch, lang, textLang, updatedAt: new Date().toISOString() };
      saveCard(next).catch(() => {
        // best-effort local save, same as the scan history
      });
      return next;
    });
  }

  function toggleMed(m: HistoryMedication) {
    if (!card) return;
    const medsLang = { ...card.medsLang };
    if (card.meds.includes(m.name)) delete medsLang[m.name];
    else medsLang[m.name] = m.lang;
    update({ meds: toggled(card.meds, m.name), medsLang });
  }

  function switchMode(next: 'edit' | 'show') {
    setMode(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  async function handleClear() {
    await clearCard();
    setCard(emptyCard(lang));
    setConfirmClear(false);
    setNotice(ui.cleared);
  }

  function chips(list: CardOption[], picked: string[], key: 'allergy' | 'adr' | 'conditions' | 'pregnancy' | 'avoid') {
    return (
      <View style={styles.chipRow}>
        {list.map((o) => (
          <Chip key={o.code} label={o.label[lang]} selected={picked.includes(o.code)} onPress={() => update({ [key]: toggled(picked, o.code) })} />
        ))}
      </View>
    );
  }

  function yesNo(value: boolean | null, onChange: (v: boolean) => void) {
    return (
      <View style={styles.chipRow} accessibilityRole="radiogroup">
        <Chip radio label={ui.no} selected={value === false} onPress={() => onChange(false)} />
        <Chip radio label={ui.yes} selected={value === true} onPress={() => onChange(true)} />
      </View>
    );
  }

  if (!card) {
    return <ScrollView contentContainerStyle={styles.container} />;
  }

  if (mode === 'show') {
    return (
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        <View style={styles.showTop}>
          <Text style={styles.showHint}>{ui.showHint}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.smallButton} onPress={() => switchMode('edit')}>
            <Text style={styles.smallButtonText}>{ui.edit}</Text>
          </TouchableOpacity>
        </View>
        {isCardEmpty(card) ? <Text style={styles.emptyText}>{ui.empty}</Text> : <JapaneseCard card={card} />}
      </ScrollView>
    );
  }

  const tApp = STRINGS[lang];
  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Link href="/" style={styles.backLink}>
        ← {tApp.appTitle}
      </Link>
      <Text style={styles.title}>{ui.title}</Text>
      <Text style={styles.intro}>{ui.intro}</Text>
      <Text style={styles.localNote}>{ui.localNote}</Text>

      <View style={styles.langRow} accessibilityRole="radiogroup">
        {LANGUAGES.map((l) => (
          <Chip
            radio
            key={l.code}
            label={l.native}
            selected={l.code === lang}
            onPress={() => {
              setLang(l.code);
              saveLangPref(l.code).catch(() => {});
            }}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.jpLevel}</Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup">
          {(['none', 'little', 'ok'] as JpLevel[]).map((lv) => (
            <Chip
              radio
              key={lv}
              label={lv === 'none' ? ui.jpNone : lv === 'little' ? ui.jpLittle : ui.jpOk}
              selected={card.jpLevel === lv}
              onPress={() => update({ jpLevel: lv })}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.allergy}</Text>
        {yesNo(card.allergyYes, (v) => update({ allergyYes: v }))}
        {card.allergyYes && chips(ALLERGY_OPTIONS, card.allergy, 'allergy')}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.adr}</Text>
        {yesNo(card.adrYes, (v) => update({ adrYes: v }))}
        {card.adrYes && (
          <>
            {chips(ADR_OPTIONS, card.adr, 'adr')}
            <TextInput
              style={styles.input}
              value={card.adrDrug}
              onChangeText={(v) => update({ adrDrug: v })}
              placeholder={ui.adrDrug}
              placeholderTextColor={COLORS.textMuted}
              accessibilityLabel={ui.adrDrug}
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.conditions}</Text>
        {chips(CONDITION_OPTIONS, card.conditions, 'conditions')}
        <Text style={[styles.question, styles.subQuestion]}>{ui.pregnancy}</Text>
        {chips(PREGNANCY_OPTIONS, card.pregnancy, 'pregnancy')}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.meds}</Text>
        <Text style={styles.helper}>{ui.medsFromHistory}</Text>
        {historyNames.length > 0 && <Text style={styles.helper}>{ui.medsPreferJa}</Text>}
        {historyNames.length === 0 ? (
          <Text style={styles.helper}>{ui.medsNoHistory}</Text>
        ) : (
          <View style={styles.chipRow}>
            {historyNames.map((m) => (
              <Chip
                key={m.name}
                label={m.name}
                tag={LANGUAGES.find((l) => l.code === m.lang)?.native}
                selected={card.meds.includes(m.name)}
                onPress={() => toggleMed(m)}
              />
            ))}
          </View>
        )}
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={card.medsOther}
          onChangeText={(v) => update({ medsOther: v })}
          placeholder={ui.medsOther}
          placeholderTextColor={COLORS.textMuted}
          accessibilityLabel={ui.medsOther}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.avoid}</Text>
        {chips(AVOID_OPTIONS, card.avoid, 'avoid')}
      </View>

      <View style={styles.section}>
        <Chip label={ui.child} selected={card.child} onPress={() => update({ child: !card.child })} />
        {card.child && (
          <View style={styles.weightRow}>
            <Text style={styles.helper}>{ui.weight}</Text>
            <TextInput
              style={[styles.input, styles.inputWeight]}
              value={card.weight}
              onChangeText={(v) => update({ weight: v.replace(/[^0-9.]/g, '').slice(0, 5) })}
              keyboardType="decimal-pad"
              accessibilityLabel={ui.weight}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.notes}</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          value={card.notes}
          onChangeText={(v) => update({ notes: v })}
          accessibilityLabel={ui.notes}
          multiline
        />
        <Text style={styles.helper}>{ui.freeHint}</Text>
      </View>

      <Text style={styles.helper}>{ui.autosave}</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.primaryButton} onPress={() => switchMode('show')}>
        <Text style={styles.primaryButtonText}>{ui.show}</Text>
      </TouchableOpacity>

      {!!notice && <Text style={styles.notice}>{notice}</Text>}
      {confirmClear ? (
        <View style={styles.confirmRow}>
          <Text style={styles.helper}>{ui.clearAsk}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={handleClear}>
            <Text style={styles.dangerText}>{ui.clearYes}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => setConfirmClear(false)}>
            <Text style={styles.linkText}>{ui.clearNo}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity accessibilityRole="button" style={styles.clearButton} onPress={() => setConfirmClear(true)}>
          <Text style={styles.dangerText}>{ui.clear}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// The part the pharmacist reads: always Japanese, large type, answers as a label/value list.
function JapaneseCard({ card }: { card: PharmacyCard }) {
  const ja = (list: CardOption[], codes: string[]) => codes.map((c) => optionLabel(list, c, 'ja')).join('、');
  const langJa = LANG_NAME_JA[card.lang];
  const original = (field: FreeTextField) => {
    const text = card[field].trim();
    if (!text) return null;
    const fieldLang = card.textLang[field] ?? card.lang;
    return (
      <Text style={styles.cardOriginal}>
        {fieldLang === 'ja' ? JA_CARD.originalJa : JA_CARD.original(LANG_NAME_JA[fieldLang])}：{text}
      </Text>
    );
  };
  const yesNoValue = (yes: boolean | null, list: CardOption[], codes: string[]) =>
    yes === null ? JA_CARD.unanswered : !yes ? JA_CARD.none : codes.length ? ja(list, codes) : JA_CARD.yesUnspecified;
  const rows: { label: string; value: string; extra?: ReactNode; strong?: boolean }[] = [];

  if (card.jpLevel) rows.push({ label: JA_CARD.jp, value: JA_CARD.jpLevel[card.jpLevel] });
  rows.push({ label: JA_CARD.allergy, value: yesNoValue(card.allergyYes, ALLERGY_OPTIONS, card.allergy), strong: !!card.allergyYes });
  rows.push({
    label: JA_CARD.adr,
    value: yesNoValue(card.adrYes, ADR_OPTIONS, card.adr),
    extra: card.adrYes ? original('adrDrug') : null,
    strong: !!card.adrYes,
  });
  rows.push({ label: JA_CARD.conditions, value: card.conditions.length ? ja(CONDITION_OPTIONS, card.conditions) : JA_CARD.noneEntered });
  if (card.pregnancy.length) rows.push({ label: JA_CARD.pregnancy, value: ja(PREGNANCY_OPTIONS, card.pregnancy), strong: true });
  // Japanese names read as-is; the rest are grouped under the language they are written in. Memos saved before
  // medsLang existed fall back to: kana in the name = Japanese, otherwise the memo's language.
  const medLang = (name: string): Lang => card.medsLang[name] ?? (/[\u3040-\u30ff]/.test(name) ? 'ja' : card.lang);
  const jaMeds = card.meds.filter((n) => medLang(n) === 'ja');
  const otherLangs = [...new Set(card.meds.map(medLang).filter((l) => l !== 'ja'))];
  // one medicine per line with a leading bullet, so a list of several is easy to scan at the counter
  const bulletList = (names: string[]) => names.map((n) => `・${n}`).join('\n');
  rows.push({
    label: JA_CARD.meds,
    value: bulletList(jaMeds) || (card.meds.length || card.medsOther.trim() ? '' : JA_CARD.noneEntered),
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
      </>
    ),
  });
  if (card.avoid.length) rows.push({ label: JA_CARD.avoid, value: ja(AVOID_OPTIONS, card.avoid) });
  if (card.child) rows.push({ label: JA_CARD.child, value: card.weight ? JA_CARD.childWeight(card.weight) : JA_CARD.childNoWeight, strong: true });
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
      {!!updated && <Text style={styles.cardFoot}>{JA_CARD.updated(updated)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  backLink: {
    fontSize: 14,
    color: COLORS.accent,
    marginBottom: SPACING.lg,
    fontWeight: '600',
  },
  title: {
    fontSize: FONT.title - 6,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  intro: {
    fontSize: FONT.label,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  localNote: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  question: {
    fontSize: FONT.label + 1,
    fontWeight: '700',
    color: COLORS.text,
  },
  subQuestion: {
    marginTop: SPACING.xs,
  },
  helper: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chipBg,
    alignSelf: 'flex-start',
  },
  chipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.label - 1,
    color: COLORS.text,
  },
  chipTag: {
    fontSize: FONT.small - 1,
    color: COLORS.textMuted,
  },
  chipTextOn: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT.label,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  inputMulti: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputWeight: {
    width: 100,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT.button,
    fontWeight: '800',
  },
  notice: {
    fontSize: FONT.small,
    color: COLORS.primaryDark,
    marginTop: SPACING.sm,
  },
  clearButton: {
    alignSelf: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  dangerText: {
    fontSize: FONT.label,
    color: COLORS.danger,
    fontWeight: '700',
  },
  linkText: {
    fontSize: FONT.label,
    color: COLORS.accent,
    fontWeight: '700',
  },
  showTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  showHint: {
    flexShrink: 1,
    fontSize: FONT.label,
    color: COLORS.textMuted,
  },
  smallButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.label,
  },
  emptyText: {
    fontSize: FONT.body,
    color: COLORS.textMuted,
  },
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
});
