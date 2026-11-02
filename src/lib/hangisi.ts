/*
 * "Hangisi?" ile yerleştirme: yeni kaydın sıralamadaki yerini ikili sorularla bulmak. Sıralama
 * zaten sıralı olduğu için ikili arama yeter: her soru aralığı yarıya indiriyor, n kayıtlık
 * listede en fazla ⌈log₂(n+1)⌉ soru (100 kayıtta 7). Burada React yok; arayüz `HangisiEkrani`.
 *
 * Aralık [alt, ust): yeni kaydın girebileceği konumlar (0 = en üst, n = en alt). Sorulan kayıt
 * aralığın ortasındaki; yeni kayıt ondan iyiyse yeri onun üstü, değilse altı.
 */

export interface HangisiDurumu {
  alt: number;
  ust: number;
  /** Önceki aralıklar: "Geri" son cevabı geri alıyor. */
  gecmis: { alt: number; ust: number }[];
}

export const hangisiBaslat = (kayitSayisi: number): HangisiDurumu =>
  ({ alt: 0, ust: Math.max(0, kayitSayisi), gecmis: [] });

/** Karşılaştırılacak kaydın sıralamadaki indeksi; yer bulunduysa null. */
export const hangisiSiradaki = (d: HangisiDurumu): number | null =>
  d.alt < d.ust ? Math.floor((d.alt + d.ust) / 2) : null;

/** Bulunan konum (`siralamayaSok`'un hedefi); sorular bitmediyse null. */
export const hangisiSonuc = (d: HangisiDurumu): number | null =>
  hangisiSiradaki(d) === null ? d.alt : null;

/** `yeniDahaIyi`: yeni kayıt sorulan kayıttan önde mi. */
export function hangisiCevapla(d: HangisiDurumu, yeniDahaIyi: boolean): HangisiDurumu {
  const orta = hangisiSiradaki(d);
  if (orta === null) return d;
  const gecmis = [...d.gecmis, { alt: d.alt, ust: d.ust }];
  return yeniDahaIyi ? { alt: d.alt, ust: orta, gecmis } : { alt: orta + 1, ust: d.ust, gecmis };
}

export function hangisiGeriAl(d: HangisiDurumu): HangisiDurumu {
  const onceki = d.gecmis.at(-1);
  return onceki ? { ...onceki, gecmis: d.gecmis.slice(0, -1) } : d;
}

/** Bu aralıkta kalan en fazla soru sayısı: ilerleme göstergesi için. */
export const hangisiKalanEnFazla = (d: HangisiDurumu): number =>
  d.ust > d.alt ? Math.ceil(Math.log2(d.ust - d.alt + 1)) : 0;
