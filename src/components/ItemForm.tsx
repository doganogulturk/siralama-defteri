'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AlanTanimi, Item, Kategori, OzellikDeger, alanGorunur, alanKisa,
} from '../types/item';
import { uploadFotograf, deleteFotograf } from '../lib/items';
import { TopluBlok, topluAyristir, topluKayitSayisi } from '../lib/toplu';
import TopluAlan from './TopluAlan';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { hataMetni } from '../lib/hata';

/**
 * 'siralama' — denenmiş kayıt (varsayılan akış)
 * 'istek'    — istek listesi kaydı: sırası henüz belli değil
 * 'denedim'  — istek listesindeki kaydı sıralamaya taşıyan dönüşüm
 */
export type FormMode = 'siralama' | 'istek' | 'denedim';

interface ItemFormProps {
  isOpen: boolean;
  editingItem: Item | null;
  mode?: FormMode;
  /** Başlıklarda kullanılıyor: "Yeni Ayran", "Yeni Kola"… */
  listeAdi: string;
  kategoriler: Kategori[];
  alanlar: AlanTanimi[];
  initialCategoryId?: string | null;
  /** Sıralamadaki mevcut kayıtlar (sıralı) — "şunun altına" seçimi için. */
  existingItems?: Item[];
  onClose: () => void;
  onSave: (entry: Item, targetIndex?: number) => void;
  /** Verilirse formda "Toplu" sekmesi açılır. `denendi` formun kipinden geliyor. */
  onTopluSave?: (bloklar: TopluBlok[], denendi: boolean) => Promise<void>;
  onDelete?: () => void;
}

const KameraIkon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h3.5L8 5.5h8L17.5 8H21v12H3z" />
    <circle cx="12" cy="13.5" r="3.6" />
  </svg>
);

const SilIkon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

