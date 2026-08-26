'use client';

import { useCallback, useEffect, useState } from 'react';
import { Liste } from '../types/item';
import { getListeler, getListeSayilari, ListeSayisi } from '../lib/items';
import { hataMetni } from '../lib/hata';

/**
 * Liste indeksi ve her listenin kayıt sayısı.
 *
 * Listeler kayıt sayısına göre sıralanıyor: en dolu liste başta. Böylece
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
        [...gelen].sort((a, b) => (adet[b.id]?.toplam ?? 0) - (adet[a.id]?.toplam ?? 0))
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

  return { listeler, sayilar, loading, error, load };
}
