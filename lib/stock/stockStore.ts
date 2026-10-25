// The stock CSV the pharmacist loaded, kept in this browser only (localStorage) so it needn't be re-read for every
// prescription. Never sent anywhere.
import type { StockRow } from './csv';

const KEY = 'rxhelper.pharmacyStock.v1';

export type SavedStock = { rows: StockRow[]; fileName: string; loadedAt: string };

export function loadStock(): SavedStock | null {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedStock) : null;
  } catch {
    return null;
  }
}

export function saveStock(s: SavedStock): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage full / private mode: the CSV still works until the page is closed
  }
}

export function clearStock(): void {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // ignore
  }
}
