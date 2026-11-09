import type { CapacitorConfig } from '@capacitor/cli';

/*
 * App Store uygulaması (Capacitor). Ekranlar statik pakette, cihazın içinde (`npm run mobil`:
 * NEXT_PUBLIC_MOBIL=1 next build → out/); paylaşım sayfaları ve görseller canlı sitede
 * (`lib/site.ts`). appId mağazaya ilk yüklemeden sonra değiştirilemez: Apple Developer'daki
 * App ID ve Sign in with Apple ayarları bu kimlikle (docs/yol-haritasi.md → Mobil).
 */
const config: CapacitorConfig = {
  appId: 'com.siralamadefteri.app',
  appName: 'Sıralama Defteri',
  webDir: 'out',
  // Sayfa yüklenene kadar WebView'in zemini: açılıştan sonra bembeyaz bir an görünmesin (defter zemini).
  backgroundColor: '#f7f6f2',
  ios: {
    // Kareli kâğıt güvenli alanın altına da uzansın; içerik `env(safe-area-inset-*)` ile içeride.
    contentInset: 'never',
  },
};

export default config;
