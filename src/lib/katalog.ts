import { korListeleri, type KorListe } from './kor';
import { ADET, dogruDizi, dogruSiraListeleri, maddeleriSec, type DogruSiraListe } from './dogru-sira';
import { uretec } from './sayilar';
import type { Dil } from './i18n';

/*
 * Oyunların ortak kataloğu: "neyi sıralıyorsun". Modlar ("nasıl sıralıyorsun": Kör Sıralama,
 * Tier, Kör Tier, Doğru Sıra) aynı listeleri kullanıyor; bir liste eklemek her modda yeni
 * bir oyun demek. İki kaynak var:
 *   • zevk listeleri (`lib/kor.ts`): otuz maddelik havuz, doğru cevap yok;
 *   • doğru cevabı olan listeler (`lib/dogru-sira-listeler.ts`): daha büyük bir havuz ve
 *     her maddenin değeri. Bunlar her modda oynanıyor; sonuçta gerçek sırayla da ölçülüyor.
 * Oyunda her zaman on madde var: havuz onluksa hepsi, büyükse tohumdan seçilen on
 * (doğru cevabı olanda Doğru Sıra'nın seçimi, fark kuralıyla; zevk listesinde düz
 * karıştırma). Zevk listesinde tohum yoksa havuzun ilk onu: havuzlar büyümeden önceki
 * tohumsuz sonuç bağlantıları o onu taşıyor. Burada React yok (`katalog.test.ts`).
 */

export interface KatalogListe {
  slug: string;
  simge: string;
  renk: string;
  ad: string;
  /** Maddelerin havuzu (adlar). */
  havuz: string[];
  /** Doğru cevabı olan listede Doğru Sıra tanımı; zevk listesinde null. */
  dogru: DogruSiraListe | null;
}

const zevkten = (l: KorListe): KatalogListe => ({
  slug: l.slug, simge: l.simge, renk: l.renk, ad: l.ad, havuz: l.kayitlar, dogru: null,
});
const dogrudan = (l: DogruSiraListe): KatalogListe => ({
  slug: l.slug, simge: l.simge, renk: l.renk, ad: l.ad, havuz: l.maddeler.map(x => x.ad), dogru: l,
});

/** Bütün katalog: önce zevk listeleri, sonra doğru cevabı olanlar. */
export const katalog = (dil: Dil): KatalogListe[] => [
  ...korListeleri(dil).map(zevkten),
  ...dogruSiraListeleri(dil).map(dogrudan),
];

export const katalogListesi = (slug: string, dil: Dil): KatalogListe | null =>
  katalog(dil).find(l => l.slug === slug) ?? null;

/** Oyunun on maddesini seçmek için tohum gerekiyor mu (havuz ondan büyükse). */
export const tohumGerekli = (l: Pick<KatalogListe, 'havuz'>) => l.havuz.length > ADET;

/** Zevk listesinde tohumdan on madde: havuzun tohumlu karıştırmasının ilk onu. */
function zevkSecimi(slug: string, uzunluk: number, tohum: string): number[] {
  const r = uretec(`${slug}:${tohum}`);
  const dizi = Array.from({ length: uzunluk }, (_, i) => i);
  for (let i = dizi.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
  }
  return dizi.slice(0, ADET);
}

/**
 * Oyunun on maddesi: havuzdaki yerleri, gösterilecek sırayla. Havuz onluksa hepsi
 * (karıştırmayı oyun yapıyor); büyükse tohumdan seçilen on. Tohum yoksa zevk listesinde
 * havuzun ilk onu (eski bağlantılar), doğru cevabı olanda boş.
 */
export function oyunSecimi(l: KatalogListe, tohum: string | null): number[] {
  if (!tohumGerekli(l)) return l.havuz.map((_, i) => i);
  if (!tohum) return l.dogru ? [] : l.havuz.slice(0, ADET).map((_, i) => i);
  return l.dogru ? maddeleriSec(l.slug, tohum) : zevkSecimi(l.slug, l.havuz.length, tohum);
}

/**
 * Doğru cevabı olan listede seçimin gerçek sırası: her maddenin (seçimdeki konumu)
 * gerçek yeri, 0'dan. Zevk listesinde null.
 */
export function gercekYerler(l: KatalogListe, secim: number[]): number[] | null {
  if (!l.dogru) return null;
  const dogru = dogruDizi(l.dogru, secim);
  const yer = new Array<number>(secim.length);
  dogru.forEach((k, i) => { yer[k] = i; });
  return yer;
}

/**
 * Kör Sıralama'nın oyun listesi: katalog listesinin seçilen on maddesi, `KorListe`
 * biçiminde (oyun, sonuç kodlaması ve görsel onu bekliyor). Tohum gerekip yoksa null.
 */
export function korOyunListesi(slug: string, tohum: string | null, dil: Dil): KorListe | null {
  const l = katalogListesi(slug, dil);
  if (!l) return null;
  const secim = oyunSecimi(l, tohum);
  if (secim.length === 0) return null;
  return { slug: l.slug, simge: l.simge, renk: l.renk, ad: l.ad, kayitlar: secim.map(i => l.havuz[i]) };
}
