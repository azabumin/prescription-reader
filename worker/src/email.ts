// Sends the password-reset email via Resend (https://resend.com).
//
// rxhelper.jp's DNS lives at お名前.com, not on Cloudflare, so Cloudflare Email Service's
// `send_email` binding can't onboard it (needs a Cloudflare-managed zone to write SPF/DKIM
// into). Resend only needs a few DNS records added wherever the domain's DNS already lives --
// no nameserver migration -- so that's the path this project uses.
//
// Setup (one-time, done outside this codebase):
//   1. Create a free Resend account at resend.com.
//   2. Add rxhelper.jp as a sending domain there; it gives you SPF/DKIM records to add at
//      お名前.com (same DNS panel already used for the GitHub Pages A-records -- these are
//      TXT/CNAME records, so they don't conflict with the existing A records).
//   3. Wait for Resend to verify the domain (DNS propagation, usually minutes).
//   4. Create an API key in the Resend dashboard.
//   5. Run `wrangler secret put RESEND_API_KEY` in worker/ and paste the key.
// Until RESEND_API_KEY is set, this just logs the reset link (visible via `wrangler tail`)
// instead of failing -- see the fallback below.

type Lang = 'ja' | 'ko' | 'en' | 'vi' | 'zh' | 'id' | 'tl' | 'th' | 'my' | 'ne' | 'pt';

const FROM = 'RxHelper <noreply@rxhelper.jp>';

const TEMPLATES: Record<Lang, { subject: string; body: (url: string) => string }> = {
  ja: {
    subject: 'パスワード再設定のご案内',
    body: (url) =>
      `以下のリンクをクリックして、パスワードを再設定してください。\n\n${url}\n\nこのリンクは1時間有効です。心当たりがない場合は、このメールを無視してください。`,
  },
  ko: {
    subject: '비밀번호 재설정 안내',
    body: (url) =>
      `아래 링크를 클릭하여 비밀번호를 재설정해주세요.\n\n${url}\n\n이 링크는 1시간 동안 유효합니다. 본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.`,
  },
  en: {
    subject: 'Reset Your Password',
    body: (url) =>
      `Click the link below to reset your password.\n\n${url}\n\nThis link is valid for 1 hour. If you didn't request this, you can safely ignore this email.`,
  },
  vi: {
    subject: 'Đặt Lại Mật Khẩu Của Bạn',
    body: (url) =>
      `Nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn.\n\n${url}\n\nLiên kết này có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu điều này, bạn có thể bỏ qua email này.`,
  },
  zh: {
    subject: '重置您的密码',
    body: (url) => `点击下方链接重置您的密码。\n\n${url}\n\n此链接有效期为1小时。如果这不是您本人的操作,请忽略此邮件。`,
  },
  id: {
    subject: 'Atur Ulang Kata Sandi Anda',
    body: (url) =>
      `Klik tautan di bawah ini untuk mengatur ulang kata sandi Anda.\n\n${url}\n\nTautan ini berlaku selama 1 jam. Jika Anda tidak meminta ini, Anda dapat mengabaikan email ini.`,
  },
  tl: {
    subject: 'I-reset ang Iyong Password',
    body: (url) =>
      `I-click ang link sa ibaba upang i-reset ang iyong password.\n\n${url}\n\nValid ang link na ito sa loob ng 1 oras. Kung hindi mo hiniling ito, maaari mong balewalain ang email na ito.`,
  },
  th: {
    subject: 'รีเซ็ตรหัสผ่านของคุณ',
    body: (url) =>
      `คลิกลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่านของคุณ\n\n${url}\n\nลิงก์นี้ใช้งานได้ภายใน 1 ชั่วโมง หากคุณไม่ได้ร้องขอสิ่งนี้ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้`,
  },
  my: {
    subject: 'သင့်စကားဝှက်ကို ပြန်လည်သတ်မှတ်ပါ',
    body: (url) =>
      `သင့်စကားဝှက်ကို ပြန်လည်သတ်မှတ်ရန် အောက်ပါလင့်ခ်ကို နှိပ်ပါ။\n\n${url}\n\nဤလင့်ခ်သည် ၁ နာရီ တိုင်အောင် သက်တမ်းရှိသည်။ သင်တောင်းဆိုခြင်း မဟုတ်ပါက ဤအီးမေးလ်ကို လျစ်လျူရှုနိုင်ပါသည်။`,
  },
  ne: {
    subject: 'तपाईंको पासवर्ड रिसेट गर्नुहोस्',
    body: (url) =>
      `तपाईंको पासवर्ड रिसेट गर्न तलको लिंकमा क्लिक गर्नुहोस्।\n\n${url}\n\nयो लिंक १ घण्टाको लागि मान्य छ। यदि तपाईंले यो अनुरोध गर्नुभएको छैन भने, तपाईं यो इमेललाई बेवास्ता गर्न सक्नुहुन्छ।`,
  },
  pt: {
    subject: 'Redefinir Sua Senha',
    body: (url) =>
      `Clique no link abaixo para redefinir sua senha.\n\n${url}\n\nEste link é válido por 1 hora. Se você não solicitou isso, pode ignorar este e-mail com segurança.`,
  },
};

function resolveTemplateLang(lang: unknown): Lang {
  return typeof lang === 'string' && lang in TEMPLATES ? (lang as Lang) : 'en';
}

function textToHtml(text: string, url: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const linked = escaped.replace(url, `<a href="${url}">${url}</a>`);
  return linked
    .split('\n\n')
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  lang: unknown,
  resendApiKey: string | undefined,
): Promise<void> {
  const template = TEMPLATES[resolveTemplateLang(lang)];
  const text = template.body(resetUrl);

  if (!resendApiKey) {
    console.log('password_reset_email_not_configured', { email, resetUrl });
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: template.subject,
      text,
      html: textToHtml(text, resetUrl),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Resend API ${response.status}: ${errText}`);
  }
}
