import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '../types';
import { listHistory } from './history';

const STORAGE_KEY = 'prescription-reader:pharmacy-card';

export type JpLevel = 'none' | 'little' | 'ok';
export type FreeTextField = 'adrDrug' | 'medsOther' | 'notes';

// What the patient wants the pharmacy to know, entered in their own language and shown to the
// pharmacist in Japanese. Fixed options are stored as codes (translated client-side, like
// TimeSlot); only the free-text fields stay in the language they were typed in.
export type PharmacyCard = {
  jpLevel: JpLevel | null;
  allergyYes: boolean | null; // null = not answered yet
  allergy: string[];
  adrYes: boolean | null;
  adr: string[];
  adrDrug: string;
  conditions: string[];
  pregnancy: string[];
  avoid: string[];
  meds: string[]; // medication names picked from the local scan history
  // language of the scan each picked name came from (history names are written in the language the scan was
  // analyzed in, so the same drug can appear once in Japanese and once in, say, Korean)
  medsLang: Record<string, Lang>;
  hiddenMeds: string[]; // history names the patient removed from the memo's candidate list (history itself is kept)
  medsOther: string;
  child: boolean;
  weight: string;
  notes: string;
  lang: Lang; // language the memo was last edited in
  // language each free-text field was typed in (shown to the pharmacist next to the untranslated text)
  textLang: Partial<Record<FreeTextField, Lang>>;
  updatedAt: string | null; // ISO timestamp
};

export function emptyCard(lang: Lang): PharmacyCard {
  return {
    jpLevel: null,
    allergyYes: null,
    allergy: [],
    adrYes: null,
    adr: [],
    adrDrug: '',
    conditions: [],
    pregnancy: [],
    avoid: [],
    meds: [],
    medsLang: {},
    hiddenMeds: [],
    medsOther: '',
    child: false,
    weight: '',
    notes: '',
    lang,
    textLang: {},
    updatedAt: null,
  };
}

// Local-only, like the scan history: nothing here is ever sent anywhere.
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
    card.allergyYes === null &&
    card.adrYes === null &&
    card.conditions.length === 0 &&
    card.pregnancy.length === 0 &&
    card.avoid.length === 0 &&
    card.meds.length === 0 &&
    !card.medsOther.trim() &&
    !card.child &&
    !card.notes.trim()
  );
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
