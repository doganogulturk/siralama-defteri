'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createListe, getListeler } from '../lib/items';
import { benzersizSlug, slugify } from '../lib/slug';
import { topluAyristir, topluKaydet, topluKayitSayisi } from '../lib/toplu';
import { hataMetni } from '../lib/hata';
import TopluAlan from './TopluAlan';

interface ListeEkleModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Liste oluşturulduktan sonra çağrılır — açan sayfa listesini tazeleyebilsin. */
  onCreated?: () => void;
}

/**
 * Yeni liste formu. Hem ana ekrandan hem sol raydan açıldığı için bileşen;
 * slug çakışmasını önlemek için mevcut slug'ları kaydetme anında okuyor.
 */
export default function ListeEkleModal({ isOpen, onClose, onCreated }: ListeEkleModalProps) {
  const router = useRouter();
  const [ad, setAd] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);
  /** Toplu giriş kutusu bilerek kapalı doğuyor: liste açmanın kısa yolu kısa kalsın. */
  const [topluAcik, setTopluAcik] = useState(false);
  const [toplu, setToplu] = useState('');
  const bloklar = useMemo(() => topluAyristir(toplu), [toplu]);

  if (!isOpen) return null;

  const topluAdet = topluKayitSayisi(bloklar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim() || kaydediliyor) return;
    setKaydediliyor(true);
    try {
      const mevcut = await getListeler();
      const olusan = await createListe({
        ad: ad.trim(),
        slug: benzersizSlug(slugify(ad), mevcut.map(l => l.slug)),
        sira: mevcut.length,
      });
      if (topluAdet > 0) {
        await topluKaydet({ liste: olusan, kategoriler: [], bloklar, baslangicSira: 0 });
      }
      onCreated?.();
      // Kategorisiz doğan listede yapılacak ilk iş ayarlar; toplu giriş bunu zaten
      // hallettiyse kullanıcı doğrudan sıralamasına düşsün.
      router.push(topluAdet > 0 ? `/l/${olusan.slug}` : `/l/${olusan.slug}/ayarlar`);
    } catch (err: unknown) {
      alert('Liste oluşturulamadı: ' + hataMetni(err));
      setKaydediliyor(false);
    }
  };

  return (
    <div
      className="form-screen-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="form-screen form-screen-short">
        <header className="form-screen-header">
          <button type="button" className="form-screen-back" onClick={onClose} aria-label="Kapat">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <h2 className="form-screen-title">Yeni Liste</h2>
          <span className="form-screen-header-spacer" />
        </header>

        <form onSubmit={handleSubmit} className="form-screen-body">
          <label className="field">
            <span className="field-label">Liste Adı *</span>
            <input
              type="text"
              className="field-input"
              placeholder="Kola, Döner, Türk Kahvesi…"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              required
              autoFocus
            />
          </label>

          {topluAcik ? (
            <TopluAlan deger={toplu} onChange={setToplu} bloklar={bloklar} autoFocus />
          ) : (
            <button type="button" className="btn-quiet" onClick={() => setTopluAcik(true)}>
              Kayıtları da şimdi yaz
            </button>
          )}

          <p className="field-hint">
            {topluAdet > 0
              ? 'Kayıtlar denenmiş sayılır; sıralamayı sonra sürükleyerek düzeltirsin.'
              : 'Kategorileri ve ek alanları bir sonraki adımda tanımlayacaksın.'}
          </p>

          <div className="form-screen-actions">
            <button type="button" className="btn-quiet" onClick={onClose}>Vazgeç</button>
            <button type="submit" className="btn-primary" disabled={kaydediliyor}>
              {kaydediliyor
                ? 'Oluşturuluyor…'
                : topluAdet > 0 ? `Oluştur · ${topluAdet} kayıt` : 'Oluştur'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
