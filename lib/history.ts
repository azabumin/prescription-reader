import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisResult, Lang } from '../types';

const STORAGE_KEY = 'prescription-reader:history';
const MAX_ENTRIES = 30;

export type HistoryEntry = {
  id: string;
  scannedAt: string; // ISO timestamp
  lang: Lang;
  result: AnalysisResult;
};

// Deliberately text-only -- the photo itself is never written to storage, on-device or
// otherwise (see privacy.tsx). This is local-only: nothing here is ever sent anywhere.
export async function saveHistoryEntry(result: AnalysisResult, lang: Lang): Promise<void> {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scannedAt: new Date().toISOString(),
    lang,
    result,
  };
  const existing = await listHistory();
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function listHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function deleteHistoryEntry(id: string): Promise<HistoryEntry[]> {
  const existing = await listHistory();
  const next = existing.filter((entry) => entry.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
