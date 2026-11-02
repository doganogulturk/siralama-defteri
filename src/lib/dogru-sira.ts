import { DOGRU_SIRA_LISTELERI, type Bicim, type DogruSiraTanimi } from './dogru-sira-listeler';
import { gunlukMu, tohumTarihi, uretec } from './sayilar';
import { dilEtiketi, type Dil } from './i18n';

/*
 * Doğru Sıra: doğru cevabı olan sıralamalar (ülkelerin nüfusu, padişahlar…). Listenin
 * havuzundan on madde karışık geliyor; oyuncu onları sürükleyerek diziyor, "Kontrol et"te
 * gerçek sıra ve değerler açılıyor. Puan, gerçek sırayla uyum (Kendall): her ikilinin
 * doğru mu dizildiği. Karşılaştırmadaki (`lib/kiyas.ts`) ölçünün aynısı.
 *
 * Hiçbir şey kaydedilmiyor. Seçim tohumdan (Sayılar'ın tohumları: `g20261102` günlük,
 * `rk3x9q2` serbest), oyuncunun dizilişi adreste: `/kor/dogru-sira/<liste>?t=<tohum>&s=<diziliş>`.
 * Diziliş Sayılar'ınkiyle aynı biçimde: yukarıdan aşağı, oradaki maddenin geliş sırası.
 * Burada React yok (`dogru-sira.test.ts`).
 */

export const ADET = 10;

/** Arayüz dilinde liste. */
export interface DogruSiraListe {
  slug: string;
  simge: string;
  renk: string;
  yon: 'azalan' | 'artan';
  bicim: Bicim;
  ad: string;
  soru: string;
  ust: string;
  alt: string;
  kaynak: string;
  maddeler: { ad: string; deger: number }[];
}

const cevir = (t: DogruSiraTanimi, dil: Dil): DogruSiraListe => ({
  slug: t.slug, simge: t.simge, renk: t.renk, yon: t.yon, bicim: t.bicim,
  ...t.metin[dil],
  maddeler: t.maddeler.map(x => ({ ad: x[dil], deger: x.deger })),
});

export const dogruSiraListeleri = (dil: Dil) => DOGRU_SIRA_LISTELERI.map(t => cevir(t, dil));

export function dogruSiraListesi(slug: string, dil: Dil): DogruSiraListe | null {
  const t = DOGRU_SIRA_LISTELERI.find(x => x.slug === slug);
  return t ? cevir(t, dil) : null;
}

/** İki değer birlikte oyuna girebilir mi: aralarında listenin istediği kadar fark var mı. */
export function ayriMi(ayrim: DogruSiraTanimi['ayrim'], a: number, b: number): boolean {
  if ('oran' in ayrim) return Math.abs(a - b) >= ayrim.oran * Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) >= ayrim.fark;
}

/**
 * Tohumun on maddesi, gösterilecek (karışık) sırayla: havuzdaki indeksler. Havuz tohumla
 * karıştırılıyor, sırayla gelen her madde seçilenlerin hepsinden yeterince ayrıysa alınıyor.
 * Ona ulaşılamazsa (havuzda yakın değerler çoksa) karıştırma yineleniyor; testler her
 * listenin her tohumda ona ulaştığını denetliyor. Tohum listenin adıyla karışıyor: aynı
 * günün tohumu her listede başka maddeler seçiyor.
 */
export function maddeleriSec(slug: string, tohum: string): number[] {
  const t = DOGRU_SIRA_LISTELERI.find(x => x.slug === slug);
  if (!t) return [];
  const r = uretec(`${slug}:${tohum}`);
  let enIyi: number[] = [];
  for (let deneme = 0; deneme < 40; deneme++) {
    const dizi = t.maddeler.map((_, i) => i);
    for (let i = dizi.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
    }
    const secim: number[] = [];
    for (const i of dizi) {
      if (secim.every(s => ayriMi(t.ayrim, t.maddeler[s].deger, t.maddeler[i].deger))) secim.push(i);
      if (secim.length === ADET) return secim;
    }
    if (secim.length > enIyi.length) enIyi = secim;
  }
  return enIyi;
}

