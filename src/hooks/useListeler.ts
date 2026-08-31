'use client';

import { useCallback, useEffect, useState } from 'react';
import { Liste } from '../types/item';
import { getListeler, getListeSayilari, ListeSayisi } from '../lib/items';
import { hataMetni } from '../lib/hata';

/**
 * Ray, sayfayla aynı veriyi ayrı bir sorgudan okuyor; bir kayıt sıralamaya girip
 * çıktığında rayın sayısı yerinde kalmasın diye küçük bir haber kanalı. Sayfa
 * mutasyondan sonra `listeleriTazele()` çağırıyor, o an ekranda olan raylar
 * kendini yeniliyor.
 */
const aboneler = new Set<() => void>();
export const listeleriTazele = () => aboneler.forEach(f => f());

/** Bir listenin sıralamaya girmiş kayıt sayısı — indekste gösterilen ve sıralayan ölçü. */
export const siralanan = (s?: ListeSayisi): number => (s ? s.toplam - s.bekleyen : 0);

/**
 * Liste indeksi ve her listenin kayıt sayısı.
 *
 * Listeler sıralanmış kayıt sayısına göre diziliyor: en dolu sıralama başta.
 * Ölçü toplam değil sıralanan, çünkü indekste gösterilen sayı da o — bekleyenler
 * sayılsaydı satırdaki rakamla satırların sırası birbirini tutmazdı. Böylece
 * `si_lists.sira`'yı elle yönetmek gerekmiyor — sütun şemada duruyor ama
 * arayüzde sıralamayı artık kullanım belirliyor. Eşitlikte sort kararlı
 * olduğu için sorgudan gelen sıra (sira, created_at) korunuyor.
 */
export function useListeler() {
  const [listeler, setListeler] = useState<Liste[]>([]);
  const [sayilar, setSayilar] = useState<Record<string, ListeSayisi>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Sayımlar listelerin yanında ikincil: hata verirse indeks yine de çalışsın.
      const [gelen, adet] = await Promise.all([
        getListeler(),
        getListeSayilari().catch(() => ({} as Record<string, ListeSayisi>)),
      ]);
      setSayilar(adet);
      setListeler(
        [...gelen].sort((a, b) =>
          siralanan(adet[b.id]) - siralanan(adet[a.id])
          || (adet[b.id]?.toplam ?? 0) - (adet[a.id]?.toplam ?? 0)
        )
      );
    } catch (e: unknown) {
      setError(hataMetni(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    const tazele = () => { void load(); };
    aboneler.add(tazele);
    return () => { aboneler.delete(tazele); };
  }, [load]);

  return { listeler, sayilar, loading, error, load };
}
