import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';
import { COLORS, SPACING } from '../constants/theme';
import { BRAND } from '../lib/seo';

// Public page for pharmacies (indexable): what plans A / B / A+B do. Japanese only, whatever language the app is set
// to. Describes only what is live in app/pharmacy/plan.tsx + check.tsx (lib/pharmacyPlan.ts). No prices yet.

const CONTACT_EMAIL = 'azabumin@gmail.com'; // same as app/tokushoho.tsx
const CONTACT_TEL = '080-3155-5076';
const MAIL_SUBJECT = encodeURIComponent(`${BRAND}（薬局向け）について`);

// 検証研究の協力薬局募集（2026-11-28 追加）. Terms confirmed by the owner on 2026-11-23; the form is the owner's
// Google Form (16 questions). Remove or rewrite this block once the study period is over.
const STUDY_FORM_URL = 'https://forms.gle/AKiL1WFNqMc2YDPt9';
const STUDY_TERMS: string[] = [
  '期間：2026年12月14日（月）〜2027年1月31日（日）',
  '募集：先着5薬局（定員に達したあとは、順番待ちとしてご連絡します）',
  '費用：検証期間中はかかりません。期間が終わっても、自動で有料になることはありません。',
  'お願いしたいこと：週1回の簡単な記録（3分ほど）と、終了時に15分ほどのお話',
];

type Plan = { heading: string; lead: string; points: string[] };

const PLANS: Plan[] = [
  {
    heading: 'プランA　窓口の処方箋チェック',
    lead: '在庫・欠品・出荷調整の確認に使います。',
    points: [
      '窓口で受けた処方箋を、受付のタブレットで撮影するか、スキャナで取り込みます（2枚まで）。',
      'AIが薬の名前を読み取り、薬局の在庫CSVと照合して「在庫あり／不足／在庫なし」を表示します。',
      '厚生労働省の公表データにもとづき、「限定出荷」「供給停止」の薬も表示します（内服薬が対象）。',
      'AIで読み取る前に、患者さんに了承を確認する手順があります。',
      '処方箋の画像は、薬の読み取りのためだけに米国のAIサービスに送ります。画像も読み取り結果も保存しません。',
    ],
  },
  {
    heading: 'プランB　外国籍の患者さんの初回問診',
    lead: '患者さんが記入した初回問診を、薬局では日本語で確認できます。使い方は2通りです。',
    points: [
      '① QRコードから送信：患者さんが窓口のQRコードから、処方箋の写真と初回問診の答えを送ります（患者さんの登録は不要）。薬局の受付画面に日本語の問診票で届き、返信できます。',
      '② 「薬局で見せるメモ」：患者さんが、アレルギーや持病、飲んでいるお薬などを入力したメモ画面を窓口で見せます。内容は日本語で表示されます。この方法では何も送信されません。',
      '薬局からの返信は、患者さんが選んだ言語に翻訳されて届きます。',
      '窓口に置くQRコードのチラシは、受付画面から印刷できます。',
      'プランBには、薬の読み取りと在庫照合はありません。',
    ],
  },
  {
    heading: 'プランA+B　AとBの両方',
    lead: 'AとBの機能を、1つの受付画面で使います。',
    points: ['患者さんから送られてきた処方箋も、AIが薬を読み取り、在庫CSVと照合します。'],
  },
];

const COMMON: string[] = [
  'レセコンのPCではなく、受付のPC・タブレットのブラウザで使います。',
  '在庫CSVはブラウザの中だけで照合し、サーバーには送りません。',
  'AIの読み取りと照合の結果は参考情報です。調剤・疑義照会などの判断は、薬剤師が処方箋の原本で行ってください。',
  '患者さんから届いたデータは、受付画面で「完了」にした時点、または7日後に削除されます。',
  'プランは、あとから受付画面でいつでも変更できます。',
];

const STEPS: string[] = [
  '下記のお問い合わせ先にご連絡ください。',
  '薬局用の登録リンクをお送りします。パスワードを設定して、受付画面にログインします。',
  '最初のログインで、A・B・A+Bの中からプランを選びます。',
];

