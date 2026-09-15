'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Item, Kategori, Liste } from '../types/item';
import {
  getListeBySlug, getKategoriler, getItems,
  createItem, updateItem, deleteItem, deleteItems,
  updateItemsSira, updateItemsKategori, deleteFotograf,
} from '../lib/items';
import { sortSirali, sortIstekListesi } from '../lib/sort';
import { hataMetni } from '../lib/hata';
import { listeleriTazele } from './useListeler';

/** Sıralamadaki kayıt: denenmiş ve "Bir daha asla" bölümünde değil. */
const siralamada = (i: Item) => i.denendi && !i.asla;

/**
 * Bir listenin tüm verisi: liste kaydı, kategorileri ve öğeleri.
 * Öğeler tek sorguyla gelip sıralama / "Bir daha asla" / istek listesi olarak
 * bellekte ayrılıyor — formdaki "şunun altına ekle" seçicisi sıralı listeye
 * ihtiyaç duyduğu için ayrımı SQL'e taşımanın kazancı yok.
 *
 * Sıralama ve "Bir daha asla" aynı `sira` kolonunu kendi içlerinde ayrı ayrı
 * 0'dan numaralıyor; iki bölümü birbirinden ayıran `asla`.
 */
export function useListStore(slug: string) {
  const [liste, setListe] = useState<Liste | null>(null);
  const [kategorilerHam, setKategoriler] = useState<Kategori[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const l = await getListeBySlug(slug);
      setListe(l);
      if (!l) {
        setKategoriler([]);
        setItems([]);
        return;
      }
      const [kats, its] = await Promise.all([getKategoriler(l.id), getItems(l.id)]);
      setKategoriler(kats);
      setItems(its);
    } catch (e: unknown) {
      setError(hataMetni(e));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  /**
   * Kategoriler kayıt sayısına göre sıralı — liste indeksiyle aynı kural.
   * Eşitlikte `sira`, sonra `created_at`. Elle sıralama diye bir iş yok.
   */
  const kategoriler = useMemo(() => {
    const adet = items.reduce<Record<string, number>>((acc, i) => {
      if (i.category_id) acc[i.category_id] = (acc[i.category_id] ?? 0) + 1;
      return acc;
    }, {});
    return [...kategorilerHam].sort((a, b) =>
      (adet[b.id] ?? 0) - (adet[a.id] ?? 0)
      || (a.sira ?? 0) - (b.sira ?? 0)
      || (a.created_at ?? '').localeCompare(b.created_at ?? '')
    );
  }, [kategorilerHam, items]);

  const denenenler = useMemo(() => sortSirali(items.filter(siralamada)), [items]);
  /** Denenmiş ama sıralamada değil: kırmızı çizginin altındaki bölüm, kendi içinde sıralı. */
  const aslaListesi = useMemo(() => sortSirali(items.filter(i => i.denendi && i.asla)), [items]);
  const istekListesi = useMemo(() => sortIstekListesi(items.filter(i => !i.denendi)), [items]);

  /** `aslaDahil`: bölüm değiştiren sürükle-bırak `asla`'yı da yazıyor; ekleme yolu yalnızca sırayı. */
  const persistSira = useCallback(async (list: Item[], aslaDahil = false) => {
    setIsSaving(true);
    try {
      await updateItemsSira(list.map(i => ({
        id: i.id,
        sira: i.sira ?? 0,
        ...(aslaDahil ? { asla: !!i.asla } : {}),
      })));
      // Şampiyon değişmiş olabilir: ray ve ana ekran ilk üçü yeniden okusun.
      listeleriTazele();
    } catch (e: unknown) {
      alert('Sıralama kaydedilemedi: ' + hataMetni(e));
    } finally {
      setIsSaving(false);
    }
  }, []);

  /**
   * Kaydı sıralamaya `targetIndex` konumundan sokup sıralamayı yeniden numaralar.
   * "Bir daha asla" bölümüne dokunmuyor: onun numaraları kendine ait.
   */
  const spliceIntoRanking = useCallback((
    prev: Item[],
    item: Item,
    targetIndex?: number
  ) => {
    const ranked = sortSirali(prev.filter(i => siralamada(i) && i.id !== item.id));
    const at = targetIndex !== undefined && targetIndex >= 0
      ? Math.min(targetIndex, ranked.length)
      : 0;
    ranked.splice(at, 0, item);
    const numbered = ranked.map((it, idx) => ({ ...it, sira: idx }));
    void persistSira(numbered);
    return [...prev.filter(i => !siralamada(i) && i.id !== item.id), ...numbered];
  }, [persistSira]);

  /**
   * Tek kayıt yolu: yeni kayıt, düzenleme ve "denedim" dönüşümü.
   * `targetIndex` yalnızca kayıt sıralamaya giriyorsa anlamlı.
   */
  const saveEntry = useCallback(async (
    entry: Item,
    editingItem: Item | null,
    targetIndex?: number
  ): Promise<Item> => {
    if (!liste) throw new Error('Liste yüklenmedi.');
    // `sira` ve `asla` bilerek dışarıda: konumu spliceIntoRanking / reorder belirliyor.
    const payload = {
      list_id: liste.id,
      category_id: entry.category_id ?? null,
      ad: entry.ad,
      alt_ad: entry.alt_ad ?? null,
      fotograf_url: entry.fotograf_url ?? null,
      notlar: entry.notlar ?? null,
      ozellikler: entry.ozellikler,
      denendi: entry.denendi,
    };

    if (editingItem) {
      const oldPhoto = editingItem.fotograf_url;
      const updated = await updateItem(entry.id, payload);
      if (oldPhoto && oldPhoto !== updated.fotograf_url) void deleteFotograf(oldPhoto);

      const donusum = !editingItem.denendi && updated.denendi;   // "denedim" işaretlendi
      setItems(prev => (
        donusum
          ? spliceIntoRanking(prev, updated, targetIndex)
          : prev.map(i => (i.id === entry.id ? updated : i))
      ));
      return updated;
    }

    const created = await createItem(payload);
    setItems(prev => (
      created.denendi
        ? spliceIntoRanking(prev, created, targetIndex)
        : [...prev, created]
    ));
    return created;
  }, [liste, spliceIntoRanking]);

  const removeEntry = useCallback(async (item: Item) => {
    await deleteItem(item.id, item.fotograf_url);
    setItems(prev => prev.filter(i => i.id !== item.id));
  }, []);

  /**
   * Sürükle-bırak sonrası denenmişlerin yeni hâli: sıralama ve "Bir daha asla"
   * birlikte, her kaydın `sira`'sı ve `asla`'sı güncellenmiş olarak.
   */
  const reorder = useCallback((next: Item[]) => {
    setItems(prev => {
      void persistSira(next, true);
      return [...prev.filter(i => !i.denendi), ...next];
    });
  }, [persistSira]);

  /**
   * Toplu kategori atama: seçili kayıtlar tek istekte aynı kategoriye. `ozellikler`e
   * dokunmuyor — eski kategoriye bağlı alan değerleri kayıtta kalıp görünmez olur.
   */
  const kategoriAta = useCallback(async (ids: string[], categoryId: string | null) => {
    await updateItemsKategori(ids, categoryId);
    const hedef = new Set(ids);
    setItems(prev => prev.map(i => (hedef.has(i.id) ? { ...i, category_id: categoryId } : i)));
  }, []);

  /*
   * Toplu işlemler önce yazıp sonra ekranı güncelliyor: hata olursa sayfa veriyi
   * baştan okuyor, yarım kalmış bir iyimser durum ekranda kalmıyor. Hepsi kayıt
   * sayılarını ya da şampiyonu değiştirebildiği için sonunda ray tazeleniyor.
   */

  /**
   * Seçili denenmiş kayıtları "Bir daha asla" ile sıralama arasında taşır (`asla`
   * hedef bölüm). Taşınanlar mevcut sıralarıyla hedef bölümün sonuna ekleniyor;
   * iki bölüm de kendi içinde 0'dan yeniden numaralanıyor.
   */
  const bolumDegistir = useCallback(async (ids: string[], asla: boolean) => {
    const hedef = new Set(ids);
    const sira = sortSirali(items.filter(siralamada));
    const bolum = sortSirali(items.filter(i => i.denendi && i.asla));
    const [kaynak, varis] = asla ? [sira, bolum] : [bolum, sira];
    const kalan = kaynak.filter(i => !hedef.has(i.id));
    const yeniVaris = [...varis, ...kaynak.filter(i => hedef.has(i.id))];
    const [yeniSira, yeniBolum] = asla ? [kalan, yeniVaris] : [yeniVaris, kalan];
    const next = [
      ...yeniSira.map((it, idx) => ({ ...it, sira: idx, asla: false })),
      ...yeniBolum.map((it, idx) => ({ ...it, sira: idx, asla: true })),
    ];
    await updateItemsSira(next.map(i => ({ id: i.id, sira: i.sira, asla: i.asla })));
    setItems(prev => [...prev.filter(i => !i.denendi), ...next]);
    listeleriTazele();
  }, [items]);

  /** Toplu "Denedim": seçili bekleyenler, listede göründükleri sırayla sıralamanın sonuna. */
  const denendiYap = useCallback(async (ids: string[]) => {
    const hedef = new Set(ids);
    const sira = sortSirali(items.filter(siralamada));
    const baslangic = sira.length > 0 ? (sira[sira.length - 1].sira ?? 0) + 1 : 0;
    const tasinan = sortIstekListesi(items.filter(i => !i.denendi && hedef.has(i.id)))
      .map((it, n) => ({ ...it, denendi: true, asla: false, sira: baslangic + n }));
    await updateItemsSira(tasinan.map(i => ({ id: i.id, sira: i.sira, asla: false, denendi: true })));
    const yeni = new Map(tasinan.map(i => [i.id, i]));
    setItems(prev => prev.map(i => yeni.get(i.id) ?? i));
    listeleriTazele();
  }, [items]);

  /** Toplu silme: kayıtlar ve fotoğrafları. Onayı sayfa soruyor. */
  const topluSil = useCallback(async (ids: string[]) => {
    const hedef = new Set(ids);
    await deleteItems(items.filter(i => hedef.has(i.id)));
    setItems(prev => prev.filter(i => !hedef.has(i.id)));
    listeleriTazele();
  }, [items]);

  return {
    liste, kategoriler, items, denenenler, aslaListesi, istekListesi,
    loading, error, isSaving,
    load, saveEntry, removeEntry, reorder, kategoriAta, bolumDegistir, denendiYap, topluSil,
  };
}
