// Runs after a patient's send has been stored (ctx.waitUntil), so the patient isn't kept waiting on the AI:
// reads the medicines off the photo and fills in Japanese for free text the patient didn't translate.
// Either step may fail on its own; the pharmacist still has the photo and the patient's original text.
// A plan-B pharmacy has no stock check, so the medicines aren't read at all (drugs_status 'skipped').
import type { MemoField } from '../memoTranslate';
import * as defaultAi from './ai';
import { FREE_TEXT_FIELDS, type PharmacyCard } from './cardType';
import { setReceivedDrugCount } from './events';
import { hasStockCheck, type PharmacyPlan } from './pharmacyAuth';

type FieldIn = { key: MemoField; text: string; lang?: string };

export type IntakeAi = Pick<typeof defaultAi, 'extractDrugs' | 'translateFields'>;

// Free-text fields that still need Japanese: not typed in Japanese, and no translation of the current text.
export function fieldsNeedingJa(card: Partial<PharmacyCard>): FieldIn[] {
  const out: FieldIn[] = [];
  for (const key of FREE_TEXT_FIELDS) {
    const text = typeof card[key] === 'string' ? (card[key] as string).trim() : '';
    if (!text) continue;
    const lang = card.textLang?.[key] ?? card.lang;
    if (lang === 'ja') continue;
    if (card.translations?.[key]?.src === text) continue;
    out.push(lang ? { key, text, lang } : { key, text });
  }
  return out;
}

export async function processIntake(env: Env, intakeId: string, ai: IntakeAi = defaultAi): Promise<void> {
  const row = await env.DB.prepare(
    "SELECT i.card_json, p.plan FROM intakes i JOIN pharmacies p ON p.id = i.pharmacy_id WHERE i.id = ? AND i.status != 'done'",
  )
    .bind(intakeId)
    .first<{ card_json: string | null; plan: PharmacyPlan }>();
  if (!row) return;
  const readDrugs = hasStockCheck(row.plan);
  const { results: images } = await env.DB.prepare('SELECT media_type, data_b64 FROM intake_images WHERE intake_id = ? ORDER BY idx')
    .bind(intakeId)
    .all<{ media_type: string; data_b64: string }>();

  const card = row.card_json ? (JSON.parse(row.card_json) as Partial<PharmacyCard>) : null;
  const pending = card ? fieldsNeedingJa(card) : [];

  const [drugs, ja] = await Promise.allSettled([
    readDrugs ? ai.extractDrugs(env, images.map((i) => ({ base64: i.data_b64, mediaType: i.media_type }))) : Promise.resolve(null),
    ai.translateFields(env, pending),
  ]);

  // Write back only while the intake is still open -- a pharmacy that pressed 完了 has asked for the data to go.
  if (drugs.status === 'fulfilled') {
    const list = drugs.value;
    if (list === null) {
      await env.DB.prepare("UPDATE intakes SET drugs_status = 'skipped' WHERE id = ? AND status != 'done'").bind(intakeId).run();
    } else {
      await env.DB.prepare("UPDATE intakes SET drugs_json = ?, drugs_status = 'done' WHERE id = ? AND status != 'done'")
        .bind(JSON.stringify(list), intakeId)
        .run();
      await setReceivedDrugCount(env.DB, intakeId, list.length);
    }
  } else {
    console.error('intake_drug_extraction_failed', intakeId, drugs.reason);
    await env.DB.prepare("UPDATE intakes SET drugs_status = 'failed' WHERE id = ? AND status != 'done'").bind(intakeId).run();
  }

  if (card && pending.length > 0) {
    if (ja.status === 'fulfilled') {
      const translations = { ...(card.translations ?? {}) };
      for (const f of pending) {
        const text = ja.value[f.key];
        if (text) translations[f.key] = { src: f.text, ja: text };
      }
      await env.DB.prepare("UPDATE intakes SET card_json = ? WHERE id = ? AND status != 'done' AND card_json IS NOT NULL")
        .bind(JSON.stringify({ ...card, translations }), intakeId)
        .run();
    } else {
      console.error('intake_translation_failed', intakeId, ja.reason);
    }
  }
}
