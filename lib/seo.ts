// Search-engine metadata, emitted at build time by app/+html.tsx (site-wide) and
// components/SeoHead.tsx (per route). The site's search language is Japanese, whatever
// language a visitor later picks in the app.

export const SITE_URL = 'https://rxhelper.jp';
export const BRAND = '処方箋ヘルパー';
export const BRAND_ALT_NAMES = ['処方せんヘルパー', 'RXHelper', 'rxhelper'];
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// Google Search Console "HTML tag" verification: paste only the content="..." value here,
// then rebuild + deploy. Empty = no tag is emitted.
export const GOOGLE_SITE_VERIFICATION = '';

const HOME_TITLE = `${BRAND}｜処方箋・お薬の説明を11言語で`;
const HOME_DESCRIPTION =
  `${BRAND}は、処方箋やお薬の袋を撮影するだけで、お薬の名前・飲み方・注意点をわかりやすく説明するウェブアプリです。` +
  '英語・中国語・韓国語・ベトナム語・ネパール語など11言語の多言語（多国語）に対応しています。';

export type PageSeo = {
  title: string;
  description: string;
  /** false = <meta name="robots" content="noindex">, no canonical, left out of sitemap.xml */
  index: boolean;
};

const PAGES: Record<string, Omit<PageSeo, 'description'> & { description?: string }> = {
  '/': { title: HOME_TITLE, description: HOME_DESCRIPTION, index: true },
  '/about': {
    title: `${BRAND}について｜11言語でお薬を説明するアプリ`,
    description:
      `${BRAND}のしくみと制作者について。処方箋やお薬の袋の写真から、AIがお薬の名前・飲み方・注意点を多言語でわかりやすく整理します。`,
    index: true,
  },
  '/pharmacy-card': {
    title: `薬局で見せるメモ｜${BRAND}`,
    description:
      'アレルギー・持病・妊娠や授乳・飲んでいるお薬などを入力すると、薬剤師さんに見せられる日本語のメモになります。11言語で入力できます。',
    index: true,
  },
  '/privacy': { title: `プライバシーポリシー｜${BRAND}`, description: `${BRAND}のプライバシーポリシーです。`, index: true },
  '/terms': { title: `利用規約｜${BRAND}`, description: `${BRAND}の利用規約です。`, index: true },
  '/tokushoho': {
    title: `特定商取引法に基づく表記｜${BRAND}`,
    description: `${BRAND}の特定商取引法に基づく表記です。`,
    index: true,
  },
  '/login': { title: `ログイン｜${BRAND}`, index: true },
  '/signup': { title: `新規登録｜${BRAND}`, index: true },
  '/forgot-password': { title: `パスワードの再設定｜${BRAND}`, index: false },
  '/reset-password': { title: `パスワードの再設定｜${BRAND}`, index: false },
  '/history': { title: `記録｜${BRAND}`, index: false },
  '/account': { title: `マイページ｜${BRAND}`, index: false },
  '/subscribe': { title: `お支払い｜${BRAND}`, index: false },
  '/payment-result': { title: `お支払い結果｜${BRAND}`, index: false },
  '/send': { title: `薬局に送る｜${BRAND}`, index: false },
  '/sent': { title: `送信済み｜${BRAND}`, index: false },
  '/admin': { title: `管理画面｜${BRAND}`, index: false },
};

/** Pages listed in public/sitemap.xml (keep the two in sync). */
export const SITEMAP_PATHS = Object.keys(PAGES).filter(
  (p) => PAGES[p].index && p !== '/login' && p !== '/signup'
);

export function seoForPath(pathname: string): PageSeo & { url: string } {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  const url = path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
  // Pharmacy-side console (/pharmacy, /pharmacy/*) -- not for patients' searches.
  if (path === '/pharmacy' || path.startsWith('/pharmacy/')) {
    return { title: `薬局向け｜${BRAND}`, description: HOME_DESCRIPTION, index: false, url };
  }
  const page = PAGES[path];
  if (!page) return { title: BRAND, description: HOME_DESCRIPTION, index: false, url };
  return { ...page, description: page.description ?? HOME_DESCRIPTION, url };
}
