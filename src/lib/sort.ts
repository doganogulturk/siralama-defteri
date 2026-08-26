import { Item } from '../types/item';

/** Denenmiş kayıtlar: kullanıcının sürükleyerek belirlediği sıra. */
export function sortSirali(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    const diff = (a.sira ?? 9999) - (b.sira ?? 9999);
    if (diff !== 0) return diff;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

/** İstek listesinin sıralaması yok — en son eklenen en üstte. */
export function sortIstekListesi(items: Item[]): Item[] {
  return [...items].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}
