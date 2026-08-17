import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { authFormStyles as f } from '../components/authFormStyles';
import { staticPageStyles as s } from '../components/staticPageStyles';
import { requestPasswordReset } from '../lib/auth';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

export default function ForgotPasswordScreen() {
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved) setLang(saved);
    });
  }, []);
  const t = STRINGS[lang];

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
    } finally {
      // Always show the same "sent" state regardless of outcome -- the backend never
      // reveals whether the email is registered, so the UI shouldn't either.
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        {t.backToApp}
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>{t.authForgotPasswordTitle}</Text>

        {sent ? (
          <Text style={f.successText}>{t.authResetSentMessage}</Text>
        ) : (
          <>
            <Text style={[s.body, { marginBottom: 16 }]}>{t.authForgotPasswordSubtitle}</Text>
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
            <TouchableOpacity
              style={[f.button, submitting && f.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={f.buttonText}>{t.authSendResetLinkButton}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={f.footerRow}>
          <Link href="/login" style={f.footerLink}>
            {t.authGoToLogin}
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
