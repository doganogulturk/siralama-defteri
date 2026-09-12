'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import {
  AlanTanimi, Item, Kategori, alanGorunur, alanKisa, bayrak, kategoriBul, metin,
} from '../types/item';
import { brandColor, brandInitials } from './ItemRow';

interface DetailPaneProps {
  item: Item;
  /** Bekleyen kaydın sırası yok; o zaman null. */
  rank: number | null;
  kategoriler: Kategori[];
  alanlar: AlanTanimi[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onClose: () => void;
}

function Thumb({ item, className }: { item: Item; className: string }) {
  return item.fotograf_url
    ? <img src={item.fotograf_url} className={className} alt="" />
    : (
      // Renk değişkenle: büyük detay görseli onu vurgunun tonuyla eziyor.
      <span className={`${className} thumb-fallback`} style={{ '--marka': brandColor(item.ad || '') } as React.CSSProperties}>
        {brandInitials(item.ad)}
      </span>
    );
}

/**
 * Masaüstü detay paneli: seçili kaydın tamamı. Seçim yokken sayfa paneli hiç
 * çizmiyor — sıralamanın özeti filtre şeridinin tekrarıydı.
 */
export default function DetailPane({
  item, rank, kategoriler, alanlar, onEdit, onDelete, onClose,
}: DetailPaneProps) {
  const kat = kategoriBul(kategoriler, item.category_id);
  const metinAlanlari = alanlar.filter(a => a.tip === 'metin' && alanGorunur(a, item.category_id));
  const boolAlanlari = alanlar.filter(a => a.tip === 'bool' && alanGorunur(a, item.category_id));

  return (
    <div className="detail">
      <div className="detail-bar">
        {rank !== null
          ? <span className="detail-rank">#{rank}</span>
          : <span className="detail-rank detail-rank-bekleyen">Denenmemiş</span>}
        <button type="button" className="detail-close" onClick={onClose} aria-label="Seçimi kaldır">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="detail-hero">
        <Thumb item={item} className="detail-photo" />
      </div>

      <div className="detail-body">
        <h2 className="detail-name">{item.ad}</h2>
        {item.alt_ad && <p className="detail-variant">{item.alt_ad}</p>}

        <div className="detail-chips">
          {kat && (
            <span className="chip" style={{ '--chip': kat.renk } as React.CSSProperties}>
              {kat.ad}
            </span>
          )}
          {boolAlanlari.map(a => (
            bayrak(item, a.anahtar)
              ? <span className="chip chip-sour" key={a.anahtar}>{alanKisa(a)}</span>
              : <span className="chip chip-plain" key={a.anahtar}>{alanKisa(a)} değil</span>
          ))}
        </div>

        <dl className="detail-facts">
          {metinAlanlari.map(a => {
            const deger = metin(item, a.anahtar);
            if (!deger) return null;
            return <div key={a.anahtar}><dt>{alanKisa(a)}</dt><dd>{deger}</dd></div>;
          })}
          {item.created_at && (
            <div>
              <dt>Eklendi</dt>
              <dd>{new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
            </div>
          )}
        </dl>

        {item.notlar && (
          <section className="pane-section">
            <h3 className="pane-section-title">Not</h3>
            <p className="detail-not">{item.notlar}</p>
          </section>
        )}
      </div>

      <div className="detail-actions">
        <button type="button" className="btn-danger" onClick={() => onDelete(item)}>Sil</button>
        <button type="button" className="btn-primary" onClick={() => onEdit(item)}>Düzenle</button>
      </div>
    </div>
  );
}
