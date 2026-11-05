import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ph } from '../../components/pharmacy/pharmacyUi';
import { COLORS } from '../../constants/theme';
import { getMe, loadSession, PharmacyApiError, PharmacyAuthError, setPlan } from '../../lib/pharmacyApi';
import { PLAN_INFO, type PharmacyPlan } from '../../lib/pharmacyPlan';

const PLANS: PharmacyPlan[] = ['A', 'B', 'AB'];

// The pharmacy picks which functions it uses: shown first after the first login (plan not chosen yet), and from the
// home screen's 「プラン」 link whenever it wants to change. Only the chosen plan's functions appear on the home screen.
export default function PharmacyPlanScreen() {
  const router = useRouter();
  const session = loadSession();
  const [current, setCurrent] = useState<PharmacyPlan | null>(null);
  const [chosenBefore, setChosenBefore] = useState(true);
  const [selected, setSelected] = useState<PharmacyPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      router.replace('/pharmacy/login');
      return;
    }
    getMe()
      .then((me) => {
        setChosenBefore(me.planChosen);
        if (me.planChosen) {
          setCurrent(me.plan);
          setSelected(me.plan);
        }
      })
      .catch((e) => {
        if (e instanceof PharmacyAuthError) router.replace('/pharmacy/login');
        else setError('読み込めませんでした。通信を確認してください。');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await setPlan(selected);
      router.replace('/pharmacy');
    } catch (e) {
      if (e instanceof PharmacyAuthError) router.replace('/pharmacy/login');
      else if (e instanceof PharmacyApiError && e.code === 'open_intakes')
        setError(
          `まだ完了していない受付が ${String(e.detail.count ?? '')} 件あります。プランAには受信箱がないため、先に受付を「完了」にしてから変更してください。`,
        );
      else setError('保存できませんでした。通信を確認して、もう一度お試しください。');
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;
  const unchanged = chosenBefore && selected === current;
  const canSave = !!selected && !unchanged && !busy;

  return (
    <ScrollView contentContainerStyle={[ph.page, { maxWidth: 760 }]}>
      <Text style={ph.title}>{chosenBefore ? 'プランの変更' : 'プランを選んでください'}</Text>
      <Text style={ph.body}>
        この薬局で使う機能を、次の3つから選んでください。選んだプランの機能だけが受付画面に表示されます。プランは、あとからいつでも変えられます。
      </Text>

      {PLANS.map((p) => {
        const on = selected === p;
        return (
          <TouchableOpacity
            key={p}
            accessibilityRole="radio"
            aria-checked={on}
            style={[ph.card, { borderWidth: 2, borderColor: on ? COLORS.primary : 'transparent' }]}
            onPress={() => setSelected(p)}
          >
            <View style={[ph.row, { justifyContent: 'space-between' }]}>
              <Text style={ph.h2}>
                {on ? '● ' : '○ '}
                {PLAN_INFO[p].name}
              </Text>
              {current === p && <Text style={ph.ok}>現在のプラン</Text>}
            </View>
            <Text style={ph.body}>{PLAN_INFO[p].does}</Text>
            <Text style={ph.small}>{PLAN_INFO[p].note}</Text>
          </TouchableOpacity>
        );
      })}

      <Text style={ph.small}>
        AIの読み取りと照合の結果は参考情報です。調剤・疑義照会などの判断は、処方箋の原本で行ってください。
      </Text>
      {!!error && <Text style={ph.error}>{error}</Text>}

      <View style={ph.row}>
        <TouchableOpacity
          accessibilityRole="button"
          aria-disabled={!canSave}
          disabled={!canSave}
          style={[ph.primary, !canSave && ph.disabled]}
          onPress={save}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={ph.primaryText}>{chosenBefore ? 'このプランに変更する' : 'このプランで始める'}</Text>
          )}
        </TouchableOpacity>
        {chosenBefore && (
          <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/pharmacy')}>
            <Text style={ph.link}>変更せずに戻る</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
