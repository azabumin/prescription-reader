import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { processIntake as run } from '../src/intake/process';
import { insertIntake, insertPharmacy } from './helpers';

const ai = { extractDrugs: vi.fn(), translateFields: vi.fn() };
const processIntake = (e: Env, id: string) => run(e, id, ai);

const DRUG = { name: 'アレグラ錠60mg', generic: false, amountPerDose: 1, unit: '錠', dosesPerDay: 2, days: 14, prnCount: null, rawText: 'アレグラ錠60mg 2錠 分2 朝夕食後 14日分' };

async function row(id: string) {
  return env.DB.prepare('SELECT drugs_json, drugs_status, card_json FROM intakes WHERE id = ?').bind(id).first<{ drugs_json: string | null; drugs_status: string; card_json: string | null }>();
}

describe('processIntake', () => {
  beforeEach(() => {
    ai.extractDrugs.mockReset();
    ai.translateFields.mockReset().mockResolvedValue({});
  });

  it('stores extracted drugs and marks done', async () => {
    const ph = await insertPharmacy();
    const { id } = await insertIntake(ph.id);
    ai.extractDrugs.mockResolvedValue([DRUG]);
    await processIntake(env, id);
    const r = await row(id);
    expect(r!.drugs_status).toBe('done');
    expect(JSON.parse(r!.drugs_json!)).toEqual([DRUG]);
    expect(ai.extractDrugs.mock.calls[0][1]).toEqual([{ base64: 'aGVsbG8=', mediaType: 'image/jpeg' }]);
  });

  it('marks failed when extraction throws, keeps images and card', async () => {
    const ph = await insertPharmacy();
    const card = { lang: 'vi', notes: 'xin chào', textLang: { notes: 'vi' }, translations: {} };
    const { id } = await insertIntake(ph.id, { card });
    ai.extractDrugs.mockRejectedValue(new Error('boom'));
    await processIntake(env, id);
    const r = await row(id);
    expect(r!.drugs_status).toBe('failed');
    expect(r!.drugs_json).toBeNull();
    expect(JSON.parse(r!.card_json!).notes).toBe('xin chào');
    const img = await env.DB.prepare('SELECT COUNT(*) AS n FROM intake_images WHERE intake_id = ?').bind(id).first<{ n: number }>();
    expect(img!.n).toBe(1);
  });

  it('fills ja translations for non-Japanese free text only', async () => {
    const ph = await insertPharmacy();
    const card = {
      lang: 'vi',
      notes: 'dị ứng tôm',
      adrDrug: 'ロキソニン',
      otcText: 'vitamin C',
      textLang: { notes: 'vi', adrDrug: 'ja', otcText: 'vi' },
      translations: { otcText: { src: 'vitamin C', ja: 'ビタミンC' } },
    };
    const { id } = await insertIntake(ph.id, { card });
    ai.extractDrugs.mockResolvedValue([]);
    ai.translateFields.mockResolvedValue({ notes: 'エビのアレルギー' });
    await processIntake(env, id);
    // only notes needed work: adrDrug is Japanese, otcText already has a current translation
    expect(ai.translateFields.mock.calls[0][1]).toEqual([{ key: 'notes', text: 'dị ứng tôm', lang: 'vi' }]);
    const saved = JSON.parse((await row(id))!.card_json!);
    expect(saved.translations.notes).toEqual({ src: 'dị ứng tôm', ja: 'エビのアレルギー' });
    expect(saved.translations.otcText).toEqual({ src: 'vitamin C', ja: 'ビタミンC' });
    expect(saved.translations.adrDrug).toBeUndefined();
  });

  it('does nothing for a deleted intake', async () => {
    await expect(processIntake(env, 'f'.repeat(32))).resolves.toBeUndefined();
    expect(ai.extractDrugs).not.toHaveBeenCalled();
  });

  it('does not write data back to a completed intake', async () => {
    const ph = await insertPharmacy();
    const { id } = await insertIntake(ph.id);
    ai.extractDrugs.mockImplementation(async () => {
      await env.DB.prepare("UPDATE intakes SET status = 'done', card_json = NULL WHERE id = ?").bind(id).run();
      return [DRUG];
    });
    await processIntake(env, id);
    const r = await row(id);
    expect(r!.drugs_json).toBeNull();
    expect(r!.card_json).toBeNull();
  });
});