const LANGS = '日本語・英語・中国語・韓国語・ベトナム語・インドネシア語・タガログ語・タイ語・ミャンマー語・ネパール語・ポルトガル語';

function Bullets({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  return (
    <View style={st.list}>
      {items.map((item, i) => (
        <Text key={i} style={[s.body, st.item]}>
          {numbered ? `${i + 1}. ` : /^[①②]/.test(item) ? '' : '・'}
          {item}
        </Text>
      ))}
    </View>
  );
}

function H2({ children }: { children: string }) {
  return (
    <Text style={st.h2} role="heading" aria-level={2}>
      {children}
    </Text>
  );
}

export default function ForPharmacyScreen() {
  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        ← {BRAND}に戻る
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle} role="heading">
          <Text style={st.brand}>
            {BRAND}
            {'\n'}
          </Text>
          薬局の方へ
        </Text>
        <Text style={s.body}>
          {BRAND}には、患者さんにお薬の説明を表示する機能のほかに、薬局の受付で使う機能があります。使いたい機能に合わせて、A・B・A+Bの3つのプランから選べます。
        </Text>
      </View>

      <View style={[s.langBlock, st.study]}>
        <H2>検証研究の協力薬局を募集しています</H2>
        <Text style={s.body}>受付で使う機能を実際の薬局で使っていただき、使いやすさと安全性を確かめます。</Text>
        <Bullets items={STUDY_TERMS} />
        <Link href={STUDY_FORM_URL} target="_blank" rel="noopener noreferrer" style={st.cta}>
          お申し込みフォームを開く
        </Link>
        <Text style={[s.muted, st.note]}>
          Googleフォームが新しいタブで開きます。フォームには、患者さんの個人情報を入力しないでください。フォームを使わずに、下記のお問い合わせ先へご連絡いただいてもかまいません。
        </Text>
      </View>

      {PLANS.map((p) => (
        <View key={p.heading} style={s.langBlock}>
          <H2>{p.heading}</H2>
          <Text style={s.body}>{p.lead}</Text>
          <Bullets items={p.points} />
        </View>
      ))}
      <Text style={[s.muted, st.langs]}>対応言語（11言語）：{LANGS}</Text>

      <View style={s.langBlock}>
        <H2>共通のしくみ</H2>
        <Bullets items={COMMON} />
      </View>

      <View style={s.langBlock}>
        <H2>はじめ方</H2>
        <Bullets items={STEPS} numbered />
        <Text style={[s.muted, st.note]}>導入のご相談・ご利用条件についても、お気軽にお問い合わせください。</Text>
      </View>

      <View style={s.langBlock}>
        <H2>お問い合わせ</H2>
        <Text style={s.body}>運営：株式会社Priamos（{BRAND}）</Text>
        <Text style={s.body}>
          メール：
          <Link href={`mailto:${CONTACT_EMAIL}?subject=${MAIL_SUBJECT}`} style={st.link}>
            {CONTACT_EMAIL}
          </Link>
        </Text>
        <Text style={s.body}>電話：{CONTACT_TEL}</Text>
        <Link href="/tokushoho" style={[st.link, st.note]}>
          特定商取引法に基づく表記
        </Link>
      </View>

      <Text style={[s.muted, st.footer]}>
        登録済みの薬局の方：
        <Link href="/pharmacy/login" style={st.link}>
          受付画面にログイン
        </Link>
      </Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  brand: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  h2: { fontSize: 17, fontWeight: '800', color: COLORS.primaryDark, marginBottom: SPACING.xs },
  list: { marginTop: SPACING.sm, gap: SPACING.xs },
  item: { paddingLeft: 2 },
  note: { marginTop: SPACING.sm },
  langs: { marginTop: -SPACING.sm, marginBottom: SPACING.lg, paddingHorizontal: SPACING.xs },
  link: { color: COLORS.accent, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { textAlign: 'center', marginBottom: SPACING.xl },
  study: { borderColor: COLORS.primary, borderWidth: 2 },
  cta: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