/** Seçimin doğru sırası: seçimdeki konumlar (0–9), yukarıdan aşağı. */
export function dogruDizi(liste: Pick<DogruSiraListe, 'yon' | 'maddeler'>, secim: number[]): number[] {
  const yon = liste.yon === 'azalan' ? -1 : 1;
  return secim.map((_, k) => k).sort((a, b) => yon * (liste.maddeler[secim[a]].deger - liste.maddeler[secim[b]].deger));
}

export interface DogruSiraSonucu {
  /** Gerçek sırayla uyum, yüzde: doğru dizilen ikililerin oranı. */
  uyum: number;
  /** Tam yerinde duran madde sayısı. */
  tamYerinde: number;
  /** Oyuncunun yukarıdan aşağı her yuvası için o maddenin gerçek yeri (0'dan). */
  gercekYer: number[];
}

/**
 * Puan. `dizilis`: oyuncunun yukarıdan aşağı dizdiği maddeler, seçimdeki konumlarıyla.
 * Uyum Kendall'ın ölçüsü: 45 ikilinin kaçı gerçek sıradaki gibi dizilmiş. Tam yerinde
 * olanları saymak tek bir kaymayı bütün oyuna yayardı; ikili ölçü kaymayı küçük cezalandırıyor.
 */
export function puanla(liste: Pick<DogruSiraListe, 'yon' | 'maddeler'>, secim: number[], dizilis: number[]): DogruSiraSonucu {
  const dogru = dogruDizi(liste, secim);
  const yer = new Map(dogru.map((k, i) => [k, i]));
  const gercekYer = dizilis.map(k => yer.get(k) ?? 0);
  let uyan = 0;
  let toplam = 0;
  for (let i = 0; i < gercekYer.length; i++) {
    for (let j = i + 1; j < gercekYer.length; j++) {
      toplam++;
      if (gercekYer[i] < gercekYer[j]) uyan++;
    }
  }
  return {
    uyum: toplam ? Math.round((uyan / toplam) * 100) : 0,
    tamYerinde: gercekYer.filter((g, i) => g === i).length,
    gercekYer,
  };
}

/**
 * Günün listesi: günler listeler arasında sırayla dönüyor; o gün herkes aynı listeyi aynı
 * maddelerle oynuyor (tohum günün tarihi). Tarih günlük tohumdan, yoksa null.
 */
export function gununListesi(tohum: string): string | null {
  const tarih = gunlukMu(tohum) ? tohumTarihi(tohum) : null;
  if (!tarih) return null;
  const gun = Math.floor(Date.parse(`${tarih}T00:00:00Z`) / 86_400_000);
  return DOGRU_SIRA_LISTELERI[gun % DOGRU_SIRA_LISTELERI.length].slug;
}

/** Yüzde: Türkçede işaret önde ("%82"), İngilizcede arkada ("82%"). */
export const yuzde = (u: number, dil: Dil) => (dil === 'tr' ? `%${u}` : `${u}%`);

const KELIME: Record<Dil, { milyar: string; milyon: string; bin: string }> = {
  tr: { milyar: 'milyar', milyon: 'milyon', bin: 'bin' },
  en: { milyar: 'billion', milyon: 'million', bin: 'thousand' },
};

/** Değerin okunur hâli: "1,45 milyar", "87,5 milyon", "823 bin", "8.849 m", "778,5 milyon km". */
export function degerYaz(bicim: Bicim, deger: number, dil: Dil): string {
  const s = (n: number, kesir = 0) =>
    n.toLocaleString(dilEtiketi(dil), { minimumFractionDigits: 0, maximumFractionDigits: kesir });
  const k = KELIME[dil];
  switch (bicim) {
    case 'kisi':
      if (deger >= 1e9) return `${s(deger / 1e9, 2)} ${k.milyar}`;
      if (deger >= 1e8) return `${s(deger / 1e6)} ${k.milyon}`;
      if (deger >= 1e6) return `${s(deger / 1e6, 1)} ${k.milyon}`;
      if (deger >= 1e3) return `${s(deger / 1e3)} ${k.bin}`;
      return s(deger);
    case 'km2':
      return deger >= 1e6 ? `${s(deger / 1e6, 1)} ${k.milyon} km²` : `${s(deger)} km²`;
    case 'metre':
      return `${s(deger)} m`;
    case 'milyonKm':
      return deger >= 1000 ? `${s(deger / 1000, 2)} ${k.milyar} km` : `${s(deger, 1)} ${k.milyon} km`;
    case 'yil':
      return String(deger);
    default:
      return s(deger);
  }
}
