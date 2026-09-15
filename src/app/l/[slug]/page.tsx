'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Item, alanKisa, bayrak, filtreAlanlari } from '../../../types/item';
import {
  KATEGORISIZ, bosFiltre, filtreBos, filtreUygula, kategoriSayilari, bayrakSayilari,
} from '../../../lib/filtre';
import { useListStore } from '../../../hooks/useListStore';
import { listeleriTazele } from '../../../hooks/useListeler';
import { TopluBlok, topluKaydet } from '../../../lib/toplu';
import { hataMetni } from '../../../lib/hata';
import { uploadFotograf, deleteFotograf } from '../../../lib/items';
import { useIsDesktop } from '../../../hooks/useIsDesktop';
import FilterPanel from '../../../components/FilterPanel';
import {
  ASLA_SINIRI, AslaSiniri, DraggableRow, StaticRow, SuruklenebilirAslaSiniri,
} from '../../../components/ItemRow';
import DetailPane from '../../../components/DetailPane';
import WishlistPanel from '../../../components/WishlistPanel';
import ItemForm, { FormMode } from '../../../components/ItemForm';
import ListeRayi from '../../../components/ListeRayi';
import ListeAyarlariModal from '../../../components/ListeAyarlariModal';
import { BosSahne } from '../../../components/Sahne';

