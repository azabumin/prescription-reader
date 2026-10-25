// "The pharmacy replied" email, only for patients who typed an address on the send screen. It never carries the
// content (medicine names, messages) -- just a link back to the app. Sent via Resend like the password-reset mail
// (see ../email.ts); without RESEND_API_KEY it only logs.
import type { Lang } from './types';

const FROM = 'RxHelper <noreply@rxhelper.jp>';
const SITE = 'https://rxhelper.jp';

const MAIL: Record<Lang, { subject: string; body: string }> = {
  ja: { subject: '薬局から返信がありました', body: '薬局から返信がありました。アプリで確認してください。' },
  ko: { subject: '약국에서 답장이 왔습니다', body: '약국에서 답장이 왔습니다. 앱에서 확인해 주세요.' },
  en: { subject: 'The pharmacy has replied', body: 'The pharmacy has replied. Please check it in the app.' },
  zh: { subject: '药店已回复', body: '药店已回复。请在应用中查看。' },
  vi: { subject: 'Nhà thuốc đã trả lời', body: 'Nhà thuốc đã trả lời. Vui lòng kiểm tra trong ứng dụng.' },
  id: { subject: 'Apotek telah membalas', body: 'Apotek telah membalas. Silakan periksa di aplikasi.' },
  tl: { subject: 'Sumagot na ang botika', body: 'Sumagot na ang botika. Pakitingnan ito sa app.' },
  th: { subject: 'ร้านยาตอบกลับแล้ว', body: 'ร้านยาได้ตอบกลับแล้ว กรุณาตรวจสอบในแอป' },
  my: { subject: 'ဆေးဆိုင်မှ အကြောင်းပြန်ပါပြီ', body: 'ဆေးဆိုင်မှ အကြောင်းပြန်ပါပြီ။ အက်ပ်တွင် စစ်ဆေးပါ။' },
  ne: { subject: 'फार्मेसीले जवाफ दियो', body: 'फार्मेसीले जवाफ दिएको छ। कृपया एपमा हेर्नुहोस्।' },
  pt: { subject: 'A farmácia respondeu', body: 'A farmácia respondeu. Por favor, confira no aplicativo.' },
};

export function buildStatusEmail(lang: Lang, intakeId: string): { subject: string; text: string } {
  const m = MAIL[lang] ?? MAIL.ja;
  return { subject: m.subject, text: `${m.body}\n\n${SITE}/sent?i=${intakeId}\n\n— rxhelper.jp` };
}

// Never throws: a failed email must not undo or block the pharmacy's reply.
export async function sendStatusEmail(env: Env, to: string, lang: Lang, intakeId: string): Promise<void> {
  const { subject, text } = buildStatusEmail(lang, intakeId);
  if (!env.RESEND_API_KEY) {
    console.log('status_email_not_sent_no_resend_key', intakeId);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, text }),
    });
    if (!res.ok) console.error('status_email_failed', intakeId, res.status);
  } catch (err) {
    console.error('status_email_failed', intakeId, err);
  }
}
