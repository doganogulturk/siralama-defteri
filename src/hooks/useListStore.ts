'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Item, Kademe, Kategori, Liste } from '@/types/item';
import {
  getListeBySlug, getKategoriler, getItems,
  createItem, updateItem, deleteItem, deleteItems,
  updateItemsSira, updateItemsKategori, deleteFotograf,
} from '@/lib/items';
import { sortSirali, sortIstekListesi } from '@/lib/sort';
import {
  SiraSonucu, bolumDegistir as bolumHesapla, denendiYap as denendiHesapla,
  denenenleriDegistir, siraliSiralama, siralamayaSok,
} from '@/lib/siralama';
import { kademeDegistir, kademeliMi } from '@/lib/kademe';
import { hataMetni } from '@/lib/hata';
import { listeleriTazele } from './useListeler';
import { uyar } from '@/lib/pencere';
import { messages } from '@/lib/i18n';

/**
 * Bir listenin tüm verisi: liste kaydı, kategorileri ve öğeleri.
 * Öğeler tek sorguyla gelip sıralama / "Bir daha asla" / istek listesi olarak
 * bellekte ayrılıyor — formdaki "şunun altına ekle" seçicisi sıralı listeye
 * ihtiyaç duyduğu için ayrımı SQL'e taşımanın kazancı yok.
 *
 * Sıra hesapları saf fonksiyonlarda (`lib/siralama.ts`). Kayıtların son hâli bir
 * ref'te de tutuluyor: hesap ondan yapılıp sonuç hem duruma hem veritabanına
 * yazılıyor. Yazımı `setItems(prev => …)` içinde yapmak updater'ı yan etkili
 * kılardı — React onu StrictMode'da iki kez, eşzamanlı çizimde yeniden çalıştırabiliyor.
 */
