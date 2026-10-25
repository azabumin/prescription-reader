import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ph } from '../../components/pharmacy/pharmacyUi';
import { PharmacyApiError, setupPharmacy } from '../../lib/pharmacyApi';

// First-time setup from the link the operator sends (…/pharmacy/setup?code=<薬局コード>&s=<設定コード>):
// the pharmacy chooses its own password. The link works once and for 14 days.
export default function PharmacySetupScreen() {
  const params = useLocalSearchParams<{ code?: string; s?: string }>();
  const code = typeof params.code === 'string' ? params.code : '';
  const setupCode = typeof params.s === 'string' ? params.s : '';
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = !!code && !!setupCode && password.length >= 8 && confirm === password && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await setupPharmacy(code, setupCode, password);
      router.replace('/pharmacy/login');
    } catch (e) {
      const c = e instanceof PharmacyApiError ? e.code : 'server';
      setError(
        c === 'invalid_setup'
          ? 'このリンクは使えません（使用済み、または期限切れ）。運営にお問い合わせください。'
          : c === 'weak_password'
            ? 'パスワードは8文字以上にしてください。'
            : '設定できませんでした。時間をおいて、もう一度お試しください。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={ph.narrow}>
      <Text style={ph.title}>初回設定（パスワード）</Text>
      {!code || !setupCode ? (
        <Text style={ph.error}>リンクが正しくありません。届いたリンクをそのまま開いてください。</Text>
      ) : (
        <>
          <Text style={ph.body}>この薬局の受信画面に入るためのパスワードを決めてください（8文字以上）。運営はこのパスワードを知りません。</Text>
          <TextInput style={ph.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="パスワード" accessibilityLabel="パスワード" />
          {tooShort && <Text style={ph.error}>8文字以上にしてください</Text>}
          <TextInput style={ph.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="もう一度入力" accessibilityLabel="パスワード（確認）" />
          {mismatch && <Text style={ph.error}>同じパスワードを入力してください</Text>}
          {!!error && <Text style={ph.error}>{error}</Text>}
          <TouchableOpacity accessibilityRole="button" aria-disabled={!canSubmit} disabled={!canSubmit} style={[ph.primary, !canSubmit && ph.disabled]} onPress={submit}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ph.primaryText}>設定する</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}
