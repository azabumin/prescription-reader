// The operator's admin screen (app/admin/index.tsx) -> worker/src/admin.ts. Web only. The admin key (ADMIN_TOKEN) is
// typed once and kept in this browser's localStorage; a 401 forgets it.
import { WORKER_URL } from '../constants/config';
import type { PharmacyPlan } from './pharmacyPlan';

const KEY_STORAGE = 'rxhelper.adminKey.v1';

export type AdminPharmacy = {
  id: number;
  code: string;
  name: string;
  email: string;
  plan: PharmacyPlan;
  planChosen: boolean;
  createdAt: string;
  disabled: boolean;
  lastLoginAt: string | null;
  passwordSet: boolean;
  setupLinkValid: boolean;
  sends30: number;
  checks30: number;
  lastActivityAt: string | null;
  openIntakes: number;
  unreadFeedback: number;
  ai30: { calls: number; usd: number }; // AI calls and the cost estimate (USD) of the last 30 days
};

// AI usage of the last 30 days (worker/src/aiUsage.ts). usd is an estimate from list prices; models without a
// known price are counted in calls/tokens but listed in unpriced instead of the estimate.
export type AiUsageTotals = { calls: number; inputTokens: number; outputTokens: number; usd: number; unpriced: string[] };
export type AiUsage = { days: number; features: (AiUsageTotals & { feature: string })[]; total: AiUsageTotals };

export type AdminFeedback = { id: number; createdAt: string; body: string; read: boolean; pharmacyName: string; plan: PharmacyPlan };

export class AdminError extends Error {
  constructor(public code: string, public status: number, public detail: Record<string, unknown> = {}) {
    super(code);
    this.name = 'AdminError';
  }
}

export function loadAdminKey(): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY_STORAGE) ?? null;
  } catch {
    return null;
  }
}

export function saveAdminKey(key: string | null) {
  try {
    if (key) globalThis.localStorage?.setItem(KEY_STORAGE, key);
    else globalThis.localStorage?.removeItem(KEY_STORAGE);
  } catch {
    // private mode etc.: the key is just typed again next time
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = loadAdminKey();
  if (!key) throw new AdminError('unauthorized', 401);
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}${path}`, {
      ...init,
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${key}` },
    });
  } catch {
    throw new AdminError('network', 0);
  }
  if (res.status === 401) saveAdminKey(null);
  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      // non-JSON error body
    }
    const { error, ...rest } = body;
    throw new AdminError(typeof error === 'string' ? error : 'server', res.status, rest);
  }
  return (await res.json()) as T;
}

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });

export const listPharmacies = async () => (await request<{ items: AdminPharmacy[] }>('/admin/pharmacies')).items;
export const createPharmacy = (name: string, email: string, plan: PharmacyPlan | null) =>
  post<{ id: number; code: string; setupUrl: string; patientUrl: string }>('/admin/pharmacies', { name, email, plan });
export const newSetupLink = (id: number) => post<{ setupUrl: string }>(`/admin/pharmacies/${id}/setup-link`);
export const setPharmacyPlan = (id: number, plan: PharmacyPlan) => post<{ ok: true }>(`/admin/pharmacies/${id}/plan`, { plan });
export const setPharmacyDisabled = (id: number, disabled: boolean) => post<{ ok: true }>(`/admin/pharmacies/${id}/disabled`, { disabled });
export const getAiUsage = () => request<AiUsage>('/admin/ai-usage');
export const listFeedback = async () => (await request<{ items: AdminFeedback[] }>('/admin/feedback')).items;
export const markFeedbackRead = (id: number) => post<{ ok: true }>(`/admin/feedback/${id}/read`);
