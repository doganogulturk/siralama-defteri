'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect } from 'react';
import { AyranEntry, Kategori, kategoriler, kategoriEtiketleri } from '../types/ayran';
import { uploadFotograf, deleteFotograf } from '../lib/ayranlar';
import { useIsDesktop } from '../hooks/useIsDesktop';

/**
 * 'siralama' — denenmiş ayran (varsayılan akış)
 * 'istek'    — istek listesi kaydı: ekşilik ve sıra henüz bilinmiyor
 * 'denedim'  — istek listesindeki kaydı sıralamaya taşıyan dönüşüm
 */
export type FormMode = 'siralama' | 'istek' | 'denedim';

interface AyranFormProps {
  isOpen: boolean;
  editingItem: AyranEntry | null;
  mode?: FormMode;
  initialCategory?: Kategori;
  /** Sıralamadaki mevcut kayıtlar (sıralı) — "şunun altına" seçimi için. */
  existingAyrans?: AyranEntry[];
  onClose: () => void;
  onSave: (entry: AyranEntry, targetIndex?: number) => void;
  onDelete?: () => void;
}

const kategoriEmoji: Record<Kategori, string> = {
  yaygin_market: '🛒',
  market_markasi: '🏪',
  yoresel: '🌿',
};

export default function AyranForm({
  isOpen,
  editingItem,
  mode = 'siralama',
  initialCategory,
  existingAyrans = [],
  onClose,
  onSave,
  onDelete,
}: AyranFormProps) {
  const isDesktop = useIsDesktop();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markaRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [marka, setMarka] = useState(editingItem?.marka ?? '');
  const [urunAdi, setUrunAdi] = useState(editingItem?.urun_adi ?? '');
  const [kategori, setKategori] = useState<Kategori>(editingItem?.kategori ?? initialCategory ?? 'yaygin_market');
  const [eksiMi, setEksiMi] = useState(editingItem?.eksi_mi ?? false);
  const [marketAdi, setMarketAdi] = useState(editingItem?.market_adi ?? '');
  const [yore, setYore] = useState(editingItem?.yore ?? '');
  const [fotografUrl, setFotografUrl] = useState(editingItem?.fotograf_url ?? '');
  const [notlar, setNotlar] = useState(editingItem?.notlar ?? '');
  const [positionMode, setPositionMode] = useState<'top' | 'bottom' | 'after'>('top');
  const [afterItemId, setAfterItemId] = useState<string>(existingAyrans[0]?.id ?? '');

  const originalFotografUrl = useRef(editingItem?.fotograf_url ?? '');

  const isIstek = mode === 'istek';
  const isDonusum = mode === 'denedim';
  // Sıra yalnızca sıralamaya giren kayıtlar için sorulur (yeni kayıt ya da
  // "denedim" dönüşümü) — istek listesinde henüz bir sıralama yeri yok.
  const showPosition = !isIstek && (!editingItem || isDonusum) && existingAyrans.length > 0;

  const handleClose = () => {
    if (fotografUrl && fotografUrl !== originalFotografUrl.current) {
      void deleteFotograf(fotografUrl);
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fotografUrl]);

  // Marka alanına yalnızca masaüstünde odaklanılıyor; mobilde otomatik odak
  // ekran klavyesini anında açıp formun görünümünü bozuyor.
  useEffect(() => {
    if (isOpen && isDesktop) markaRef.current?.focus();
  }, [isOpen, isDesktop]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marka.trim()) return;

    let targetIndex: number | undefined;
    if (showPosition) {
      if (positionMode === 'top') {
        targetIndex = 0;
      } else if (positionMode === 'bottom') {
        targetIndex = existingAyrans.length;
      } else {
        const idx = existingAyrans.findIndex(a => a.id === afterItemId);
        targetIndex = idx !== -1 ? idx + 1 : 0;
      }
    }

    onSave(
      {
        id: editingItem?.id || '',
        created_at: editingItem?.created_at,
        marka: marka.trim(),
        urun_adi: urunAdi.trim() || null,
        kategori,
        eksi_mi: eksiMi,
        market_adi: kategori === 'market_markasi' ? (marketAdi.trim() || null) : null,
        yore: kategori === 'yoresel' ? (yore.trim() || null) : null,
        fotograf_url: fotografUrl.trim() || null,
        notlar: notlar.trim() || null,
        denendi: !isIstek,
      },
      targetIndex
    );
  };

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin.');
      return;
    }
    setUploading(true);
    try {
      const previousUrl = fotografUrl;
      const url = await uploadFotograf(file);
      setFotografUrl(url);
      if (previousUrl && previousUrl !== originalFotografUrl.current) {
        void deleteFotograf(previousUrl);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Fotoğraf yüklenirken hata oluştu: ' + message);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleImageFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="form-screen-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <section className="form-screen">
        <header className="form-screen-header">
          <button type="button" className="form-screen-back" onClick={handleClose} aria-label="Kapat">
            <span className="form-screen-back-desktop">✕</span>
            <span className="form-screen-back-mobile">←</span>
          </button>
          <h2 className="form-screen-title">
            {isDonusum ? 'Denedim!' : editingItem ? 'Kaydı Düzenle' : isIstek ? 'Listeme Ekle' : 'Yeni Ayran'}
          </h2>
          {editingItem && onDelete ? (
            <button type="button" className="form-screen-delete" onClick={onDelete} aria-label="Sil">🗑️</button>
          ) : <span className="form-screen-header-spacer" />}
        </header>

        <form onSubmit={handleSubmit} className="form-screen-body">
          <div
            className={`photo-drop ${fotografUrl ? 'has-image' : ''}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="photo-drop-state">
                <span className="photo-drop-spinner">⌛</span>
                <span>Yükleniyor…</span>
              </div>
            ) : fotografUrl ? (
              <>
                <img src={fotografUrl} className="photo-drop-img" alt="Ayran görseli" />
                <div className="photo-drop-overlay">
                  <span className="photo-drop-change">Değiştir</span>
                  <button
                    type="button"
                    className="photo-drop-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (fotografUrl !== originalFotografUrl.current) {
                        void deleteFotograf(fotografUrl);
                      }
                      setFotografUrl('');
                    }}
                  >
                    Kaldır
                  </button>
                </div>
              </>
            ) : (
              <div className="photo-drop-placeholder">
                <span className="photo-drop-icon">📸</span>
                <span className="photo-drop-title">Fotoğraf Ekle</span>
                <span className="photo-drop-sub">Sürükle bırak veya tıkla</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
          />

          <div className="field-grid">
            <label className="field">
              <span className="field-label">Marka *</span>
              <input
                ref={markaRef}
                type="text"
                className="field-input"
                placeholder="Sütaş, Pınar, Özerhisar…"
                value={marka}
                onChange={(e) => setMarka(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Ürün Adı / Çeşidi</span>
              <input
                type="text"
                className="field-input"
                placeholder="Cam Şişe, Yayık, Tam Yağlı…"
                value={urunAdi}
                onChange={(e) => setUrunAdi(e.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <span className="field-label">Kategori *</span>
            <div className="kategori-picker">
              {kategoriler.map((kat) => (
                <button
                  key={kat}
                  type="button"
                  className={`kategori-chip ${kat}${kategori === kat ? ' selected' : ''}`}
                  onClick={() => setKategori(kat)}
                >
                  <span>{kategoriEmoji[kat]}</span>
                  {kategoriEtiketleri[kat]}
                </button>
              ))}
            </div>
          </div>

          {kategori === 'market_markasi' && (
            <label className="field field-fade-in">
              <span className="field-label">Satılan Market</span>
              <input
                type="text"
                className="field-input"
                placeholder="Migros, BİM, A101, File…"
                value={marketAdi}
                onChange={(e) => setMarketAdi(e.target.value)}
              />
            </label>
          )}

          {kategori === 'yoresel' && (
            <label className="field field-fade-in">
              <span className="field-label">Yöre / Şehir / Köy</span>
              <input
                type="text"
                className="field-input"
                placeholder="Balıkesir Susurluk, Konya, Erzurum…"
                value={yore}
                onChange={(e) => setYore(e.target.value)}
              />
            </label>
          )}

          <label className="field">
            <span className="field-label">Not</span>
            <textarea
              className="field-input field-textarea"
              rows={2}
              placeholder={isIstek ? 'Nerede gördüm, kim önerdi…' : 'Tadı, dokusu, aklında kalanlar…'}
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
            />
          </label>

          <div className="field-toggle">
            <div>
              <span className="field-label">Ekşi ayran mı?</span>
              {isIstek && <p className="field-hint">Biliyorsan şimdi işaretle; denedikten sonra da değiştirebilirsin.</p>}
            </div>
            <button
              type="button"
              className={`switch ${eksiMi ? 'on' : ''}`}
              onClick={() => setEksiMi(prev => !prev)}
              aria-pressed={eksiMi}
            >
              <span className="switch-knob" />
            </button>
          </div>

          {showPosition && (
            <div className="field">
              <span className="field-label">Listeye Ekleneceği Yer</span>
              <p className="field-hint">Sonrasında listeden sürükleyerek sırasını değiştirebilirsin.</p>
              <div className="position-toggle">
                <button
                  type="button"
                  className={positionMode === 'top' ? 'selected' : ''}
                  onClick={() => setPositionMode('top')}
                >
                  En Üste
                </button>
                <button
                  type="button"
                  className={positionMode === 'bottom' ? 'selected' : ''}
                  onClick={() => setPositionMode('bottom')}
                >
                  En Alta
                </button>
                <button
                  type="button"
                  className={positionMode === 'after' ? 'selected' : ''}
                  onClick={() => setPositionMode('after')}
                >
                  Şunun Altına
                </button>
              </div>

              {positionMode === 'after' && (
                <select
                  className="field-select field-fade-in"
                  value={afterItemId}
                  onChange={(e) => setAfterItemId(e.target.value)}
                  aria-label="Hangi ayranın altına eklensin"
                >
                  {existingAyrans.map((item, idx) => (
                    <option key={item.id} value={item.id}>
                      {idx + 1}. {item.marka}{item.urun_adi ? ` — ${item.urun_adi}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="form-screen-actions">
            <button type="button" className="btn-quiet" onClick={handleClose}>Vazgeç</button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading
                ? 'Yükleniyor…'
                : isDonusum ? 'Sıralamaya Ekle'
                : editingItem ? 'Güncelle'
                : isIstek ? 'Listeme Ekle'
                : 'Kaydet'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
