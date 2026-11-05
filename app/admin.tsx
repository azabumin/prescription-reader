import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { formatJaTime, injectPharmacyCss, ph, webData } from '../components/pharmacy/pharmacyUi';
import { COLORS } from '../constants/theme';
import {
  AdminError,
  createPharmacy,
  listFeedback,
  listPharmacies,
  loadAdminKey,
  markFeedbackRead,
  newSetupLink,
  saveAdminKey,
  setPharmacyDisabled,
  setPharmacyPlan,
  type AdminFeedback,
  type AdminPharmacy,
} from '../lib/adminApi';
import type { PharmacyPlan } from '../lib/pharmacyPlan';

const PLANS: PharmacyPlan[] = ['A', 'B', 'AB'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function copy(text: string) {
  globalThis.navigator?.clipboard?.writeText(text).catch(() => {});
}

// A link the operator hands to a pharmacy, with a copy button.
function LinkBox({ label, url }: { label: string; url: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={ph.small}>{label}</Text>
      <View style={ph.row}>
        <Text selectable style={[ph.body, { flexShrink: 1 }]}>
          {url}
        </Text>
        <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={() => copy(url)}>
          <Text style={ph.secondaryText}>コピー</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// The operator's screen (worker/src/admin.ts): register pharmacies, issue setup links, change plans, stop / restart,
// read feedback. Counts only -- no patient content. Entered with the admin key (ADMIN_TOKEN), kept in this browser.
export default function AdminScreen() {
  const [hasKey, setHasKey] = useState(() => !!loadAdminKey());
  const [keyInput, setKeyInput] = useState('');
  const [pharmacies, setPharmacies] = useState<AdminPharmacy[] | null>(null);
  const [feedback, setFeedback] = useState<AdminFeedback[] | null>(null);
  const [error, setError] = useState('');
  const [rowMsg, setRowMsg] = useState<Record<number, { text: string; url?: string; bad?: boolean }>>({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<PharmacyPlan | null>(null);
  const [created, setCreated] = useState<{ name: string; setupUrl: string; patientUrl: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    injectPharmacyCss();
  }, []);

  const fail = useCallback((e: unknown) => {
    if (e instanceof AdminError && e.status === 401) {
      setHasKey(false);
      setError('管理者キーが違います。');
    } else setError('読み込めませんでした。通信を確認してください。');
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [p, f] = await Promise.all([listPharmacies(), listFeedback()]);
      setPharmacies(p);
      setFeedback(f);
      setError('');
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  useEffect(() => {
    if (hasKey) refresh();
  }, [hasKey, refresh]);

  function enter() {
    if (!keyInput.trim()) return;
    saveAdminKey(keyInput.trim());
    setKeyInput('');
    setError('');
    setHasKey(true);
  }

  function leave() {
    saveAdminKey(null);
    setHasKey(false);
    setPharmacies(null);
    setFeedback(null);
  }

  async function register() {
    setBusy(true);
    setError('');
    try {
      const r = await createPharmacy(name.trim(), email.trim(), plan);
      setCreated({ name: name.trim(), setupUrl: r.setupUrl, patientUrl: r.patientUrl });
      setName('');
      setEmail('');
      setPlan(null);
      await refresh();
    } catch (e) {
      if (e instanceof AdminError && e.code === 'email_taken') setError('このメールアドレスの薬局は、もう登録されています。');
      else if (e instanceof AdminError && e.code === 'invalid_pharmacy') setError('薬局名とメールアドレスを確かめてください。');
      else fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function rowAction(id: number, run: () => Promise<{ text: string; url?: string }>) {
    try {
      const msg = await run();
      setRowMsg((m) => ({ ...m, [id]: msg }));
      await refresh();
    } catch (e) {
      if (e instanceof AdminError && e.code === 'open_intakes')
        setRowMsg((m) => ({ ...m, [id]: { text: `未完了の受付が ${String(e.detail.count ?? '')} 件あるため、プランAにはできません。`, bad: true } }));
      else fail(e);
    }
  }

  if (!hasKey) {
    return (
      <View style={{ flex: 1 }} {...webData({ pharmacyRoot: 'true' })}>
        <ScrollView contentContainerStyle={ph.narrow}>
          <Text style={ph.title}>運営の管理画面</Text>
          <Text style={ph.small}>管理者キーを入れてください。このブラウザに保存されます。</Text>
          <TextInput style={ph.input} value={keyInput} onChangeText={setKeyInput} secureTextEntry placeholder="管理者キー" accessibilityLabel="管理者キー" onSubmitEditing={enter} />
          {!!error && <Text style={ph.error}>{error}</Text>}
          <TouchableOpacity accessibilityRole="button" style={ph.primary} onPress={enter}>
            <Text style={ph.primaryText}>入る</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const canRegister = !!name.trim() && EMAIL_RE.test(email.trim()) && !busy;

  return (
    <View style={{ flex: 1 }} {...webData({ pharmacyRoot: 'true' })}>
      <ScrollView contentContainerStyle={ph.page}>
        <View style={[ph.row, { justifyContent: 'space-between' }]}>
          <Text style={ph.title}>運営の管理画面</Text>
          <View style={ph.row}>
            <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={refresh}>
              <Text style={ph.secondaryText}>更新</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" onPress={leave}>
              <Text style={ph.link}>このブラウザからキーを消す</Text>
            </TouchableOpacity>
          </View>
        </View>
        {!!error && <Text style={ph.error}>{error}</Text>}

        <View style={ph.card}>
          <Text style={ph.h2}>薬局を登録する</Text>
          <TextInput style={ph.input} value={name} onChangeText={setName} placeholder="薬局名" accessibilityLabel="薬局名" />
          <TextInput
            style={ph.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="ログイン用メールアドレス"
            accessibilityLabel="ログイン用メールアドレス"
          />
          <View style={ph.row}>
            <Text style={ph.small}>プラン：</Text>
            {([null, ...PLANS] as (PharmacyPlan | null)[]).map((p) => (
              <TouchableOpacity key={p ?? 'none'} accessibilityRole="radio" aria-checked={plan === p} style={[ph.chip, plan === p && ph.chipOn]} onPress={() => setPlan(p)}>
                <Text style={[ph.chipText, plan === p && ph.chipTextOn]}>{p ? `プラン${p}` : '薬局が選ぶ'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity accessibilityRole="button" aria-disabled={!canRegister} disabled={!canRegister} style={[ph.primary, { alignSelf: 'flex-start' }, !canRegister && ph.disabled]} onPress={register}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ph.primaryText}>登録する</Text>}
          </TouchableOpacity>
          {created && (
            <View style={{ gap: 8 }}>
              <Text style={ph.ok}>{created.name} を登録しました。初回設定のリンクを薬局にお送りください（14日間有効・1回限り）。</Text>
              <LinkBox label="初回設定のリンク（薬局に送る）" url={created.setupUrl} />
              <LinkBox label="患者さん用のリンク（QRチラシは薬局の受付画面から印刷できます）" url={created.patientUrl} />
            </View>
          )}
        </View>

        <Text style={ph.h2}>薬局（{pharmacies?.length ?? '…'}）</Text>
        {pharmacies === null ? (
          !error && <ActivityIndicator color={COLORS.primary} />
        ) : (
          pharmacies.map((p) => {
            const msg = rowMsg[p.id];
            return (
              <View key={p.id} style={[ph.card, p.disabled && { opacity: 0.6 }]}>
                <View style={[ph.row, { justifyContent: 'space-between' }]}>
                  <Text style={ph.h2}>
                    {p.name}
                    {p.disabled ? '　（停止中）' : ''}
                  </Text>
                  <Text style={ph.small}>
                    コード {p.code}　／　{p.email}
                  </Text>
                </View>
                <Text style={ph.body}>
                  {p.planChosen ? `プラン${p.plan}` : 'プラン未選択'}　／　登録 {formatJaTime(p.createdAt)}　／　最後のログイン {p.lastLoginAt ? formatJaTime(p.lastLoginAt) : 'なし'}
                  {!p.passwordSet && `　／　パスワード未設定${p.setupLinkValid ? '（設定リンク有効）' : '（設定リンク期限切れ）'}`}
                </Text>
                <Text style={ph.small}>
                  直近30日：患者さんからの受付 {p.sends30} 件・窓口照合 {p.checks30} 回　／　未完了の受付 {p.openIntakes} 件　／　未読のご意見 {p.unreadFeedback} 件
                  {p.lastActivityAt ? `　／　最後の利用 ${formatJaTime(p.lastActivityAt)}` : ''}
                </Text>
                <View style={ph.row}>
                  {PLANS.map((pl) => {
                    const on = p.planChosen && p.plan === pl;
                    return (
                      <TouchableOpacity
                        key={pl}
                        accessibilityRole="button"
                        style={[ph.chip, on && ph.chipOn]}
                        disabled={on}
                        onPress={() =>
                          rowAction(p.id, async () => {
                            await setPharmacyPlan(p.id, pl);
                            return { text: `プラン${pl}にしました。` };
                          })
                        }
                      >
                        <Text style={[ph.chipText, on && ph.chipTextOn]}>プラン{pl}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={ph.secondary}
                    onPress={() =>
                      rowAction(p.id, async () => ({
                        text: '新しい初回設定のリンクです（14日間有効・1回限り）。薬局にお送りください。',
                        url: (await newSetupLink(p.id)).setupUrl,
                      }))
                    }
                  >
                    <Text style={ph.secondaryText}>設定リンクを発行</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={p.disabled ? ph.secondary : ph.danger}
                    onPress={() => {
                      const ok = globalThis.confirm?.(
                        p.disabled ? `${p.name} を再開しますか？` : `${p.name} を停止しますか？ログイン中の端末も終了し、患者さんは送れなくなります。`,
                      );
                      if (ok)
                        rowAction(p.id, async () => {
                          await setPharmacyDisabled(p.id, !p.disabled);
                          return { text: p.disabled ? '再開しました。' : '停止しました。' };
                        });
                    }}
                  >
                    <Text style={p.disabled ? ph.secondaryText : ph.dangerText}>{p.disabled ? '再開する' : '停止する'}</Text>
                  </TouchableOpacity>
                </View>
                {msg && (msg.url ? <LinkBox label={msg.text} url={msg.url} /> : <Text style={msg.bad ? ph.error : ph.ok}>{msg.text}</Text>)}
              </View>
            );
          })
        )}

        <Text style={ph.h2}>ご意見（{feedback?.filter((f) => !f.read).length ?? '…'}件 未読）</Text>
        {feedback?.length === 0 && <Text style={ph.body}>まだ届いていません。</Text>}
        {feedback?.map((f) => (
          <View key={f.id} style={[ph.card, !f.read && { borderLeftWidth: 6, borderLeftColor: COLORS.primary }]}>
            <View style={[ph.row, { justifyContent: 'space-between' }]}>
              <Text style={ph.h2}>
                {f.pharmacyName}（プラン{f.plan}）
              </Text>
              <Text style={ph.small}>{formatJaTime(f.createdAt)}</Text>
            </View>
            <Text style={ph.body}>{f.body}</Text>
            {!f.read && (
              <TouchableOpacity accessibilityRole="button" style={[ph.secondary, { alignSelf: 'flex-start' }]} onPress={() => markFeedbackRead(f.id).then(refresh, fail)}>
                <Text style={ph.secondaryText}>既読にする</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
