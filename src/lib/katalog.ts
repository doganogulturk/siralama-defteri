import { korListeleri, type KorListe } from './kor';
import { ADET, dogruDizi, dogruSiraListeleri, maddeleriSec, type DogruSiraListe } from './dogru-sira';
import type { Dil } from './i18n';

/*
 * Oyunların ortak kataloğu: "neyi sıralıyorsun". Modlar ("nasıl sıralıyorsun": Kör Sıralama,
 * Tier, Kör Tier, Doğru Sıra) aynı listeleri kullanıyor; bir liste eklemek her modda yeni
 * bir oyun demek. İki kaynak var:
 *   • zevk listeleri (`lib/kor.ts`): on madde, doğru cevap yok;
 *   • doğru cevabı olan listeler (`lib/dogru-sira-listeler.ts`): daha büyük bir havuz ve
 *     her maddenin değeri. Bunlar her modda oynanıyor; sonuçta gerçek sırayla da ölçülüyor.
 * Oyunda her zaman on madde var: havuz onluksa hepsi, büyükse tohumdan seçilen on
 * (Doğru Sıra'nın seçimi, fark kuralıyla). Burada React yok (`katalog.test.ts`).
 */

export interface KatalogListe {
  slug: string;
  simge: string;
  renk: string;
  ad: string;
  /** Maddelerin havuzu (adlar). Zevk listelerinde tam on. */
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

/**
 * Oyunun on maddesi: havuzdaki yerleri, gösterilecek sırayla. Havuz onluksa hepsi
 * (karıştırmayı oyun yapıyor); büyükse tohumdan seçilen on. Tohum gerekip yoksa boş.
 */
export function oyunSecimi(l: KatalogListe, tohum: string | null): number[] {
  if (!tohumGerekli(l)) return l.havuz.map((_, i) => i);
  return tohum ? maddeleriSec(l.slug, tohum) : [];
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
