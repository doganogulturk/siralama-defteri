'use client';

import { useEffect, useState } from 'react';
import { Item } from '../types/item';
import { hataMetni } from '../lib/hata';
import { onayla, uyar } from '../lib/pencere';
import type { useListStore } from './useListStore';

type Magaza = Pick<
  ReturnType<typeof useListStore>,
  'items' | 'kategoriler' | 'load' | 'kategoriAta' | 'bolumDegistir' | 'denendiYap' | 'topluSil'
>;

/**
 * Seçim modu ve toplu işlemler: kategori atama, "Bir daha asla" ile sıralama arasında
 * taşıma, toplu "Denedim" ve silme. `secim` null ise mod kapalı; açıkken seçili kayıtların
 * id'leri. Seçim sekmeye ait — sekme değişince `temizle` çağrılıyor.
 */
export function useSecim({ magaza, gorunenKayitlar, bildir }: {
  magaza: Magaza;
  /** "Tümünü seç"in kapsamı: açık sekmede filtreye uyan kayıtlar. */
  gorunenKayitlar: Item[];
  bildir: (mesaj: string) => void;
}) {
  const { items, kategoriler, load, kategoriAta, bolumDegistir, denendiYap, topluSil } = magaza;
  const [secim, setSecim] = useState<Set<string> | null>(null);
  const [atamaSuruyor, setAtamaSuruyor] = useState(false);
  /** Çubuğun alt satırı: ana işlemler ya da "Kategori"ye basınca açılan kategori hapları. */
  const [cubukKip, setCubukKip] = useState<'islemler' | 'kategori'>('islemler');

  useEffect(() => {
    if (!secim) return;
    const kapat = (e: KeyboardEvent) => { if (e.key === 'Escape') setSecim(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [secim]);

  const hepsiSecili = !!secim && gorunenKayitlar.length > 0 && gorunenKayitlar.every(i => secim.has(i.id));
  const seciliKayitlar = secim ? items.filter(i => secim.has(i.id)) : [];
  /** Bölüm düğmesinin yönü: seçilenlerin hepsi zaten "Bir daha asla"daysa "Sıralamaya al". */
  const aslaSecili = seciliKayitlar.filter(i => i.denendi && i.asla);
  const siraliSecili = seciliKayitlar.filter(i => i.denendi && !i.asla);
  const sadeceAsla = siraliSecili.length === 0 && aslaSecili.length > 0;

  const ac = () => { setCubukKip('islemler'); setSecim(new Set()); };
  const kapat = () => setSecim(null);
  /** Mod açıksa seçimi boşaltır, kapalıysa kapalı bırakır. */
  const temizle = () => setSecim(prev => (prev ? new Set() : null));
  const degistir = (id: string) => setSecim(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const tumunuSec = () => setSecim(hepsiSecili ? new Set() : new Set(gorunenKayitlar.map(i => i.id)));

  /** Toplu işlemlerin ortak yolu. Seçim temizleniyor ama mod açık kalıyor ki sıradaki grup seçilebilsin. */
  const islemYap = async (fn: () => Promise<void>, mesaj: string) => {
    if (atamaSuruyor) return;
    setAtamaSuruyor(true);
    try {
      await fn();
      bildir(mesaj);
      setSecim(new Set());
      setCubukKip('islemler');
    } catch (e: unknown) {
      void uyar('İşlem tamamlanamadı: ' + hataMetni(e));
      // Yarım kalmış bir iyimser durum ekranda kalmasın: ekranı veritabanıyla eşitle.
      void load();
    } finally {
      setAtamaSuruyor(false);
    }
  };

  const kategoriyeTasi = (categoryId: string | null) => {
    if (!secim?.size) return;
    const ids = [...secim];
    const ad = categoryId ? kategoriler.find(k => k.id === categoryId)?.ad : null;
    void islemYap(
      () => kategoriAta(ids, categoryId),
      ad ? `${ids.length} kayıt “${ad}” kategorisine taşındı` : `${ids.length} kayıt kategoriden çıkarıldı`
    );
  };

  /** Sıralamam sekmesi: seçilenleri "Bir daha asla"ya taşır; hepsi zaten oradaysa sıralamaya geri alır. */
  const bolumIslemi = () => {
    const aslaya = !sadeceAsla;
    const hedef = aslaya ? siraliSecili : aslaSecili;
    if (hedef.length === 0) return;
    void islemYap(
      () => bolumDegistir(hedef.map(i => i.id), aslaya),
      aslaya ? `${hedef.length} kayıt Bir daha asla'ya taşındı` : `${hedef.length} kayıt sıralamaya alındı`
    );
  };

  /** Denenmemiş sekmesi: seçilenler sıralamanın sonuna. Yerleri sonra sürükleyerek düzeltiliyor. */
  const denedimToplu = () => {
    if (!secim?.size) return;
    const ids = [...secim];
    void islemYap(() => denendiYap(ids), `${ids.length} kayıt sıralamanın sonuna eklendi`);
  };

  const silToplu = async () => {
    if (seciliKayitlar.length === 0) return;
    const adet = seciliKayitlar.length;
    const fotolu = seciliKayitlar.some(i => i.fotograf_url);
    if (!(await onayla({
      metin: `${adet} kayıt${fotolu ? ' ve fotoğrafları' : ''} kalıcı olarak silinecek. Emin misin?`,
      onay: 'Sil',
      tehlikeli: true,
    }))) return;
    const ids = seciliKayitlar.map(i => i.id);
    void islemYap(() => topluSil(ids), `${adet} kayıt silindi`);
  };

  return {
    secim, atamaSuruyor, cubukKip, setCubukKip,
    hepsiSecili, gorunenAdet: gorunenKayitlar.length, aslaSecili, siraliSecili, sadeceAsla,
    ac, kapat, temizle, degistir, tumunuSec,
    kategoriyeTasi, bolumIslemi, denedimToplu, silToplu,
  };
}

export type SecimModu = ReturnType<typeof useSecim>;
