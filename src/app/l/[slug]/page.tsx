'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Item, alanKisa, bayrak, filtreAlanlari } from '../../../types/item';
import { sortSirali } from '../../../lib/sort';
import {
  bosFiltre, filtreBos, filtreUygula, kategoriSayilari, bayrakSayilari,
} from '../../../lib/filtre';
import { useListStore } from '../../../hooks/useListStore';
import { listeleriTazele } from '../../../hooks/useListeler';
import { TopluBlok, topluKaydet } from '../../../lib/toplu';
import { hataMetni } from '../../../lib/hata';
import { useIsDesktop } from '../../../hooks/useIsDesktop';
import FilterPanel from '../../../components/FilterPanel';
import { StaticRow, DraggableRow } from '../../../components/ItemRow';
import DetailPane from '../../../components/DetailPane';
import WishlistPanel from '../../../components/WishlistPanel';
import ItemForm, { FormMode } from '../../../components/ItemForm';
import ListeRayi from '../../../components/ListeRayi';

export default function ListePage() {
  const isDesktop = useIsDesktop();
  const SLUG = String(useParams().slug ?? '');
  const {
    liste, kategoriler, items,
    denenenler: ranked, istekListesi,
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Derived data ────────────────────────────────── */
  const visible = useMemo(() => filtreUygula(ranked, filtre), [ranked, filtre]);
  const gorunenIstek = useMemo(() => filtreUygula(istekListesi, filtre), [istekListesi, filtre]);
  const canReorder = filtreBos(filtre);

  const total = ranked.length;
  const katSayilari = useMemo(() => kategoriSayilari(ranked), [ranked]);
  const baySayilari = useMemo(() => bayrakSayilari(ranked, alanlar), [ranked, alanlar]);

  // Mobil özet satırı ilk filtrelenebilir bool alanı üzerinden kuruluyor.
  const ozetAlan = filtreAlanlari(alanlar)[0];
  const ozetEvet = ozetAlan ? ranked.filter(i => bayrak(i, ozetAlan.anahtar)).length : 0;

  const selectedItem = useMemo(
    () => [...ranked, ...istekListesi].find(i => i.id === selectedId) ?? null,
    [ranked, istekListesi, selectedId]
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = sortSirali(ranked);
    const from = sorted.findIndex(i => i.id === active.id);
    const to = sorted.findIndex(i => i.id === over.id);
    if (from === -1 || to === -1) return;
    reorder(arrayMove(sorted, from, to).map((item, idx) => ({ ...item, sira: idx })));
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
    if (visible.length === 0) {
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
        </div>
      );
    }

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {/* Izgara stratejisi: podyumda 2. ve 3. yan yana duruyor, dikey strateji
            onların yerini yanlış hesaplardı. */}
        <SortableContext items={visible.map(i => i.id)} strategy={rectSortingStrategy}>
          {/* has-zirve: filtresiz görünümde ilk üç fotoğraflı podyum kartı olur.
              Satırlar listeden çıkarılmıyor ki sürüklenebilirliklerini korusunlar. */}
          <div className="rows has-zirve">
            {visible.map((item, i) => (
              <DraggableRow
                key={item.id}
                item={item}
                alanlar={alanlar}
                rank={i + 1}
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
    <div className="app" style={{ '--accent': liste?.renk } as React.CSSProperties}>
      {/* ── Sol ray: künye + liste indeksi (masaüstü) ── */}
      <ListeRayi aktifSlug={SLUG} />

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
          <Link href={`/l/${SLUG}/ayarlar`} className="mobile-brand-settings" aria-label="Liste ayarları">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <path d="M3 6h7M16 6h5M3 12h3M12 12h9M3 18h9M18 18h3" />
              <circle cx="13" cy="6" r="2.1" /><circle cx="9" cy="12" r="2.1" /><circle cx="15" cy="18" r="2.1" />
            </svg>
          </Link>
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

      {/* ── Right: detail + wishlist drawer (desktop) ── */}
      <section className="pane">
        <div className="pane-main">
          <DetailPane
            item={selectedItem}
            rank={selectedRank}
            total={total}
            ranked={ranked}
            kategoriler={kategoriler}
            alanlar={alanlar}
            kategoriSayilari={katSayilari}
            onEdit={(item) => openForm(item.denendi ? 'siralama' : 'istek', item)}
            onDelete={handleDelete}
            onSelect={(item) => setSelectedId(item.id)}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </section>

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
