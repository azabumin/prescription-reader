import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';

import { authFormStyles as f } from '../components/authFormStyles';
import { staticPageStyles as s } from '../components/staticPageStyles';
import { AuthError, authErrorMessage, resetPassword } from '../lib/auth';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved) setLang(saved);
    });
  }, []);
  const t = STRINGS[lang];

  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : t.errorInvalidOrExpiredToken);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (submitting || !token) return;
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
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
        <Text style={s.pageTitle}>{t.authResetPasswordTitle}</Text>

        {success ? (
          <Text style={f.successText}>{t.authResetSuccessMessage}</Text>
        ) : (
          <>
            {error && <Text style={f.errorText}>{error}</Text>}
            {token && (
              <>
                <Text style={[s.body, { marginBottom: 16 }]}>{t.authResetPasswordSubtitle}</Text>
                <TextInput
                  style={f.input}
                  placeholder={t.authNewPasswordLabel}
                  placeholderTextColor="#9AA6A2"
                  value={newPassword}
                  onChangeText={setNewPassword}
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
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={f.buttonText}>{t.authResetPasswordButton}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
