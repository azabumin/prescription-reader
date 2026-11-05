import { createElement, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'qrcode';

import { ph } from '../../components/pharmacy/pharmacyUi';
import { COLORS } from '../../constants/theme';
import { flyerHtml } from '../../lib/flyerHtml';
import { getMe, loadSession, PharmacyAuthError } from '../../lib/pharmacyApi';
import { hasIntake } from '../../lib/pharmacyPlan';

// The counter flyer with this pharmacy's QR code (plans B / AB), shown as an A4 page and printed from here.
// The QR code is made in the browser; nothing is sent anywhere. Web only, like every pharmacy screen.
export default function PharmacyFlyerScreen() {
  const router = useRouter();
  const session = loadSession();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      router.replace('/pharmacy/login');
      return;
    }
    (async () => {
      try {
        const me = await getMe();
        if (!hasIntake(me.plan)) {
          setError('プランAでは、患者さんからの送信を受け付けないため、QRチラシはありません。');
          return;
        }
        const url = `${globalThis.location?.origin ?? 'https://rxhelper.jp'}/send?ph=${me.code}`;
        const qr = await QRCode.toDataURL(url, { margin: 1, width: 600, errorCorrectionLevel: 'M' });
        setHtml(flyerHtml(me.name, url, qr));
      } catch (e) {
        if (e instanceof PharmacyAuthError) router.replace('/pharmacy/login');
        else setError('読み込めませんでした。通信を確認してください。');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session) return null;

  return (
    <ScrollView contentContainerStyle={[ph.page, { maxWidth: 900 }]}>
      <View style={[ph.row, { justifyContent: 'space-between' }]}>
        <Text style={ph.title}>窓口用のQRチラシ</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/pharmacy')}>
          <Text style={ph.link}>受付画面に戻る</Text>
        </TouchableOpacity>
      </View>
      <Text style={ph.body}>
        窓口や待合に置く、患者さん向けのチラシです。QRコードはこの薬局専用です。「印刷する」でA4に印刷してください。
      </Text>
      {!!error && <Text style={ph.error}>{error}</Text>}
      {!error && !html && <ActivityIndicator color={COLORS.primary} />}
      {html && (
        <>
          <TouchableOpacity
            accessibilityRole="button"
            style={[ph.primary, { alignSelf: 'flex-start' }]}
            onPress={() => frame.current?.contentWindow?.print()}
          >
            <Text style={ph.primaryText}>印刷する</Text>
          </TouchableOpacity>
          {createElement('iframe', {
            ref: frame,
            srcDoc: html,
            title: '窓口用のQRチラシ',
            style: { width: '210mm', maxWidth: '100%', height: '297mm', border: `1px solid ${COLORS.border}`, background: '#FFFFFF' },
          })}
        </>
      )}
    </ScrollView>
  );
}
