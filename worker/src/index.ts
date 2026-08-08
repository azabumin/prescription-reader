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

type Lang = 'ja' | 'ko' | 'en' | 'vi' | 'zh' | 'id' | 'tl' | 'th' | 'my' | 'ne' | 'pt';

// Keep in sync with LANGUAGES in ../../types.ts. Only the English name matters here —
// it's substituted into an English-language instruction to Claude, not shown to the user.
const LANGUAGE_NAMES: Record<Lang, string> = {
  ja: 'Japanese',
  ko: 'Korean',
  en: 'English',
  vi: 'Vietnamese',
  zh: 'Chinese',
  id: 'Indonesian',
  tl: 'Filipino (Tagalog)',
  th: 'Thai',
  my: 'Burmese',
  ne: 'Nepali',
  pt: 'Portuguese',
};

// One schema for every target language — field descriptions are instructions to Claude
// (which understands them regardless of output language), not user-facing text.
const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    medicationName: {
      type: 'string',
      description: 'Overall heading naming the medication(s) shown on the prescription/label.',
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of this individual medication.' },
          dosage: { type: 'string', description: 'Amount taken per dose, e.g. "1 tablet".' },
          frequency: {
            type: 'string',
            description: 'When/how often to take it, e.g. "Once daily, after breakfast".',
          },
          purpose: { type: 'string', description: "This medication's general purpose, briefly." },
          precaution: { type: 'string', description: 'Precautions or warnings, briefly.' },
        },
        required: ['name', 'dosage', 'frequency', 'purpose', 'precaution'],
        additionalProperties: false,
      },
    },
    generalNotes: {
      type: 'string',
      description:
        'Brief overall note. Must state this is not medical advice, just a plain-language restatement of what is printed on the label, and that the user should ask a pharmacist or doctor with questions.',
    },
  },
  required: ['medicationName', 'items', 'generalNotes'],
  additionalProperties: false,
} as const;

function buildPrompt(targetLanguageName: string): string {
  return `Analyze the photo of a prescription or medication label. The text on it may be in Japanese, Korean, or another language — read it regardless of which.

1. Identify the medication name(s) shown (there may be more than one).
2. For each medication, state the dose per administration, timing/frequency, its general purpose, and any precautions — in plain, everyday language, not technical medical jargon.
3. Write a brief overall note that this is not medical advice — just the label's own text restated in plain language — and that the reader should ask a pharmacist or doctor with any questions about taking the medication.
4. If any part of the photo is blurry or illegible, say so rather than guessing at it.

Write your entire response in ${targetLanguageName}, including every field. Do not mix in other languages.`;
}

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
    const lang: Lang = typeof body.lang === 'string' && body.lang in LANGUAGE_NAMES ? (body.lang as Lang) : 'en';

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
      output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
            { type: 'text', text: buildPrompt(LANGUAGE_NAMES[lang]) },
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
