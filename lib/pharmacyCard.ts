import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '../types';
import { listHistory } from './history';

const STORAGE_KEY = 'prescription-reader:pharmacy-card';

export type JpLevel = 'none' | 'little' | 'ok';
export type FreeTextField =
  | 'adrDrug' | 'allergyOther' | 'conditionsOther' | 'medsOther' | 'medsOtherIngredient' | 'otcText' | 'avoidOther' | 'notes';
export const FREE_TEXT_FIELDS: FreeTextField[] = [
  'adrDrug', 'allergyOther', 'conditionsOther', 'medsOther', 'medsOtherIngredient', 'otcText', 'avoidOther', 'notes',
];

// Japanese machine translation of one free-text field, kept with the exact text it was made from so a later edit
// is detected (the translation is then stale and the card shows the original until it is translated again).
export type MemoTranslation = { src: string; ja: string };

// What the patient wants the pharmacy to know, entered in their own language and shown to the
// pharmacist in Japanese. Fixed options are stored as codes (translated client-side, like
// TimeSlot); the free-text fields stay in the language they were typed in until the patient asks for
// a Japanese translation (lib/memoTranslate.ts), which is stored next to the original.
// The items follow a pharmacy's first-visit questionnaire (初回アンケート), so the Japanese card can be read like it.
export type PharmacyCard = {
  jpLevel: JpLevel | null;
  notebook: string | null; // お薬手帳: NOTEBOOK_OPTIONS code
  heightCm: string; // digits
  generic: string | null; // GENERIC_OPTIONS code
  allergyYes: boolean | null; // null = not answered yet
  allergy: string[];
  allergyOther: string;
  adrYes: boolean | null;
  adr: string[];
  adrDrug: string; // causative medicine or ingredient, if known
  conditions: string[];
  conditionsOther: string;
  pregnancy: string[];
  pregnancyWeek: string; // digits only
  nursingChildAge: string; // digits only (years)
  avoid: string[];
  avoidOther: string;
  meds: string[]; // medication names picked from the local scan history
  // language of the scan each picked name came from (history names are written in the language the scan was
  // analyzed in, so the same drug can appear once in Japanese and once in, say, Korean)
  medsLang: Record<string, Lang>;
  hiddenMeds: string[]; // history names the patient removed from the memo's candidate list (history itself is kept)
  medsOther: string; // e.g. medicines brought from the home country
  medsOtherIngredient: string; // their ingredient names, if known (brand names abroad are hard to identify in Japan)
  otherRx: boolean | null; // also gets medicines from another clinic or pharmacy
  otherRxNotebook: boolean; // ...and they are in the medicine notebook
  otcYes: boolean | null; // over-the-counter medicines, supplements, kampo
  otcText: string;
  pregnancyDue: string; // M/D
  lifestyle: string[];
  smokingPerDay: string;
  intake: string[]; // foods and drinks taken often (dairy, coffee, natto, grapefruit)
  constitution: string[];
  diet: string[];
  forms: string[]; // medicine forms hard to take
  child: boolean;
  weight: string; // kg (everyone, not only children)
  notes: string;
  lang: Lang; // language the memo was last edited in
  // language each free-text field was typed in (shown to the pharmacist next to the untranslated text)
  textLang: Partial<Record<FreeTextField, Lang>>;
  translations: Partial<Record<FreeTextField, MemoTranslation>>;
  updatedAt: string | null; // ISO timestamp
};

export function emptyCard(lang: Lang): PharmacyCard {
  return {
    jpLevel: null,
    notebook: null,
    heightCm: '',
    generic: null,
    allergyYes: null,
    allergy: [],
    allergyOther: '',
    adrYes: null,
    adr: [],
    adrDrug: '',
    conditions: [],
    conditionsOther: '',
    pregnancy: [],
    pregnancyWeek: '',
    nursingChildAge: '',
    avoid: [],
    avoidOther: '',
    meds: [],
    medsLang: {},
    hiddenMeds: [],
    medsOther: '',
    medsOtherIngredient: '',
    otherRx: null,
    otherRxNotebook: false,
    otcYes: null,
    otcText: '',
    pregnancyDue: '',
    lifestyle: [],
    smokingPerDay: '',
    intake: [],
    constitution: [],
    diet: [],
    forms: [],
    child: false,
    weight: '',
    notes: '',
    lang,
    textLang: {},
    translations: {},
    updatedAt: null,
  };
}

// Stored locally, like the scan history. Only the free-text fields ever leave the device, and only when the patient
// taps the translate button (see lib/memoTranslate.ts).
export async function loadCard(lang: Lang): Promise<PharmacyCard> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCard(lang);
    return { ...emptyCard(lang), ...JSON.parse(raw) };
  } catch {
    return emptyCard(lang);
  }
}

export async function saveCard(card: PharmacyCard): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(card));
}

export async function clearCard(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function isCardEmpty(card: PharmacyCard): boolean {
  return (
    card.jpLevel === null &&
    card.notebook === null &&
    !card.heightCm.trim() &&
    !card.weight.trim() &&
    card.generic === null &&
    card.allergyYes === null &&
    card.otherRx === null &&
    card.otcYes === null &&
    card.lifestyle.length === 0 &&
    card.intake.length === 0 &&
    card.constitution.length === 0 &&
    card.diet.length === 0 &&
    card.forms.length === 0 &&
    card.adrYes === null &&
    card.conditions.length === 0 &&
    !card.conditionsOther.trim() &&
    card.pregnancy.length === 0 &&
    card.avoid.length === 0 &&
    !card.avoidOther.trim() &&
    card.meds.length === 0 &&
    !card.medsOther.trim() &&
    !card.medsOtherIngredient.trim() &&
    !card.child &&
    !card.notes.trim()
  );
}

// Japanese translation of a field, or null when there is none or the text was edited after translating.
export function currentTranslation(card: PharmacyCard, field: FreeTextField): string | null {
  const t = card.translations[field];
  const text = card[field].trim();
  return t && text && t.src === text ? t.ja : null;
}

// Free-text fields that have text but no up-to-date Japanese translation (Japanese-language text needs none).
export function untranslatedFields(card: PharmacyCard): FreeTextField[] {
  return FREE_TEXT_FIELDS.filter((f) => {
    const text = card[f].trim();
    if (!text) return false;
    if ((card.textLang[f] ?? card.lang) === 'ja') return false;
    return currentTranslation(card, f) === null;
  });
}

export type HistoryMedication = { name: string; lang: Lang };

// Distinct medication names from past scans so the patient can tick what they take. Names written in Japanese
// come first (the pharmacist reads them as-is), then the rest, each newest first.
export async function historyMedicationNames(): Promise<HistoryMedication[]> {
  const entries = await listHistory();
  const meds: HistoryMedication[] = [];
  for (const entry of entries) {
    for (const item of entry.result.items) {
      const name = item.name.trim();
      if (name && !meds.some((m) => m.name === name)) meds.push({ name, lang: entry.lang });
    }
  }
  return [...meds.filter((m) => m.lang === 'ja'), ...meds.filter((m) => m.lang !== 'ja')].slice(0, 20);
}
