// Deletes intakes 7 days after they were sent (expires_at), whether or not the pharmacy pressed 完了.
// Runs from the hourly Cron Trigger (wrangler.jsonc). intake_events rows are kept -- they hold no personal data.
import { logEvent } from './events';

export async function purgeExpired(db: D1Database, now: Date): Promise<number> {
  const cutoff = now.toISOString();
  const { results } = await db
    .prepare('SELECT id, pharmacy_id, status, lang FROM intakes WHERE expires_at < ?')
    .bind(cutoff)
    .all<{ id: string; pharmacy_id: number; status: string; lang: string }>();
  for (const r of results) {
    if (r.status !== 'done') await logEvent(db, r.pharmacy_id, r.id, 'expired', { lang: r.lang });
  }
  if (results.length === 0) return 0;
  // images and messages go with the row (ON DELETE CASCADE)
  const res = await db.prepare('DELETE FROM intakes WHERE expires_at < ?').bind(cutoff).run();
  return res.meta.changes;
}
