import type { Lang } from '../types';

// BCP-47 locale tags for SpeechSynthesisUtterance.lang. Actual voice availability and
// quality depends on the user's browser/OS -- widely-supported languages (ja/ko/en/zh/pt)
// tend to have good built-in voices; some (my/ne/tl) may fall back to a generic or missing
// voice on older devices. There is no reliable way to detect voice quality in advance.
const SPEECH_LOCALES: Record<Lang, string> = {
  ja: 'ja-JP',
  ko: 'ko-KR',
  en: 'en-US',
  vi: 'vi-VN',
  zh: 'zh-CN',
  id: 'id-ID',
  tl: 'fil-PH',
  th: 'th-TH',
  my: 'my-MM',
  ne: 'ne-NP',
  pt: 'pt-PT',
};

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, lang: Lang, onEnd?: () => void): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LOCALES[lang];
  utterance.rate = 0.9;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
