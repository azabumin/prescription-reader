// Timing record for the verification study (how long until the pharmacy opens / replies / finishes).
// No personal data: intake_ref is a one-way hash of the intake id, and the rows outlive the 7-day purge.
import { sha256Hex } from './pharmacyAuth';

export type IntakeEvent = 'received' | 'opened' | 'replied' | 'done' | 'expired';

export async function intakeRef(intakeId: string): Promise<string> {
  return (await sha256Hex(`intake-event:${intakeId}`)).slice(0, 16);
}

export async function logEvent(
  db: D1Database,
  pharmacyId: number,
  intakeId: string,
  event: IntakeEvent,
  extra: { lang?: string; drugCount?: number } = {},
): Promise<void> {
  await db
    .prepare('INSERT INTO intake_events (pharmacy_id, intake_ref, event, lang, drug_count, at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(pharmacyId, await intakeRef(intakeId), event, extra.lang ?? null, extra.drugCount ?? null, new Date().toISOString())
    .run();
}
