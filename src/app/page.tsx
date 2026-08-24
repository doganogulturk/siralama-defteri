'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { AyranEntry, Kategori, kategoriler } from '../types/ayran';
import { sortAyranlar } from '../lib/sort';
import { useAyranStore } from '../hooks/useAyranStore';
import { useIsDesktop } from '../hooks/useIsDesktop';
import FilterPanel, { ViewMode } from '../components/FilterPanel';
import { StaticRow, DraggableRow } from '../components/AyranRow';
import DetailPane from '../components/DetailPane';
import WishlistDrawer from '../components/WishlistDrawer';
import AyranForm, { FormMode } from '../components/AyranForm';

const VIEW_TITLE: Record<ViewMode, string> = {
  hepsi: 'Tüm Kayıtlar',
  eksi: 'Ekşiler',
  tatli: 'Ekşi Olmayanlar',
};

export default function Home() {
  const isDesktop = useIsDesktop();
  const {
    denenenler: ranked, istekListesi,
    loading, error, isSaving,
    load, saveEntry, removeEntry, reorder,
  } = useAyranStore();

  const [view, setView] = useState<ViewMode>('hepsi');
  const [categories, setCategories] = useState<Set<Kategori>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('siralama');
  const [editingItem, setEditingItem] = useState<AyranEntry | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ── Derived data ────────────────────────────────── */
  const visible = useMemo(() => {
    let items = ranked;
    if (view === 'eksi') items = items.filter(i => i.eksi_mi);
    if (view === 'tatli') items = items.filter(i => !i.eksi_mi);
    if (categories.size > 0) items = items.filter(i => categories.has(i.kategori));
    return items;
  }, [ranked, view, categories]);

  const canReorder = view === 'hepsi' && categories.size === 0;

  const total = ranked.length;
  const eksiCount = ranked.filter(a => a.eksi_mi).length;
  const viewCounts: Record<ViewMode, number> = {
    hepsi: total, eksi: eksiCount, tatli: total - eksiCount,
  };

  const categoryCounts = useMemo(() => {
    const base = kategoriler.reduce((acc, k) => { acc[k] = 0; return acc; }, {} as Record<Kategori, number>);
    let source = ranked;
    if (view === 'eksi') source = source.filter(a => a.eksi_mi);
    if (view === 'tatli') source = source.filter(a => !a.eksi_mi);
    for (const a of source) base[a.kategori]++;
    return base;
  }, [ranked, view]);

  const selectedItem = selectedId ? ranked.find(a => a.id === selectedId) ?? null : null;
  const selectedRank = selectedItem ? ranked.findIndex(a => a.id === selectedItem.id) + 1 : null;

  /* ── Interactions ────────────────────────────────── */
  const toggleCategory = (kat: Kategori) => {
    setCategories(prev => {
      const next = new Set(prev);
      if (next.has(kat)) next.delete(kat); else next.add(kat);
      return next;
    });
  };

  // Masaüstünde satıra tıklamak detayı açar, mobilde doğrudan düzenlemeye gider.
  const handleRowSelect = (item: AyranEntry) => {
    if (isDesktop) {
      setSelectedId(prev => (prev === item.id ? null : item.id));
    } else {
      openForm('siralama', item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = sortAyranlar(ranked);
    const from = sorted.findIndex(i => i.id === active.id);
    const to = sorted.findIndex(i => i.id === over.id);
    if (from === -1 || to === -1) return;
    reorder(arrayMove(sorted, from, to).map((item, idx) => ({ ...item, sira: idx })));
  };

  /* ── Form ────────────────────────────────────────── */
  const openForm = (mode: FormMode, item: AyranEntry | null = null) => {
    setFormMode(mode);
    setEditingItem(item);
    setIsFormOpen(true);
  };
  const closeForm = () => { setIsFormOpen(false); setEditingItem(null); };
  const openAdd = () => openForm('siralama');

  const handleSave = async (entry: AyranEntry, targetIndex?: number) => {
    try {
      const saved = await saveEntry(entry, editingItem, targetIndex);
      if (saved.denendi && !editingItem?.denendi) setSelectedId(saved.id);
      closeForm();
    } catch (e: unknown) {
      alert('Hata: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDelete = async (item: AyranEntry) => {
    if (!window.confirm(`“${item.marka}” kaydını silmek istediğinize emin misiniz?`)) return;
    try {
      await removeEntry(item);
      setSelectedId(prev => (prev === item.id ? null : prev));
      closeForm();
    } catch (e: unknown) {
      alert('Silme sırasında hata oluştu: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const renderFilterPanel = (instanceId: string, layout: 'stack' | 'inline') => (
    <FilterPanel
      instanceId={instanceId}
      layout={layout}
      view={view}
      onChangeView={setView}
      viewCounts={viewCounts}
      categories={categories}
      onToggleCategory={toggleCategory}
      onClearCategories={() => setCategories(new Set())}
      categoryCounts={categoryCounts}
    />
  );

  const listBody = (() => {
    if (loading) return <p className="state-msg">Yükleniyor…</p>;
    if (total === 0) {
      return (
        <div className="state-empty">
          <p className="state-empty-title">Henüz ayran kaydın yok</p>
          <p>İlk ayranını ekleyerek kendi sıralamanı oluşturmaya başla.</p>
          <button type="button" className="btn-primary" onClick={openAdd}>İlk Ayranı Ekle</button>
        </div>
      );
    }
    if (visible.length === 0) {
      return (
        <div className="state-empty">
          <p className="state-empty-title">Eşleşen kayıt yok</p>
          <p>Seçtiğin filtrelere uyan ayran bulunmuyor.</p>
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
        <SortableContext items={visible.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="rows">
            {visible.map((item, i) => (
              <DraggableRow
                key={item.id}
                item={item}
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
    <div className="app">
      {/* ── Rail: brand + filters (desktop) ──────────── */}
      <aside className="rail">
        <div className="rail-brand">
          <span className="rail-mark">🥛</span>
          <span className="rail-brand-text">
            <strong>Ayran Gurmesi</strong>
            <em>kişisel sıralama defteri</em>
          </span>
        </div>

        <button type="button" className="rail-add" onClick={openAdd}>
          Yeni Ayran Ekle
        </button>

        <div className="rail-filters">{renderFilterPanel('rail', 'stack')}</div>
      </aside>

      {/* ── Center: ranked list ──────────────────────── */}
      <main className="list">
        {/* Masaüstünde marka rayda; mobilde bu ince başlık üstleniyor */}
        <div className="mobile-brand">
          <span className="mobile-brand-mark">🥛</span>
          <span className="mobile-brand-text">
            <strong>Ayran Gurmesi</strong>
            <em>kişisel sıralama defteri</em>
          </span>
        </div>

        {total > 0 && (
          <p className="mobile-summary">
            <strong>{total}</strong> ayran denedin · <strong>{eksiCount}</strong> tanesi ekşi ·{' '}
            <strong>{total - eksiCount}</strong> tanesi değil
          </p>
        )}

        {/* Mobilde istek listesi ayrı bir sayfa; masaüstünde sağdaki çekmece */}
        <Link href="/listem" className="wish-link">
          <span className="wish-link-icon" aria-hidden="true">🔖</span>
          <span className="wish-link-text">
            <strong>Listem</strong>
            <em>denemek istediklerin</em>
          </span>
          <span className="wish-link-count">{istekListesi.length}</span>
          <span className="wish-link-arrow" aria-hidden="true">→</span>
        </Link>

        {/* Mobilde filtreler ve başlık kaydırma boyunca sabit kalır */}
        <div className="sticky-top">
          <div className="mobile-filters">{renderFilterPanel('strip', 'inline')}</div>

          <header className="list-head">
            <div className="list-head-top">
              <h1 className="list-title">{VIEW_TITLE[view]}</h1>
              <span className="list-count">{visible.length}</span>
            </div>
            {!canReorder && (
              <p className="list-note">
                Sıralama yalnızca filtresiz “Tüm Kayıtlar” görünümünde değiştirilebilir.
              </p>
            )}
          </header>
        </div>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>Tekrar dene</button>
          </div>
        )}

        {listBody}
      </main>

      {/* ── Right: detail + wishlist drawer (desktop) ── */}
      <section className="pane">
        <div className="pane-main">
          <DetailPane
            item={selectedItem}
            rank={selectedRank}
            total={total}
            ranked={ranked}
            eksiCount={eksiCount}
            categoryCounts={categoryCounts}
            onEdit={(item) => openForm('siralama', item)}
            onDelete={handleDelete}
            onSelect={(item) => setSelectedId(item.id)}
            onClose={() => setSelectedId(null)}
          />
        </div>

        <WishlistDrawer
          items={istekListesi}
          loading={loading}
          onEdit={(item) => openForm('istek', item)}
          onTried={(item) => openForm('denedim', item)}
          onAdd={() => openForm('istek')}
        />
      </section>

      <button type="button" className="fab" onClick={openAdd} aria-label="Yeni Ayran Ekle">+</button>

      {isSaving && <div className="toast">Sıralama kaydediliyor…</div>}

      <AyranForm
        key={`${editingItem?.id ?? 'new'}-${formMode}-${isFormOpen ? 'open' : 'closed'}`}
        isOpen={isFormOpen}
        editingItem={editingItem}
        mode={formMode}
        initialCategory={categories.size === 1 ? [...categories][0] : 'yaygin_market'}
        existingAyrans={ranked}
        onClose={closeForm}
        onSave={handleSave}
        onDelete={editingItem ? () => handleDelete(editingItem) : undefined}
      />
    </div>
  );
}
