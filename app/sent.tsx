import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { detectDefaultLang } from '../lib/i18n';
import { getIntakeStatus, type IntakeStatusView } from '../lib/intakeApi';
import { listSent, removeSent, type SentIntake } from '../lib/intakeStore';
import { loadLangPref } from '../lib/langPref';
import { SEND_STRINGS, type SendStrings } from '../lib/sendStrings';
import { LANGUAGES, type Lang } from '../types';

// "Sent prescriptions": what each pharmacy has replied. Read with the token kept on this device; refreshed when the
// screen opens and every 30 seconds while it's open.

const REFRESH_MS = 30_000;

type Row = { sent: SentIntake; view: IntakeStatusView | null | undefined; failed: boolean }; // view: undefined = loading, null = gone

function statusText(t: SendStrings, v: IntakeStatusView): string {
  switch (v.status) {
    case 'ready':
      return t.statusReady;
    case 'inquiry':
      return t.statusInquiry;
    case 'later':
      return t.statusLater(v.laterTime ?? '');
    case 'done':
      return t.statusDone;
    default:
      return t.statusNew;
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function SentScreen() {
  const params = useLocalSearchParams<{ i?: string }>();
  const focusId = typeof params.i === 'string' ? params.i : '';
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = SEND_STRINGS[lang];

  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved && LANGUAGES.some((l) => l.code === saved)) setLang(saved);
    });
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const sent = await listSent();
    // the intake the patient just sent (or followed a mail link to) comes first
    sent.sort((a, b) => (a.intakeId === focusId ? -1 : b.intakeId === focusId ? 1 : 0));
    const next = await Promise.all(
      sent.map(async (s): Promise<Row> => {
        try {
          return { sent: s, view: await getIntakeStatus(s.intakeId, s.token), failed: false };
        } catch {
          return { sent: s, view: undefined, failed: true };
        }
      }),
    );
    setRows(next);
    setRefreshing(false);
  }, [focusId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      timer.current = setInterval(refresh, REFRESH_MS);
      return () => {
        if (timer.current) clearInterval(timer.current);
      };
    }, [refresh]),
  );

  async function remove(id: string) {
    await removeSent(id);
    setRows((prev) => (prev ?? []).filter((r) => r.sent.intakeId !== id));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/" style={styles.back}>
        ← rxhelper.jp
      </Link>
      <Text style={styles.title}>{t.sentTitle}</Text>
      <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={refresh} disabled={refreshing}>
        {refreshing ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.secondaryButtonText}>{t.refresh}</Text>}
      </TouchableOpacity>

      {rows === null ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : rows.length === 0 ? (
        <Text style={styles.body}>{t.sentEmpty}</Text>
      ) : (
        rows.map(({ sent, view, failed }) => (
          <View key={sent.intakeId} style={[styles.card, sent.intakeId === focusId && styles.cardFocus]}>
            <Text style={styles.pharmacy}>{sent.pharmacyName}</Text>
            <Text style={styles.helper}>
              {t.sentAt} {formatTime(sent.createdAt)}
            </Text>
            {failed ? (
              <Text style={styles.error}>{t.errNetwork}</Text>
            ) : view === undefined ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : view === null ? (
              <>
                <Text style={styles.body}>{t.gone}</Text>
                <TouchableOpacity accessibilityRole="button" onPress={() => remove(sent.intakeId)}>
                  <Text style={styles.link}>{t.removeFromList}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.status, view.status === 'ready' && styles.statusReady]}>{statusText(t, view)}</Text>
                {view.messages.map((m) => (
                  <View key={m.createdAt + m.textJa} style={styles.message}>
                    <Text style={styles.messageHead}>{t.fromPharmacy}</Text>
                    <Text style={styles.body}>{m.textPatient}</Text>
                    {lang !== 'ja' && (
                      <Text style={styles.original}>
                        {t.originalJa}：{m.textJa}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
        ))
      )}
      <Text style={styles.helper}>{t.bring}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, gap: SPACING.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  back: { color: COLORS.textMuted, fontSize: FONT.small },
  title: { fontSize: FONT.title - 4, fontWeight: '800', color: COLORS.text },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  cardFocus: { borderWidth: 2, borderColor: COLORS.primary },
  pharmacy: { fontSize: FONT.subtitle, fontWeight: '800', color: COLORS.text },
  status: { fontSize: FONT.body + 1, fontWeight: '700', color: COLORS.primaryDark },
  statusReady: { color: COLORS.primary },
  body: { fontSize: FONT.body, color: COLORS.text, lineHeight: FONT.body * 1.5 },
  helper: { fontSize: FONT.small, color: COLORS.textMuted, lineHeight: FONT.small * 1.6 },
  error: { fontSize: FONT.label, color: COLORS.danger, fontWeight: '700' },
  link: { color: COLORS.accent, fontSize: FONT.label },
  message: { backgroundColor: COLORS.bg, borderRadius: RADIUS.sm, padding: SPACING.sm, gap: SPACING.xs },
  messageHead: { fontSize: FONT.small, fontWeight: '700', color: COLORS.textMuted },
  original: { fontSize: FONT.small, color: COLORS.textMuted },
  secondaryButton: { backgroundColor: COLORS.chipBg, borderRadius: RADIUS.pill, paddingVertical: SPACING.md, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: FONT.label + 1 },
});
