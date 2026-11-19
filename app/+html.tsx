import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

import { LANGUAGES } from '../types';
import { BRAND, BRAND_ALT_NAMES, GOOGLE_SITE_VERIFICATION, OG_IMAGE, SITE_URL } from '../lib/seo';

// Root HTML for the static web export (build time only, never runs in the browser).
// Same head as Expo's default template, plus lang="ja" and the site-wide search metadata.
// Per-route title/description/canonical come from components/SeoHead.tsx.

const JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND,
    alternateName: BRAND_ALT_NAMES,
    url: `${SITE_URL}/`,
    inLanguage: 'ja',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: BRAND,
    alternateName: BRAND_ALT_NAMES,
    url: `${SITE_URL}/`,
    description:
      '処方箋やお薬の袋を撮影すると、お薬の名前・飲み方・注意点を11言語でわかりやすく説明するウェブアプリ。',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    inLanguage: LANGUAGES.map((l) => l.code),
    image: OG_IMAGE,
  },
];

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {GOOGLE_SITE_VERIFICATION ? (
          <meta name="google-site-verification" content={GOOGLE_SITE_VERIFICATION} />
        ) : null}
        <meta property="og:site_name" content={BRAND} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
