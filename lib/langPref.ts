import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lang } from '../types';

const STORAGE_KEY = 'prescription-reader:lang';

export async function loadLangPref(): Promise<Lang | null> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) as Lang | null;
  } catch {
    return null;
  }
}

export async function saveLangPref(lang: Lang): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}
