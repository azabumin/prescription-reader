import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';
import { COLORS, SPACING } from '../constants/theme';

type Row = { label: string; value: string };

const ROWS: Row[] = [
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
  {
    label: '動作環境',
    value: '最新のWebブラウザ（Chrome、Safari等）でご利用いただけます。',
  },
];

export default function TokushohoScreen() {
  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        ← 처방전 도우미로 돌아가기 / 処方箋ヘルパーに戻る
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>特定商取引法に基づく表記</Text>
        <Text style={s.muted}>最終更新日: 2026年8月</Text>

        <View style={rowStyles.table}>
          {ROWS.map((row) => (
            <View key={row.label} style={rowStyles.row}>
              <Text style={rowStyles.label}>{row.label}</Text>
              <Text style={rowStyles.value}>{row.value}</Text>
            </View>
          ))}
        </View>
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
