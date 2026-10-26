import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { JapaneseCard } from '../../components/JapaneseCard';
import { formatJaTime, ph, STATUS_JA, webData } from '../../components/pharmacy/pharmacyUi';
import { COLORS } from '../../constants/theme';
import {
  getIntake,
  getIntakeImageUrl,
  listTemplates,
  markDone,
  PharmacyApiError,
  PharmacyAuthError,
  postMessage,
  previewTranslation,
  reply,
  type IntakeDetail,
} from '../../lib/pharmacyApi';
import { LANG_NAME_JA } from '../../lib/pharmacyCardStrings';
import { SEND_STRINGS } from '../../lib/sendStrings';
import { matchDrug, needQuantity, VERDICT_LABELS, type DrugMatch } from '../../lib/stock/match';
import { loadRealIndex, SUPPLY_LABELS, type RealIndex } from '../../lib/stock/realdata';
import { loadStock } from '../../lib/stock/stockStore';

const LATER_TIMES = ['17:00', '18:00', '19:00', '20:00'];
const VERDICT_COLOR = { ok: COLORS.primary, short: '#B7791F', none: COLORS.danger, unknown: COLORS.textMuted } as const;

export default function PharmacyIntakeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // /pharmacy/intake?id=… (static hosting has no dynamic routes)
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [detail, setDetail] = useState<IntakeDetail | null>(null);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [zoom, setZoom] = useState<string | null>(null);
  const [index, setIndex] = useState<RealIndex | null>(null);
  const [templates, setTemplates] = useState<{ key: string; textJa: string }[]>([]);
  const [templateKey, setTemplateKey] = useState('');
  const [laterTime, setLaterTime] = useState('18:00');
  const [freeJa, setFreeJa] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmDone, setConfirmDone] = useState(false);
  const polls = useRef(0);
  const stock = loadStock();

  const handle = useCallback(
    (e: unknown, fallback: string) => {
      if (e instanceof PharmacyAuthError) router.replace('/pharmacy/login');
      else if (e instanceof PharmacyApiError && e.code === 'gone') setGone(true);
      else setError(fallback);
    },
    [router],
  );

  const load = useCallback(async () => {
    try {
      const d = await getIntake(String(id));
      setDetail(d);
      return d;
    } catch (e) {
      handle(e, '読み込めませんでした。通信を確認してください。');
      return null;
    }
  }, [id, handle]);

  useEffect(() => {
    let urls: string[] = [];
    load().then(async (d) => {
      if (!d) return;
      try {
        urls = await Promise.all(Array.from({ length: d.imageCount }, (_, i) => getIntakeImageUrl(d.id, i)));
        setImages(urls);
      } catch (e) {
        handle(e, '写真を読み込めませんでした。');
      }
    });
    listTemplates().then(setTemplates).catch(() => {});
    loadRealIndex()
      .then(setIndex)
      .catch(() => setError('照合用のデータを読み込めませんでした。在庫の照合は使えません。'));
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [load, handle]);

  // the AI reads the photo right after the send; check back every few seconds until it's finished
  useEffect(() => {
    if (detail?.drugsStatus !== 'pending' || polls.current > 30) return;
    const t = setTimeout(() => {
      polls.current += 1;
      load();
    }, 4000);
    return () => clearTimeout(t);
  }, [detail, load]);

  async function act(label: string, fn: () => Promise<void>, done: string) {
    setBusy(label);
    setNotice('');
    setError('');
    try {
      await fn();
      setNotice(done);
      await load();
    } catch (e) {
      handle(e, '送れませんでした。もう一度お試しください。');
    } finally {
      setBusy('');
    }
  }

  async function checkTranslation() {
    if (!detail || !freeJa.trim()) return;
    setBusy('preview');
    setError('');
    try {
      setPreview(await previewTranslation(freeJa.trim(), detail.lang));
    } catch (e) {
      handle(e, '翻訳できませんでした。もう一度お試しください。');
    } finally {
      setBusy('');
    }
  }

  async function finish() {
    if (!detail) return;
    setBusy('done');
    try {
      await markDone(detail.id);
      router.replace('/pharmacy');
    } catch (e) {
      handle(e, '完了にできませんでした。');
      setBusy('');
    }
  }

  if (gone) {
    return (
      <ScrollView contentContainerStyle={ph.narrow}>
        <Text style={ph.body}>この受付は削除されました（7日経過または完了）。</Text>
        <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={() => router.replace('/pharmacy')}>
          <Text style={ph.secondaryText}>受信箱に戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  if (!detail) {
    return (
      <ScrollView contentContainerStyle={ph.page}>
        {error ? <Text style={ph.error}>{error}</Text> : <ActivityIndicator color={COLORS.primary} />}
      </ScrollView>
    );
  }

  const isDone = detail.status === 'done';
  const matches: (DrugMatch | null)[] = (detail.drugs ?? []).map((d) => (index ? matchDrug(d, index, stock?.rows ?? null) : null));

  const photoColumn = (
    <View style={[ph.card, wide && { flex: 1 }]}>
      <Text style={ph.h2}>処方箋の写真</Text>
      {images.length === 0 && !isDone && <ActivityIndicator color={COLORS.primary} />}
      {isDone && <Text style={ph.small}>完了済みのため、写真は削除されています。</Text>}
      {images.map((u) => (
        <TouchableOpacity key={u} accessibilityRole="button" accessibilityLabel="写真を拡大" onPress={() => setZoom(zoom === u ? null : u)}>
          <Image source={{ uri: u }} style={{ width: '100%', aspectRatio: zoom === u ? undefined : 3 / 4, height: zoom === u ? 1200 : undefined, borderRadius: 8 }} resizeMode="contain" />
        </TouchableOpacity>
      ))}
      {images.length > 0 && <Text style={ph.small}>写真をタップすると大きく表示します。</Text>}
    </View>
  );

  const drugColumn = (
    <View style={[ph.card, wide && { flex: 1.3 }]}>
      <Text style={ph.h2}>処方の内容と在庫（参考）</Text>
      <Text style={ph.small}>AIが写真から読み取った参考情報です。判断は写真と処方箋の原本で確認してください。</Text>
      {detail.drugsStatus === 'pending' && <Text style={ph.body}>AIが読み取り中です…</Text>}
      {detail.drugsStatus === 'failed' && <Text style={ph.error}>読み取れませんでした。写真で確認してください。</Text>}
      {!stock && detail.drugs && <Text style={ph.small}>在庫CSVを読み込むと、在庫数との照合も表示します（受信箱の画面から）。</Text>}
      {(detail.drugs ?? []).map((d, i) => {
        const m = matches[i];
        const need = needQuantity(d);
        return (
          <View key={i} style={{ borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, gap: 2 }}>
            <View style={[ph.row, { justifyContent: 'space-between' }]}>
              <Text style={[ph.body, { fontWeight: '700', flexShrink: 1 }]}>
                {d.generic ? '【般】' : ''}
                {d.name}
              </Text>
              {m && stock && <Text style={{ color: VERDICT_COLOR[m.verdict], fontWeight: '800' }}>{VERDICT_LABELS[m.verdict]}</Text>}
            </View>
            <Text style={ph.small}>{d.rawText}</Text>
            <Text style={ph.small}>
              必要量：{need === null ? '—' : `${need}${d.unit}`}
              {m && m.stockQty !== null ? `　在庫：${m.stockQty}${d.unit}` : ''}
              {m && m.stockNames.length > 0 ? `（${m.stockNames.join('、')}）` : ''}
            </Text>
            {m && m.supply.length > 0 && (
              <Text style={ph.small}>
                出荷状況：
                {m.supply
                  .filter((s) => s.status !== 0)
                  .slice(0, 3)
                  .map((s) => `${s.name} ${SUPPLY_LABELS[s.status]}`)
                  .join('、') || 'すべて通常出荷'}
                　／　通常出荷の製品 {m.normalAlternatives}／{m.groupSize}件
              </Text>
            )}
            {m && m.groupSize === 0 && <Text style={ph.small}>照合用データにない薬です（外用薬・注射薬など）。目で確認してください。</Text>}
          </View>
        );
      })}
      {index && <Text style={ph.small}>照合用データ：厚労省 薬価基準（{index.asof.yakka}）・供給状況（{index.asof.supply}取得）</Text>}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={ph.page}>
      <View style={[ph.row, { justifyContent: 'space-between' }]} {...webData({ noprint: 'true' })}>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/pharmacy')}>
          <Text style={ph.link}>← 受信箱</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={ph.secondary} onPress={() => Platform.OS === 'web' && window.print()}>
          <Text style={ph.secondaryText}>問診票（日本語）を印刷</Text>
        </TouchableOpacity>
      </View>

      <View style={ph.card}>
        <Text style={ph.title}>
          {formatJaTime(detail.createdAt)} 受付　{LANG_NAME_JA[detail.lang]}
        </Text>
        <Text style={ph.body}>
          受け取り希望：{SEND_STRINGS.ja.pickup[detail.pickup]}　／　状態：{STATUS_JA[detail.status]}
          {detail.status === 'later' && detail.laterTime ? `（${detail.laterTime}以降）` : ''}
        </Text>
      </View>

      <View style={wide ? { flexDirection: 'row', gap: 16, alignItems: 'flex-start' } : { gap: 16 }} {...webData({ noprint: 'true' })}>
        {photoColumn}
        {drugColumn}
      </View>

      <View style={ph.card}>
        <Text style={ph.h2}>初回アンケートの答え（日本語）</Text>
        {detail.card ? <JapaneseCard card={detail.card} /> : <Text style={ph.small}>完了済みのため、回答は削除されています。</Text>}
      </View>

      {!isDone && (
        <View style={ph.card} {...webData({ noprint: 'true' })}>
          <Text style={ph.h2}>患者さんへの返信</Text>
          <Text style={ph.small}>患者さんのスマホに、患者さんの言語（{LANG_NAME_JA[detail.lang]}）で表示されます。</Text>
          <View style={ph.row}>
            <TouchableOpacity accessibilityRole="button" style={ph.primary} disabled={!!busy} onPress={() => act('ready', () => reply(detail.id, 'ready'), '「準備できました」を送りました。')}>
              <Text style={ph.primaryText}>準備できました</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={ph.secondary} disabled={!!busy} onPress={() => act('inquiry', () => reply(detail.id, 'inquiry'), '「疑義照会中」を送りました。')}>
              <Text style={ph.secondaryText}>疑義照会中</Text>
            </TouchableOpacity>
          </View>
          <View style={ph.row}>
            {LATER_TIMES.map((t) => (
              <TouchableOpacity key={t} accessibilityRole="radio" aria-checked={t === laterTime} style={[ph.chip, t === laterTime && ph.chipOn]} onPress={() => setLaterTime(t)}>
                <Text style={[ph.chipText, t === laterTime && ph.chipTextOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              accessibilityRole="button"
              style={ph.secondary}
              disabled={!!busy}
              onPress={() => act('later', () => reply(detail.id, 'later', laterTime), `「${laterTime}以降にご用意」を送りました。`)}
            >
              <Text style={ph.secondaryText}>{laterTime}以降にご用意</Text>
            </TouchableOpacity>
          </View>

          <Text style={[ph.h2, { marginTop: 8 }]}>メッセージ（翻訳して送ります）</Text>
          {templates.map((t) => (
            <TouchableOpacity key={t.key} accessibilityRole="radio" aria-checked={t.key === templateKey} style={[ph.chip, t.key === templateKey && ph.chipOn, { alignSelf: 'flex-start' }]} onPress={() => setTemplateKey(t.key)}>
              <Text style={[ph.chipText, t.key === templateKey && ph.chipTextOn]}>{t.textJa}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            aria-disabled={!templateKey}
            style={[ph.secondary, { alignSelf: 'flex-start' }, !templateKey && ph.disabled]}
            disabled={!templateKey || !!busy}
            onPress={() => act('template', () => postMessage(detail.id, { kind: 'template', templateKey }), '定型メッセージを送りました。').then(() => setTemplateKey(''))}
          >
            <Text style={ph.secondaryText}>選んだメッセージを送る</Text>
          </TouchableOpacity>

          <TextInput
            style={[ph.input, { minHeight: 70 }]}
            value={freeJa}
            onChangeText={(v) => {
              setFreeJa(v);
              setPreview(null);
            }}
            multiline
            placeholder="自由に書く（日本語）"
            accessibilityLabel="自由に書くメッセージ（日本語）"
          />
          <View style={ph.row}>
            <TouchableOpacity accessibilityRole="button" style={ph.secondary} disabled={!freeJa.trim() || !!busy} onPress={checkTranslation}>
              {busy === 'preview' ? <ActivityIndicator color={COLORS.primary} /> : <Text style={ph.secondaryText}>訳を確認</Text>}
            </TouchableOpacity>
          </View>
          {preview !== null && (
            <View style={[ph.card, { backgroundColor: COLORS.bg }]}>
              <Text style={ph.small}>患者さんに表示される訳（{LANG_NAME_JA[detail.lang]}）</Text>
              <Text style={ph.body}>{preview}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={[ph.primary, { alignSelf: 'flex-start' }]}
                disabled={!!busy}
                onPress={() =>
                  act('free', () => postMessage(detail.id, { kind: 'free', textJa: freeJa.trim(), textPatient: preview }), 'メッセージを送りました。').then(() => {
                    setFreeJa('');
                    setPreview(null);
                  })
                }
              >
                <Text style={ph.primaryText}>この内容で送る</Text>
              </TouchableOpacity>
            </View>
          )}
          {!!notice && <Text style={ph.ok}>{notice}</Text>}
          {!!error && <Text style={ph.error}>{error}</Text>}
        </View>
      )}

      {detail.messages.length > 0 && (
        <View style={ph.card} {...webData({ noprint: 'true' })}>
          <Text style={ph.h2}>送ったメッセージ</Text>
          {detail.messages.map((m) => (
            <View key={m.createdAt + m.textJa} style={{ gap: 2 }}>
              <Text style={ph.body}>{m.textJa}</Text>
              {detail.lang !== 'ja' && <Text style={ph.small}>（患者さんの画面：{m.textPatient}）</Text>}
              <Text style={ph.small}>{formatJaTime(m.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}

      {!isDone && (
        <View style={ph.card} {...webData({ noprint: 'true' })}>
          {!confirmDone ? (
            <TouchableOpacity accessibilityRole="button" style={[ph.danger, { alignSelf: 'flex-start' }]} onPress={() => setConfirmDone(true)}>
              <Text style={ph.dangerText}>完了（データを削除）</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={ph.body}>写真と回答、メッセージを削除します。元に戻せません。</Text>
              <View style={ph.row}>
                <TouchableOpacity accessibilityRole="button" style={ph.danger} disabled={busy === 'done'} onPress={finish}>
                  {busy === 'done' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ph.dangerText}>削除して完了</Text>}
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" onPress={() => setConfirmDone(false)}>
                  <Text style={ph.link}>やめる</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}
