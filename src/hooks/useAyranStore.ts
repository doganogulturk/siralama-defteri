'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AyranEntry } from '../types/ayran';
import {
  getAyranlar, createAyran, updateAyran, deleteAyran, updateAyranlarSira, deleteFotograf,
} from '../lib/ayranlar';
import { sortAyranlar, sortIstekListesi } from '../lib/sort';

/**
 * Tek sorgu tüm kayıtları çeker; denenmişler ile istek listesi bellekte ayrılır.
 * İki route (sıralama ve /listem) da bu depoyu kullanıyor — formdaki "şunun altına
 * ekle" seçicisi her iki tarafta da denenmiş listeye ihtiyaç duyduğu için ayrımı
 * SQL'e taşımanın kazancı yok.
 */
export function useAyranStore() {
  const [ayrans, setAyrans] = useState<AyranEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAyrans(await getAyranlar());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const denenenler = useMemo(
    () => sortAyranlar(ayrans.filter(a => a.denendi)),
    [ayrans]
  );
  const istekListesi = useMemo(
    () => sortIstekListesi(ayrans.filter(a => !a.denendi)),
    [ayrans]
  );

  const persistSira = useCallback(async (list: AyranEntry[]) => {
    setIsSaving(true);
    try {
      await updateAyranlarSira(list.map(i => ({ id: i.id, sira: i.sira ?? 0 })));
    } catch (e: unknown) {
      alert('Sıralama kaydedilemedi: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsSaving(false);
    }
  }, []);

  /** Kaydı denenmişler sıralamasına `targetIndex` konumundan sokup tümünü yeniden numaralar. */
  const spliceIntoRanking = useCallback((
    prev: AyranEntry[],
    item: AyranEntry,
    targetIndex?: number
  ) => {
    const ranked = sortAyranlar(prev.filter(a => a.denendi && a.id !== item.id));
    const at = targetIndex !== undefined && targetIndex >= 0
      ? Math.min(targetIndex, ranked.length)
      : 0;
    ranked.splice(at, 0, item);
    const numbered = ranked.map((it, idx) => ({ ...it, sira: idx }));
    void persistSira(numbered);
    return [...prev.filter(a => !a.denendi && a.id !== item.id), ...numbered];
  }, [persistSira]);

  /**
   * Tek kayıt yolu: yeni kayıt, düzenleme ve "denedim" dönüşümü.
   * `targetIndex` yalnızca kayıt sıralamaya giriyorsa anlamlı.
   */
  const saveEntry = useCallback(async (
    entry: AyranEntry,
    editingItem: AyranEntry | null,
    targetIndex?: number
  ): Promise<AyranEntry> => {
    const { id, ...fields } = entry;

    if (editingItem) {
      const oldPhoto = editingItem.fotograf_url;
      const updated = await updateAyran(id, fields);
      if (oldPhoto && oldPhoto !== updated.fotograf_url) void deleteFotograf(oldPhoto);

      const donusum = !editingItem.denendi && updated.denendi;   // "denedim" işaretlendi
      setAyrans(prev => (
        donusum
          ? spliceIntoRanking(prev, updated, targetIndex)
          : prev.map(a => (a.id === id ? updated : a))
      ));
      return updated;
    }

    const created = await createAyran(fields);
    setAyrans(prev => (
      created.denendi
        ? spliceIntoRanking(prev, created, targetIndex)
        : [...prev, created]
    ));
    return created;
  }, [spliceIntoRanking]);

  const removeEntry = useCallback(async (item: AyranEntry) => {
    await deleteAyran(item.id, item.fotograf_url);
    setAyrans(prev => prev.filter(a => a.id !== item.id));
  }, []);

  /** Sürükle-bırak sonrası denenmişler listesinin yeni hâli. */
  const reorder = useCallback((next: AyranEntry[]) => {
    setAyrans(prev => {
      void persistSira(next);
      return [...prev.filter(a => !a.denendi), ...next];
    });
  }, [persistSira]);

  return {
    ayrans, denenenler, istekListesi,
    loading, error, isSaving,
    load, saveEntry, removeEntry, reorder,
  };
}
