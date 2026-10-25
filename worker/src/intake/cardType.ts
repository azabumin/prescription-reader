// Type-only copy of the patient's pharmacy memo (lib/pharmacyCard.ts) -- keep in sync with that file.
// The Worker stores the card the patient sent as JSON and fills in Japanese translations of the free text;
// the pharmacy screen renders it with the same JapaneseCard component the patient app uses.
import type { Lang } from './types';

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
