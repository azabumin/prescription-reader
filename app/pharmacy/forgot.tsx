import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { ph } from '../../components/pharmacy/pharmacyUi';
import { forgotPassword, PharmacyApiError } from '../../lib/pharmacyApi';

// "Forgot password": the login address gets a one-hour link to the setup screen. The screen says the same thing
// whether or not the address is registered.
export default function PharmacyForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setError(
        e instanceof PharmacyApiError && e.code === 'rate_limited'
          ? '試行回数が多すぎます。明日もう一度お試しください。'
          : '送れませんでした。時間をおいて、もう一度お試しください。',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={ph.narrow}>
      <Text style={ph.title}>パスワードを忘れた方</Text>
      {sent ? (
        <>
          <Text style={ph.body}>
            登録のメールアドレスであれば、パスワードを設定し直すリンクを送りました。リンクは1時間有効です。メールのリンクを開いて、新しいパスワードを決めてください。
          </Text>
          <Text style={ph.small}>メールが届かないときは、迷惑メールのフォルダもご確認ください。それでも届かない場合は、運営にご連絡ください。</Text>
        </>
      ) : (
        <>
          <Text style={ph.body}>ログインに使っているメールアドレスを入れてください。パスワードを設定し直すリンクを、そのアドレスに送ります。</Text>
          <TextInput
            style={ph.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="メールアドレス"
            accessibilityLabel="メールアドレス"
            onSubmitEditing={submit}
          />
          {!!error && <Text style={ph.error}>{error}</Text>}
          <TouchableOpacity accessibilityRole="button" aria-disabled={!canSubmit} disabled={!canSubmit} style={[ph.primary, !canSubmit && ph.disabled]} onPress={submit}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ph.primaryText}>リンクを送る</Text>}
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/pharmacy/login')}>
        <Text style={ph.link}>ログイン画面に戻る</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
