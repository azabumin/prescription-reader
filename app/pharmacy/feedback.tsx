import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ph } from '../../components/pharmacy/pharmacyUi';
import { loadSession, PharmacyApiError, PharmacyAuthError, sendFeedback } from '../../lib/pharmacyApi';

const MAX_CHARS = 2000; // worker/src/intake/feedback.ts

// Feedback to the operator from the console (stored for the admin screen and mailed to the operator).
export default function PharmacyFeedbackScreen() {
  const router = useRouter();
  const session = loadSession();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const length = text.trim().length;
  const canSubmit = length > 0 && length <= MAX_CHARS && !busy;

  useEffect(() => {
    if (!session) router.replace('/pharmacy/login');
  }, [session, router]);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      await sendFeedback(text.trim());
      setSent(true);
      setText('');
    } catch (e) {
      if (e instanceof PharmacyAuthError) router.replace('/pharmacy/login');
      else
        setError(
          e instanceof PharmacyApiError && e.code === 'rate_limited'
            ? '今日はこれ以上送れません。明日またお送りください。'
            : '送れませんでした。通信を確認して、もう一度お試しください。',
        );
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  return (
    <ScrollView contentContainerStyle={[ph.page, { maxWidth: 760 }]}>
      <View style={[ph.row, { justifyContent: 'space-between' }]}>
        <Text style={ph.title}>ご意見を送る</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/pharmacy')}>
          <Text style={ph.link}>受付画面に戻る</Text>
        </TouchableOpacity>
      </View>
      <Text style={ph.body}>使いにくい点、実際の窓口の流れに合わない点、ほしい機能など、何でもお聞かせください。運営に届きます。</Text>
      <Text style={ph.error}>患者さんの氏名など、個人が分かることは書かないでください。</Text>
      {sent && <Text style={ph.ok}>送りました。ありがとうございます。</Text>}
      <TextInput
        style={[ph.input, { minHeight: 180, textAlignVertical: 'top' }]}
        value={text}
        onChangeText={(t) => {
          setText(t);
          setSent(false);
        }}
        multiline
        placeholder="ご意見"
        accessibilityLabel="ご意見"
      />
      <Text style={length > MAX_CHARS ? ph.error : ph.small}>
        {length} / {MAX_CHARS}文字
      </Text>
      {!!error && <Text style={ph.error}>{error}</Text>}
      <TouchableOpacity
        accessibilityRole="button"
        aria-disabled={!canSubmit}
        disabled={!canSubmit}
        style={[ph.primary, { alignSelf: 'flex-start' }, !canSubmit && ph.disabled]}
        onPress={submit}
      >
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ph.primaryText}>送る</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
