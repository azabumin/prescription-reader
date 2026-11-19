import Head from 'expo-router/head';
import { usePathname } from 'expo-router';

import { seoForPath } from '../lib/seo';

// Per-route <title>, description, canonical and Open Graph tags. Mounted once in
// app/_layout.tsx; written into each page's static HTML at export time.
export default function SeoHead() {
  const seo = seoForPath(usePathname() || '/');
  return (
    <Head>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      {seo.index ? <link rel="canonical" href={seo.url} /> : <meta name="robots" content="noindex" />}
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={seo.url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
    </Head>
  );
}
