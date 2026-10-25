// The patient's list of prescriptions sent to pharmacies (kept on the device; the server only knows a token hash).
// Pure helpers -- lib/intakeStore.ts does the AsyncStorage part.
export type SentIntake = { intakeId: string; token: string; pharmacyName: string; createdAt: string };

// The server deletes an intake 7 days after it was sent; one extra day covers clock differences.
const KEEP_DAYS = 8;

export function pruneSent(list: SentIntake[], now: Date): SentIntake[] {
  const cutoff = now.getTime() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  return list
    .filter((x) => new Date(x.createdAt).getTime() > cutoff)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertSent(list: SentIntake[], item: SentIntake, now: Date): SentIntake[] {
  return pruneSent([item, ...list.filter((x) => x.intakeId !== item.intakeId)], now);
}
