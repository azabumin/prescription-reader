// Shared types for the pharmacy intake feature (patient send -> pharmacy inbox).
// Keep Lang in sync with ../../../types.ts (LANGUAGES).
export type Lang = 'ja' | 'ko' | 'en' | 'vi' | 'zh' | 'id' | 'tl' | 'th' | 'my' | 'ne' | 'pt';
export const LANGS: Lang[] = ['ja', 'ko', 'en', 'vi', 'zh', 'id', 'tl', 'th', 'my', 'ne', 'pt'];

export type IntakeStatus = 'new' | 'ready' | 'inquiry' | 'later' | 'done';
export type PickupCode = 'today15' | 'today17' | 'today19' | 'tomorrow';
export const PICKUP_CODES: PickupCode[] = ['today15', 'today17', 'today19', 'tomorrow'];

// One medicine as read from the prescription photo. Reference only -- the pharmacist checks the photo.
export type ExtractedDrug = {
  name: string; // as printed, without the 【般】 mark
  generic: boolean; // printed as a generic-name prescription (【般】)
  amountPerDose: number | null;
  unit: string; // 錠, カプセル, g, mL, 包 ...
  dosesPerDay: number | null;
  days: number | null;
  prnCount: number | null; // 頓服: number of doses dispensed
  rawText: string; // the line as printed
};

export const INTAKE_TTL_DAYS = 7;
export const MAX_IMAGES = 2;
export const MAX_IMAGE_B64 = 1_500_000;
export const MAX_CARD_JSON = 50_000;
export const IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
