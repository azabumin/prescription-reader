// Native fallback -- this app ships as a web export, but keep imports safe everywhere.
// The real implementation is speech.web.ts, which Metro picks automatically on web.
import type { Lang } from '../types';

export function isSpeechSupported(): boolean {
  return false;
}

export function speak(_text: string, _lang: Lang, _onEnd?: () => void): void {
  // no-op on native
}

export function stopSpeech(): void {
  // no-op on native
}
