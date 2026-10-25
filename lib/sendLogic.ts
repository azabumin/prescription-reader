// Pure helpers for the "send to this pharmacy" screen (app/send.tsx).
import type { PharmacyCard } from './pharmacyCard';

// Claude's vision encoder gains nothing past ~1568px on the long edge (same limit as app/index.tsx).
export const MAX_EDGE = 1568;

// How many questionnaire items have an answer, for "回答済み（N項目）". A "no" is an answer.
export function answeredCount(card: PharmacyCard): number {
  const has = (s: string) => s.trim().length > 0;
  const items = [
    card.notebook !== null,
    has(card.heightCm) || has(card.weight),
    card.generic !== null,
    card.conditions.length > 0 || has(card.conditionsOther),
    card.allergyYes !== null,
    card.adrYes !== null,
    card.meds.length > 0 || has(card.medsOther),
    card.otherRx !== null,
    card.otcYes !== null,
    card.pregnancy.length > 0,
    card.lifestyle.length > 0,
    card.intake.length > 0,
    card.constitution.length > 0,
    card.diet.length > 0,
    card.forms.length > 0,
    card.avoid.length > 0 || has(card.avoidOther),
    has(card.notes),
  ];
  return items.filter(Boolean).length;
}

// Resize so the long edge is MAX_EDGE; null when the photo is already small enough. Only the long edge is set:
// expo-image-manipulator's web resize keeps the ratio for an omitted side but treats null as 0.
export function longEdgeResize(width: number, height: number): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= MAX_EDGE) return null;
  return width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE };
}

// One id per send attempt, reused on retry so a dropped connection never creates a second intake.
export function newClientRequestId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
