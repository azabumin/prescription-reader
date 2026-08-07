declare global {
  interface Env {
    ANTHROPIC_API_KEY: string;
  }
}

// Cost-control caps for the shared Anthropic API key. Adjust as needed.
const PER_IP_DAILY_LIMIT = 20;
const GLOBAL_DAILY_LIMIT = 300;
const MAX_BASE64_LENGTH = 8_000_000; // ~6MB image
const MODEL = 'claude-haiku-4-5';
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Lang = 'ko' | 'ja';

function buildSchema(lang: Lang) {
  const isJa = lang === 'ja';
  return {
    type: 'object',
    properties: {
      medicationName: {
        type: 'string',
        description: isJa
          ? '処方箋・薬袋に記載されたお薬の名前(全体をまとめた見出し)'
          : '처방전/약봉투에 적힌 약 이름(전체를 아우르는 제목)',
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: isJa ? '個別のお薬の名前' : '개별 약 이름' },
            dosage: {
              type: 'string',
              description: isJa ? '1回の服用量 (例: 「1錠」)' : '1회 복용량 (예: "1정")',
            },
            frequency: {
              type: 'string',
              description: isJa
                ? '服用タイミング・頻度 (例: 「1日3回、食後30分」)'
                : '복용 시간/빈도 (예: "하루 3번, 식후 30분")',
            },
            purpose: {
              type: 'string',
              description: isJa ? 'この薬の一般的な用途 (簡潔に)' : '이 약의 일반적인 용도 (간단히)',
            },
            precaution: {
              type: 'string',
              description: isJa ? '注意事項 (簡潔に)' : '주의사항 (간단히)',
            },
          },
          required: ['name', 'dosage', 'frequency', 'purpose', 'precaution'],
          additionalProperties: false,
        },
      },
      generalNotes: {
        type: 'string',
        description: isJa
          ? '医療アドバイスではないという断り書きを含む、全体のご案内'
          : '의료 조언이 아니라는 안내를 포함한 전체 안내 문구',
      },
    },
    required: ['medicationName', 'items', 'generalNotes'],
    additionalProperties: false,
  } as const;
}

const PROMPTS: Record<Lang, string> = {
  ko: `사진 속 처방전 또는 약봉투를 분석해주세요.
1. 약 이름(여러 약이 있으면 각각의 이름)을 알려주세요.
2. 각 약에 대해 1회 복용량, 복용 시간/빈도, 일반적인 용도, 주의사항을 쉬운 말로 정리해주세요.
3. 전체적으로 참고할 안내 문구를 짧게 적어주세요 — 이 안내가 의료 조언이 아니라 처방전에 적힌 내용을 쉬운 말로 옮긴 것이라는 점과, 복용 관련 궁금한 점은 약사·의사와 상담해야 한다는 점을 포함해주세요.
전문 의학 용어는 피하고 일상적인 말로 풀어서 설명해주세요. 사진이 흐리거나 읽기 어려운 부분이 있으면 추측하지 말고 "읽기 어려움"이라고 표시해주세요.
모든 답변은 한국어로 작성해주세요.`,
  ja: `写真の処方箋またはお薬の袋を分析してください。
1. お薬の名前(複数ある場合はそれぞれの名前)を教えてください。
2. 各お薬について、1回の服用量、服用タイミング・頻度、一般的な用途、注意事項をわかりやすい言葉でまとめてください。
3. 全体のご案内を短く書いてください — この説明が医療アドバイスではなく、処方箋に書かれた内容をわかりやすく言い換えたものであること、服用について気になる点は薬剤師・医師にご相談いただく必要があることを含めてください。
専門的な医学用語は避け、日常的な言葉で説明してください。写真が不鮮明で読み取れない部分がある場合は、推測せずに「判読できません」と表示してください。
すべての回答は日本語で書いてください。`,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const corsHeaders = buildCorsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/analyze' || request.method !== 'POST') {
      return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const today = new Date().toISOString().slice(0, 10);
    const ipKey = `ip:${ip}:${today}`;
    const globalKey = `global:${today}`;

    const [ipCountRaw, globalCountRaw] = await Promise.all([
      env.RATE_LIMIT_KV.get(ipKey),
      env.RATE_LIMIT_KV.get(globalKey),
    ]);
    const ipCount = parseInt(ipCountRaw ?? '0', 10);
    const globalCount = parseInt(globalCountRaw ?? '0', 10);

    if (ipCount >= PER_IP_DAILY_LIMIT || globalCount >= GLOBAL_DAILY_LIMIT) {
      return jsonResponse({ error: 'rate_limited' }, 429, corsHeaders);
    }

    let body: { image?: unknown; mediaType?: unknown; lang?: unknown };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400, corsHeaders);
    }

    if (typeof body.image !== 'string' || body.image.length === 0) {
      return jsonResponse({ error: 'missing_image' }, 400, corsHeaders);
    }
    if (body.image.length > MAX_BASE64_LENGTH) {
      return jsonResponse({ error: 'image_too_large' }, 413, corsHeaders);
    }
    const mediaType =
      typeof body.mediaType === 'string' && ALLOWED_MEDIA_TYPES.includes(body.mediaType)
        ? body.mediaType
        : 'image/jpeg';
    const lang: Lang = body.lang === 'ja' ? 'ja' : 'ko';

    const dayTtlSeconds = 60 * 60 * 26;
    await Promise.all([
      env.RATE_LIMIT_KV.put(ipKey, String(ipCount + 1), { expirationTtl: dayTtlSeconds }),
      env.RATE_LIMIT_KV.put(globalKey, String(globalCount + 1), { expirationTtl: dayTtlSeconds }),
    ]);

    try {
      const analysis = await callClaude(body.image, mediaType, lang, env.ANTHROPIC_API_KEY);
      return jsonResponse(analysis, 200, corsHeaders);
    } catch (err) {
      console.error('analysis_failed', err);
      return jsonResponse({ error: 'analysis_failed' }, 502, corsHeaders);
    }
  },
};

function buildCorsHeaders(origin: string, env: Env): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin === env.ALLOWED_ORIGIN || origin.startsWith('http://localhost:')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonResponse(data: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

async function callClaude(base64Image: string, mediaType: string, lang: Lang, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1536,
      output_config: { format: { type: 'json_schema', schema: buildSchema(lang) } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
            { type: 'text', text: PROMPTS[lang] },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API ${response.status}: ${errText}`);
  }

  const data = (await response.json()) as {
    stop_reason: string;
    content: { type: string; text?: string }[];
  };

  if (data.stop_reason === 'refusal') {
    throw new Error('model refused the request');
  }

  const textBlock = data.content.find((block) => block.type === 'text');
  if (!textBlock?.text) {
    throw new Error('no text block in Claude response');
  }

  return JSON.parse(textBlock.text);
}
