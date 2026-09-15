import { AlanTanimi, Item, bayrak, filtreAlanlari } from '../types/item';

export type BayrakDurumu = 'hepsi' | 'evet' | 'hayir';

export interface Filtre {
  /** Seçili kategori id'leri; boşsa kategori filtresi yok. */
  kategoriler: Set<string>;
  /** Alan anahtarı → seçili durum. Eksik anahtar 'hepsi' sayılır. */
  bayraklar: Record<string, BayrakDurumu>;
}

export const bosFiltre = (): Filtre => ({ kategoriler: new Set(), bayraklar: {} });

/**
 * Kategori filtresinde "kategorisi olmayan kayıtlar" seçeneği. Kategori id'leri
 * uuid olduğu için bu işaretle çakışmıyor; `kategoriler` kümesine id gibi giriyor.
 */
export const KATEGORISIZ = 'kategorisiz';

export const bayrakDurumu = (f: Filtre, anahtar: string): BayrakDurumu =>
  f.bayraklar[anahtar] ?? 'hepsi';

/** Filtresiz görünüm — sürükleyerek sıralama yalnızca bu durumda mümkün. */
export const filtreBos = (f: Filtre): boolean =>
  f.kategoriler.size === 0 && Object.values(f.bayraklar).every(v => v === 'hepsi');

const bayrakUyar = (item: Item, anahtar: string, durum: BayrakDurumu): boolean => {
  if (durum === 'hepsi') return true;
  return bayrak(item, anahtar) === (durum === 'evet');
};

export function filtreUygula(items: Item[], f: Filtre): Item[] {
  return items.filter(item => {
    if (f.kategoriler.size > 0) {
      const uyar = item.category_id
        ? f.kategoriler.has(item.category_id)
        : f.kategoriler.has(KATEGORISIZ);
      if (!uyar) return false;
    }
    return Object.entries(f.bayraklar).every(([anahtar, durum]) =>
      bayrakUyar(item, anahtar, durum)
    );
  });
}

export const kategoriSayilari = (items: Item[]): Record<string, number> =>
  items.reduce<Record<string, number>>((acc, item) => {
    if (item.category_id) acc[item.category_id] = (acc[item.category_id] ?? 0) + 1;
    return acc;
  }, {});

/** Her bool alan için üç seçeneğin kaç kayda karşılık geldiği. */
export const bayrakSayilari = (
  items: Item[],
  alanlar: AlanTanimi[]
): Record<string, Record<BayrakDurumu, number>> =>
  Object.fromEntries(
    filtreAlanlari(alanlar).map(alan => {
      const evet = items.filter(i => bayrak(i, alan.anahtar)).length;
      return [alan.anahtar, { hepsi: items.length, evet, hayir: items.length - evet }];
    })
  );
