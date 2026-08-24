'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AyranEntry } from '../../types/ayran';
import { useAyranStore } from '../../hooks/useAyranStore';
import WishlistPanel from '../../components/WishlistPanel';
import AyranForm, { FormMode } from '../../components/AyranForm';

/**
 * İstek listesinin mobildeki evi. Gerçek bir route olması önemli: donanım geri
 * tuşu ve "← Denediklerim" bağlantısı bedavaya geliyor. Masaüstünde asıl yer
 * sağ paneldeki çekmece, ama URL doğrudan açılırsa bu sayfa da çalışır.
 */
export default function ListemPage() {
  const router = useRouter();
  const {
    denenenler, istekListesi, loading, error, isSaving, load, saveEntry, removeEntry,
  } = useAyranStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('istek');
  const [editingItem, setEditingItem] = useState<AyranEntry | null>(null);

  const openForm = (mode: FormMode, item: AyranEntry | null = null) => {
    setFormMode(mode);
    setEditingItem(item);
    setIsFormOpen(true);
  };
  const closeForm = () => { setIsFormOpen(false); setEditingItem(null); };

  const handleSave = async (entry: AyranEntry, targetIndex?: number) => {
    try {
      await saveEntry(entry, editingItem, targetIndex);
      closeForm();
      // Dönüşümden sonra sıralamaya dönülüyor: kullanıcı ayranın nereye oturduğunu görsün.
      if (formMode === 'denedim') router.push('/');
    } catch (e: unknown) {
      alert('Hata: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleDelete = async (item: AyranEntry) => {
    if (!window.confirm(`“${item.marka}” kaydını listeden silmek istediğinize emin misiniz?`)) return;
    try {
      await removeEntry(item);
      closeForm();
    } catch (e: unknown) {
      alert('Silme sırasında hata oluştu: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div className="app app-solo">
      <main className="list">
        <Link href="/" className="page-back">
          <span aria-hidden="true">←</span> Denediklerim
          <span className="page-back-count">{denenenler.length}</span>
        </Link>

        <div className="sticky-top">
          <header className="list-head">
            <div className="list-head-top">
              <h1 className="list-title">Listem</h1>
              <span className="list-count">{istekListesi.length}</span>
            </div>
            <p className="list-note">
              Henüz denemediğin, sırasını bekleyen ayranlar. Denediğinde “Denedim” de,
              sıralamandaki yerini seç.
            </p>
          </header>
        </div>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>Tekrar dene</button>
          </div>
        )}

        <WishlistPanel
          items={istekListesi}
          loading={loading}
          onEdit={(item) => openForm('istek', item)}
          onTried={(item) => openForm('denedim', item)}
          onAdd={() => openForm('istek')}
        />
      </main>

      <button
        type="button"
        className="fab"
        onClick={() => openForm('istek')}
        aria-label="Listeye ayran ekle"
      >
        +
      </button>

      {isSaving && <div className="toast">Sıralama kaydediliyor…</div>}

      <AyranForm
        key={`${editingItem?.id ?? 'new'}-${formMode}-${isFormOpen ? 'open' : 'closed'}`}
        isOpen={isFormOpen}
        editingItem={editingItem}
        mode={formMode}
        existingAyrans={denenenler}
        onClose={closeForm}
        onSave={handleSave}
        onDelete={editingItem ? () => handleDelete(editingItem) : undefined}
      />
    </div>
  );
}
