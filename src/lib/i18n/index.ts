import { en } from './en';
import { tr, type Mesajlar } from './tr';

/**
 * Arayüz dili: Türkçe ya da İngilizce. İlk açılışta seçim yoksa önce bağlantıdaki dil (`?l=en`: paylaşanın
 * dili), sonra cihazın dili (Türkçeyse Türkçe, değilse İngilizce); "Hesabım"dan ya da giriş ekranından
 * seçilirse o hatırlanır. Metinler iki sözlükte (tr.ts, en.ts); İngilizce sözlük Türkçeyle aynı yapıda olmak
 * zorunda olduğu için eksik çeviri derlemede yakalanır.
 *
 * Bu modül React'e dokunmuyor, sunucu bileşenleri de içe aktarabiliyor; bağlam ve kancalar `DilBaglami.tsx`'te.
 *
 * Dil değişince bütün sayfa o dilde yeniden kurulur (`DilKoku`). Sunucu ilk çizimi isteğin dilinde yapar
 * (`sunucu.ts` → `istekDili`: çerez, sonra tarayıcının dili); seçim bu yüzden bir çereze de yazılıyor.
 * Sunucuda da çizilen istemci bileşenleri metni bağlamdan okur (`DilBaglami.tsx` → `useMesajlar`); yalnızca
 * tarayıcıda çalışan kod `messages()`tan. Sunucu bileşenleri ve görseller `sozluk(dil)` kullanır.
 */
export type Dil = 'tr' | 'en';
export type { Mesajlar };

export const DIL_DEPO = 'siralama-defteri:dil';
/** Sunucunun okuduğu çerez: localStorage'daki seçimin aynısı. */
export const DIL_CEREZ = 'sd-dil';
/** Bağlantıdaki dil: paylaşım bağlantıları paylaşanın dilini taşır. */
export const DIL_PARAMETRE = 'l';

const SOZLUKLER: Record<Dil, Mesajlar> = { tr, en };

export const dilMi = (d: unknown): d is Dil => d === 'tr' || d === 'en';

/** Sunucu bileşenleri ve görseller için: modül durumuna dokunmadan bir dilin metinleri. */
export function sozluk(dil: Dil): Mesajlar {
  return SOZLUKLER[dil];
}

/** Şu an çizilen dil; `DilKoku` her çizimde günceller. Testlerde ve sunucuda Türkçe. */
let simdiki: Dil = 'tr';
let secilen: Dil | null = null;
const dinleyiciler = new Set<() => void>();

const cerezYaz = (dil: Dil) => {
  document.cookie = `${DIL_CEREZ}=${dil}; path=/; max-age=31536000; samesite=lax`;
};

/**
 * Sunucunun bulduğu dille (`sunucu.ts` → `istekDili`) aynı sırayla: seçim, bağlantı, cihaz. Seçim hem
 * depoda hem çerezde; çerezi olmayan eski bir seçim çereze de yazılıyor, sonraki açılışta sunucu da
 * görsün.
 */
function diliBul(): Dil {
  const cerez = document.cookie.match(new RegExp(`(?:^|; )${DIL_CEREZ}=([^;]*)`))?.[1];
  try {
    const kayitli = localStorage.getItem(DIL_DEPO);
    if (dilMi(kayitli)) {
      if (cerez !== kayitli) cerezYaz(kayitli);
      return kayitli;
    }
  } catch {
    // Depolama kapalı; çereze, bağlantıya ve cihaz diline bakılır.
  }
  if (dilMi(cerez)) return cerez;
  const baglanti = new URLSearchParams(window.location.search).get(DIL_PARAMETRE);
  if (dilMi(baglanti)) return baglanti;
  const cihaz = (navigator.languages?.[0] ?? navigator.language ?? 'tr').toLowerCase();
  return cihaz.startsWith('tr') ? 'tr' : 'en';
}

/** Kişinin dili (seçimi, bağlantı ya da cihaz); `DilKoku` buna abone oluyor. */
export function diliOku(): Dil {
  secilen ??= diliBul();
  return secilen;
}

export function dileAbone(dinleyici: () => void) {
  dinleyiciler.add(dinleyici);
  return () => {
    dinleyiciler.delete(dinleyici);
  };
}

export function diliSec(dil: Dil) {
  secilen = dil;
  try {
    localStorage.setItem(DIL_DEPO, dil);
  } catch {
    // Depolama kapalı; seçim bu sayfa yaşamı boyunca geçerli.
  }
  cerezYaz(dil);
  dinleyiciler.forEach(d => d());
}

/** `DilKoku` çizerken çağırır; altındaki her şey bu dilde çizilir. */
export function diliUygula(dil: Dil) {
  simdiki = dil;
}

/** `messages()` gibi: yalnızca tarayıcıda; sunucuda çizilen bileşenlerde `useDilim()`. */
export function simdikiDil(): Dil {
  return simdiki;
}

/**
 * Şu anki dilin metinleri — yalnızca tarayıcıda çalışan kod için (olay işleyicileri, `AuthGate`
 * arkasındaki ekranlar). Sunucuda da çizilen bileşenler `useMesajlar()` kullanmalı (`DilBaglami.tsx`);
 * sunucuda bu fonksiyon hep Türkçe döner, geliştirmede de uyarır.
 */
export function messages(): Mesajlar {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn('[dil] messages() sunucuda çağrıldı; çizimde useMesajlar() kullanılmalı.\n'
      + new Error().stack?.split('\n').slice(2, 5).join('\n'));
  }
  return SOZLUKLER[simdiki];
}

/** Tarih, sayı ve büyük harf dönüşümleri için dil etiketi. */
export function dilEtiketi(dil: Dil = simdiki): string {
  return dil === 'en' ? 'en-GB' : 'tr-TR';
}
