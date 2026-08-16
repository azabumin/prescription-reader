import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';
import { COLORS, SPACING } from '../constants/theme';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

// This page's content only has copy written for these three languages. A user who picked one
// of the other 8 (vi/zh/id/tl/th/my/ne/pt) sees English here rather than a language they didn't
// pick. The back link above the card still uses the full STRINGS table, so it's always correct.
type ContentLang = 'ja' | 'ko' | 'en';
const CONTENT_LANGS: ContentLang[] = ['ja', 'ko', 'en'];

function resolveContentLang(lang: Lang): ContentLang {
  return (CONTENT_LANGS as string[]).includes(lang) ? (lang as ContentLang) : 'en';
}

type Row = { label: string; value: string };

const CONTENT: Record<ContentLang, { title: string; updated: string; rows: Row[]; note?: string }> = {
  ja: {
    title: '特定商取引法に基づく表記',
    updated: '最終更新日: 2026年8月',
    rows: [
      { label: '販売業者', value: '株式会社PRIAMOS' },
      { label: '運営統括責任者', value: '代表取締役　閔鐘基' },
      { label: '所在地', value: '東京都江戸川区西葛西8-15-6-703' },
      { label: '電話番号', value: '080-3155-5076' },
      { label: 'メールアドレス', value: 'azabumin@gmail.com' },
      { label: '販売価格', value: '月額プラン ¥480（税込）\n年額プラン ¥3,600（税込）' },
      {
        label: '商品代金以外の必要料金',
        value: 'インターネット接続料金など、通信に関する費用はお客様のご負担となります。',
      },
      { label: 'お支払い方法', value: 'クレジットカード決済（ZEUS決済代行）' },
      {
        label: 'お支払い時期',
        value: 'ご登録時に決済され、以降は毎月自動更新（自動課金）となります。',
      },
      { label: 'サービス提供時期', value: 'お支払い完了後、直ちにご利用いただけます。' },
      {
        label: '返品・キャンセルについて',
        value:
          'デジタルサービスの性質上、お支払い済みの料金の返金は原則としてお受けしておりません。次回の自動更新の停止（解約）はいつでもマイページから手続きいただけます。解約後も、お支払い済みの期間の終了日まで引き続きサービスをご利用いただけます。',
      },
      { label: '動作環境', value: '最新のWebブラウザ（Chrome、Safari等）でご利用いただけます。' },
    ],
  },
  ko: {
    title: '특정상거래법에 따른 표기',
    updated: '최종 수정일: 2026년 8월',
    rows: [
      { label: '판매업자', value: '株式会社PRIAMOS (주식회사 PRIAMOS)' },
      { label: '운영총괄책임자', value: '대표이사 민종기 (閔鐘基)' },
      { label: '소재지', value: '東京都江戸川区西葛西8-15-6-703 (일본 도쿄도 에도가와구 니시카사이)' },
      { label: '전화번호', value: '080-3155-5076' },
      { label: '이메일 주소', value: 'azabumin@gmail.com' },
      { label: '판매가격', value: '월간 플랜 ¥480 (세금 포함)\n연간 플랜 ¥3,600 (세금 포함)' },
      {
        label: '상품대금 이외 필요 요금',
        value: '인터넷 접속료 등 통신 관련 비용은 고객님 부담입니다.',
      },
      { label: '결제 방법', value: '신용카드 결제 (ZEUS 결제대행)' },
      {
        label: '결제 시기',
        value: '등록 시 결제되며, 이후 매월 자동으로 갱신(자동 결제)됩니다.',
      },
      { label: '서비스 제공 시기', value: '결제 완료 후 즉시 이용하실 수 있습니다.' },
      {
        label: '환불·해지 안내',
        value:
          '디지털 서비스의 특성상, 이미 결제하신 요금은 원칙적으로 환불해 드리지 않습니다. 다음 자동 갱신 중지(해지)는 마이페이지에서 언제든지 신청하실 수 있습니다. 해지 후에도 이미 결제하신 기간의 종료일까지는 계속 서비스를 이용하실 수 있습니다.',
      },
      { label: '동작 환경', value: '최신 웹 브라우저(Chrome, Safari 등)에서 이용하실 수 있습니다.' },
    ],
    note: '※ 본 페이지는 일본 특정상거래법에 따른 법정 고지사항입니다. 원문(일본어)이 법적 효력을 가지며, 이 번역은 참고용으로 제공됩니다.',
  },
  en: {
    title: 'Notice Under Japan’s Act on Specified Commercial Transactions',
    updated: 'Last updated: August 2026',
    rows: [
      { label: 'Business Name', value: 'PRIAMOS Co., Ltd. (株式会社 PRIAMOS)' },
      { label: 'Responsible Officer', value: 'Jong-gi Min, Representative Director (閔鐘基)' },
      { label: 'Address', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'Phone Number', value: '080-3155-5076' },
      { label: 'Email Address', value: 'azabumin@gmail.com' },
      { label: 'Price', value: 'Monthly Plan ¥480 (tax included)\nAnnual Plan ¥3,600 (tax included)' },
      {
        label: 'Additional Fees',
        value: 'Internet connection charges and other communication costs are the customer’s responsibility.',
      },
      { label: 'Payment Method', value: 'Credit card (processed via ZEUS)' },
      {
        label: 'Payment Timing',
        value: 'Charged at the time of registration; thereafter renews automatically every month (auto-billing).',
      },
      { label: 'Service Delivery Timing', value: 'The service is available immediately after payment is completed.' },
      {
        label: 'Refunds & Cancellation',
        value:
          'Due to the nature of digital services, fees already paid are not refundable in principle. You may stop the next automatic renewal (cancel) at any time from My Page. Even after cancellation, you can continue using the service until the end of the period you already paid for.',
      },
      { label: 'System Requirements', value: 'Available on the latest web browsers (Chrome, Safari, etc.).' },
    ],
    note: '※ This page is a legal disclosure required under Japan’s Act on Specified Commercial Transactions. The Japanese original is the legally binding version; this translation is provided for convenience only.',
  },
};

export default function TokushohoScreen() {
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved) setLang(saved);
    });
  }, []);
  const content = CONTENT[resolveContentLang(lang)];

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        {STRINGS[lang].backToApp}
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>{content.title}</Text>
        <Text style={s.muted}>{content.updated}</Text>

        <View style={rowStyles.table}>
          {content.rows.map((row) => (
            <View key={row.label} style={rowStyles.row}>
              <Text style={rowStyles.label}>{row.label}</Text>
              <Text style={rowStyles.value}>{row.value}</Text>
            </View>
          ))}
        </View>

        {content.note && <Text style={[s.muted, { marginTop: SPACING.md }]}>{content.note}</Text>}
      </View>
    </ScrollView>
  );
}

const rowStyles = StyleSheet.create({
  table: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  label: {
    width: 150,
    flexShrink: 0,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  value: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.text,
    lineHeight: 20,
  },
});
