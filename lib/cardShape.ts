// A questionnaire card from the server may lack fields or hold the wrong types (the worker checks only that it is an
// object), and JapaneseCard reads every field. Keep a value only when its type matches the empty card's; lists keep
// only their strings. Fields that are null in the empty card (not answered yet) accept null, a string or a boolean.
export function normalizeCard<T extends object>(raw: unknown, empty: T): T {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const r = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...(empty as Record<string, unknown>) };
  for (const [key, d] of Object.entries(empty)) {
    const v = r[key];
    if (v === undefined) continue;
    if (Array.isArray(d)) {
      if (Array.isArray(v)) out[key] = v.filter((x) => typeof x === 'string');
    } else if (d === null) {
      if (v === null || typeof v === 'string' || typeof v === 'boolean') out[key] = v;
    } else if (typeof d === 'object') {
      if (v && typeof v === 'object' && !Array.isArray(v)) out[key] = v;
    } else if (typeof v === typeof d) {
      out[key] = v;
    }
  }
  return out as T;
}
