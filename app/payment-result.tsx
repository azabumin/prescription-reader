import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { fetchMe, loadStoredAuth, saveStoredAuth } from '../lib/auth';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

type Outcome = 'checking' | 'paid' | 'pending' | 'failed';

const POLL_TIMES = 6;
const POLL_INTERVAL_MS = 2000;

export default function PaymentResultScreen() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [lang, setLang] = useState<Lang>('ja');
  const [outcome, setOutcome] = useState<Outcome>(status === 'success' ? 'checking' : 'failed');
  const t = STRINGS[lang];

  useEffect(() => {
    loadLangPref().then((saved) => setLang(saved ?? detectDefaultLang()));
  }, []);

  // ZEUS tells our server about the payment separately from redirecting the customer back here,
  // so the two can arrive in either order -- ask the server a few times before giving up.
  useEffect(() => {
    if (status !== 'success') {
      setOutcome('failed');
      return;
    }
    let cancelled = false;
    (async () => {
      const stored = await loadStoredAuth();
      for (let i = 0; i < POLL_TIMES && stored; i++) {
        try {
          const user = await fetchMe(stored.token);
          if (user.subscriptionStatus === 'active') {
            await saveStoredAuth(stored.token, user);
            if (!cancelled) setOutcome('paid');
            return;
          }
        } catch {
          // keep polling
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (cancelled) return;
      }
      if (!cancelled) setOutcome('pending');
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {outcome === 'checking' && (
          <>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.body}>{t.paymentPendingBody}</Text>
          </>
        )}
        {outcome === 'paid' && (
          <>
            <Text style={styles.title}>{t.paymentSuccessTitle}</Text>
            <Text style={styles.body}>{t.paymentSuccessBody}</Text>
          </>
        )}
        {outcome === 'pending' && <Text style={styles.body}>{t.paymentPendingBody}</Text>}
        {outcome === 'failed' && (
          <>
            <Text style={styles.title}>{t.paymentFailedTitle}</Text>
            <Text style={styles.body}>{t.paymentFailedBody}</Text>
            <Link href="/subscribe" style={styles.link}>
              <Text style={styles.linkText}>{t.authSubscribeButton}</Text>
            </Link>
          </>
        )}
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t.backToApp}</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  link: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  linkText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
