import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { formatJaTime, ph, STATUS_JA } from '../../components/pharmacy/pharmacyUi';
import { StockCsvPanel } from '../../components/pharmacy/StockCsvPanel';
import { COLORS } from '../../constants/theme';
import { getMe, listIntakes, loadSession, logoutPharmacy, PharmacyAuthError, type InboxItem } from '../../lib/pharmacyApi';
import { LANG_NAME_JA } from '../../lib/pharmacyCardStrings';
import { hasIntake, hasStockCheck, type PharmacyPlan } from '../../lib/pharmacyPlan';
import { SEND_STRINGS } from '../../lib/sendStrings';

const REFRESH_MS = 30_000;
const DRUGS_JA = { pending: 'AI読み取り中', done: 'AI読み取り済み', failed: 'AI読み取り失敗（写真で確認）', skipped: '薬の読み取りなし' } as const;

// The pharmacy's home screen, laid out by plan (lib/pharmacyPlan.ts):
//   A  -> walk-in check + stock CSV,  B -> inbox of patient sends,  AB -> both.
// The plan is re-read from the server on every refresh, so an operator's change shows up without logging in again.
export default function PharmacyHomeScreen() {
  const router = useRouter();
  const session = loadSession();
  const [plan, setPlan] = useState<PharmacyPlan | null>(session?.pharmacy.plan ?? null);
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [error, setError] = useState('');
  const [newCount, setNewCount] = useState(0);
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!session) router.replace('/pharmacy/login');
  }, [session, router]);

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      setPlan(me.plan);
      if (hasIntake(me.plan)) {
        const list = await listIntakes();
        if (known.current) {
          const fresh = list.filter((i) => !known.current!.has(i.id)).length;
          if (fresh > 0) setNewCount((n) => n + fresh);
        }
        known.current = new Set(list.map((i) => i.id));
        setItems(list);
      }
      setError('');
    } catch (e) {
      if (e instanceof PharmacyAuthError) router.replace('/pharmacy/login');
      else setError('読み込めませんでした。通信を確認してください。');
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      if (!loadSession()) return;
      refresh();
      const timer = setInterval(refresh, REFRESH_MS);
      return () => clearInterval(timer);
    }, [refresh]),
  );

  async function logout() {
    await logoutPharmacy().catch(() => {});
    router.replace('/pharmacy/login');
  }

  if (!session) return null;

  return (
    <ScrollView contentContainerStyle={ph.page}>
      <View style={[ph.row, { justifyContent: 'space-between' }]}>
        <View>
          <Text style={ph.title}>{plan === 'A' ? '窓口の処方箋チェック' : '届いた処方箋'}</Text>
          <Text style={ph.small}>{session.pharmacy.name}</Text>
        </View>
        <View style={ph.row}>
          <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={refresh}>
            <Text style={ph.secondaryText}>更新</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={logout}>
            <Text style={ph.link}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!error && <Text style={ph.error}>{error}</Text>}
      {plan === null && !error && <ActivityIndicator color={COLORS.primary} />}

      {plan && hasStockCheck(plan) && (
        <View style={ph.card}>
          <Text style={ph.h2}>窓口で受けた処方箋の在庫照合</Text>
          <Text style={ph.small}>処方箋を撮影するか、スキャンした画像を選ぶと、AIが薬の名前を読み取り、在庫CSVと照合します。</Text>
          <TouchableOpacity accessibilityRole="button" style={[ph.primary, { alignSelf: 'flex-start' }]} onPress={() => router.push('/pharmacy/check')}>
            <Text style={ph.primaryText}>窓口の処方箋を照合する</Text>
          </TouchableOpacity>
        </View>
      )}

      {plan && hasStockCheck(plan) && <StockCsvPanel />}

      {plan && hasIntake(plan) && (
        <>
          {plan === 'AB' && <Text style={[ph.h2, { marginTop: 8 }]}>患者さんから届いた処方箋</Text>}
          {newCount > 0 && (
            <TouchableOpacity accessibilityRole="button" style={[ph.card, { backgroundColor: '#FFF6E5' }]} onPress={() => setNewCount(0)}>
              <Text style={ph.ok}>新しい受付が {newCount} 件あります（タップで消す）</Text>
            </TouchableOpacity>
          )}
          {items === null ? (
            !error && <ActivityIndicator color={COLORS.primary} />
          ) : items.length === 0 ? (
            <Text style={ph.body}>まだ届いていません。患者さんが窓口のQRコードから送ると、ここに表示されます。</Text>
          ) : (
            items.map((it) => (
              <TouchableOpacity
                key={it.id}
                accessibilityRole="button"
                style={[ph.card, !it.opened && { borderLeftWidth: 6, borderLeftColor: COLORS.primary }, it.status === 'done' && { opacity: 0.6 }]}
                onPress={() => router.push({ pathname: '/pharmacy/intake', params: { id: it.id } })}
              >
                <View style={[ph.row, { justifyContent: 'space-between' }]}>
                  <Text style={ph.h2}>
                    {formatJaTime(it.createdAt)}　{LANG_NAME_JA[it.lang]}
                    {!it.opened && '　●未読'}
                  </Text>
                  <Text style={ph.ok}>{STATUS_JA[it.status]}</Text>
                </View>
                <Text style={ph.small}>
                  受け取り希望：{SEND_STRINGS.ja.pickup[it.pickup]}
                  {hasStockCheck(plan) ? `　／　${DRUGS_JA[it.drugsStatus]}` : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
          <Text style={ph.small}>受付のデータは「完了」を押すとすぐに、押さなくても7日で自動的に削除されます。</Text>
        </>
      )}

      {plan === 'A' && <Text style={ph.small}>窓口照合の画像と読み取り結果は保存しません。在庫CSVはこのブラウザの中だけで使います。</Text>}
    </ScrollView>
  );
}
