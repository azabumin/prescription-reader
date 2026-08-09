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
          timeSlots: {
            type: 'array',
            description:
              'Every time-of-day this dose applies to, from the fixed set below — do not invent other values. Pick every slot that applies (e.g. a "3x daily after meals" drug gets all three of morning/noon/evening). Use ["asNeeded"] alone for PRN doses (頓服/屯用/필요시/as needed) not tied to a fixed time — never combine "asNeeded" with a fixed slot.',
            items: { type: 'string', enum: ['morning', 'noon', 'evening', 'bedtime', 'asNeeded'] },
          },
          timingDetail: {
            type: 'string',
            description:
              'Nuance the fixed time slots can\'t capture, in the target language: meal relation (before/after/with meals, minutes relative to a meal), fasting requirement, max doses per day for PRN drugs, or any other timing qualifier printed on the label. Empty string if there is nothing beyond the time slots themselves.',
          },
          purpose: { type: 'string', description: "This medication's general purpose, briefly." },
          precaution: { type: 'string', description: 'Precautions or warnings, briefly.' },
        },
        required: ['name', 'dosage', 'timeSlots', 'timingDetail', 'purpose', 'precaution'],
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

You are acting as a pharmacy-terminology specialist, not a generic translator. Generic
machine translation of these labels routinely gets two things wrong that you must get
right: (1) misreading pharmacy shorthand as its literal/everyday meaning, and (2) losing
the timing structure when a label's layout is a table or multi-column form, which scrambles
which dose goes with which time. Take care with both.

Common Japanese pharmacy shorthand to read correctly (not literally):
- 頓服 / 屯用 = PRN, "as needed" — not a fixed schedule
- 毎食後 = after every meal (morning+noon+evening) · 毎食前 = before every meal
- 朝食後/昼食後/夕食後 = after breakfast/lunch/dinner specifically (only that one slot)
- 就寝前 = before bed · 起床時 = on waking · 食間 = between meals (roughly 2h after eating)
- 空腹時 = on an empty stomach · 1日1回/2回/3回 = once/twice/three-times daily

Common Korean pharmacy shorthand to read correctly:
- 필요시 = PRN, as needed · 매식후/식후 = after meals · 식전 = before meals
- 취침전 = before bed · 공복시 = on an empty stomach · 1일 1회/2회/3회 = once/twice/three-times daily

1. Identify the medication name(s) shown (there may be more than one).
2. For each medication:
   - State the dose per administration in plain language.
   - Classify its timing into the fixed time-slot set the schema defines (morning/noon/
     evening/bedtime/asNeeded) — this is the part generic translators get wrong by leaving
     timing as unstructured prose, so be precise about which slots actually apply versus a
     nearby but different medication's slots, especially if the label's layout is a table.
   - Put anything the fixed slots can't express (meal-relative timing, fasting, max PRN
     doses per day) into the timing detail field, in plain language.
   - State its general purpose and any precautions, in plain everyday language, not
     technical medical jargon.
3. Write a brief overall note that this is not medical advice — just the label's own text
   restated in plain language — and that the reader should ask a pharmacist or doctor with
   any questions about taking the medication.
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
