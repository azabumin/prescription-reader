import AsyncStorage from '@react-native-async-storage/async-storage';

import { pruneSent, upsertSent, type SentIntake } from './sentIntakes';

export type { SentIntake };

const STORAGE_KEY = 'rxhelper.sentIntakes.v1';

async function read(): Promise<SentIntake[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SentIntake[]) : [];
  } catch {
    return [];
  }
}

export async function listSent(): Promise<SentIntake[]> {
  return pruneSent(await read(), new Date());
}

export async function addSent(item: SentIntake): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(upsertSent(await read(), item, new Date())));
}

export async function removeSent(intakeId: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify((await read()).filter((x) => x.intakeId !== intakeId)));
}
