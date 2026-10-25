import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { JapaneseCard } from '../components/JapaneseCard';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref, saveLangPref } from '../lib/langPref';
import { MemoTranslateError, translateMemoFields } from '../lib/memoTranslate';
import {
  clearCard,
  currentTranslation,
  emptyCard,
  FREE_TEXT_FIELDS,
  historyMedicationNames,
  isCardEmpty,
  loadCard,
  saveCard,
  untranslatedFields,
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
import { SEND_STRINGS } from '../lib/sendStrings';
import { LANGUAGES } from '../types';
import type { Lang } from '../types';

// A memo the patient fills in their own language and shows on their phone at the pharmacy
// counter, where it reads in Japanese. Everything stays on this device; the only server call is the
// optional translation of the free-text fields, made when the patient taps the translate button.

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
  // opened from the "send to this pharmacy" screen: offer the way back there (the memo saves as it's edited)
  const params = useLocalSearchParams<{ returnTo?: string; ph?: string }>();
  const backToSendCode = params.returnTo === 'send' && typeof params.ph === 'string' ? params.ph : '';
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  const [card, setCard] = useState<PharmacyCard | null>(null);
  const [mode, setMode] = useState<'edit' | 'show'>('edit');
  const [historyNames, setHistoryNames] = useState<HistoryMedication[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translateMsg, setTranslateMsg] = useState<{ text: string; ok: boolean } | null>(null);
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
      FREE_TEXT_FIELDS.forEach((f) => {
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

  function hideMed(name: string) {
    if (!card) return;
    const medsLang = { ...card.medsLang };
    delete medsLang[name];
    update({ meds: card.meds.filter((n) => n !== name), medsLang, hiddenMeds: [...card.hiddenMeds, name] });
  }

  async function translateNow() {
    if (!card || translating) return;
    const fields = untranslatedFields(card).map((key) => ({ key, text: card[key].trim(), lang: card.textLang[key] ?? card.lang }));
    if (fields.length === 0) return;
    setTranslating(true);
    setTranslateMsg(null);
    try {
      const result = await translateMemoFields(fields);
      setCard((prev) => {
        if (!prev) return prev;
        const translations = { ...prev.translations };
        fields.forEach((f) => {
          const ja = result[f.key];
          if (ja) translations[f.key] = { src: f.text, ja };
        });
        const next = { ...prev, translations };
        saveCard(next).catch(() => {});
        return next;
      });
      const allDone = fields.every((f) => result[f.key]);
      setTranslateMsg(allDone ? { text: ui.translated, ok: true } : { text: ui.translateFailed, ok: false });
    } catch (e) {
      const limited = e instanceof MemoTranslateError && e.code === 'rate_limited';
      setTranslateMsg({ text: limited ? ui.translateLimit : ui.translateFailed, ok: false });
    } finally {
      setTranslating(false);
    }
  }

  function translateBlock() {
    return (
      <View style={styles.translateBox}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.translateButton, translating && styles.translateButtonBusy]}
          onPress={translateNow}
          disabled={translating}
        >
          {translating ? <ActivityIndicator color={COLORS.primary} /> : null}
          <Text style={styles.translateButtonText}>{translating ? ui.translating : ui.translate}</Text>
        </TouchableOpacity>
        <Text style={styles.helper}>{ui.translateNote}</Text>
      </View>
    );
  }

  function digitsInput(value: string, onChange: (v: string) => void, label: string) {
    return (
      <View style={styles.weightRow}>
        <Text style={styles.helper}>{label}</Text>
        <TextInput
          style={[styles.input, styles.inputWeight]}
          value={value}
          onChangeText={(v) => onChange(v.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="number-pad"
          accessibilityLabel={label}
        />
      </View>
    );
  }

  function switchMode(next: 'edit' | 'show') {
    setMode(next);
    setTranslateMsg(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  async function handleClear() {
    await clearCard();
    setCard(emptyCard(lang));
    setConfirmClear(false);
    setNotice(ui.cleared);
  }

  type ChipKey = 'allergy' | 'adr' | 'conditions' | 'pregnancy' | 'avoid' | 'lifestyle' | 'intake' | 'constitution' | 'diet' | 'forms';
  function chips(list: CardOption[], picked: string[], key: ChipKey) {
    return (
      <View style={styles.chipRow}>
        {list.map((o) => (
          <Chip key={o.code} label={o.label[lang]} selected={picked.includes(o.code)} onPress={() => update({ [key]: toggled(picked, o.code) })} />
        ))}
      </View>
    );
  }

  // one answer from a list; tapping the chosen answer again clears it
  function radioChips(list: CardOption[], value: string | null, onChange: (v: string | null) => void) {
    return (
      <View style={styles.chipRow} accessibilityRole="radiogroup">
        {list.map((o) => (
          <Chip radio key={o.code} label={o.label[lang]} selected={value === o.code} onPress={() => onChange(value === o.code ? null : o.code)} />
        ))}
      </View>
    );
  }

  function numberInput(value: string, onChange: (v: string) => void, label: string, pattern: RegExp, max: number) {
    return (
      <View style={styles.weightRow}>
        <Text style={styles.helper}>{label}</Text>
        <TextInput
          style={[styles.input, styles.inputWeight]}
          value={value}
          onChangeText={(v) => onChange(v.replace(pattern, '').slice(0, max))}
          keyboardType="numbers-and-punctuation"
          accessibilityLabel={label}
        />
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
        {untranslatedFields(card).length > 0 && (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>{ui.translatePending}</Text>
            {translateBlock()}
          </View>
        )}
        {!!translateMsg && <Text style={[styles.notice, !translateMsg.ok && styles.noticeError]}>{translateMsg.text}</Text>}
        {isCardEmpty(card) ? <Text style={styles.emptyText}>{ui.empty}</Text> : <JapaneseCard card={card} />}
      </ScrollView>
    );
  }

  const tApp = STRINGS[lang];
  // Candidates = history names minus the ones the patient hid, plus anything already picked whose scan has since been
  // deleted from history (otherwise it would stay on the card with no way to untick it).
  const candidates: HistoryMedication[] = [
    ...historyNames.filter((m) => !card.hiddenMeds.includes(m.name)),
    ...card.meds
      .filter((n) => !historyNames.some((m) => m.name === n))
      .map((n) => ({ name: n, lang: card.medsLang[n] ?? card.lang })),
  ];
  const hiddenCount = historyNames.filter((m) => card.hiddenMeds.includes(m.name)).length;
  return (
    <ScrollView ref={scrollRef} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Link href="/" style={styles.backLink}>
        ← {tApp.appTitle}
      </Link>
      <Text style={styles.title}>{ui.title}</Text>
      {!!backToSendCode && (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.smallButton}
          // back() when we came from the send screen, so it isn't stacked twice; replace() after a reload
          onPress={() => (router.canGoBack() ? router.back() : router.replace({ pathname: '/send', params: { ph: backToSendCode } }))}
        >
          <Text style={styles.smallButtonText}>← {SEND_STRINGS[lang].sendLinkFromMemo}</Text>
        </TouchableOpacity>
      )}
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
        <Text style={styles.question}>{ui.notebook}</Text>
        {radioChips(NOTEBOOK_OPTIONS, card.notebook, (v) => update({ notebook: v }))}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.body}</Text>
        {numberInput(card.heightCm, (v) => update({ heightCm: v }), ui.height, /[^0-9.]/g, 5)}
        {numberInput(card.weight, (v) => update({ weight: v }), ui.weight, /[^0-9.]/g, 5)}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.generic}</Text>
        {radioChips(GENERIC_OPTIONS, card.generic, (v) => update({ generic: v }))}
        <Text style={styles.helper}>{ui.genericNote}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.conditions}</Text>
        {chips(CONDITION_OPTIONS, card.conditions, 'conditions')}
        <TextInput
          style={styles.input}
          value={card.conditionsOther}
          onChangeText={(v) => update({ conditionsOther: v })}
          placeholder={ui.conditionsOther}
          placeholderTextColor={COLORS.textMuted}
          accessibilityLabel={ui.conditionsOther}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.allergy}</Text>
        {yesNo(card.allergyYes, (v) => update({ allergyYes: v }))}
        {card.allergyYes && (
          <>
            {chips(ALLERGY_OPTIONS, card.allergy, 'allergy')}
            <TextInput
              style={styles.input}
              value={card.allergyOther}
              onChangeText={(v) => update({ allergyOther: v })}
              placeholder={ui.allergyOther}
              placeholderTextColor={COLORS.textMuted}
              accessibilityLabel={ui.allergyOther}
            />
          </>
        )}
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
        <Text style={styles.question}>{ui.meds}</Text>
        <Text style={styles.helper}>{ui.medsFromHistory}</Text>
        {candidates.length > 0 && <Text style={styles.helper}>{ui.medsPreferJa}</Text>}
        {candidates.length === 0 && hiddenCount === 0 ? (
          <Text style={styles.helper}>{ui.medsNoHistory}</Text>
        ) : (
          <View style={styles.chipRow}>
            {candidates.map((m) => (
              <View key={m.name} style={styles.medChip}>
                <Chip
                  label={m.name}
                  tag={LANGUAGES.find((l) => l.code === m.lang)?.native}
                  selected={card.meds.includes(m.name)}
                  onPress={() => toggleMed(m)}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`${ui.medsHide}: ${m.name}`}
                  style={styles.hideButton}
                  onPress={() => hideMed(m.name)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.hideButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {hiddenCount > 0 && (
          <TouchableOpacity accessibilityRole="button" onPress={() => update({ hiddenMeds: [] })}>
            <Text style={styles.linkText}>{ui.medsShowHidden.replace('{n}', String(hiddenCount))}</Text>
          </TouchableOpacity>
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
        <TextInput
          style={styles.input}
          value={card.medsOtherIngredient}
          onChangeText={(v) => update({ medsOtherIngredient: v })}
          placeholder={ui.medsOtherIngredient}
          placeholderTextColor={COLORS.textMuted}
          accessibilityLabel={ui.medsOtherIngredient}
        />
        <Text style={[styles.question, styles.subQuestion]}>{ui.otherRx}</Text>
        {yesNo(card.otherRx, (v) => update({ otherRx: v }))}
        {card.otherRx && (
          <Chip label={ui.otherRxNotebook} selected={card.otherRxNotebook} onPress={() => update({ otherRxNotebook: !card.otherRxNotebook })} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.otc}</Text>
        {yesNo(card.otcYes, (v) => update({ otcYes: v }))}
        {card.otcYes && (
          <TextInput
            style={styles.input}
            value={card.otcText}
            onChangeText={(v) => update({ otcText: v })}
            placeholder={ui.otcText}
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel={ui.otc}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.pregnancy}</Text>
        {chips(PREGNANCY_OPTIONS, card.pregnancy, 'pregnancy')}
        {card.pregnancy.includes('pregnant') && digitsInput(card.pregnancyWeek, (v) => update({ pregnancyWeek: v }), ui.pregnancyWeek)}
        {card.pregnancy.includes('pregnant') &&
          numberInput(card.pregnancyDue, (v) => update({ pregnancyDue: v }), ui.pregnancyDue, /[^0-9/]/g, 5)}
        {card.pregnancy.includes('breastfeeding') &&
          digitsInput(card.nursingChildAge, (v) => update({ nursingChildAge: v }), ui.nursingChildAge)}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.lifestyle}</Text>
        {chips(LIFESTYLE_OPTIONS, card.lifestyle, 'lifestyle')}
        {card.lifestyle.includes('smoking') && digitsInput(card.smokingPerDay, (v) => update({ smokingPerDay: v }), ui.smokingPerDay)}
        <Text style={[styles.question, styles.subQuestion]}>{ui.intake}</Text>
        {chips(INTAKE_OPTIONS, card.intake, 'intake')}
        <Text style={[styles.question, styles.subQuestion]}>{ui.constitution}</Text>
        {chips(CONSTITUTION_OPTIONS, card.constitution, 'constitution')}
        <Text style={[styles.question, styles.subQuestion]}>{ui.diet}</Text>
        {chips(DIET_OPTIONS, card.diet, 'diet')}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.forms}</Text>
        {chips(FORM_OPTIONS, card.forms, 'forms')}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{ui.avoid}</Text>
        {chips(AVOID_OPTIONS, card.avoid, 'avoid')}
        <TextInput
          style={styles.input}
          value={card.avoidOther}
          onChangeText={(v) => update({ avoidOther: v })}
          placeholder={ui.avoidOther}
          placeholderTextColor={COLORS.textMuted}
          accessibilityLabel={ui.avoidOther}
        />
      </View>

      <View style={styles.section}>
        <Chip label={ui.child} selected={card.child} onPress={() => update({ child: !card.child })} />
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

      {untranslatedFields(card).length > 0 && translateBlock()}
      {!!translateMsg && <Text style={[styles.notice, !translateMsg.ok && styles.noticeError]}>{translateMsg.text}</Text>}

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
  medChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hideButton: {
    width: 26,
    height: 26,
    marginLeft: 2,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideButtonText: {
    fontSize: 18,
    lineHeight: 20,
    color: COLORS.textMuted,
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
    flexWrap: 'wrap',
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
  translateBox: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
  },
  translateButtonBusy: {
    opacity: 0.7,
  },
  translateButtonText: {
    color: COLORS.primary,
    fontSize: FONT.label + 1,
    fontWeight: '800',
  },
  pendingBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  pendingText: {
    fontSize: FONT.label,
    color: COLORS.text,
    fontWeight: '700',
  },
  noticeError: {
    color: COLORS.danger,
  },
});
