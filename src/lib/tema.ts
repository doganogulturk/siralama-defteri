/**
 * Görünüm teması: sistemi izle (varsayılan), hep açık ya da hep koyu. Seçim `<html data-tema>` olarak
 * uygulanıyor; `globals.css` koyu renkleri hem sistem koyuyken (seçim "acik" değilse) hem `data-tema="koyu"`
 * iken açıyor. "sistem"de öznitelik yok, CSS yalnızca cihaza bakıyor.
 *
 * Seçim dildeki gibi hem depoda hem çerezde: sunucu ilk çizimi seçilen temayla yapıyor (kök düzen), bir an
 * yanlış renk görünmüyor. Uygulama paketinde çerez yok: iOS, depodaki seçimi sayfa başlamadan uygulayan küçük
 * bir betiği WebView'e ekliyor (`UygulamaViewController.swift`, `TEMA_BETIGI`'nin aynısı). Seçim iOS'a da
 * gidiyor (`TemaPlugin`): durum çubuğu ve sayfa yüklenene kadarki zemin de seçimi izlesin.
 *
 * Bu modül React'e dokunmuyor; sunucu bileşenleri de içe aktarabiliyor.
 */
export type Tema = 'sistem' | 'acik' | 'koyu';

export const TEMALAR: Tema[] = ['sistem', 'acik', 'koyu'];
export const TEMA_DEPO = 'siralama-defteri:tema';
/** Sunucunun okuduğu çerez: depodaki seçimin aynısı. */
export const TEMA_CEREZ = 'sd-tema';

/** Tarayıcı çubuğunun rengi (layout.tsx → viewport.themeColor ile aynı): sayfa zemini. */
export const TEMA_RENGI = { acik: '#f8f7f4', koyu: '#100e0c' } as const;

export const temaMi = (t: unknown): t is Tema => t === 'sistem' || t === 'acik' || t === 'koyu';

/** Görünen tema: seçim "sistem"se cihazınki. */
export function gorunenTema(secim: Tema, sistemKoyu: boolean): 'acik' | 'koyu' {
  if (secim === 'sistem') return sistemKoyu ? 'koyu' : 'acik';
  return secim;
}

/** `<html data-tema>` değeri: "sistem"de öznitelik yok. */
export const temaOzniteligi = (secim: Tema): 'acik' | 'koyu' | undefined =>
  secim === 'sistem' ? undefined : secim;

/** Depodaki ya da çerezdeki değerden seçim; tanınmayan değer "sistem". Depo önce gelir (çerez onun kopyası). */
export function kayitliTema(depo: string | null | undefined, cerez: string | null | undefined): Tema {
  if (temaMi(depo)) return depo;
  if (temaMi(cerez)) return cerez;
  return 'sistem';
}

/**
 * Sayfa başlamadan çalışan betik: depodaki seçimi `data-tema` olarak uyguluyor. Uygulama paketi derlemede
 * çiziliyor, sunucu çerezi göremiyor; iOS bunu WebView'e belge başında ekliyor. **Aynısı
 * `ios/App/App/UygulamaViewController.swift`'te** (Swift dizgisi); biri değişirse öbürü de. Düz JS, React'ten
 * bağımsız; satır içi `<script>` olarak sayfaya konmuyor (React 19 bunu hata sayıyor, Next'in `beforeInteractive`'i
 * de hidrasyonla birlikte çalışıyor, yani ilk boyamadan sonra).
 */
export const TEMA_BETIGI = `(function(){try{var d=localStorage.getItem(${JSON.stringify(TEMA_DEPO)});if(d==='acik'||d==='koyu'){document.documentElement.setAttribute('data-tema',d)}else if(d==='sistem'){document.documentElement.removeAttribute('data-tema')}}catch(e){}})()`;

// ── Tarayıcı ─────────────────────────────────────────────────────────────

const dinleyiciler = new Set<() => void>();
let secilen: Tema | null = null;

const cerezOku = () => document.cookie.match(new RegExp(`(?:^|; )${TEMA_CEREZ}=([^;]*)`))?.[1];
const cerezYaz = (tema: Tema) => {
  document.cookie = `${TEMA_CEREZ}=${tema}; path=/; max-age=31536000; samesite=lax`;
};

/** Kişinin seçimi (depo, sonra çerez, yoksa "sistem"). */
export function temaOku(): Tema {
  if (secilen) return secilen;
  let depo: string | null = null;
  try {
    depo = localStorage.getItem(TEMA_DEPO);
  } catch {
    // Depolama kapalı: çereze bakılır.
  }
  secilen = kayitliTema(depo, cerezOku());
  return secilen;
}

export function temayaAbone(dinleyici: () => void) {
  dinleyiciler.add(dinleyici);
  return () => {
    dinleyiciler.delete(dinleyici);
  };
}

/** Uygulamada seçimi iOS'a da bildirir; webde ya da eklenti yoksa sessizce geçer. */
async function yerelTemaAyarla(tema: Tema) {
  const { Capacitor, registerPlugin } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) return;
  const eklenti = registerPlugin<{ ayarla(s: { tema: Tema }): Promise<void> }>('Tema');
  await eklenti.ayarla({ tema }).catch(() => undefined);
}

/**
 * Seçimi sayfaya uygular: `data-tema`, ve tarayıcı çubuğunun rengi (layout'taki `theme-color` etiketleri
 * cihaz temasına göre iki tane; elle seçimde ikisi de seçilen temanın rengi).
 */
export function temayiUygula(tema: Tema) {
  const kok = document.documentElement;
  const oznitelik = temaOzniteligi(tema);
  if (oznitelik) kok.setAttribute('data-tema', oznitelik);
  else kok.removeAttribute('data-tema');
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => {
    const cihazKoyu = (meta.media ?? '').includes('dark');
    meta.content = TEMA_RENGI[gorunenTema(tema, cihazKoyu)];
  });
}

/** Temayı seçer: depoya ve çereze yazar, uygular, iOS'a bildirir. */
export function temaSec(tema: Tema) {
  secilen = tema;
  try {
    localStorage.setItem(TEMA_DEPO, tema);
  } catch {
    // Depolama kapalı: çerez yine de yazılıyor.
  }
  cerezYaz(tema);
  temayiUygula(tema);
  void yerelTemaAyarla(tema);
  dinleyiciler.forEach(d => d());
}

/** Sayfa açılınca bir kez (kök düzen → `TemaKoku`): tarayıcı çubuğu ve iOS seçimle uyumlu olsun. */
export function temayiBaslat() {
  const tema = temaOku();
  // Çerezi olmayan (süresi dolmuş, silinmiş) bir seçim: sonraki açılışta sunucu da görsün.
  if (tema !== 'sistem' && cerezOku() !== tema) cerezYaz(tema);
  temayiUygula(tema);
  void yerelTemaAyarla(tema);
}