export default function ItemForm({
  isOpen,
  editingItem,
  mode = 'siralama',
  listeAdi,
  kategoriler,
  alanlar,
  initialCategoryId,
  existingItems = [],
  onClose,
  onSave,
  onTopluSave,
  onDelete,
}: ItemFormProps) {
  const isDesktop = useIsDesktop();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [ad, setAd] = useState(editingItem?.ad ?? '');
  const [altAd, setAltAd] = useState(editingItem?.alt_ad ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(
    editingItem?.category_id ?? initialCategoryId ?? kategoriler[0]?.id ?? null
  );
  const [ozellikler, setOzellikler] = useState<Record<string, OzellikDeger>>(
    editingItem?.ozellikler ?? {}
  );
  const [fotografUrl, setFotografUrl] = useState(editingItem?.fotograf_url ?? '');
  const [notlar, setNotlar] = useState(editingItem?.notlar ?? '');
  const [sekme, setSekme] = useState<'tek' | 'toplu'>('tek');
  const [toplu, setToplu] = useState('');
  const [topluKaydediliyor, setTopluKaydediliyor] = useState(false);
  const [positionMode, setPositionMode] = useState<'top' | 'bottom' | 'after'>('top');
  const [afterItemId, setAfterItemId] = useState<string>(existingItems[0]?.id ?? '');

  const originalFotografUrl = useRef(editingItem?.fotograf_url ?? '');

  const isIstek = mode === 'istek';
  const isDonusum = mode === 'denedim';
  // Toplu giriş yalnızca yeni kayıt açarken anlamlı: düzenleme ve "denedim"
  // dönüşümü tek bir kaydın üstünde çalışıyor.
  const topluVar = !!onTopluSave && !editingItem && !isDonusum;
  const topluSekmede = topluVar && sekme === 'toplu';
  // Sıra yalnızca sıralamaya giren kayıtlar için sorulur (yeni kayıt ya da
  // "denedim" dönüşümü) — istek listesinde henüz bir sıralama yeri yok.
  const showPosition = !isIstek && (!editingItem || isDonusum) && existingItems.length > 0;

  const gorunurAlanlar = alanlar.filter(a => alanGorunur(a, categoryId));
  const metinAlanlari = gorunurAlanlar.filter(a => a.tip === 'metin');
  const boolAlanlari = gorunurAlanlar.filter(a => a.tip === 'bool');

  const topluBloklar = useMemo(() => topluAyristir(toplu), [toplu]);
  const topluAdet = topluKayitSayisi(topluBloklar);

  const setOzellik = (anahtar: string, deger: OzellikDeger) =>
    setOzellikler(prev => ({ ...prev, [anahtar]: deger }));

  const metinDeger = (anahtar: string) => {
    const v = ozellikler[anahtar];
    return typeof v === 'string' ? v : '';
  };

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

  // Ad alanına yalnızca masaüstünde odaklanılıyor; mobilde otomatik odak
  // ekran klavyesini anında açıp formun görünümünü bozuyor.
  useEffect(() => {
    if (isOpen && isDesktop && sekme === 'tek') adRef.current?.focus();
  }, [isOpen, isDesktop, sekme]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim()) return;

    let targetIndex: number | undefined;
    if (showPosition) {
      if (positionMode === 'top') {
        targetIndex = 0;
      } else if (positionMode === 'bottom') {
        targetIndex = existingItems.length;
      } else {
        const idx = existingItems.findIndex(i => i.id === afterItemId);
        targetIndex = idx !== -1 ? idx + 1 : 0;
      }
    }

    // Yalnızca seçili kategoride görünen alanlar kaydediliyor; kategori
    // değiştiğinde eskisine ait değerler kayda taşınmıyor.
    const temizOzellikler: Record<string, OzellikDeger> = {};
    for (const alan of gorunurAlanlar) {
      if (alan.tip === 'bool') {
        temizOzellikler[alan.anahtar] = ozellikler[alan.anahtar] === true;
      } else {
        const deger = metinDeger(alan.anahtar).trim();
        if (deger) temizOzellikler[alan.anahtar] = deger;
      }
    }

    onSave(
      {
        id: editingItem?.id || '',
        list_id: editingItem?.list_id || '',
        created_at: editingItem?.created_at,
        category_id: categoryId,
        ad: ad.trim(),
        alt_ad: altAd.trim() || null,
        fotograf_url: fotografUrl.trim() || null,
        notlar: notlar.trim() || null,
        ozellikler: temizOzellikler,
        denendi: !isIstek,
      },
      targetIndex
    );
  };

  const handleTopluSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onTopluSave || topluAdet === 0 || topluKaydediliyor) return;
    setTopluKaydediliyor(true);
    try {
      await onTopluSave(topluBloklar, !isIstek);
      onClose();
    } catch (err: unknown) {
      alert('Kayıtlar eklenemedi: ' + hataMetni(err));
      setTopluKaydediliyor(false);
    }
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
      alert('Fotoğraf yüklenirken hata oluştu: ' + hataMetni(err));
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
            {isDonusum ? 'Denedim!' : editingItem ? 'Kaydı Düzenle' : isIstek ? 'Listeye Ekle' : `Kayıt Ekle · ${listeAdi}`}
          </h2>
          {editingItem && onDelete ? (
            <button type="button" className="form-screen-delete" onClick={onDelete} aria-label="Sil">{SilIkon}</button>
          ) : <span className="form-screen-header-spacer" />}
        </header>

        {topluVar && (
          <nav className="tabs" aria-label="Ekleme biçimi">
            <button
              type="button"
              className={`tab${sekme === 'tek' ? ' is-on' : ''}`}
              aria-current={sekme === 'tek' ? 'true' : undefined}
              onClick={() => setSekme('tek')}
            >
              Tek kayıt
            </button>
            <button
              type="button"
              className={`tab${sekme === 'toplu' ? ' is-on' : ''}`}
              aria-current={sekme === 'toplu' ? 'true' : undefined}
              onClick={() => setSekme('toplu')}
            >
              Toplu
            </button>
          </nav>
        )}

        {topluSekmede && (
          <form onSubmit={handleTopluSubmit} className="form-screen-body">
            <TopluAlan deger={toplu} onChange={setToplu} bloklar={topluBloklar} autoFocus={isDesktop} />

            <p className="field-hint">
              {isIstek
                ? 'Kayıtlar bekleyenlere düşer; denedikçe tek tek sıralamaya alırsın.'
                : 'Kayıtlar yazdığın sırayla sıralamanın altına eklenir; yerlerini sonra sürükleyerek düzeltirsin.'}
            </p>

            <div className="form-screen-actions">
              <button type="button" className="btn-quiet" onClick={handleClose}>Vazgeç</button>
              <button
                type="submit"
                className="btn-primary"
                disabled={topluKaydediliyor || topluAdet === 0}
              >
                {topluKaydediliyor
                  ? 'Ekleniyor…'
                  : topluAdet > 0 ? `${topluAdet} Kaydı Ekle` : 'Ekle'}
              </button>
            </div>
          </form>
        )}

        {!topluSekmede && (
          <form onSubmit={handleSubmit} className="form-screen-body">
            {/* Fotoğraf solda, ad ve çeşit sağında: formun tepesi tek bir bant
                olunca "listeye ekleneceği yer" kaydırmadan görünüyor. */}
            <div className="form-kimlik">
              <div
                className={`photo-drop ${fotografUrl ? 'has-image' : ''}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="photo-drop-state">
                    <span className="photo-drop-title">Yükleniyor…</span>
                  </div>
                ) : fotografUrl ? (
                  <>
                    <img src={fotografUrl} className="photo-drop-img" alt="" />
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
                    <span className="photo-drop-icon">{KameraIkon}</span>
                    <span className="photo-drop-title">Fotoğraf</span>
                  </div>
                )}
              </div>
              <div className="form-kimlik-alanlar">
                <label className="field">
                  <span className="field-label">Ad *</span>
                  <input
                    ref={adRef}
                    type="text"
                    className="field-input"
                    placeholder="Marka ya da isim"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span className="field-label">Çeşit / Alt Ad</span>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Varsa çeşidi"
                    value={altAd}
                    onChange={(e) => setAltAd(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />

            {kategoriler.length > 0 && (
              <div className="field">
                <span className="field-label">Kategori</span>
                <div className="kategori-picker">
                  {kategoriler.map((kat) => (
                    <button
                      key={kat.id}
                      type="button"
                      className={`kategori-chip${categoryId === kat.id ? ' selected' : ''}`}
                      style={{ '--kat': kat.renk } as React.CSSProperties}
                      onClick={() => setCategoryId(kat.id)}
                    >
                      <i className="kategori-chip-dot" aria-hidden="true" />
                      {kat.ad}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {metinAlanlari.map(alan => (
              <label className="field field-fade-in" key={alan.anahtar}>
                <span className="field-label">{alan.etiket}</span>
                <input
                  type="text"
                  className="field-input"
                  placeholder={alan.ipucu ?? ''}
                  value={metinDeger(alan.anahtar)}
                  onChange={(e) => setOzellik(alan.anahtar, e.target.value)}
                />
              </label>
            ))}

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

            {boolAlanlari.map(alan => {
              const acik = ozellikler[alan.anahtar] === true;
              return (
                <div className="field-toggle" key={alan.anahtar}>
                  <div>
                    <span className="field-label">{alan.etiket}</span>
                    {isIstek && (
                      <p className="field-hint">
                        Biliyorsan şimdi işaretle; denedikten sonra da değiştirebilirsin.
                      </p>
                    )}
                  </div>
                  {/* Anahtar yerine iki kutu: hangi tarafın seçili olduğu tartışmasız. */}
                  <div className="switch" role="group" aria-label={alanKisa(alan)}>
                    <button
                      type="button"
                      className={`switch-opt${acik ? ' is-on' : ''}`}
                      onClick={() => setOzellik(alan.anahtar, true)}
                      aria-pressed={acik}
                    >
                      Evet
                    </button>
                    <button
                      type="button"
                      className={`switch-opt${acik ? '' : ' is-on'}`}
                      onClick={() => setOzellik(alan.anahtar, false)}
                      aria-pressed={!acik}
                    >
                      Hayır
                    </button>
                  </div>
                </div>
              );
            })}

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
                    aria-label="Hangi kaydın altına eklensin"
                  >
                    {existingItems.map((item, idx) => (
                      <option key={item.id} value={item.id}>
                        {idx + 1}. {item.ad}{item.alt_ad ? ` — ${item.alt_ad}` : ''}
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
        )}
      </section>
    </div>
  );
}
