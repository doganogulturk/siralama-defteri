/*
 * Web sitesi ile uygulama paketi (Capacitor, App Store) aynı koddan iki derleme:
 *   • web (`next build`): Vercel'de, sunucu rotalarıyla (paylaşım sayfaları, görseller);
 *   • mobil (`npm run mobil`, NEXT_PUBLIC_MOBIL=1): statik dışa aktarma, ekranlar cihazın içinde.
 * Mobilde sunucu rotaları yok: paylaşım bağlantıları ve sonuç/story görselleri canlı siteden geliyor.
 * Ayrım `next.config.ts` → `pageExtensions` (`*.web.tsx` yalnızca webde, `*.mobil.tsx` yalnızca
 * mobilde) ve bu dosya. Ayrıntılar docs/mimari.md → Uygulama paketi.
 */

/** Uygulama paketi mi (statik dışa aktarma). Derlemede sabitleniyor. */
export const MOBIL = process.env.NEXT_PUBLIC_MOBIL === '1';

/** Herkese açık sitenin adresi: paylaşım bağlantıları, sunucu görselleri, uygulamadan açılan sayfalar. */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siralama-defteri.vercel.app').replace(/\/$/, '');

/**
 * Başkasına gidecek bağlantıların kökü: webde sayfanın kendi adresi (yerelde localhost, önizlemede
 * önizleme adresi), uygulamada canlı site (uygulamanın kendi adresi `capacitor://localhost`).
 */
export const paylasimKoku = (): string => (MOBIL ? SITE : window.location.origin);

/** Sunucu rotasının (görsel, story) adresi: webde göreli, uygulamada canlı sitede. */
export const sunucuAdresi = (yol: string): string => (MOBIL ? `${SITE}${yol}` : yol);

/** Bir listenin sıralama ekranı (iki derlemede aynı). */
export const listeAdresi = (slug: string): string => `/liste?s=${encodeURIComponent(slug)}`;

/** "Ben de sıralayayım" / karşılaştırma ekranı (iki derlemede aynı). */
export const kiyasAdresi = (kod: string): string => `/kiyasla?k=${encodeURIComponent(kod)}`;

/**
 * Paylaşım sayfası: webde site içinde, uygulamada canlı sitede (uygulamanın içinde değil; sistem
 * tarayıcısında açılır). Sunucuda çiziliyor, uygulama paketinde yok.
 */
export const paylasimSayfasi = (kod: string): string => sunucuAdresi(`/p/${kod}`);
