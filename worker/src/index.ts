import { canAnalyze, resolveSessionUser } from './auth';
import { handleLogin, handleLogout, handleMe, handleRequestPasswordReset, handleResetPassword, handleSignup } from './authRoutes';
import { jsonResponse } from './http';

declare global {
  interface Env {
    ANTHROPIC_API_KEY: string;
    ALLOWED_ORIGINS: string;
    PASSWORD_PEPPER: string;
    // Optional -- unset until the Resend account + DNS verification is done. See email.ts.
    RESEND_API_KEY?: string;
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
          purpose: {
            type: 'string',
            description:
              "This medication's general purpose, briefly, but ONLY if you are highly confident it matches the exact drug/formula name identified above — never the purpose of a different, more familiar-sounding drug. If not highly confident, say the exact purpose should be confirmed with the pharmacist/doctor instead of guessing.",
          },
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
  return `CRITICAL SAFETY RULE — NEVER SUBSTITUTE A DIFFERENT MEDICATION: The single most
dangerous mistake you can make is naming or describing a DIFFERENT drug than the one actually
printed on the label. This has happened before in real use: a cough suppressant
(dextromethorphan) was output as an unrelated allergy medication (desloratadine), and a Kampo
formula for sore throat (桔梗湯, kikyoto) was output as a different, unrelated formula (芍薬湯).
These are not translation nuances — they are factual substitutions that could mislead someone
about what they are taking. To prevent this:
- Read the drug/formula name on the label character by character. Do not autocomplete it to a
  more familiar-sounding drug name, even if part of the name is unclear or hard to translate.
- If you are not certain how to translate or transliterate a specific drug or Kampo formula
  name into the target language, do NOT substitute a different, better-known drug or formula
  you happen to recognize with more confidence. Instead, phonetically transliterate the
  Japanese/Korean reading into the target language's script, optionally keeping the original-
  script name in parentheses.
- Kampo (漢方) formula names are especially easy to confuse — they are multi-kanji compound
  names with no simple international equivalent. Never swap one Kampo formula for a different
  one. If you cannot translate a Kampo name with full confidence, keep its original Japanese
  reading (romanized) plus "(a traditional Japanese herbal formula)" rather than describing a
  different formula's effects.
- Before writing the "purpose" field, silently double-check: does this purpose actually match
  the specific drug/formula name you just identified — not a similarly-named or more famous
  drug? If you are not highly confident about a specific drug's real-world purpose, say so
  plainly (e.g. "this medication's exact purpose should be confirmed with the prescribing
  pharmacist or doctor") instead of stating a guessed purpose as fact. A wrong but confident-
  sounding purpose is worse than admitting uncertainty.

CRITICAL LANGUAGE RULE: The reader speaks ${targetLanguageName} and cannot read the
label's own language. Every field you output — medicationName, dosage, purpose, precaution,
timingDetail, generalNotes — must be written entirely in ${targetLanguageName}. Translate
everything; do not leave any field in the label's source language (Japanese, Korean, or
otherwise). The Japanese/Korean glossary terms quoted below are reference examples only, to
help you *read* the label correctly — they are not the language you should write in. Only a
medication's proper/brand name may stay as printed if it has no natural translation.

Analyze the photo of a prescription or medication label. The text on it may be in Japanese, Korean, or another language — read it regardless of which.

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
     technical medical jargon — but only state a purpose you are highly confident matches
     this exact drug/formula (see the safety rule above); otherwise say it should be
     confirmed with the pharmacist/doctor.
3. Write a brief overall note that this is not medical advice — just the label's own text
   restated in plain language — and that the reader should ask a pharmacist or doctor with
   any questions about taking the medication.
4. If any part of the photo is blurry or illegible, say so rather than guessing at it.

FINAL CHECK before answering: for each medication, re-read the name you are about to output
and confirm it names the SAME substance as what is printed on the label — not a different,
more familiar drug or Kampo formula. Then re-read every field and confirm it is written in
${targetLanguageName}, not in the label's own language. Write your entire response in
${targetLanguageName}, including every field. Do not mix in other languages.`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const corsHeaders = buildCorsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname}`;

    if (route === 'POST /signup') return handleSignup(request, env, corsHeaders);
    if (route === 'POST /login') return handleLogin(request, env, corsHeaders);
    if (route === 'POST /logout') return handleLogout(request, env, corsHeaders);
    if (route === 'GET /me') return handleMe(request, env, corsHeaders);
    if (route === 'POST /request-password-reset') return handleRequestPasswordReset(request, env, corsHeaders);
    if (route === 'POST /reset-password') return handleResetPassword(request, env, corsHeaders);

    if (route !== 'POST /analyze') {
      return jsonResponse({ error: 'not_found' }, 404, corsHeaders);
    }

    const sessionUser = await resolveSessionUser(request, env.DB);
    if (!sessionUser) {
      return jsonResponse({ error: 'unauthorized' }, 401, corsHeaders);
    }
    if (!canAnalyze(sessionUser)) {
      return jsonResponse({ error: 'trial_expired' }, 402, corsHeaders);
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
      const MAX_ATTEMPTS = 3;
      let analysis = await callClaude(body.image, mediaType, lang, env.ANTHROPIC_API_KEY);
      let attempts = 1;
      while (hasJapaneseLeak(analysis, lang) && attempts < MAX_ATTEMPTS) {
        console.error('language_leak_detected', { lang, attempt: attempts });
        analysis = await callClaude(body.image, mediaType, lang, env.ANTHROPIC_API_KEY);
        attempts += 1;
      }
      if (hasJapaneseLeak(analysis, lang)) {
        console.error('language_leak_unresolved', { lang, attempts });
      }
      return jsonResponse(analysis, 200, corsHeaders);
    } catch (err) {
      console.error('analysis_failed', err);
      return jsonResponse({ error: 'analysis_failed' }, 502, corsHeaders);
    }
  },
};

function buildCorsHeaders(origin: string, env: Env): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
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
      temperature: 0,
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

// Hiragana/katakana (U+3040-U+30FF) only occur in Japanese -- none of the other 10 supported
// languages legitimately produce them in prose, even Chinese (which uses kanji-like hanzi but
// not kana). So finding any in a non-Japanese-target response is a reliable signal that the
// model leaked source-language text into the translation, despite the prompt's instructions --
// a known failure mode where a heavily-Japanese label photo biases the output back toward
// Japanese. We treat it as a retryable failure rather than trusting the prompt alone.
function hasJapaneseLeak(analysis: unknown, lang: Lang): boolean {
  if (lang === 'ja' || typeof analysis !== 'object' || analysis === null) return false;
  const kana = /[぀-ヿ]/;
  const result = analysis as {
    medicationName?: unknown;
    generalNotes?: unknown;
    items?: { name?: unknown; dosage?: unknown; timingDetail?: unknown; purpose?: unknown; precaution?: unknown }[];
  };
  const fields: unknown[] = [result.medicationName, result.generalNotes];
  for (const item of result.items ?? []) {
    fields.push(item.name, item.dosage, item.timingDetail, item.purpose, item.precaution);
  }
  return fields.some((f) => typeof f === 'string' && kana.test(f));
}