export function useListStore(slug: string) {
  const [liste, setListe] = useState<Liste | null>(null);
  const [kategorilerHam, setKategoriler] = useState<Kategori[]>([]);
  const [items, setItemsState] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  /** Kayıtların son hâli: await'ten sonra da güncel olan, hesapların okuduğu yer. */
  const itemsRef = useRef<Item[]>([]);
  const setItems = useCallback((next: Item[]) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

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
  }, [slug, setItems]);

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

  /** Kademeler açıksa yukarıdan aşağı; kapalıysa null. */
  const kademeler = useMemo<Kademe[] | null>(
    () => (kademeliMi(liste?.kademeler) ? liste.kademeler : null), [liste]);
  /** Hesapların okuduğu güncel kademeler (await sonrasında da). */
  const kademelerRef = useRef<Kademe[] | null>(null);
  useEffect(() => { kademelerRef.current = kademeler; }, [kademeler]);

  /** Sıralama: `sira`, kademeler açıksa önce kademe (`lib/kademe.ts`). */
  const denenenler = useMemo(() => siraliSiralama(items, kademeler), [items, kademeler]);
  /** Denenmiş ama sıralamada değil: kırmızı çizginin altındaki bölüm, kendi içinde sıralı. */
  const aslaListesi = useMemo(() => sortSirali(items.filter(i => i.denendi && i.asla)), [items]);
  const istekListesi = useMemo(() => sortIstekListesi(items.filter(i => !i.denendi)), [items]);

  /**
   * İyimser yol: ekran hemen değişiyor, sıra arkadan yazılıyor. Yazım başarısız olursa
   * ekran veritabanından ayrı düşmesin diye veri baştan okunuyor.
   * `aslaDahil`: bölüm değiştiren sürükle-bırak `asla`'yı da yazıyor; ekleme yolu yalnızca sırayı.
   * Kademeler açıksa kademe her zaman yazılıyor: sıra ile kademe birlikte tutarlı kalsın.
   */
  const persistSira = useCallback(async (list: Item[], aslaDahil = false) => {
    setIsSaving(true);
    const kademeDahil = !!kademelerRef.current;
    try {
      await updateItemsSira(list.map(i => ({
        id: i.id,
        sira: i.sira ?? 0,
        ...(aslaDahil ? { asla: !!i.asla } : {}),
        ...(kademeDahil ? { kademe: i.kademe ?? null } : {}),
      })));
      // Şampiyon değişmiş olabilir: ray ve ana ekran ilk üçü yeniden okusun.
      listeleriTazele();
    } catch (e: unknown) {
      void load();
      void uyar(messages().islem.siraKaydedilemedi(hataMetni(e)));
    } finally {
      setIsSaving(false);
    }
  }, [load]);

  /** İyimser uygulama: sonucu ekrana koy, değişenleri arkadan yaz. */
  const iyimser = useCallback((sonuc: SiraSonucu, aslaDahil = false) => {
    setItems(sonuc.items);
    void persistSira(sonuc.degisenler, aslaDahil);
  }, [setItems, persistSira]);

  /**
   * Tek kayıt yolu: yeni kayıt, düzenleme ve "denedim" dönüşümü.
   * `targetIndex` yalnızca kayıt sıralamaya giriyorsa anlamlı.
   */
  const saveEntry = useCallback(async (
    entry: Item,
    editingItem: Item | null,
    targetIndex?: number
  ): Promise<Item> => {
    if (!liste) throw new Error(messages().islem.listeYuklenmedi);
    // `sira` ve `asla` bilerek dışarıda: konumu siralamayaSok / reorder belirliyor.
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

      if (!editingItem.denendi && updated.denendi) {   // "denedim" işaretlendi
        iyimser(siralamayaSok(itemsRef.current, updated, targetIndex, kademelerRef.current));
      } else {
        setItems(itemsRef.current.map(i => (i.id === entry.id ? updated : i)));
      }
      return updated;
    }

    const created = await createItem(payload);
    if (created.denendi) iyimser(siralamayaSok(itemsRef.current, created, targetIndex, kademelerRef.current));
    else setItems([...itemsRef.current, created]);
    return created;
  }, [liste, iyimser, setItems]);

  const removeEntry = useCallback(async (item: Item) => {
    await deleteItem(item.id, item.fotograf_url);
    setItems(itemsRef.current.filter(i => i.id !== item.id));
  }, [setItems]);

  /** Sürükle-bırak sonrası denenmişlerin yeni hâli: sıralama ve "Bir daha asla" birlikte. */
  const reorder = useCallback((next: Item[]) => {
    iyimser(denenenleriDegistir(itemsRef.current, next), true);
  }, [iyimser]);

  /** Kaydı başka bir kademeye taşır ("dokun, kademeyi seç"); sıra kademeye göre yeniden. */
  const kademeTasi = useCallback((id: string, hedef: string | null) => {
    const k = kademelerRef.current;
    if (!k) return;
    const yeni = kademeDegistir(siraliSiralama(itemsRef.current, k), k, id, hedef);
    if (yeni) iyimser(denenenleriDegistir(itemsRef.current, [...yeni, ...itemsRef.current.filter(i => i.denendi && i.asla)]));
  }, [iyimser]);

  /**
   * Toplu kategori atama: seçili kayıtlar tek istekte aynı kategoriye. `ozellikler`e
   * dokunmuyor — eski kategoriye bağlı alan değerleri kayıtta kalıp görünmez olur.
   */
  const kategoriAta = useCallback(async (ids: string[], categoryId: string | null) => {
    await updateItemsKategori(ids, categoryId);
    const hedef = new Set(ids);
    setItems(itemsRef.current.map(i => (hedef.has(i.id) ? { ...i, category_id: categoryId } : i)));
  }, [setItems]);

  /*
   * Toplu işlemler önce yazıp sonra ekranı güncelliyor: hata olursa sayfa veriyi
   * baştan okuyor, yarım kalmış bir iyimser durum ekranda kalmıyor. Hepsi kayıt
   * sayılarını ya da şampiyonu değiştirebildiği için sonunda ray tazeleniyor.
   */

  /** Seçili denenmiş kayıtları "Bir daha asla" ile sıralama arasında taşır (`asla` hedef bölüm). */
  const bolumDegistir = useCallback(async (ids: string[], asla: boolean) => {
    const k = kademelerRef.current;
    const sonuc = bolumHesapla(itemsRef.current, ids, asla, k);
    await updateItemsSira(sonuc.degisenler.map(i => ({
      id: i.id, sira: i.sira ?? 0, asla: !!i.asla, ...(k ? { kademe: i.kademe ?? null } : {}),
    })));
    // Yazılan hâl, yazım sürerken değişmiş olabilecek güncel listenin üstüne: bekleyenler korunuyor.
    setItems(denenenleriDegistir(itemsRef.current, sonuc.degisenler).items);
    listeleriTazele();
  }, [setItems]);

  /** Toplu "Denedim": seçili bekleyenler, listede göründükleri sırayla sıralamanın sonuna. */
  const denendiYap = useCallback(async (ids: string[]) => {
    const k = kademelerRef.current;
    const sonuc = denendiHesapla(itemsRef.current, ids, k);
    await updateItemsSira(sonuc.degisenler.map(i => ({
      id: i.id, sira: i.sira ?? 0, asla: false, denendi: true, ...(k ? { kademe: null } : {}),
    })));
    const yeni = new Map(sonuc.degisenler.map(i => [i.id, i]));
    setItems(itemsRef.current.map(i => yeni.get(i.id) ?? i));
    listeleriTazele();
  }, [setItems]);

  /** Toplu silme: kayıtlar ve fotoğrafları. Onayı sayfa soruyor. */
  const topluSil = useCallback(async (ids: string[]) => {
    const hedef = new Set(ids);
    await deleteItems(itemsRef.current.filter(i => hedef.has(i.id)));
    setItems(itemsRef.current.filter(i => !hedef.has(i.id)));
    listeleriTazele();
  }, [setItems]);

  return {
    liste, kategoriler, kademeler, items, denenenler, aslaListesi, istekListesi,
    loading, error, isSaving,
    load, saveEntry, removeEntry, reorder, kademeTasi, kategoriAta, bolumDegistir, denendiYap, topluSil,
  };
}
