'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createListe, getListeler } from '../lib/items';
import { benzersizSlug, slugify } from '../lib/slug';
import { hataMetni } from '../lib/hata';

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
  const [emoji, setEmoji] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim() || kaydediliyor) return;
    setKaydediliyor(true);
    try {
      const mevcut = await getListeler();
      const olusan = await createListe({
        ad: ad.trim(),
        slug: benzersizSlug(slugify(ad), mevcut.map(l => l.slug)),
        emoji: emoji.trim() || null,
        sira: mevcut.length,
      });
      onCreated?.();
      // Yeni liste kategorisiz doğuyor; kullanıcı doğrudan ayarlara düşsün.
      router.push(`/l/${olusan.slug}/ayarlar`);
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
            <span className="form-screen-back-desktop">✕</span>
            <span className="form-screen-back-mobile">←</span>
          </button>
          <h2 className="form-screen-title">Yeni Liste</h2>
          <span className="form-screen-header-spacer" />
        </header>

        <form onSubmit={handleSubmit} className="form-screen-body">
          <div className="field-grid">
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
            <label className="field">
              <span className="field-label">Simge</span>
              <input
                type="text"
                className="field-input"
                placeholder="🥤"
                maxLength={4}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
              />
            </label>
          </div>

          <p className="field-hint">
            Kategorileri ve ek alanları bir sonraki adımda tanımlayacaksın.
          </p>

          <div className="form-screen-actions">
            <button type="button" className="btn-quiet" onClick={onClose}>Vazgeç</button>
            <button type="submit" className="btn-primary" disabled={kaydediliyor}>
              {kaydediliyor ? 'Oluşturuluyor…' : 'Oluştur'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
