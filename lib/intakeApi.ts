// Patient side of the pharmacy intake (worker/src/intake/patientRoutes.ts). No account: the token returned on send
// is kept on this device (lib/intakeStore.ts) and is the only way to read the pharmacy's replies.
import { WORKER_URL } from '../constants/config';
import type { PharmacyCard } from './pharmacyCard';
import type { Lang } from '../types';

export type PickupCode = 'today15' | 'today17' | 'today19' | 'tomorrow';
export const PICKUP_CODES: PickupCode[] = ['today15', 'today17', 'today19', 'tomorrow'];
export type IntakeStatus = 'new' | 'ready' | 'inquiry' | 'later' | 'done';

export type IntakeErrorCode = 'network' | 'invalid' | 'image_too_large' | 'rate_limited' | 'pharmacy_not_found' | 'server';

export class IntakeError extends Error {
  constructor(public code: IntakeErrorCode) {
    super(code);
    this.name = 'IntakeError';
  }
}

export type SendIntakeInput = {
  pharmacyCode: string;
  clientRequestId: string;
  lang: Lang;
  pickup: PickupCode;
  card: PharmacyCard;
  images: { base64: string; mediaType: 'image/jpeg' }[];
  notifyEmail?: string;
  consent: true;
};

export type IntakeStatusView = {
  pharmacyName: string;
  status: IntakeStatus;
  laterTime: string | null;
  createdAt: string;
  messages: { textPatient: string; textJa: string; createdAt: string }[];
};

export async function getPharmacyName(code: string): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/p/pharmacy?code=${encodeURIComponent(code)}`);
  } catch {
    throw new IntakeError('network');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new IntakeError('server');
  return ((await res.json()) as { name: string }).name;
}

export async function sendIntake(input: SendIntakeInput): Promise<{ intakeId: string; patientToken: string }> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/intakes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    throw new IntakeError('network');
  }
  if (res.status === 201) return (await res.json()) as { intakeId: string; patientToken: string };
  if (res.status === 413) throw new IntakeError('image_too_large');
  if (res.status === 429) throw new IntakeError('rate_limited');
  if (res.status === 404) throw new IntakeError('pharmacy_not_found');
  if (res.status === 400) throw new IntakeError('invalid');
  throw new IntakeError('server');
}

// null = the intake no longer exists (7 days passed, or the token doesn't match).
export async function getIntakeStatus(intakeId: string, token: string): Promise<IntakeStatusView | null> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/intakes/${encodeURIComponent(intakeId)}`, { headers: { 'X-Intake-Token': token } });
  } catch {
    throw new IntakeError('network');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new IntakeError('server');
  return (await res.json()) as IntakeStatusView;
}
