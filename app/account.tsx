import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import {
  AuthError,
  accountState,
  authErrorMessage,
  cancelSubscription,
  fetchMe,
  loadStoredAuth,
  resumeSubscription,
  saveStoredAuth,
  trialDaysRemaining,
  type AuthUser,
} from '../lib/auth';
import { formatDate } from '../lib/format';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

export default function AccountScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('ja');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = loading
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const t = STRINGS[lang];

  useEffect(() => {
    loadLangPref().then((saved) => setLang(saved ?? detectDefaultLang()));
    loadStoredAuth().then(async (stored) => {
      if (!stored) {
        setUser(null);
        return;
      }
      setToken(stored.token);
      try {
        const fresh = await fetchMe(stored.token);
        saveStoredAuth(stored.token, fresh);
        setUser(fresh);
      } catch {
        setUser(null);
      }
    });
  }, []);

  async function runAction(action: (token: string) => Promise<AuthUser>) {
    if (!token) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const updated = await action(token);
      await saveStoredAuth(token, updated);
      setUser(updated);
      setConfirming(false);
    } catch (e) {
      setErrorMsg(e instanceof AuthError ? authErrorMessage(t, e) : t.errorServer);
      // The state may have changed underneath us (e.g. the paid period just ended) -- re-read it.
      fetchMe(token)
        .then((fresh) => {
          saveStoredAuth(token, fresh);
          setUser(fresh);
        })
        .catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  const state = user ? accountState(user) : null;
  // The site owner's own account has no expiry and no renewal to manage.
  const manageable = !!user && !!user.subscriptionExpiresAt;
  const renewalIso = user?.nextChargeDueAt ?? user?.subscriptionExpiresAt ?? null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t.accountTitle}</Text>

      {user === undefined && (
        <View style={styles.card}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {user === null && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>{t.authLoginButton}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!!user && !!state && (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.accountEmailLabel}</Text>
            <Text style={styles.rowValue}>{user.email}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t.accountStatusLabel}</Text>
            <Text style={styles.rowValue}>
              {state === 'trial' && t.accountStatusTrial.replace('{days}', String(trialDaysRemaining(user)))}
              {state === 'active' && t.accountStatusActive}
              {state === 'canceled' && t.accountStatusCanceled}
              {state === 'inactive' && t.accountStatusInactive}
            </Text>
          </View>

          {state === 'active' && manageable && !!renewalIso && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t.accountNextRenewalLabel}</Text>
              <Text style={styles.rowValue}>{formatDate(renewalIso, lang)}</Text>
            </View>
          )}

          {state === 'trial' && <Text style={styles.body}>{t.accountTrialNote}</Text>}

          {state === 'canceled' && !!renewalIso && (
            <Text style={styles.body}>{t.accountCanceledNote.replace('{date}', formatDate(renewalIso, lang))}</Text>
          )}

          {state === 'inactive' && (
            <>
              <Text style={styles.body}>{t.authTrialExpiredBody}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/subscribe')}>
                <Text style={styles.primaryButtonText}>{t.authSubscribeButton}</Text>
              </TouchableOpacity>
            </>
          )}

          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {state === 'active' && manageable && !confirming && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setConfirming(true)} disabled={busy}>
              <Text style={styles.secondaryButtonText}>{t.accountCancelButton}</Text>
            </TouchableOpacity>
          )}

          {state === 'active' && manageable && confirming && (
            <>
              <Text style={styles.body}>{t.accountCancelConfirm}</Text>
              <TouchableOpacity
                style={[styles.dangerButton, busy && styles.buttonDisabled]}
                onPress={() => runAction(cancelSubscription)}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t.accountCancelConfirmYes}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setConfirming(false)} disabled={busy}>
                <Text style={styles.secondaryButtonText}>{t.accountKeep}</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'canceled' && manageable && (
            <TouchableOpacity
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={() => runAction(resumeSubscription)}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t.accountResumeButton}</Text>}
            </TouchableOpacity>
          )}
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
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 21,
  },
  body: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#C0392B',
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
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
