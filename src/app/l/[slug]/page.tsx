'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Item, alanKisa, bayrak, filtreAlanlari } from '../../../types/item';
import {
  bosFiltre, filtreBos, filtreUygula, kategoriSayilari, bayrakSayilari,
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

export default function ListePage() {
  const isDesktop = useIsDesktop();
  const SLUG = String(useParams().slug ?? '');
  const {
    liste, kategoriler, items,
    denenenler: ranked, aslaListesi, istekListesi,
    loading, error, isSaving,
    load, saveEntry, removeEntry, reorder,
  } = useListStore(SLUG);

  const alanlar = useMemo(() => liste?.alanlar ?? [], [liste]);

  const [filtre, setFiltre] = useState(bosFiltre);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Bekleyenler ayrı bir route değil, aynı sayfanın ikinci sekmesi. */
  const [sekme, setSekme] = useState<'siralama' | 'sirada'>('siralama');

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

  const handleRowSelect = (item: Item) => {
    if (isDesktop) setSelectedId(prev => (prev === item.id ? null : item.id));
    else openForm(item.denendi ? 'siralama' : 'istek', item);
  };

  const sekmeSec = (next: 'siralama' | 'sirada') => {
    setSekme(next);
    setSelectedId(null);
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
        />
      );
    }

    if (total === 0) {
      return (
        <div className="state-empty">
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

    if (!canReorder) {
      return (
        <div className="rows">
          {visible.map((item) => (
            <StaticRow
              key={item.id}
              item={item}
              alanlar={alanlar}
              rank={ranked.findIndex(r => r.id === item.id) + 1}
              isSelected={selectedId === item.id}
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
                  isSelected={selectedId === item.id}
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
          strategy={verticalListSortingStrategy}
        >
          <div className="rows">
            {ranked.map((item, i) => (
              <DraggableRow
                key={item.id}
                item={item}
                alanlar={alanlar}
                rank={i + 1}
                isSelected={selectedId === item.id}
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
                isSelected={selectedId === item.id}
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
      <ListeRayi aktifSlug={SLUG} onAyarlar={() => setAyarlarAcik(true)} />

      {/* ── Center: ranked list ──────────────────────── */}
      <main className="list">
        {/* Masaüstünde marka rayda; mobilde bu ince başlık üstleniyor */}
        <div className="mobile-brand">
          <Link href="/" className="mobile-brand-back" aria-label="Listelerim">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="mobile-brand-text">
            <strong>{listeAdi}</strong>
            <em>kişisel sıralaman</em>
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

        {/* Mobilde filtreler ve başlık kaydırma boyunca sabit kalır */}
        <div className="sticky-top">
          <div className="mobile-filters">{renderFilterPanel('strip', 'inline')}</div>
          {/* Masaüstünde filtreler rayda değil, başlığın altında bir şerit */}
          <div className="desk-filters">{renderFilterPanel('desk', 'inline')}</div>

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

        {/* Mobilde ekranın dibinde sabit bant, masaüstünde orta sütunun dibi. */}
        <button
          type="button"
          className="fab"
          onClick={() => openForm(sekme === 'sirada' ? 'istek' : 'siralama')}
        >
          {sekme === 'sirada' ? 'Denenmemiş kayıt ekle' : 'Kayıt ekle'}
        </button>
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
        />
      )}

      {isSaving && <div className="toast">Sıralama kaydediliyor…</div>}

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
