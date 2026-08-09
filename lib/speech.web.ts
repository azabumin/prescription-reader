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

// Voices load asynchronously on many browsers (notably iOS Safari), so getVoices() can
// return an empty list right after page load. speechSynthesis.speak() must also be called
// synchronously inside the tap/click handler on iOS Safari -- if it's deferred until an
// async "voiceschanged" callback fires later, iOS can silently ignore the assigned voice
// and lang and fall back to the device's system-language voice instead. To avoid that gap,
// we warm the voice list once at module load (well before the user taps anything) and cache
// it, so speak() always has a populated list ready and can call speechSynthesis.speak()
// immediately, in the same call stack as the user's tap.
let cachedVoices: SpeechSynthesisVoice[] = [];

function refreshVoiceCache(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoiceCache();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoiceCache);
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function pickVoice(bcp47: string): SpeechSynthesisVoice | undefined {
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const exact = voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (exact) return exact;
  const prefix = bcp47.split('-')[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
}

export function speak(text: string, lang: Lang, onEnd?: () => void): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  const bcp47 = SPEECH_LOCALES[lang];
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;
  const voice = pickVoice(bcp47);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.75;
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
