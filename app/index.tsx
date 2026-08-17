import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import AdBanner from '../components/AdBanner';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { analyzePrescriptionPhoto, AnalyzeError } from '../lib/api';
import {
  clearStoredAuth,
  fetchMe,
  isTrialOrSubscriptionActive,
  loadStoredAuth,
  logout as logoutRequest,
  saveStoredAuth,
  trialDaysRemaining,
  type AuthUser,
} from '../lib/auth';
import { buildMedicationCalendar, hasSchedulableDoses } from '../lib/calendar';
import { downloadTextFile } from '../lib/download';
import { saveHistoryEntry } from '../lib/history';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref, saveLangPref } from '../lib/langPref';
import { isSpeechSupported, speak, stopSpeech } from '../lib/speech';
import { buildSpokenSummary } from '../lib/speechText';
import { LANGUAGES, TIME_SLOTS } from '../types';
import type { AnalysisResult, Lang, TimeSlot } from '../types';

function slotLabelKey(slot: TimeSlot): string {
  return `timeSlot${slot[0].toUpperCase()}${slot.slice(1)}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [auth, setAuth] = useState<{ token: string; user: AuthUser } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const t = STRINGS[lang];
  const currentLanguage = LANGUAGES.find((l) => l.code === lang)!;
  const canUseService = !!auth && isTrialOrSubscriptionActive(auth.user);

  useEffect(() => stopSpeech, []);

  // The language picker's choice only lived in this screen's local state, so navigating to
  // /about, /privacy, /terms, or /tokushoho and back (which unmounts this screen) silently
  // reset the language back to the browser default. Restore whatever the user last picked.
  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved) setLang(saved);
    });
  }, []);

  useEffect(() => {
    loadStoredAuth().then((stored) => {
      // Show the cached session immediately so the gate doesn't flash, then refresh
      // from the server -- trial/subscription status can change server-side (trial
      // lapsing, a future payment) without this device doing anything, so the cached
      // copy alone can't be trusted for the analyze-or-not decision.
      setAuth(stored);
      setAuthChecked(true);
      if (stored) {
        fetchMe(stored.token)
          .then((freshUser) => {
            setAuth({ token: stored.token, user: freshUser });
            saveStoredAuth(stored.token, freshUser);
          })
          .catch(() => {
            // Session token no longer valid server-side -- drop the stale local copy.
            clearStoredAuth();
            setAuth(null);
          });
      }
    });
  }, []);

  async function handleLogout() {
    if (auth) {
      logoutRequest(auth.token).catch(() => {
        // best-effort -- even if this fails server-side, clearing the local token
        // still logs the user out of this device
      });
    }
    await clearStoredAuth();
    setAuth(null);
    reset();
  }

  function toggleListen() {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      return;
    }
    if (!result) return;
    speak(buildSpokenSummary(result, lang), lang, () => setSpeaking(false));
    setSpeaking(true);
  }

  async function analyze(uri: string, targetLang: Lang = lang) {
    if (!auth) return;
    stopSpeech();
    setSpeaking(false);
    setAnalyzing(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!manipulated.base64) {
        throw new Error('no base64 output');
      }
      const analysis = await analyzePrescriptionPhoto(manipulated.base64, 'image/jpeg', targetLang, auth.token);
      setResult(analysis);
      saveHistoryEntry(analysis, targetLang).catch(() => {
        // best-effort local save; a failure here shouldn't block showing the result
      });
    } catch (e) {
      if (e instanceof AnalyzeError) {
        if (e.code === 'unauthorized') {
          // The session token is gone or expired server-side -- clear the stale local
          // copy and send the user to log back in rather than showing a generic error.
          await clearStoredAuth();
          setAuth(null);
          router.replace('/login');
          return;
        }
        setErrorMsg(
          e.code === 'network'
            ? t.errorNetwork
            : e.code === 'rate_limited'
              ? t.errorRateLimited
              : e.code === 'trial_expired'
                ? t.authTrialExpiredBody
                : t.errorServer
        );
      } else {
        setErrorMsg(t.errorServer);
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handlePick(source: 'camera' | 'library') {
    if (!canUseService) return;
    setErrorMsg(null);
    try {
      // On web, requesting camera permission as a separate awaited call breaks
      // the browser's user-activation chain before launchCameraAsync runs, so
      // the browser silently blocks the camera with no error shown. Skip the
      // separate request there and let launchCameraAsync trigger the browser's
      // own camera permission prompt directly, right on the button tap.
      if (Platform.OS !== 'web' || source === 'library') {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setErrorMsg(source === 'camera' ? t.cameraPermissionDenied : t.libraryPermissionDenied);
          return;
        }
      }

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });

      if (pickerResult.canceled || !pickerResult.assets?.length) return;

      const uri = pickerResult.assets[0].uri;
      setImageUri(uri);
      setResult(null);
      await analyze(uri);
    } catch {
      setErrorMsg(t.pickError);
    }
  }

  function reset() {
    stopSpeech();
    setSpeaking(false);
    setImageUri(null);
    setResult(null);
    setErrorMsg(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        {auth ? (
          <TouchableOpacity onPress={handleLogout} accessibilityRole="button">
            <Text style={styles.logoutText}>
              {t.authLoggedInPrefix}
              {auth.user.email} · {t.authLogoutButton}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={styles.langSwitch}
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t.chooseLanguage}
        >
          <Text style={styles.langSwitchText}>{currentLanguage.native} ▾</Text>
        </TouchableOpacity>
      </View>

      {pickerOpen && (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPickerOpen(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t.chooseLanguage}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.langOption, item.code === lang && styles.langOptionActive]}
                  onPress={() => {
                    setLang(item.code);
                    saveLangPref(item.code);
                    setPickerOpen(false);
                    // A result already on screen was fetched in the old language and
                    // won't retranslate itself -- re-run analysis on the same photo so
                    // displayed content always matches the selected language.
                    if (imageUri && item.code !== lang) {
                      analyze(imageUri, item.code);
                    }
                  }}
                >
                  <Text style={[styles.langOptionNative, item.code === lang && styles.langOptionActiveText]}>
                    {item.native}
                  </Text>
                  <Text style={styles.langOptionEnglish}>{item.english}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      )}

      <Text style={styles.title}>{t.appTitle}</Text>
      <Text style={styles.subtitle}>{t.appSubtitle}</Text>

      {!authChecked && (
        <View style={styles.centerBlock}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      )}

      {authChecked && !auth && (
        <View style={styles.pickCard}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>{t.authLoginButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/signup')}>
            <Text style={styles.secondaryButtonText}>{t.authSignupButton}</Text>
          </TouchableOpacity>
        </View>
      )}

      {authChecked && auth && !canUseService && (
        <View style={styles.pickCard}>
          <Text style={styles.medicationName}>{t.authTrialExpiredTitle}</Text>
          <Text style={styles.helperText}>{t.authTrialExpiredBody}</Text>
        </View>
      )}

      {authChecked && auth && canUseService && !imageUri && (
        <View style={styles.pickCard}>
          {auth.user.subscriptionStatus === 'trial' && (
            <Text style={styles.trialBadge}>
              {t.authTrialDaysLeftTemplate.replace('{days}', String(trialDaysRemaining(auth.user)))}
            </Text>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={() => handlePick('camera')}>
            <Text style={styles.primaryButtonText}>{t.takePhoto}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => handlePick('library')}>
            <Text style={styles.secondaryButtonText}>{t.pickPhoto}</Text>
          </TouchableOpacity>
          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          <Text style={styles.helperText}>{t.disclaimer}</Text>
        </View>
      )}

      {imageUri && (
        <View style={styles.resultCard}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

          {analyzing && (
            <View style={styles.centerBlock}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>{t.analyzing}</Text>
            </View>
          )}

          {!analyzing && errorMsg && (
            <View style={styles.centerBlock}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => analyze(imageUri)}>
                <Text style={styles.primaryButtonText}>{t.retry}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!analyzing && !errorMsg && result && (
            <View style={styles.analysisBlock}>
              <Text style={styles.medicationName}>{result.medicationName}</Text>

              {isSpeechSupported() && (
                <TouchableOpacity style={styles.secondaryButton} onPress={toggleListen}>
                  <Text style={styles.secondaryButtonText}>{speaking ? t.stopListening : t.listen}</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.sectionLabel}>{t.scheduleTitle}</Text>
              <View style={styles.scheduleCard}>
                {TIME_SLOTS.map((slot) => {
                  const meds = result.items.filter((item) => item.timeSlots.includes(slot));
                  if (meds.length === 0) return null;
                  return (
                    <View key={slot} style={styles.slotRow}>
                      <Text style={styles.slotLabel}>{t[slotLabelKey(slot)]}</Text>
                      <Text style={styles.slotMeds}>{meds.map((m) => m.name).join(' · ')}</Text>
                    </View>
                  );
                })}
              </View>

              {hasSchedulableDoses(result) && (
                <View>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => downloadTextFile('medication-reminders.ics', buildMedicationCalendar(result, lang), 'text/calendar')}
                  >
                    <Text style={styles.secondaryButtonText}>{t.addToCalendar}</Text>
                  </TouchableOpacity>
                  <Text style={styles.helperText}>{t.calendarNote}</Text>
                </View>
              )}

              <Text style={styles.sectionLabel}>{t.medicationSectionTitle}</Text>

              {result.items.map((item, index) => (
                <View key={`${item.name}-${index}`} style={styles.itemCard}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemFieldLabel}>{t.dosageLabel}</Text>
                    <Text style={styles.itemFieldValue}>{item.dosage}</Text>
                  </View>
                  {!!item.timingDetail && (
                    <View style={styles.itemRow}>
                      <Text style={styles.itemFieldLabel}>{t.timingDetailLabel}</Text>
                      <Text style={styles.itemFieldValue}>{item.timingDetail}</Text>
                    </View>
                  )}
                  <View style={styles.itemRow}>
                    <Text style={styles.itemFieldLabel}>{t.purposeLabel}</Text>
                    <Text style={styles.itemFieldValue}>{item.purpose}</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemFieldLabel}>{t.precautionLabel}</Text>
                    <Text style={styles.itemFieldValue}>{item.precaution}</Text>
                  </View>
                </View>
              ))}

              <Text style={styles.sectionLabel}>{t.generalNotesTitle}</Text>
              <Text style={styles.generalNotes}>{result.generalNotes}</Text>
              <Text style={styles.helperText}>{t.disclaimer}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
            <Text style={styles.secondaryButtonText}>{t.tryAnother}</Text>
          </TouchableOpacity>
        </View>
      )}

      <AdBanner />

      <View style={styles.footer}>
        <Link href="/history" style={styles.footerLink}>
          {t.footerHistory}
        </Link>
        <Text style={styles.footerDot}>·</Text>
        <Link href="/about" style={styles.footerLink}>
          {t.footerAbout}
        </Link>
        <Text style={styles.footerDot}>·</Text>
        <Link href="/privacy" style={styles.footerLink}>
          {t.footerPrivacy}
        </Link>
        <Text style={styles.footerDot}>·</Text>
        <Link href="/terms" style={styles.footerLink}>
          {t.footerTerms}
        </Link>
        <Text style={styles.footerDot}>·</Text>
        <Link href="/tokushoho" style={styles.footerLink}>
          {t.footerTokushoho}
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    alignItems: 'stretch',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoutText: {
    color: COLORS.textMuted,
    fontSize: FONT.small,
  },
  langSwitch: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  langSwitchText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: FONT.small,
    textDecorationLine: 'underline',
  },
  trialBadge: {
    alignSelf: 'center',
    backgroundColor: COLORS.chipBg,
    color: COLORS.primaryDark,
    fontSize: FONT.small,
    fontWeight: '700',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  modalBackdrop: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(20,24,22,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: FONT.label + 1,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  modalList: {
    flexGrow: 0,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  langOptionActive: {
    backgroundColor: COLORS.chipBg,
  },
  langOptionNative: {
    fontSize: FONT.label + 1,
    fontWeight: '600',
    color: COLORS.text,
  },
  langOptionActiveText: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  langOptionEnglish: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT.subtitle,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  pickCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FONT.button,
  },
  secondaryButton: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: FONT.label + 1,
  },
  helperText: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    lineHeight: 19,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT.label,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.chipBg,
  },
  centerBlock: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: FONT.label,
  },
  analysisBlock: {
    paddingTop: SPACING.sm,
  },
  medicationName: {
    fontSize: FONT.title - 8,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  scheduleCard: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 6,
  },
  slotLabel: {
    fontSize: FONT.label,
    fontWeight: '800',
    color: COLORS.primaryDark,
    width: 90,
    flexShrink: 0,
  },
  slotMeds: {
    fontSize: FONT.label,
    color: COLORS.text,
    flex: 1,
  },
  itemCard: {
    backgroundColor: COLORS.chipBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  itemName: {
    fontSize: FONT.body + 1,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  itemRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  itemFieldLabel: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
    width: 84,
    flexShrink: 0,
  },
  itemFieldValue: {
    fontSize: FONT.label,
    color: COLORS.text,
    flex: 1,
  },
  generalNotes: {
    fontSize: FONT.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  footerLink: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
  },
  footerDot: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
  },
});
