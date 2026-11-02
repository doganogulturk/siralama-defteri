import { ADET } from './dogru-sira';

/*
 * Tier ve Kör Tier modlarının hesapları. Katalogdaki listenin on maddesi S, A, B, C, D
 * kademelerine konuyor. Tier'de serbestçe (istediği kadar değiştirerek), Kör Tier'de
 * maddeler birer birer geliyor, konduğu yerde kalıyor ve her kademede iki yer var.
 *
 * Sonuç adreste: `?s=` her maddenin (seçimdeki konumu sırasıyla) kademesi, on rakam
 * ("0214300121"). Hiçbir şey kaydedilmiyor. Doğru cevabı olan listede gerçek kademe,
 * gerçek sıranın beşe bölünmesi (ilk iki S, sonraki iki A…). Burada React yok.
 */

/** Oyunların kademeleri: sabit, kişisel listelerin kademelerinden (`lib/kademe.ts`) bağımsız. */
export const TIER_KADEMELERI = ['S', 'A', 'B', 'C', 'D'] as const;
export const KADEME_ADET = TIER_KADEMELERI.length;
/** Kör Tier'de kademe başına yer: on madde, beş kademe. */
export const KOR_TIER_SINIR = ADET / KADEME_ADET;

export const tierYaz = (kademeler: number[]) => kademeler.join('');

/**
 * Adresteki sonuç: on rakam, her biri 0–4. `sinir` verilirse (Kör Tier) hiçbir kademede
 * ondan fazla madde olamaz. Geçersizse null — adres elle değiştirilmiş olabilir.
 */
export function tierCoz(s: string | null | undefined, sinir?: number): number[] | null {
  if (!s || !/^[0-4]{10}$/.test(s)) return null;
  const k = [...s].map(Number);
  if (sinir !== undefined && TIER_KADEMELERI.some((_, i) => k.filter(x => x === i).length > sinir)) return null;
  return k;
}

/** Gerçek kademeler: gerçek sıra (0–9) beş eşit parçaya. */
export const dogruKademeler = (gercekYer: number[]) =>
  gercekYer.map(r => Math.min(KADEME_ADET - 1, Math.floor((r * KADEME_ADET) / gercekYer.length)));

/** İki kademe dizisinde aynı kademeye konan madde sayısı. */
export const ayniKademe = (a: number[], b: number[]) => a.filter((k, i) => k === b[i]).length;

/** Bir kademe kayması (S yerine A gibi) dahil yakın sayısı. */
export const yakinKademe = (a: number[], b: number[]) => a.filter((k, i) => Math.abs(k - b[i]) <= 1).length;

/** Kademeye göre gruplar: her kademede o kademeye konan maddelerin seçimdeki konumları. */
export const tierGruplari = (kademeler: (number | null)[]) =>
  TIER_KADEMELERI.map((_, i) => kademeler.flatMap((k, m) => (k === i ? [m] : [])));
