import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { ph } from '../../components/pharmacy/pharmacyUi';
import { loginPharmacy, PharmacyApiError } from '../../lib/pharmacyApi';

export default function PharmacyLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = email.trim().length > 0 && password.length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await loginPharmacy(email.trim(), password);
      router.replace('/pharmacy');
    } catch (e) {
      const c = e instanceof PharmacyApiError ? e.code : 'server';
      setError(
        c === 'invalid_credentials'
          ? 'メールアドレスかパスワードが違います。'
          : c === 'rate_limited'
            ? '試行回数が多すぎます。明日もう一度お試しください。'
            : 'ログインできませんでした。時間をおいて、もう一度お試しください。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={ph.narrow}>
      <Text style={ph.title}>薬局の受信画面　ログイン</Text>
      <Text style={ph.small}>レセコンとは別の、受付用のパソコンかタブレットでお使いください。</Text>
      <TextInput
        style={ph.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        placeholder="メールアドレス"
        accessibilityLabel="メールアドレス"
      />
      <TextInput style={ph.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="パスワード" accessibilityLabel="パスワード" onSubmitEditing={submit} />
      {!!error && <Text style={ph.error}>{error}</Text>}
      <TouchableOpacity accessibilityRole="button" aria-disabled={!canSubmit} disabled={!canSubmit} style={[ph.primary, !canSubmit && ph.disabled]} onPress={submit}>
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ph.primaryText}>ログイン</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
