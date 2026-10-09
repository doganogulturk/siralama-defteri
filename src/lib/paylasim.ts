import { AlanTanimi, Item } from '../types/item';

/*
 * Salt okunur paylaşım: hem sunucudaki paylaşım sayfası hem istemcideki ayarlar
 * kullanıyor. Burada Supabase istemcisi yok — sunucu tarafı okuma
 * `paylasim-sunucu.ts`'te, istemcinin oturumlu istemcisinden ayrı.
 */

/** Veritabanındaki kontrolle aynı biçim (supabase/schema.sql). */
export const KOD_BICIMI = /^[A-Za-z0-9]{16,64}$/;

const KOD_HARFLERI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * 16 harf-rakam, ~95 bit: bağlantılar tek tek denenerek bulunamasın. 248 sınırı
 * modülo yanlılığını kaldırıyor (62 × 4 = 248): üstündeki baytlar atılıyor.
 */
export function kodUret(uzunluk = 16): string {
  let kod = '';
  while (kod.length < uzunluk) {
    for (const b of crypto.getRandomValues(new Uint8Array(uzunluk * 2))) {
      if (b < 248 && kod.length < uzunluk) kod += KOD_HARFLERI[b % 62];
    }
  }
  return kod;
}

export const paylasimAdresi = (kod: string, koken: string) => `${koken}/p/${kod}`;

/** Paylaşım menüsünde ve WhatsApp mesajında bağlantının önündeki metin. */
export const paylasimMetni = (listeAdi: string) => `${listeAdi} sıralamam`;

export type PaylasilanKayit =
  Pick<Item, 'id' | 'category_id' | 'ad' | 'alt_ad' | 'fotograf_url' | 'ozellikler'> & { asla: boolean };

/** `paylasilan_liste` fonksiyonunun döndürdüğü — yalnızca sayfada gösterilenler. */
export interface PaylasilanListe {
  ad: string;
  alanlar: AlanTanimi[];
  /** Sahibin Google'daki adı; profilde ad yoksa boş. */
  sahip: string | null;
  kategoriler: { id: string; ad: string; renk: string }[];
  /** Önce sıralama, sonra "Bir daha asla"; ikisi de kendi sırasında. */
  kayitlar: PaylasilanKayit[];
}

const UNLULER = 'aeıioöuü';
const TAMLAYAN: Record<string, string> = {
  a: 'ın', ı: 'ın', e: 'in', i: 'in', o: 'un', u: 'un', ö: 'ün', ü: 'ün',
};

/**
 * Adın tamlayan eki: "Doğan" → "Doğan'ın", "Ayşe" → "Ayşe'nin", "Doğan Oğultürk" →
 * "Doğan Oğultürk'ün". Ek son ünlüye göre uyuyor; ünlüyle biten adda araya "n"
 * giriyor. Okunuşu yazılışından farklı yabancı adlarda yanılabilir.
 */
export function tamlayan(ad: string): string {
  const kucuk = ad.toLocaleLowerCase('tr');
  const sonUnlu = [...kucuk].reverse().find(h => UNLULER.includes(h));
  const ek = (sonUnlu && TAMLAYAN[sonUnlu]) ?? 'in';
  const kaynastirma = UNLULER.includes(kucuk.at(-1) ?? '') ? 'n' : '';
  return `${ad}'${kaynastirma}${ek}`;
}

/** Sayfa başlığı ve önizleme kartı: "Döner — Doğan Oğultürk'ün sıralaması". */
export const paylasimBasligi = (liste: Pick<PaylasilanListe, 'ad' | 'sahip'>) =>
  liste.sahip ? `${liste.ad} — ${tamlayan(liste.sahip)} sıralaması` : `${liste.ad} sıralaması`;

/**
 * Kayıttaki fotoğraf adresi yalnızca uygulamanın kendi kovasındaysa kullanılıyor.
 * `fotograf_url`'i sahibi API'den istediği gibi yazabilir: başka bir adres
 * paylaşım sayfasında ziyaretçinin tarayıcısını, önizleme görselinde sunucuyu
 * oraya istek atmaya yöneltirdi.
 */
export function guvenliFoto(url?: string | null): string | null {
  const taban = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !taban) return null;
  try {
    // URL ayrıştırması "../" parçalarını çözüyor: yol kontrolü atlatılamıyor.
    const adres = new URL(url);
    return adres.origin === new URL(taban).origin
      && adres.pathname.startsWith('/storage/v1/object/public/')
      ? adres.href
      : null;
  } catch {
    return null;
  }
}
