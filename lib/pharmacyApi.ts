// Pharmacy side of the intake (worker/src/intake/pharmacyAuth.ts, pharmacyRoutes.ts). Web only: the pharmacy uses a
// browser on the reception PC/tablet, never the レセコン PC. The session token lives in localStorage.
import { WORKER_URL } from '../constants/config';
import type { PharmacyCard } from './pharmacyCard';
import type { IntakeStatus, PickupCode } from './intakeApi';
import type { Lang } from '../types';

const SESSION_KEY = 'rxhelper.pharmacySession.v1';

export type PharmacySession = { token: string; pharmacy: { name: string; code: string } };

export type ExtractedDrug = {
  name: string;
  generic: boolean;
  amountPerDose: number | null;
  unit: string;
  dosesPerDay: number | null;
  days: number | null;
  prnCount: number | null;
  rawText: string;
};

export type InboxItem = {
  id: string;
  createdAt: string;
  lang: Lang;
  pickup: PickupCode;
  status: IntakeStatus;
  drugsStatus: 'pending' | 'done' | 'failed';
  opened: boolean;
};

export type IntakeDetail = {
  id: string;
  createdAt: string;
  lang: Lang;
  pickup: PickupCode;
  status: IntakeStatus;
  laterTime: string | null;
  drugsStatus: 'pending' | 'done' | 'failed';
  drugs: ExtractedDrug[] | null;
  card: PharmacyCard | null;
  imageCount: number;
  messages: { kind: 'template' | 'free'; textJa: string; textPatient: string; createdAt: string }[];
};

export class PharmacyAuthError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'PharmacyAuthError';
  }
}

// 'gone' = deleted (7 days or 完了) or another pharmacy's; the rest are what the endpoint said.
export class PharmacyApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = 'PharmacyApiError';
  }
}

export function loadSession(): PharmacySession | null {
  try {
    const raw = globalThis.localStorage?.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PharmacySession) : null;
  } catch {
    return null;
  }
}

function saveSession(s: PharmacySession | null) {
  try {
    if (s) globalThis.localStorage?.setItem(SESSION_KEY, JSON.stringify(s));
    else globalThis.localStorage?.removeItem(SESSION_KEY);
  } catch {
    // private mode etc.: the pharmacist just logs in again next time
  }
}

async function request(path: string, init: RequestInit = {}, auth = true): Promise<Response> {
  const headers: Record<string, string> = { ...(init.body ? { 'Content-Type': 'application/json' } : {}) };
  if (auth) {
    const s = loadSession();
    if (!s) throw new PharmacyAuthError();
    headers.Authorization = `Bearer ${s.token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  } catch {
    throw new PharmacyApiError('network', 0);
  }
  if (auth && res.status === 401) {
    saveSession(null);
    throw new PharmacyAuthError();
  }
  if (!res.ok) {
    let code = 'server';
    try {
      code = ((await res.json()) as { error?: string }).error ?? code;
    } catch {
      // non-JSON error body
    }
    throw new PharmacyApiError(code, res.status);
  }
  return res;
}

export async function setupPharmacy(code: string, setupCode: string, password: string): Promise<void> {
  await request('/pharmacy/setup', { method: 'POST', body: JSON.stringify({ code, setupCode, password }) }, false);
}

export async function loginPharmacy(email: string, password: string): Promise<PharmacySession> {
  const res = await request('/pharmacy/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
  const s = (await res.json()) as PharmacySession;
  saveSession(s);
  return s;
}

export async function logoutPharmacy(): Promise<void> {
  try {
    await request('/pharmacy/logout', { method: 'POST' });
  } finally {
    saveSession(null);
  }
}

export async function listIntakes(): Promise<InboxItem[]> {
  return ((await (await request('/pharmacy/intakes')).json()) as { items: InboxItem[] }).items;
}

export async function getIntake(id: string): Promise<IntakeDetail> {
  return (await (await request(`/pharmacy/intakes/${encodeURIComponent(id)}`)).json()) as IntakeDetail;
}

// A blob: URL for <img>; the caller revokes it when the screen closes.
export async function getIntakeImageUrl(id: string, idx: number): Promise<string> {
  const res = await request(`/pharmacy/intakes/${encodeURIComponent(id)}/images/${idx}`);
  return URL.createObjectURL(await res.blob());
}

export async function reply(id: string, status: 'ready' | 'inquiry' | 'later', laterTime?: string): Promise<void> {
  await request(`/pharmacy/intakes/${encodeURIComponent(id)}/reply`, { method: 'POST', body: JSON.stringify({ status, laterTime }) });
}

export async function listTemplates(): Promise<{ key: string; textJa: string }[]> {
  return ((await (await request('/pharmacy/templates')).json()) as { items: { key: string; textJa: string }[] }).items;
}

export async function previewTranslation(textJa: string, lang: Lang): Promise<string> {
  const res = await request('/pharmacy/translate-preview', { method: 'POST', body: JSON.stringify({ textJa, lang }) });
  return ((await res.json()) as { textPatient: string }).textPatient;
}

export async function postMessage(
  id: string,
  msg: { kind: 'template'; templateKey: string } | { kind: 'free'; textJa: string; textPatient: string },
): Promise<void> {
  await request(`/pharmacy/intakes/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify(msg) });
}

export async function markDone(id: string): Promise<void> {
  await request(`/pharmacy/intakes/${encodeURIComponent(id)}/done`, { method: 'POST' });
}
