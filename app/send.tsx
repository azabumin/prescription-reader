import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { detectDefaultLang } from '../lib/i18n';
import { getPharmacyName, IntakeError, PICKUP_CODES, sendIntake, type PickupCode } from '../lib/intakeApi';
import { addSent } from '../lib/intakeStore';
import { loadLangPref, saveLangPref } from '../lib/langPref';
import { loadCard, type PharmacyCard } from '../lib/pharmacyCard';
import { pickPhoto, type PreparedPhoto } from '../lib/photoPrep';
import { answeredCount, newClientRequestId } from '../lib/sendLogic';
import { SEND_STRINGS } from '../lib/sendStrings';
import { LANGUAGES, type Lang } from '../types';

// "Send to this pharmacy": opened from the pharmacy's counter QR (https://rxhelper.jp/send?ph=<code>). No account.
// The photo and the questionnaire (the same memo as "薬局で見せるメモ") go to that pharmacy, which reads them in
// Japanese; the device keeps a token to read the pharmacy's replies on /sent.

const MAX_PHOTOS = 2;
type Photo = PreparedPhoto;

export default function SendScreen() {
  const params = useLocalSearchParams<{ ph?: string }>();
  const code = typeof params.ph === 'string' ? params.ph.trim() : '';
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  const [pharmacyName, setPharmacyName] = useState<string | null | undefined>(undefined); // undefined = loading
  const [card, setCard] = useState<PharmacyCard | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pickup, setPickup] = useState<PickupCode>('today17');
  const [email, setEmail] = useState('');
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [askEmpty, setAskEmpty] = useState(false);
  const askedEmpty = useRef(false);
  const requestId = useRef(newClientRequestId()); // reused on retry: a resend never makes a second intake
  const t = SEND_STRINGS[lang];

  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved && LANGUAGES.some((l) => l.code === saved)) setLang(saved);
    });
  }, []);

  useEffect(() => {
    if (!code) {
      setPharmacyName(null);
      return;
    }
    getPharmacyName(code)
      .then(setPharmacyName)
      .catch(() => setPharmacyName(null));
  }, [code]);

  // the questionnaire is edited on the memo screen; re-read it whenever we come back
  useFocusEffect(
    useCallback(() => {
      loadCard(lang).then(setCard);
    }, [lang]),
  );

  function chooseLang(l: Lang) {
    setLang(l);
    saveLangPref(l).catch(() => {});
  }

  async function addPhoto(source: 'camera' | 'library') {
    setError('');
    if (photos.length >= MAX_PHOTOS) return;
    try {
      const p = await pickPhoto(source);
      if (p === 'denied') setError(t.errPhoto);
      else if (p === 'too_large') setError(t.errImageTooLarge);
      else if (p) setPhotos((prev) => [...prev, p].slice(0, MAX_PHOTOS));
    } catch (e) {
      console.warn('send_photo_failed', e);
      setError(t.errPhoto);
    }
  }

  const emailOk = email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const answered = card ? answeredCount(card) : 0;
  const canSend = !!pharmacyName && photos.length > 0 && agree && emailOk && !sending;

  async function send(skipEmptyCheck = false) {
    if (!canSend || !card || !pharmacyName) return;
    if (!skipEmptyCheck && answered === 0 && !askedEmpty.current) {
      askedEmpty.current = true;
      setAskEmpty(true);
      return;
    }
    setAskEmpty(false);
    setSending(true);
    setError('');
    try {
      const res = await sendIntake({
        pharmacyCode: code,
        clientRequestId: requestId.current,
        lang,
        pickup,
        card,
        images: photos.map((p) => ({ base64: p.base64, mediaType: 'image/jpeg' })),
        ...(email.trim() ? { notifyEmail: email.trim() } : {}),
        consent: true,
      });
      await addSent({ intakeId: res.intakeId, token: res.patientToken, pharmacyName, createdAt: new Date().toISOString() });
      router.replace({ pathname: '/sent', params: { i: res.intakeId } });
    } catch (e) {
      const c = e instanceof IntakeError ? e.code : 'server';
      setError(
        c === 'network'
          ? t.errNetwork
          : c === 'rate_limited'
            ? t.errRateLimited
            : c === 'image_too_large'
              ? t.errImageTooLarge
              : c === 'pharmacy_not_found'
                ? t.errPharmacy
                : c === 'invalid'
                  ? t.errInvalid
                  : t.errServer,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/" style={styles.back}>
        ← rxhelper.jp
      </Link>
      <Text style={styles.title}>{t.title}</Text>

      <View style={styles.langRow} accessibilityLabel={t.langLabel}>
        {LANGUAGES.map((l) => (
          <TouchableOpacity
            key={l.code}
            accessibilityRole="button"
            aria-selected={l.code === lang}
            style={[styles.langChip, l.code === lang && styles.langChipOn]}
            onPress={() => chooseLang(l.code)}
          >
            <Text style={[styles.langChipText, l.code === lang && styles.langChipTextOn]}>{l.native}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {pharmacyName === undefined ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : pharmacyName === null ? (
        <Text style={styles.error}>{t.badCode}</Text>
      ) : (
        <>
          <Text style={styles.to}>{t.to(pharmacyName)}</Text>

          <View style={styles.section}>
            <Text style={styles.h2}>{t.stepQuestionnaire}</Text>
            <Text style={styles.body}>{answered > 0 ? t.answered(answered) : t.notAnswered}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={() => router.push({ pathname: '/pharmacy-card', params: { returnTo: 'send', ph: code } })}
            >
              <Text style={styles.secondaryButtonText}>{t.editQuestionnaire}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>{t.stepPhoto}</Text>
            <Text style={styles.helper}>{t.photoHint}</Text>
            <View style={styles.photoRow}>
              {photos.map((p, i) => (
                <View key={p.uri + i} style={styles.photoBox}>
                  <Image source={{ uri: p.uri }} style={styles.photo} accessibilityIgnoresInvertColors />
                  <TouchableOpacity accessibilityRole="button" onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}>
                    <Text style={styles.link}>{t.removePhoto}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {photos.length < MAX_PHOTOS ? (
              <>
                <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => addPhoto('camera')}>
                  <Text style={styles.secondaryButtonText}>{t.takePhoto}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => addPhoto('library')}>
                  <Text style={styles.secondaryButtonText}>{t.pickPhoto}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.helper}>{t.photoMax}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>{t.stepPickup}</Text>
            <View style={styles.chipRow} accessibilityRole="radiogroup">
              {PICKUP_CODES.map((p) => (
                <TouchableOpacity
                  key={p}
                  accessibilityRole="radio"
                  aria-checked={p === pickup}
                  style={[styles.chip, p === pickup && styles.chipOn]}
                  onPress={() => setPickup(p)}
                >
                  <Text style={[styles.chipText, p === pickup && styles.chipTextOn]}>{t.pickup[p]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>{t.stepEmail}</Text>
            <Text style={styles.helper}>{t.emailHint}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel={t.stepEmail}
            />
            {!emailOk && <Text style={styles.error}>{t.emailInvalid}</Text>}
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>{t.consentTitle}</Text>
            {t.consent.map((line) => (
              <Text key={line} style={styles.body}>
                ・{line}
              </Text>
            ))}
            <TouchableOpacity
              accessibilityRole="checkbox"
              aria-checked={agree}
              style={styles.checkRow}
              onPress={() => setAgree((v) => !v)}
            >
              <View style={[styles.checkbox, agree && styles.checkboxOn]}>{agree && <Text style={styles.checkMark}>✓</Text>}</View>
              <Text style={styles.body}>{t.agree}</Text>
            </TouchableOpacity>
          </View>

          {askEmpty && (
            <View style={styles.confirmBox}>
              <Text style={styles.body}>{t.confirmEmpty}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={() => router.push({ pathname: '/pharmacy-card', params: { returnTo: 'send', ph: code } })}
              >
                <Text style={styles.secondaryButtonText}>{t.answerFirst}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => send(true)}>
                <Text style={styles.secondaryButtonText}>{t.sendAnyway}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            accessibilityRole="button"
            aria-disabled={!canSend}
            disabled={!canSend}
            style={[styles.primaryButton, !canSend && styles.primaryButtonOff]}
            onPress={() => send()}
          >
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{t.send}</Text>}
          </TouchableOpacity>
          <Text style={styles.helper}>{t.bring}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, gap: SPACING.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  back: { color: COLORS.textMuted, fontSize: FONT.small },
  title: { fontSize: FONT.title - 4, fontWeight: '800', color: COLORS.text },
  to: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.primaryDark },
  section: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  h2: { fontSize: FONT.subtitle, fontWeight: '800', color: COLORS.text },
  body: { fontSize: FONT.body, color: COLORS.text, lineHeight: FONT.body * 1.5, flexShrink: 1 },
  helper: { fontSize: FONT.small, color: COLORS.textMuted, lineHeight: FONT.small * 1.6 },
  error: { fontSize: FONT.label, color: COLORS.danger, fontWeight: '700' },
  link: { color: COLORS.accent, fontSize: FONT.small, textAlign: 'center', marginTop: SPACING.xs },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  langChip: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.pill, backgroundColor: COLORS.chipBg },
  langChipOn: { backgroundColor: COLORS.primary },
  langChipText: { fontSize: FONT.small, color: COLORS.primaryDark },
  langChipTextOn: { color: '#FFFFFF', fontWeight: '700' },
  photoRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  photoBox: { width: 140 },
  photo: { width: 140, height: 180, borderRadius: RADIUS.sm, backgroundColor: COLORS.chipBg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.pill, backgroundColor: COLORS.chipBg },
  chipOn: { backgroundColor: COLORS.primary },
  chipText: { fontSize: FONT.label, color: COLORS.primaryDark },
  chipTextOn: { color: '#FFFFFF', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: COLORS.primary },
  checkMark: { color: '#FFFFFF', fontWeight: '800' },
  confirmBox: { backgroundColor: '#FFF6E5', borderRadius: RADIUS.md, padding: SPACING.md, gap: SPACING.sm },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.pill, paddingVertical: SPACING.md + 2, alignItems: 'center' },
  primaryButtonOff: { backgroundColor: COLORS.disabled },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT.button },
  secondaryButton: { backgroundColor: COLORS.chipBg, borderRadius: RADIUS.pill, paddingVertical: SPACING.md, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.primaryDark, fontWeight: '700', fontSize: FONT.label + 1 },
});
