/**
 * Kullanıcının kendi listesinin kör sıralaması: paylaşılan listeden on kayıt birer
 * birer geliyor, arkadaş onları sahibinin sırasını görmeden diziyor; sonunda sahibiyle
 * uyum. Hiçbir şey kaydedilmiyor — sonuç adreste (`/p/[kod]/kor?s=`).
 *
 * Yalnızca paylaşımda görünen kayıtlar oyuna giriyor (sıralama ve "Bir daha asla");
 * denenmemişler zaten paylaşılmıyor.
 */

import { PaylasilanKayit, guvenliFoto } from './paylasim';
import { DIL_PARAMETRE, simdikiDil, sozluk, type Dil } from './i18n';

/** Oyundaki kayıt sayısı; bundan kısa liste kör sıralatılamıyor. */
export const KOR_ADET = 10;

export const korUygun = (kayitSayisi: number) => kayitSayisi >= KOR_ADET;

/** Oyuna giren kayıt: paylaşılan kaydın gerekenleri ve sahibinin sırası. */
export interface KorKayit {
  id: string;
  ad: string;
  alt_ad: string | null;
  /** Yalnızca uygulamanın kovasındaysa (`guvenliFoto`); yoksa null. */
  foto: string | null;
  /** Sahibinin sıralamasındaki yeri (1'den); "Bir daha asla"daysa null. */
  sahipSirasi: number | null;
}

/** Paylaşılan kayıtlar → oyunun kayıtları: sahibinin sırası ve yalnızca kendi kovadaki fotoğraf. */
export function korKayitlari(kayitlar: PaylasilanKayit[]): KorKayit[] {
  let sira = 0;
  return kayitlar.map(k => ({
    id: k.id,
    ad: k.ad,
    alt_ad: k.alt_ad ?? null,
    foto: guvenliFoto(k.fotograf_url),
    sahipSirasi: k.asla ? null : ++sira,
  }));
}

/**
 * Adresteki kısa kimlik: uuid'in ilk sekiz onaltılık hanesi. Bir listede en fazla 200
 * kayıt var; çakışma olasılığı ihmal edilebilir, olursa o kayıt sonuçtan düşüyor.
 */
export const kisaKimlik = (id: string) => id.replace(/-/g, '').slice(0, 8);

/** Rastgele on kayıt, geliş sırasıyla (Fisher–Yates'in ilk on adımı). */
export function korSec<T>(kayitlar: T[], rastgele: () => number = Math.random): T[] {
  const a = [...kayitlar];
  const n = Math.min(KOR_ADET, a.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rastgele() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Sonuç: birinci yuvadan onuncuya kısa kimlikler, "a1b2c3d4-…". */
export const korSonucYaz = (sira: Pick<KorKayit, 'id'>[]) => sira.map(k => kisaKimlik(k.id)).join('-');

/**
 * Adresteki sonucu listenin şimdiki kayıtlarına çeviriyor. Liste sonradan değişmiş
 * olabilir: silinen ya da adı karışan kayıt düşüyor; geriye üçten az kayıt kalırsa
 * (karşılaştırma anlamsızlaşır) ya da biçim bozuksa null.
 */
export function korSonucCoz<T extends Pick<KorKayit, 'id'>>(kayitlar: T[], s?: string | null): T[] | null {
  if (!s) return null;
  const parcalar = s.split('-');
  if (parcalar.length > KOR_ADET || parcalar.some(p => !/^[0-9a-f]{8}$/.test(p))) return null;
  const harita = new Map<string, T>();
  const cakisan = new Set<string>();
  for (const k of kayitlar) {
    const kk = kisaKimlik(k.id);
    if (harita.has(kk)) cakisan.add(kk);
    harita.set(kk, k);
  }
  const sira = parcalar
    .filter((p, i) => parcalar.indexOf(p) === i && !cakisan.has(p))
    .map(p => harita.get(p))
    .filter((k): k is T => !!k);
  return sira.length >= 3 ? sira : null;
}

/**
 * Kör sıralama ile sahibinin sırası arasındaki uyum (Kendall, `lib/kiyas.ts` ile aynı
 * kural): her kayıt çiftinde ikisi de aynı olanı mı öne koymuş? "Bir daha asla"daki
 * kayıtlar sahibinin sıralamasının altında ve kendi aralarında eşit; eşit çift sayılmıyor.
 * Kayıtlar adla değil kimlikle eşleşiyor: aynı listede aynı adlı iki kayıt olabilir.
 */
export function korUyum(sira: Pick<KorKayit, 'sahipSirasi'>[]): number | null {
  const sahipKonum = (k: Pick<KorKayit, 'sahipSirasi'>) => k.sahipSirasi ?? Number.MAX_SAFE_INTEGER;
  let ayni = 0;
  let ters = 0;
  for (let i = 0; i < sira.length; i++) {
    for (let j = i + 1; j < sira.length; j++) {
      // Benim sıramda i her zaman j'nin önünde.
      const o = Math.sign(sahipKonum(sira[j]) - sahipKonum(sira[i]));
      if (o > 0) ayni++;
      else if (o < 0) ters++;
    }
  }
  return ayni + ters > 0 ? Math.round((100 * ayni) / (ayni + ters)) : null;
}

/** Kör sıralama bağlantısı: paylaşanın dilinde (`?l=en`), paylaşım bağlantısıyla aynı kural. */
export const korAdresi = (kod: string, koken: string, dil: Dil = simdikiDil()) =>
  `${koken}/p/${kod}/kor${dil === 'tr' ? '' : `?${DIL_PARAMETRE}=${dil}`}`;

/**
 * Bağlantıyı sistemin paylaşım menüsüyle gönderiyor; menü yoksa panoya kopyalıyor.
 * Dönüş: 'paylasildi' | 'kopyalandi' | 'olmadi' (menü kapatıldı ya da pano kapalı).
 */
export async function korBaglantisiGonder(kod: string, listeAdi: string): Promise<'paylasildi' | 'kopyalandi' | 'olmadi'> {
  const url = korAdresi(kod, window.location.origin);
  const metin = sozluk(simdikiDil()).paylasim.korMetin(listeAdi);
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title: listeAdi, text: metin, url });
      return 'paylasildi';
    }
    await navigator.clipboard.writeText(`${metin} ${url}`);
    return 'kopyalandi';
  } catch {
    return 'olmadi';
  }
}
