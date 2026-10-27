import { en } from './en';
import { tr, type Mesajlar } from './tr';

/**
 * Arayüz dili: Türkçe ya da İngilizce. İlk açılışta seçim yoksa önce bağlantıdaki dil (`?l=en`: paylaşanın
 * dili), sonra cihazın dili (Türkçeyse Türkçe, değilse İngilizce); "Hesabım"dan ya da giriş ekranından
 * seçilirse o hatırlanır. Metinler iki sözlükte (tr.ts, en.ts); İngilizce sözlük Türkçeyle aynı yapıda olmak
 * zorunda olduğu için eksik çeviri derlemede yakalanır.
 *
 * Bu modül React'e dokunmuyor, sunucu bileşenleri de içe aktarabiliyor; kanca `useDil.ts`'te.
 *
 * Dil değişince bütün sayfa o dilde yeniden kurulur (`DilKoku`); bileşenler ve saf fonksiyonlar metni doğrudan
 * `messages()`tan okur. İstemci bileşenleri sunucuda ve ilk istemci çiziminde Türkçe çizilir, hidrasyon
 * uyuşmazlığı olmaz. Sunucuda çizilen sayfalar ve görseller (paylaşım sayfası, önizleme, story) dili isteğin
 * kendisinden alır (`sunucu.ts`): seçim bu yüzden bir çereze de yazılıyor.
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

function diliBul(): Dil {
  try {
    const kayitli = localStorage.getItem(DIL_DEPO);
    if (dilMi(kayitli)) return kayitli;
  } catch {
    // Depolama kapalı; bağlantıya ve cihaz diline bakılır.
  }
  const baglanti = new URLSearchParams(window.location.search).get(DIL_PARAMETRE);
  if (dilMi(baglanti)) return baglanti;
  const cihaz = (navigator.languages?.[0] ?? navigator.language ?? 'tr').toLowerCase();
  return cihaz.startsWith('tr') ? 'tr' : 'en';
}

/** Kişinin dili (seçimi, bağlantı ya da cihaz); `useDil` buna abone oluyor. */
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
  document.cookie = `${DIL_CEREZ}=${dil}; path=/; max-age=31536000; samesite=lax`;
  dinleyiciler.forEach(d => d());
}

/** `DilKoku` çizerken çağırır; altındaki her şey bu dilde çizilir. */
export function diliUygula(dil: Dil) {
  simdiki = dil;
}

export function simdikiDil(): Dil {
  return simdiki;
}

/** Şu anki dilin metinleri. */
export function messages(): Mesajlar {
  return SOZLUKLER[simdiki];
}

/** Tarih, sayı ve büyük harf dönüşümleri için dil etiketi. */
export function dilEtiketi(dil: Dil = simdiki): string {
  return dil === 'en' ? 'en-GB' : 'tr-TR';
}
