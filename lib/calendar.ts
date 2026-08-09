import type { AnalysisResult, Lang, TimeSlot } from '../types';
import { STRINGS } from './i18n';

// Default clock times for each fixed slot. These are reasonable defaults, not extracted
// from the label (the label rarely gives an exact clock time) -- the calendar note in the
// UI tells the user to adjust them to their own routine after importing.
const SLOT_TIMES: Partial<Record<TimeSlot, { hour: number; minute: number }>> = {
  morning: { hour: 8, minute: 0 },
  noon: { hour: 12, minute: 30 },
  evening: { hour: 18, minute: 30 },
  bedtime: { hour: 21, minute: 30 },
  // "asNeeded" (PRN) has no fixed time, so it deliberately has no calendar entry.
};

const SLOT_ORDER: TimeSlot[] = ['morning', 'noon', 'evening', 'bedtime'];

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatLocalDateTime(date: Date, hour: number, minute: number): string {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T${pad2(hour)}${pad2(minute)}00`;
}

function formatStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T` +
    `${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

// One recurring daily VEVENT per fixed time slot that has at least one medication assigned
// to it, listing every medication due at that time together (people take a whole slot's
// doses at once, not one calendar event per pill). PRN ("as needed") doses are excluded --
// there's no fixed time to attach a recurring reminder to.
export function buildMedicationCalendar(result: AnalysisResult, lang: Lang): string {
  const t = STRINGS[lang];
  const now = new Date();
  const uidBase = `${Date.now()}-prescription-reader`;

  const events: string[] = [];

  for (const slot of SLOT_ORDER) {
    const time = SLOT_TIMES[slot];
    if (!time) continue;
    const meds = result.items.filter((item) => item.timeSlots.includes(slot));
    if (meds.length === 0) continue;

    const slotLabel = t[`timeSlot${slot[0].toUpperCase()}${slot.slice(1)}`] ?? slot;
    const summary = `${result.medicationName} — ${slotLabel}`;
    const description = meds.map((m) => `${m.name} (${m.dosage})`).join(', ');

    events.push(
      [
        'BEGIN:VEVENT',
        `UID:${uidBase}-${slot}@prescription-reader`,
        `DTSTAMP:${formatStamp(now)}`,
        `DTSTART:${formatLocalDateTime(now, time.hour, time.minute)}`,
        'RRULE:FREQ=DAILY',
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(summary)}`,
        'TRIGGER:PT0M',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n')
    );
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//prescription-reader//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function hasSchedulableDoses(result: AnalysisResult): boolean {
  return result.items.some((item) => item.timeSlots.some((slot) => slot in SLOT_TIMES));
}
