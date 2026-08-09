export type Lang = 'ja' | 'ko' | 'en' | 'vi' | 'zh' | 'id' | 'tl' | 'th' | 'my' | 'ne' | 'pt';

export type LanguageMeta = {
  code: Lang;
  native: string;
  english: string;
};

// Ordered roughly by relevance to the Japan foreign-worker context this app grew out of:
// Japanese (the label's own language) and Korean (this app's original market) first, then
// the largest foreign-worker nationalities in Japan (technical intern trainee / 特定技能
// programs skew Vietnamese, Chinese, Indonesian, Filipino, Thai, Myanmar, Nepali), then
// Portuguese for the long-established Brazilian community, with English as a fallback.
export const LANGUAGES: LanguageMeta[] = [
  { code: 'ja', native: '日本語', english: 'Japanese' },
  { code: 'ko', native: '한국어', english: 'Korean' },
  { code: 'en', native: 'English', english: 'English' },
  { code: 'vi', native: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'zh', native: '中文', english: 'Chinese' },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'tl', native: 'Filipino', english: 'Filipino (Tagalog)' },
  { code: 'th', native: 'ภาษาไทย', english: 'Thai' },
  { code: 'my', native: 'မြန်မာ', english: 'Burmese' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali' },
  { code: 'pt', native: 'Português', english: 'Portuguese' },
];

// Fixed, language-agnostic codes the AI classifies each dose into. The UI renders these
// with client-side i18n labels (see lib/i18n.ts) rather than trusting the AI to phrase
// "morning" identically every time -- that's what makes the schedule groupable/scannable
// instead of just prose. "asNeeded" covers 頓服/屯用/필요시 (PRN) doses that aren't tied to
// a fixed time.
export type TimeSlot = 'morning' | 'noon' | 'evening' | 'bedtime' | 'asNeeded';

export const TIME_SLOTS: TimeSlot[] = ['morning', 'noon', 'evening', 'bedtime', 'asNeeded'];

export type MedicationItem = {
  name: string;
  dosage: string;
  timeSlots: TimeSlot[];
  // Free-text nuance in the target language that the fixed slots can't capture, e.g.
  // "after meals, within 30 minutes" or "avoid on an empty stomach".
  timingDetail: string;
  purpose: string;
  precaution: string;
};

export type AnalysisResult = {
  medicationName: string;
  items: MedicationItem[];
  generalNotes: string;
};
