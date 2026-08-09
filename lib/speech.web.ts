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

function pickVoice(bcp47: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const exact = voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (exact) return exact;
  const prefix = bcp47.split('-')[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
}

// Setting utterance.lang alone is not enough on many browsers -- if utterance.voice is left
// unset, some implementations silently fall back to the OS/browser default voice instead of
// picking one that matches the requested language, so the reader can hear the wrong language
// even though the text itself is correctly translated. We look up an installed voice that
// actually matches and set it explicitly. getVoices() can return an empty list on first call
// until the browser's async "voiceschanged" event fires, so we wait for that when needed.
function speakWithVoices(text: string, bcp47: string, voices: SpeechSynthesisVoice[], onEnd?: () => void): void {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;
  const voice = pickVoice(bcp47, voices);
  if (voice) utterance.voice = voice;
  utterance.rate = 0.75;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

export function speak(text: string, lang: Lang, onEnd?: () => void): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  const bcp47 = SPEECH_LOCALES[lang];

  const existingVoices = window.speechSynthesis.getVoices();
  if (existingVoices.length > 0) {
    speakWithVoices(text, bcp47, existingVoices, onEnd);
    return;
  }
  const handleVoicesChanged = () => {
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    speakWithVoices(text, bcp47, window.speechSynthesis.getVoices(), onEnd);
  };
  window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
}

export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
