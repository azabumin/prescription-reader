// Native (iOS/Android) fallback — AdSense is a web product. This is a no-op
// so importing AdBanner is safe everywhere; the real implementation is
// AdBanner.web.tsx, which Metro picks automatically on web builds.
export default function AdBanner() {
  return null;
}