/* İşlem çubuğunun simgeleri — uygulamanın çizgi simgeleriyle aynı kalınlıkta. */
const Ikon = ({ children }: { children: React.ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const KategoriIkon = <Ikon><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></Ikon>;
const AslaIkon = <Ikon><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></Ikon>;
const GeriAlIkon = <Ikon><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Ikon>;
const DenedimIkon = <Ikon><path d="M5 12.5l4.5 4.5L19 7.5" /></Ikon>;
const SilIkon = <Ikon><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Ikon>;
const GeriIkon = <Ikon><path d="M15 5l-7 7 7 7" /></Ikon>;
const KartIkon = (
  <Ikon>
    <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Ikon>
);
const SatirIkon = <Ikon><path d="M4 6h16M4 12h16M4 18h16" /></Ikon>;

/** Masaüstündeki Kart / Satır tercihinin tarayıcıdaki anahtarı. */
const GORUNUM_ANAHTARI = 'siralama-defteri:gorunum';

export default function ListePage() {
  const isDesktop = useIsDesktop();
  const SLUG = String(useParams().slug ?? '');
  const {
    liste, kategoriler, items,
    denenenler: ranked, aslaListesi, istekListesi,
    loading, error, isSaving,
    load, saveEntry, removeEntry, reorder, kategoriAta, bolumDegistir, denendiYap, topluSil,
  } = useListStore(SLUG);

  const alanlar = useMemo(() => liste?.alanlar ?? [], [liste]);

  const [filtre, setFiltre] = useState(bosFiltre);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Bekleyenler ayrı bir route değil, aynı sayfanın ikinci sekmesi. */
  const [sekme, setSekme] = useState<'siralama' | 'sirada'>('siralama');

  /**
   * Masaüstünde kayıtlar kart ya da satır; tercih tarayıcıda hatırlanıyor. Mobil hep
   * satır: dar ekranda kart tek sütuna düşüp ekrana 2–3 kayıt sığdırırdı.
   */
  const [gorunum, setGorunum] = useState<'kart' | 'satir'>('kart');
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(GORUNUM_ANAHTARI) === 'satir') setGorunum('satir');
    } catch { /* depolama kapalı: varsayılan kart */ }
  }, []);
  const gorunumSec = (next: 'kart' | 'satir') => {
    setGorunum(next);
    try { window.localStorage.setItem(GORUNUM_ANAHTARI, next); } catch { /* yok say */ }
  };
  const kartGorunum = isDesktop && gorunum === 'kart';

  /** Toplu kategori atama: null kapalı; açıkken seçili kayıtların id'leri. */
  const [secim, setSecim] = useState<Set<string> | null>(null);
  const [atamaSuruyor, setAtamaSuruyor] = useState(false);
  /** Çubuğun alt satırı: ana işlemler ya da "Kategori"ye basınca açılan kategori hapları. */
  const [cubukKip, setCubukKip] = useState<'islemler' | 'kategori'>('islemler');
  /** Kısa süreli geri bildirim ("7 kayıt Yaz kategorisine taşındı"). */
  const [bildirim, setBildirim] = useState<string | null>(null);
  useEffect(() => {
    if (!bildirim) return;
    const id = window.setTimeout(() => setBildirim(null), 2600);
    return () => window.clearTimeout(id);
  }, [bildirim]);
  useEffect(() => {
    if (!secim) return;
    const kapat = (e: KeyboardEvent) => { if (e.key === 'Escape') setSecim(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [secim]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('siralama');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  /** Liste ayarları popup'ı. Başka bir listenin ayar simgesinden ya da yeni liste
   *  açılışından `?ayarlar=1` ile gelinirse açık doğuyor. */
  const [ayarlarAcik, setAyarlarAcik] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('ayarlar')) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAyarlarAcik(true);
    // Parametre adreste kalırsa yenilemede popup yeniden açılırdı.
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Derived data ────────────────────────────────── */
  const visible = useMemo(() => filtreUygula(ranked, filtre), [ranked, filtre]);
  const visibleAsla = useMemo(() => filtreUygula(aslaListesi, filtre), [aslaListesi, filtre]);
  const gorunenIstek = useMemo(() => filtreUygula(istekListesi, filtre), [istekListesi, filtre]);
  const canReorder = filtreBos(filtre);

  /** Sayılar "Bir daha asla" bölümünü de sayıyor: onlar da denenmiş kayıtlar. */
  const denenenTum = useMemo(() => [...ranked, ...aslaListesi], [ranked, aslaListesi]);
  const total = denenenTum.length;
  const katSayilari = useMemo(() => kategoriSayilari(denenenTum), [denenenTum]);
  const baySayilari = useMemo(() => bayrakSayilari(denenenTum, alanlar), [denenenTum, alanlar]);

  // Mobil özet satırı ilk filtrelenebilir bool alanı üzerinden kuruluyor.
  const ozetAlan = filtreAlanlari(alanlar)[0];
  const ozetEvet = ozetAlan ? denenenTum.filter(i => bayrak(i, ozetAlan.anahtar)).length : 0;

  const selectedItem = useMemo(
    () => [...denenenTum, ...istekListesi].find(i => i.id === selectedId) ?? null,
    [denenenTum, istekListesi, selectedId]
  );
  // Bekleyen kaydın sırası yok; panel #numarayı o zaman göstermiyor.
  const selectedRank = useMemo(() => {
    if (!selectedItem?.denendi) return null;
    const i = ranked.findIndex(r => r.id === selectedItem.id);
    return i === -1 ? null : i + 1;
  }, [ranked, selectedItem]);
  /** Detay panelindeki "Sıralamadaki yeri": seçili kaydın bir üstü ve bir altı. */
  const komsular = useMemo(() => {
    if (selectedRank === null) return null;
    return { ust: ranked[selectedRank - 2] ?? null, alt: ranked[selectedRank] ?? null };
  }, [ranked, selectedRank]);

  /** Seçim modunda "Tümünü seç"in kapsamı: açık sekmede filtreye uyan kayıtlar. */
  const gorunenKayitlar = sekme === 'sirada' ? gorunenIstek : [...visible, ...visibleAsla];
  const hepsiSecili = !!secim && gorunenKayitlar.length > 0 && gorunenKayitlar.every(i => secim.has(i.id));
  const seciliKayitlar = secim ? items.filter(i => secim.has(i.id)) : [];
  /** Bölüm düğmesinin yönü: seçilenlerin hepsi zaten "Bir daha asla"daysa "Sıralamaya al". */
  const aslaSecili = seciliKayitlar.filter(i => i.denendi && i.asla);
  const siraliSecili = seciliKayitlar.filter(i => i.denendi && !i.asla);
  const sadeceAsla = siraliSecili.length === 0 && aslaSecili.length > 0;
  /** Açık sekmede kategorisi olmayan kayıtlar — filtre şeridindeki "Kategorisiz" hapının sayısı. */
  const kategorisizAdet = (sekme === 'sirada' ? istekListesi : denenenTum).filter(i => !i.category_id).length;
  const secili = (id: string) => (secim ? secim.has(id) : selectedId === id);

  const handleRowSelect = (item: Item) => {
    if (secim) {
      setSecim(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
        return next;
      });
      return;
    }
    if (isDesktop) setSelectedId(prev => (prev === item.id ? null : item.id));
    else openForm(item.denendi ? 'siralama' : 'istek', item);
  };

  const sekmeSec = (next: 'siralama' | 'sirada') => {
    setSekme(next);
    setSelectedId(null);
    // Seçim sekmeye ait: diğer sekmedeki görünmeyen kayıtlar yanlışlıkla taşınmasın.
    setSecim(prev => (prev ? new Set() : null));
  };

  /**
   * Sıralama ve "Bir daha asla" tek sürüklenebilir liste; aradaki kırmızı çizgi de
   * listenin bir öğesi. Bırakınca çizginin üstü sıralama, altı bölüm oluyor ve
   * iki taraf kendi içinde 0'dan numaralanıyor.
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const dizi: (Item | typeof ASLA_SINIRI)[] = [...ranked, ASLA_SINIRI, ...aslaListesi];
    const kimlik = (x: Item | typeof ASLA_SINIRI) => (x === ASLA_SINIRI ? x : x.id);
    const from = dizi.findIndex(x => kimlik(x) === active.id);
    const to = dizi.findIndex(x => kimlik(x) === over.id);
    if (from === -1 || to === -1) return;
    const yeni = arrayMove(dizi, from, to);
    const sinir = yeni.indexOf(ASLA_SINIRI);
    const ust = yeni.slice(0, sinir) as Item[];
    const alt = yeni.slice(sinir + 1) as Item[];
    reorder([
      ...ust.map((item, idx) => ({ ...item, sira: idx, asla: false })),
      ...alt.map((item, idx) => ({ ...item, sira: idx, asla: true })),
    ]);
  };

  /* ── Form ────────────────────────────────────────── */
  const openForm = (mode: FormMode, item: Item | null = null) => {
    setFormMode(mode);
    setEditingItem(item);
    setIsFormOpen(true);
  };
  const closeForm = () => { setIsFormOpen(false); setEditingItem(null); };
  const openAdd = () => openForm('siralama');

  const handleSave = async (entry: Item, targetIndex?: number) => {
    try {
      const saved = await saveEntry(entry, editingItem, targetIndex);
      if (saved.denendi && !editingItem?.denendi) setSelectedId(saved.id);
      // Kayıt eklendi ya da bekleyenlerden sıralamaya geçti: raydaki sayı da değişti.
      listeleriTazele();
      closeForm();
    } catch (e: unknown) {
      alert('Hata: ' + hataMetni(e));
    }
  };

  /** Toplu sekmesi: kayıtlar sıralamanın altına eklenir, sonra veri baştan okunur. */
  const handleTopluSave = async (bloklar: TopluBlok[], denendi: boolean) => {
    if (!liste) return;
    const sonSira = items.reduce((max, i) => Math.max(max, i.sira ?? 0), -1);
    await topluKaydet({ liste, kategoriler, bloklar, baslangicSira: sonSira + 1, denendi });
    await load();
    listeleriTazele();
  };

  /**
   * Detay panelinden doğrudan fotoğraf: yükle, kaydı güncelle. Düzenleme yolundan
   * geçtiği için eski fotoğrafı saveEntry depodan siliyor; kayıt güncellenemezse
   * yeni yüklenen dosya yetim kalmasın diye geri siliniyor.
   */
  const handleFotograf = async (item: Item, file: File) => {
    const url = await uploadFotograf(file);
    try {
      await saveEntry({ ...item, fotograf_url: url }, item);
    } catch (e: unknown) {
      void deleteFotograf(url);
      throw e;
    }
  };

  const handleDelete = async (item: Item) => {
    if (!window.confirm(`“${item.ad}” kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      await removeEntry(item);
      listeleriTazele();
      setSelectedId(prev => (prev === item.id ? null : prev));
      closeForm();
    } catch (e: unknown) {
      alert('Silme sırasında hata oluştu: ' + hataMetni(e));
    }
  };

  /* ── Toplu kategori atama ────────────────────────── */
  const secimAc = () => { setSelectedId(null); setCubukKip('islemler'); setSecim(new Set()); };
  const tumunuSec = () => setSecim(hepsiSecili ? new Set() : new Set(gorunenKayitlar.map(i => i.id)));

  /** Toplu işlemlerin ortak yolu. Seçim temizleniyor ama mod açık kalıyor ki sıradaki grup seçilebilsin. */
  const islemYap = async (fn: () => Promise<void>, mesaj: string) => {
    if (atamaSuruyor) return;
    setAtamaSuruyor(true);
    try {
      await fn();
      setBildirim(mesaj);
      setSecim(new Set());
      setCubukKip('islemler');
    } catch (e: unknown) {
      alert('İşlem tamamlanamadı: ' + hataMetni(e));
      // Satır satır yazılan işlemlerde bir kısmı geçmiş olabilir: ekranı veritabanıyla eşitle.
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

  const silToplu = () => {
    if (seciliKayitlar.length === 0) return;
    const adet = seciliKayitlar.length;
    const fotolu = seciliKayitlar.some(i => i.fotograf_url);
    if (!window.confirm(`${adet} kayıt${fotolu ? ' ve fotoğrafları' : ''} kalıcı olarak silinecek. Emin misin?`)) return;
    const ids = seciliKayitlar.map(i => i.id);
    void islemYap(() => topluSil(ids), `${adet} kayıt silindi`);
  };

  /** Liste ayarlarındaki "Şimdi ata" köprüsü: kategorisiz kayıtları süzüp seçim modunu açar. */
  const kategorisizAta = () => {
    setAyarlarAcik(false);
    setSekme(denenenTum.some(i => !i.category_id) ? 'siralama' : 'sirada');
    setFiltre({ ...bosFiltre(), kategoriler: new Set([KATEGORISIZ]) });
    secimAc();
  };

  const renderFilterPanel = (instanceId: string, layout: 'stack' | 'inline') => (
    <FilterPanel
      instanceId={instanceId}
      layout={layout}
      kategoriler={kategoriler}
      alanlar={alanlar}
      filtre={filtre}
      onChange={setFiltre}
      kategoriSayilari={katSayilari}
      bayrakSayilari={baySayilari}
      kategorisizAdet={kategorisizAdet}
    />
  );

  const listeAdi = liste?.ad ?? 'Sıralama';

  const listBody = (() => {
    if (loading) return <p className="state-msg">Yükleniyor…</p>;
    if (!liste) {
      return (
        <div className="state-empty">
          <p className="state-empty-title">Liste bulunamadı</p>
          <p>“{SLUG}” adında bir listen yok.</p>
          <Link href="/" className="btn-primary">Listelerime dön</Link>
        </div>
      );
    }
    if (sekme === 'sirada') {
      if (istekListesi.length > 0 && gorunenIstek.length === 0) {
        return (
          <div className="state-empty">
            <p className="state-empty-title">Eşleşen kayıt yok</p>
            <p>Seçtiğin filtrelere uyan bekleyen kayıt bulunmuyor.</p>
          </div>
        );
      }
      return (
        <WishlistPanel
          items={gorunenIstek}
          kategoriler={kategoriler}
          alanlar={alanlar}
          selectedId={selectedId}
          onSelect={handleRowSelect}
          onTried={(item) => openForm('denedim', item)}
          onAdd={() => openForm('istek')}
          kart={kartGorunum}
          secimModu={!!secim}
          secililer={secim}
        />
      );
    }

    if (total === 0) {
      return (
        <div className="state-empty">
          <BosSahne tur="siralama" />
          <p className="state-empty-title">Henüz kaydın yok</p>
          <p>
            İlk kaydını ekleyerek kendi sıralamanı oluşturmaya başla — uzun bir listen varsa
            formun “Toplu” sekmesine hepsini birden yapıştırabilirsin.
          </p>
          <button type="button" className="btn-primary" onClick={openAdd}>İlk Kaydı Ekle</button>
        </div>
      );
    }
    if (visible.length === 0 && visibleAsla.length === 0) {
      return (
        <div className="state-empty">
          <p className="state-empty-title">Eşleşen kayıt yok</p>
          <p>Seçtiğin filtrelere uyan kayıt bulunmuyor.</p>
        </div>
      );
    }

    // Seçim modunda da sürükleme yok: dokunmak seçmek demek, iki hareket karışmasın.
    if (!canReorder || secim) {
      return (
        <div className={kartGorunum ? 'rows rows-kart' : 'rows'}>
          {visible.map((item) => (
            <StaticRow
              key={item.id}
              item={item}
              alanlar={alanlar}
              rank={ranked.findIndex(r => r.id === item.id) + 1}
              secimModu={!!secim}
              isSelected={secili(item.id)}
              onSelect={handleRowSelect}
            />
          ))}
          {visibleAsla.length > 0 && (
            <>
              <AslaSiniri adet={aslaListesi.length} />
              {visibleAsla.map((item) => (
                <StaticRow
                  key={item.id}
                  item={item}
                  alanlar={alanlar}
                  rank={0}
                  asla
                  secimModu={!!secim}
                  isSelected={secili(item.id)}
                  onSelect={handleRowSelect}
                />
              ))}
            </>
          )}
        </div>
      );
    }

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={[...ranked.map(i => i.id), ASLA_SINIRI, ...aslaListesi.map(i => i.id)]}
          // Kartlar ızgarada: satır stratejisi yalnızca dikey yer değiştirmeyi hesaplıyor.
          strategy={kartGorunum ? rectSortingStrategy : verticalListSortingStrategy}
        >
          <div className={kartGorunum ? 'rows rows-kart' : 'rows'}>
            {ranked.map((item, i) => (
              <DraggableRow
                key={item.id}
                item={item}
                alanlar={alanlar}
                rank={i + 1}
                isSelected={secili(item.id)}
                onSelect={handleRowSelect}
              />
            ))}
            <SuruklenebilirAslaSiniri adet={aslaListesi.length} />
            {/* Bölüm boşken çizgi yine duruyor ki kartlar altına bırakılabilsin. */}
            {aslaListesi.length === 0 && (
              <p className="asla-bos">Bir daha asla dediklerini bu çizginin altına sürükle.</p>
            )}
            {aslaListesi.map((item) => (
              <DraggableRow
                key={item.id}
                item={item}
                alanlar={alanlar}
                rank={0}
                asla
                isSelected={secili(item.id)}
                onSelect={handleRowSelect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  })();

  return (
    // Seçili kayıt yokken detay sütunu kapanıyor (pane-kapali), sıralama genişliyor.
    <div className={`app${selectedItem ? '' : ' pane-kapali'}`}>
      {/* ── Sol ray: künye + liste indeksi (masaüstü) ── */}
      <ListeRayi aktifSlug={SLUG} />

      {/* ── Center: ranked list ──────────────────────── */}
      <main className={`list${kartGorunum ? ' is-kart' : ''}`}>
        {/* Başlık, sekmeler ve filtreler kaydırmada sabit; yalnızca kayıtlar hareket ediyor. */}
        <div className="sticky-top">
        <div className="mobile-brand">
          <Link href="/" className="mobile-brand-back" aria-label="Listelerim">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="mobile-brand-text">
            <strong>{listeAdi}</strong>
            {/* Yüklenirken boş satır: başlık yüksekliği oynamasın, "Henüz sıralama yok" bir an görünmesin. */}
            <em>
              {loading || !liste
                ? ' '
                : ranked[0] ? <>Şampiyon: <b>{ranked[0].ad}</b></> : 'Henüz sıralama yok'}
            </em>
          </span>
          <button
            type="button"
            className="mobile-brand-settings"
            aria-label="Liste ayarları"
            onClick={() => setAyarlarAcik(true)}
            disabled={!liste}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <path d="M3 6h7M16 6h5M3 12h3M12 12h9M3 18h9M18 18h3" />
              <circle cx="13" cy="6" r="2.1" /><circle cx="9" cy="12" r="2.1" /><circle cx="15" cy="18" r="2.1" />
            </svg>
            {/* Etiket yalnızca masaüstünde: mobil başlıkta sığmaz, adı keserdi. */}
            <span className="mobile-brand-settings-ad">Liste ayarları</span>
          </button>
        </div>

        {total > 0 && (
          <p className="mobile-summary">
            <strong>{total}</strong> kayıt sıraladın
            {ozetAlan && (
              <>
                {' '}· <strong>{ozetEvet}</strong> tanesi {alanKisa(ozetAlan).toLocaleLowerCase('tr')} ·{' '}
                <strong>{total - ozetEvet}</strong> tanesi değil
              </>
            )}
          </p>
        )}

          {/* Masaüstünde tek satır: sekmeler solda, kategori şeridi ortada, görünüm ve "Seç" sağda.
              Mobilde satır sarıyor: sekmeler kendi satırında ortalı, altında filtreler. */}
          <div className="liste-arac">
            <nav className="tabs" aria-label="Liste görünümü">
              <button
                type="button"
                className={`tab${sekme === 'siralama' ? ' is-on' : ''}`}
                aria-current={sekme === 'siralama' ? 'page' : undefined}
                onClick={() => sekmeSec('siralama')}
              >
                Sıralamam · {total}
              </button>
              <button
                type="button"
                className={`tab${sekme === 'sirada' ? ' is-on' : ''}`}
                aria-current={sekme === 'sirada' ? 'page' : undefined}
                onClick={() => sekmeSec('sirada')}
              >
                Denenmemiş · {istekListesi.length}
              </button>
            </nav>
            <div className="liste-arac-filtre">
              <div className="mobile-filters">{renderFilterPanel('strip', 'inline')}</div>
              {/* Masaüstünde filtreler rayda değil, başlığın altında bir şerit */}
              <div className="desk-filters">{renderFilterPanel('desk', 'inline')}</div>
            </div>
            {isDesktop && (sekme === 'sirada' ? istekListesi.length : total) > 0 && (
              <div className="gorunum-secici" role="group" aria-label="Görünüm">
                <button
                  type="button"
                  className={gorunum === 'kart' ? 'is-on' : ''}
                  aria-pressed={gorunum === 'kart'}
                  aria-label="Kart görünümü"
                  title="Kart görünümü"
                  onClick={() => gorunumSec('kart')}
                >
                  {KartIkon}
                </button>
                <button
                  type="button"
                  className={gorunum === 'satir' ? 'is-on' : ''}
                  aria-pressed={gorunum === 'satir'}
                  aria-label="Satır görünümü"
                  title="Satır görünümü"
                  onClick={() => gorunumSec('satir')}
                >
                  {SatirIkon}
                </button>
              </div>
            )}
            {/* Toplu işlemler: açık sekmede kayıt varken. */}
            {(sekme === 'sirada' ? istekListesi.length : total) > 0 && (
              <button
                type="button"
                className={`secim-ac${secim ? ' is-on' : ''}`}
                aria-pressed={!!secim}
                onClick={() => (secim ? setSecim(null) : secimAc())}
              >
                {secim ? 'Bitti' : 'Seç'}
              </button>
            )}
          </div>

          {sekme === 'siralama' && !canReorder && (
            <p className="list-note">
              Sıralama yalnızca filtresiz görünümde değiştirilebilir.
            </p>
          )}
        </div>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>Tekrar dene</button>
          </div>
        )}

        {listBody}

        {/* Mobilde ekranın dibinde sabit bant, masaüstünde orta sütunun dibi.
            Seçim modunda ekleme düğmesinin yerini işlem çubuğu alıyor. */}
        {secim ? (
          <div className="secim-cubugu" role="toolbar" aria-label="Seçili kayıtlar">
            <div className="secim-cubugu-ust">
              <strong aria-live="polite">
                {secim.size > 0 ? `${secim.size} seçili` : 'Kayıtlara dokunarak seç'}
              </strong>
              <button
                type="button"
                className="secim-link"
                onClick={tumunuSec}
                disabled={gorunenKayitlar.length === 0}
              >
                {hepsiSecili ? 'Seçimi temizle' : 'Tümünü seç'}
              </button>
              <button type="button" className="secim-kapat" onClick={() => setSecim(null)} aria-label="Seçimi bitir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {/* Karışık seçimde "Bir daha asla" yalnızca sıralamadakileri taşıyor — söylenmeli. */}
            {sekme === 'siralama' && cubukKip === 'islemler' && aslaSecili.length > 0 && siraliSecili.length > 0 && (
              <p className="secim-not">
                {aslaSecili.length} tanesi zaten Bir daha asla&apos;da; yalnızca diğer {siraliSecili.length} taşınır.
              </p>
            )}
            {cubukKip === 'kategori' ? (
              <div className="secim-islemler">
                <button
                  type="button"
                  className="secim-geri"
                  onClick={() => setCubukKip('islemler')}
                  aria-label="İşlemlere dön"
                >
                  {GeriIkon}
                </button>
                <div className="secim-kategoriler">
                  {kategoriler.map(kat => (
                    <button
                      key={kat.id}
                      type="button"
                      className="secim-kat"
                      style={{ '--kat': kat.renk } as React.CSSProperties}
                      disabled={secim.size === 0 || atamaSuruyor}
                      onClick={() => kategoriyeTasi(kat.id)}
                    >
                      <i aria-hidden="true" />{kat.ad}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="secim-kat is-kaldir"
                    disabled={secim.size === 0 || atamaSuruyor}
                    onClick={() => kategoriyeTasi(null)}
                  >
                    Kategoriden çıkar
                  </button>
                </div>
              </div>
            ) : (
              <div className="secim-islemler">
                {kategoriler.length > 0 && (
                  <button
                    type="button"
                    className="secim-islem"
                    disabled={secim.size === 0 || atamaSuruyor}
                    onClick={() => setCubukKip('kategori')}
                  >
                    {KategoriIkon}<span>Kategori</span>
                  </button>
                )}
                {sekme === 'sirada' ? (
                  <button
                    type="button"
                    className="secim-islem is-vurgu"
                    disabled={secim.size === 0 || atamaSuruyor}
                    onClick={denedimToplu}
                  >
                    {DenedimIkon}<span>Denedim</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secim-islem"
                    disabled={secim.size === 0 || atamaSuruyor}
                    onClick={bolumIslemi}
                  >
                    {sadeceAsla ? GeriAlIkon : AslaIkon}
                    <span>{sadeceAsla ? 'Sıralamaya al' : 'Bir daha asla'}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="secim-islem is-tehlike"
                  disabled={secim.size === 0 || atamaSuruyor}
                  onClick={silToplu}
                >
                  {SilIkon}<span>Sil</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="fab"
            onClick={() => openForm(sekme === 'sirada' ? 'istek' : 'siralama')}
          >
            {sekme === 'sirada' ? 'Denenmemiş kayıt ekle' : 'Kayıt ekle'}
          </button>
        )}
      </main>

      {/* ── Sağ: seçili kaydın detayı (masaüstü) ── */}
      {selectedItem && (
        <section className="pane">
          <div className="pane-main">
            <DetailPane
              item={selectedItem}
              rank={selectedRank}
              kategoriler={kategoriler}
              alanlar={alanlar}
              onEdit={(item) => openForm(item.denendi ? 'siralama' : 'istek', item)}
              onDelete={handleDelete}
              onFotograf={handleFotograf}
              komsular={komsular}
              onSelect={(item) => setSelectedId(item.id)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        </section>
      )}

      {ayarlarAcik && liste && (
        <ListeAyarlariModal
          liste={liste}
          kategoriler={kategoriler}
          items={items}
          onChanged={load}
          onClose={() => setAyarlarAcik(false)}
          onKategorisizAta={kategorisizAta}
        />
      )}

      {isSaving || atamaSuruyor
        ? <div className="toast">{atamaSuruyor ? 'Uygulanıyor…' : 'Sıralama kaydediliyor…'}</div>
        : bildirim && <div className="toast" role="status">{bildirim}</div>}

      <ItemForm
        key={`${editingItem?.id ?? 'new'}-${formMode}-${isFormOpen ? 'open' : 'closed'}`}
        isOpen={isFormOpen}
        editingItem={editingItem}
        mode={formMode}
        listeAdi={listeAdi}
        kategoriler={kategoriler}
        alanlar={alanlar}
        initialCategoryId={filtre.kategoriler.size === 1 ? [...filtre.kategoriler][0] : undefined}
        existingItems={ranked}
        onClose={closeForm}
        onSave={handleSave}
        onTopluSave={handleTopluSave}
        onDelete={editingItem ? () => handleDelete(editingItem) : undefined}
      />
    </div>
  );
}
