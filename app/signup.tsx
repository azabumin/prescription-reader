import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { authFormStyles as f } from '../components/authFormStyles';
import { staticPageStyles as s } from '../components/staticPageStyles';
import { AuthError, authErrorMessage, saveStoredAuth, signup } from '../lib/auth';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

export default function SignupScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved) setLang(saved);
    });
  }, []);
  const t = STRINGS[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await signup(email, password);
      await saveStoredAuth(token, user);
      router.replace('/');
    } catch (err) {
      setError(err instanceof AuthError ? authErrorMessage(t, err) : t.errorServer);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        {t.backToApp}
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>{t.authSignupTitle}</Text>

        {error && <Text style={f.errorText}>{error}</Text>}

        <TextInput
          style={f.input}
          placeholder={t.authEmailLabel}
          placeholderTextColor="#9AA6A2"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={f.input}
          placeholder={t.authPasswordLabel}
          placeholderTextColor="#9AA6A2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <TouchableOpacity
          style={[f.button, submitting && f.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={f.buttonText}>{t.authSignupButton}</Text>}
        </TouchableOpacity>

        <View style={f.footerRow}>
          <Text style={f.footerText}>{t.authHaveAccountPrompt}</Text>
          <Link href="/login" style={f.footerLink}>
            {t.authGoToLogin}
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
