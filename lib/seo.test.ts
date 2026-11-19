import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { SITEMAP_PATHS, seoForPath } from './seo';

describe('seo', () => {
  it('public/sitemap.xml lists exactly the indexable pages', () => {
    const xml = readFileSync(join(__dirname, '..', 'public', 'sitemap.xml'), 'utf8');
    const locs = [...xml.matchAll(/<loc>https:\/\/rxhelper\.jp(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
    expect(locs.sort()).toEqual([...SITEMAP_PATHS].sort());
  });

  it('home has the brand title and a canonical URL', () => {
    const s = seoForPath('/');
    expect(s.title.startsWith('処方箋ヘルパー')).toBe(true);
    expect(s.description).toContain('多言語');
    expect(s.index).toBe(true);
    expect(s.url).toBe('https://rxhelper.jp/');
  });

  it('pharmacy console and account pages are noindex, the patient memo is not', () => {
    expect(seoForPath('/pharmacy').index).toBe(false);
    expect(seoForPath('/pharmacy/intake').index).toBe(false);
    expect(seoForPath('/account').index).toBe(false);
    expect(seoForPath('/pharmacy-card').index).toBe(true);
    expect(seoForPath('/about/').url).toBe('https://rxhelper.jp/about');
  });
});
