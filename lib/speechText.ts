import { STRINGS } from './i18n';
import { TIME_SLOTS } from '../types';
import type { AnalysisResult, Lang, TimeSlot } from '../types';

function slotLabelKey(slot: TimeSlot): string {
  return `timeSlot${slot[0].toUpperCase()}${slot.slice(1)}`;
}

export function buildSpokenSummary(result: AnalysisResult, lang: Lang): string {
  const t = STRINGS[lang];
  const lines: string[] = [result.medicationName];

  lines.push(`${t.scheduleTitle}:`);
  for (const slot of TIME_SLOTS) {
    const meds = result.items.filter((item) => item.timeSlots.includes(slot));
    if (meds.length === 0) continue;
    lines.push(`${t[slotLabelKey(slot)]}: ${meds.map((m) => m.name).join(', ')}.`);
  }

  lines.push(`${t.medicationSectionTitle}:`);
  for (const item of result.items) {
    lines.push(`${item.name}. ${t.dosageLabel}: ${item.dosage}.`);
    if (item.timingDetail) {
      lines.push(`${t.timingDetailLabel}: ${item.timingDetail}.`);
    }
    lines.push(`${t.purposeLabel}: ${item.purpose}.`);
    lines.push(`${t.precautionLabel}: ${item.precaution}.`);
  }

  lines.push(`${t.generalNotesTitle}: ${result.generalNotes}`);

  return lines.join('\n');
}
