import { WORKER_URL } from '../constants/config';
import type { FreeTextField } from './pharmacyCard';

export type MemoTranslateErrorCode = 'network' | 'rate_limited' | 'server';

export class MemoTranslateError extends Error {
  constructor(public code: MemoTranslateErrorCode) {
    super(code);
    this.name = 'MemoTranslateError';
  }
}

// Sends only the free-text fields of the pharmacy memo (never the rest of it) to the API, which has Claude translate
// them into Japanese. Called only when the patient taps the translate button; nothing is stored server-side.
// Returns the Japanese text per field; fields the server did not return are simply missing.
export async function translateMemoFields(
  fields: { key: FreeTextField; text: string }[]
): Promise<Partial<Record<FreeTextField, string>>> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/translate-memo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch {
    throw new MemoTranslateError('network');
  }
  if (response.status === 429) throw new MemoTranslateError('rate_limited');
  if (!response.ok) throw new MemoTranslateError('server');

  const data = (await response.json()) as { translations?: { key?: unknown; ja?: unknown }[] };
  const out: Partial<Record<FreeTextField, string>> = {};
  for (const t of data.translations ?? []) {
    const field = fields.find((f) => f.key === t.key);
    if (field && typeof t.ja === 'string' && t.ja.trim()) out[field.key] = t.ja.trim();
  }
  return out;
}
