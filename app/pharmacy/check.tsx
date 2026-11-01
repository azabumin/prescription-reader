import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { DrugStockList } from '../../components/pharmacy/DrugStockList';
import { ph, webData } from '../../components/pharmacy/pharmacyUi';
import { COLORS } from '../../constants/theme';
import { checkWalkin, getMe, loadSession, PharmacyApiError, PharmacyAuthError, type ExtractedDrug } from '../../lib/pharmacyApi';
import { hasStockCheck, type PharmacyPlan } from '../../lib/pharmacyPlan';
import { pickPhoto, type PreparedPhoto } from '../../lib/photoPrep';
import { loadRealIndex, type RealIndex } from '../../lib/stock/realdata';
import { loadStock } from '../../lib/stock/stockStore';

const MAX_PHOTOS = 2;
// this browser has seen the notice that walk-in images go to the AI (US) and are not kept
const NOTICE_KEY = 'rxhelper.walkinNotice.v1';

function noticeSeen(): boolean {
  try {
    return globalThis.localStorage?.getItem(NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberNotice(): void {
  try {
    globalThis.localStorage?.setItem(NOTICE_KEY, '1');
  } catch {
    // private mode: asked again next time
  }
}

// Plan A: a prescription handed in at the counter (外来). Photograph it on the tablet or pick a scanned image; the AI
// reads the medicines (POST /pharmacy/check, nothing is stored) and the stock check runs here against the saved CSV.
export default function WalkinCheckScreen() {
  const router = useRouter();
  const session = loadSession();
  const [plan, setPlan] = useState<PharmacyPlan | null>(session?.pharmacy.plan ?? null);
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [agreed, setAgreed] = useState(noticeSeen);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [drugs, setDrugs] = useState<ExtractedDrug[] | null>(null);
  const [index, setIndex] = useState<RealIndex | null>(null);
  const stock = loadStock();

  useEffect(() => {
    if (!session) {
      router.replace('/pharmacy/login');
      return;
    }
    getMe()
      .then((me) => setPlan(me.plan))
      .catch((e) => {
        if (e instanceof PharmacyAuthError) router.replace('/pharmacy/login');
      });
    loadRealIndex()
      .then(setIndex)
      .catch(() => setError('照合用のデータを読み込めませんでした。在庫の照合は使えません。'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addPhoto(source: 'camera' | 'library') {
    setError('');
    if (photos.length >= MAX_PHOTOS) return;
    try {
      const p = await pickPhoto(source);
      if (p === 'denied') setError('カメラや写真を使う許可がありません。ブラウザの設定を確認してください。');
      else if (p === 'too_large') setError('画像が大きすぎます。解像度を下げてスキャンするか、撮影し直してください。');
      else if (p) {
        setPhotos((prev) => [...prev, p].slice(0, MAX_PHOTOS));
        setDrugs(null);
      }
    } catch (e) {
      console.warn('walkin_photo_failed', e);
      setError('画像を読み込めませんでした。JPEGかPNGの画像をお使いください。');
    }
  }

  async function read() {
    if (photos.length === 0 || !agreed || busy) return;
    rememberNotice();
    setBusy(true);
    setError('');
    setDrugs(null);
    try {
      setDrugs(await checkWalkin(photos.map((p) => ({ base64: p.base64, mediaType: 'image/jpeg' }))));
    } catch (e) {
      if (e instanceof PharmacyAuthError) {
        router.replace('/pharmacy/login');
        return;
      }
      const c = e instanceof PharmacyApiError ? e.code : 'server';
      setError(
        c === 'plan'
          ? 'このプランでは窓口照合を使えません。'
          : c === 'rate_limited'
            ? '今日の読み取り回数の上限に達しました。明日もう一度お試しください。'
            : c === 'image_too_large'
              ? '画像が大きすぎます。撮影し直してください。'
              : c === 'network'
                ? '送れませんでした。通信を確認してください。'
                : '読み取れませんでした。もう一度撮影するか、処方箋の原本で確認してください。',
      );
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setPhotos([]);
    setDrugs(null);
    setError('');
  }

  if (!session) return null;
  if (plan && !hasStockCheck(plan)) {
    return (
      <ScrollView contentContainerStyle={ph.narrow}>
        <Text style={ph.body}>このプランでは窓口照合を使えません。</Text>
        <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={() => router.replace('/pharmacy')}>
          <Text style={ph.secondaryText}>受付画面に戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const canRead = photos.length > 0 && agreed && !busy;

  return (
    <ScrollView contentContainerStyle={ph.page}>
      <View style={[ph.row, { justifyContent: 'space-between' }]} {...webData({ noprint: 'true' })}>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/pharmacy')}>
          <Text style={ph.link}>← 受付画面</Text>
        </TouchableOpacity>
      </View>
      <Text style={ph.title}>窓口の処方箋チェック</Text>

      <View style={ph.card} {...webData({ noprint: 'true' })}>
        <Text style={ph.h2}>1. 処方箋の画像</Text>
        <Text style={ph.small}>タブレットで撮影するか、スキャナで取り込んだ画像（JPEG・PNG）を選んでください。2枚まで（2ページの処方箋など）。</Text>
        <View style={ph.row}>
          {photos.map((p, i) => (
            <View key={p.uri} style={{ gap: 4, alignItems: 'center' }}>
              <Image source={{ uri: p.uri }} style={{ width: 140, height: 186, borderRadius: 8, backgroundColor: COLORS.chipBg }} resizeMode="contain" />
              <TouchableOpacity accessibilityRole="button" onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}>
                <Text style={ph.link}>削除</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        {photos.length < MAX_PHOTOS && (
          <View style={ph.row}>
            <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={() => addPhoto('camera')}>
              <Text style={ph.secondaryText}>撮影する</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={() => addPhoto('library')}>
              <Text style={ph.secondaryText}>画像を選ぶ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={ph.card} {...webData({ noprint: 'true' })}>
        <Text style={ph.h2}>2. AIで読み取る</Text>
        <Text style={ph.small}>
          画像は薬の読み取りにだけ使い、保存しません（米国のAIサービスに送信します）。読み取り結果は参考です。必ず処方箋の原本で確認してください。
        </Text>
        {!noticeSeen() && (
          <TouchableOpacity
            accessibilityRole="checkbox"
            aria-checked={agreed}
            style={[ph.row, { paddingVertical: 4 }]}
            onPress={() => setAgreed((v) => !v)}
          >
            <Text style={[ph.body, { fontWeight: '700' }]}>{agreed ? '☑' : '☐'}</Text>
            <Text style={ph.body}>上の内容を確認しました（この端末で初回のみ）</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          aria-disabled={!canRead}
          disabled={!canRead}
          style={[ph.primary, { alignSelf: 'flex-start' }, !canRead && ph.disabled]}
          onPress={read}
        >
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ph.primaryText}>読み取る</Text>}
        </TouchableOpacity>
        {busy && <Text style={ph.body}>AIが読み取り中です…</Text>}
        {!!error && <Text style={ph.error}>{error}</Text>}
      </View>

      {drugs && (
        <View style={ph.card}>
          <Text style={ph.h2}>処方の内容と在庫（参考）</Text>
          <Text style={ph.small}>AIが画像から読み取った参考情報です。判断は処方箋の原本で確認してください。</Text>
          {drugs.length === 0 && <Text style={ph.body}>薬を読み取れませんでした。原本で確認してください。</Text>}
          {!stock && drugs.length > 0 && <Text style={ph.small}>在庫CSVを読み込むと、在庫数との照合も表示します（受付画面から）。</Text>}
          <DrugStockList drugs={drugs} index={index} stock={stock} />
          <View style={ph.row} {...webData({ noprint: 'true' })}>
            <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={() => Platform.OS === 'web' && window.print()}>
              <Text style={ph.secondaryText}>印刷</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={ph.primary} onPress={next}>
              <Text style={ph.primaryText}>次の処方箋へ</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
