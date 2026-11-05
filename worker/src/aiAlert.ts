// Mails the operator when the Anthropic API refuses for an account reason -- credit used up, key revoked. Then every
// AI feature fails at once (the reader on rxhelper.jp, pharmacy reading, walk-in check, translation) and users only
// see a generic error, as happened on 2026-11-06. At most one mail per kind per 6 hours while it lasts.
import { sendOperatorMail } from './email';

const ALERT_EVERY_SECONDS = 6 * 60 * 60;

export type AccountProblem = 'credit' | 'key';

export function accountProblem(status: number, body: string): AccountProblem | null {
  if (status === 400 && /credit balance/i.test(body)) return 'credit';
  if (status === 401 || status === 403) return 'key';
  return null;
}

// The operator reads Korean.
const MAIL: Record<AccountProblem, { subject: string; what: string; todo: string }> = {
  credit: {
    subject: '[처방전 도우미] AI 크레딧 잔액 부족 — AI 기능이 멈췄습니다',
    what: 'Anthropic API의 크레딧 잔액이 부족해서, AI를 쓰는 기능이 모두 멈췄습니다.',
    todo:
      'console.anthropic.com → Plans & Billing에서 크레딧을 충전해 주세요. 충전하면 바로 복구됩니다(배포는 필요 없습니다).\n' +
      '자동 충전(auto-reload)을 켜 두면 다시 멈추지 않습니다.',
  },
  key: {
    subject: '[처방전 도우미] AI API 키 오류 — AI 기능이 멈췄습니다',
    what: 'Anthropic API가 서버의 API 키를 받아들이지 않아서, AI를 쓰는 기능이 모두 멈췄습니다.',
    todo:
      'console.anthropic.com → API Keys에서 키가 유효한지 확인해 주세요. 새 키를 만들었다면 worker 폴더에서\n' +
      '`npx wrangler secret put ANTHROPIC_API_KEY` 로 등록하면 바로 복구됩니다.',
  },
};

async function alertOperator(env: Env, problem: AccountProblem, detail: string): Promise<void> {
  if (!env.OPERATOR_EMAIL) return;
  const key = `ai-alert:${problem}`;
  try {
    if (await env.RATE_LIMIT_KV.get(key)) return;
    await env.RATE_LIMIT_KV.put(key, new Date().toISOString(), { expirationTtl: ALERT_EVERY_SECONDS });
    const m = MAIL[problem];
    await sendOperatorMail(
      env.OPERATOR_EMAIL,
      m.subject,
      `${m.what}\n- 처방전 설명(rxhelper.jp), 약국 창구 처방전 대조, 환자가 보낸 처방전의 AI 읽기, 번역\n\n` +
        `할 일:\n${m.todo}\n\n` +
        `같은 문제가 계속되는 동안 이 메일은 6시간에 한 번 보냅니다.\n시각: ${new Date().toISOString()}\n오류: ${detail.slice(0, 300)}`,
      env.RESEND_API_KEY,
    );
  } catch (err) {
    // the failing request still gets its own error; the alert is best effort
    console.error('ai_alert_failed', err);
  }
}

// For a non-OK Anthropic response: alerts the operator if it's an account problem, then throws as the callers did.
export async function throwClaudeError(env: Env, response: Response): Promise<never> {
  const text = await response.text();
  const problem = accountProblem(response.status, text);
  if (problem) await alertOperator(env, problem, `${response.status}: ${text}`);
  throw new Error(`Claude API ${response.status}: ${text}`);
}
