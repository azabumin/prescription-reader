import { WORKER_URL } from '../constants/config';
import type { AnalysisResult, Lang } from '../types';

export type AnalyzeErrorCode = 'network' | 'rate_limited' | 'unauthorized' | 'trial_expired' | 'server';

export class AnalyzeError extends Error {
  constructor(public code: AnalyzeErrorCode, public status?: number) {
    super(code);
    this.name = 'AnalyzeError';
  }
}

export async function analyzePrescriptionPhoto(
  base64: string,
  mediaType: string,
  lang: Lang,
  token: string
): Promise<AnalysisResult> {
  let response: Response;
  try {
    response = await fetch(`${WORKER_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ image: base64, mediaType, lang }),
    });
  } catch {
    throw new AnalyzeError('network');
  }

  if (response.status === 429) {
    throw new AnalyzeError('rate_limited', 429);
  }
  if (response.status === 401) {
    throw new AnalyzeError('unauthorized', 401);
  }
  if (response.status === 402) {
    throw new AnalyzeError('trial_expired', 402);
  }
  if (!response.ok) {
    throw new AnalyzeError('server', response.status);
  }

  return (await response.json()) as AnalysisResult;
}
