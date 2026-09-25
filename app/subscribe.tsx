import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { fetchMe, isTrialOrSubscriptionActive, loadStoredAuth, saveStoredAuth } from '../lib/auth';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import { CheckoutError, startZeusCheckout, submitZeusOrder } from '../lib/payment';
import type { Lang } from '../types';

type Access = 'loading' | 'loggedOut' | 'alreadyActive' | 'canPay';

export default function SubscribeScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('ja');
  const [access, setAccess] = useState<Access>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const t = STRINGS[lang];

  useEffect(() => {
    loadLangPref().then((saved) => setLang(saved ?? detectDefaultLang()));
    loadStoredAuth().then(async (stored) => {
      if (!stored) {
        setAccess('loggedOut');
        return;
      }
      setToken(stored.token);
      try {
        // The cached copy can be stale (e.g. paid in another tab) -- ask the server so we never
        // offer to charge someone who can already use the service.
        const fresh = await fetchMe(stored.token);
        saveStoredAuth(stored.token, fresh);
        setAccess(isTrialOrSubscriptionActive(fresh) ? 'alreadyActive' : 'canPay');
      } catch {
        setAccess('loggedOut');
      }
    });
  }, []);

  async function handleSubmit() {
    if (!token) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const checkout = await startZeusCheckout(token, phone);
      submitZeusOrder(checkout); // navigates the browser away to ZEUS -- nothing after this runs
    } catch (e) {
      setSubmitting(false);
      if (e instanceof CheckoutError && e.code === 'invalid_phone') {
        setErrorMsg(t.errorInvalidPhone);
      } else if (e instanceof CheckoutError && e.code === 'already_active') {
        setErrorMsg(t.errorAlreadyActive);
      } else if (e instanceof CheckoutError && e.code === 'unauthorized') {
        setErrorMsg(t.errorInvalidOrExpiredToken);
      } else if (e instanceof CheckoutError && e.code === 'network') {
        setErrorMsg(t.errorNetwork);
      } else {
        setErrorMsg(t.errorServer);
      }
    }
  }

  const rows: [string, string][] = [
    [t.subscribePlanLabel, t.subscribePlanValue],
    [t.subscribeChargeLabel, t.subscribeChargeValue],
    [t.subscribeRenewalLabel, t.subscribeRenewalValue],
    [t.subscribeCancelLabel, t.subscribeCancelValue],
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t.subscribeTitle}</Text>

      {access === 'loading' && (
        <View style={styles.card}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {access === 'loggedOut' && (
        <View style={styles.card}>
          <Text style={styles.body}>{t.authLoginRequiredBody}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>{t.authLoginButton}</Text>
          </TouchableOpacity>
        </View>
      )}

      {access === 'alreadyActive' && (
        <View style={styles.card}>
          <Text style={styles.body}>{t.errorAlreadyActive}</Text>
        </View>
      )}

      {access === 'canPay' && (
        <View style={styles.card}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
          <Text style={styles.body}>{t.subscribeCardNote}</Text>
          <Text style={styles.fieldLabel}>{t.subscribePhoneLabel}</Text>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="09012345678"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t.subscribePayButton}</Text>}
          </TouchableOpacity>
          <View style={styles.legalLinks}>
            <Link href="/terms" style={styles.legalLink}>
              {t.footerTerms}
            </Link>
            <Text style={styles.legalDot}>·</Text>
            <Link href="/tokushoho" style={styles.legalLink}>
              {t.footerTokushoho}
            </Link>
          </View>
        </View>
      )}

      <Link href="/" style={styles.backLink}>
        <Text style={styles.backLinkText}>{t.backToApp}</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    gap: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  row: {
    gap: 2,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  rowValue: {
    fontSize: 14.5,
    color: COLORS.text,
    lineHeight: 21,
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  errorText: {
    fontSize: 12.5,
    color: '#C0392B',
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  legalLink: {
    color: COLORS.textMuted,
    fontSize: 12.5,
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: COLORS.textMuted,
    fontSize: 12.5,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
  },
  backLinkText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
