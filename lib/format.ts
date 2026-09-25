import type { Lang } from '../types';

// Long date in the reader's language (e.g. "2026年10月25日"); falls back to the ISO date if the
// runtime has no locale data for that language.
export function formatDate(iso: string, lang: Lang): string {
  const date = new Date(iso);
  try {
    return date.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}
