import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { ADSENSE_CLIENT_ID, ADSENSE_SLOT_ID } from '../constants/adsense';

let scriptInjected = false;

function ensureAdSenseScript(clientId: string) {
  if (scriptInjected || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
  scriptInjected = true;
}

// Renders nothing until ADSENSE_CLIENT_ID / ADSENSE_SLOT_ID are configured
// (see constants/adsense.ts) — safe to leave mounted while you wait on
// AdSense approval.
export default function AdBanner() {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) return;
    ensureAdSenseScript(ADSENSE_CLIENT_ID);
    try {
      // @ts-expect-error — adsbygoogle is injected globally by the script above
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not ready yet or blocked — fail silently, no ad shown
    }
  }, []);

  if (!ADSENSE_CLIENT_ID || !ADSENSE_SLOT_ID) return null;

  return (
    <View style={{ width: '100%', alignItems: 'center', marginTop: 16 }}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </View>
  );
}
