'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { AyranEntry, kategoriEtiketleri } from '../types/ayran';
import { KAT_COLOR } from './FilterPanel';
import { brandColor, brandInitials } from './AyranRow';

interface WishlistPanelProps {
  items: AyranEntry[];
  loading?: boolean;
  /** Kayda dokunulduğunda düzenleme — istek listesinde detay paneli yok. */
  onEdit: (item: AyranEntry) => void;
  /** "Denedim": kaydı sıralamaya taşıyan dönüşüm formunu açar. */
  onTried: (item: AyranEntry) => void;
  onAdd: () => void;
}

export default function WishlistPanel({
  items, loading, onEdit, onTried, onAdd,
}: WishlistPanelProps) {
  if (loading) return <p className="state-msg">Yükleniyor…</p>;

  if (items.length === 0) {
    return (
      <div className="wish-empty">
        <p className="wish-empty-title">Listen boş</p>
        <p>Denemek istediğin ama henüz sırası gelmemiş ayranları buraya ekle.</p>
        <button type="button" className="btn-primary" onClick={onAdd}>Listeye Ekle</button>
      </div>
    );
  }

  return (
    <div className="wish-rows">
      {items.map(item => (
        <div key={item.id} className="wish-row">
          <button
            type="button"
            className="wish-row-main"
            onClick={() => onEdit(item)}
            aria-label={`${item.marka} kaydını düzenle`}
          >
            {item.fotograf_url
              ? <img src={item.fotograf_url} className="wish-thumb" alt="" />
              : (
                <span
                  className="wish-thumb thumb-fallback"
                  style={{ background: brandColor(item.marka || '') }}
                >
                  {brandInitials(item.marka)}
                </span>
              )
            }

            <span className="wish-text">
              <span className="wish-name">
                {item.marka}
                {item.urun_adi && <span className="wish-variant"> {item.urun_adi}</span>}
              </span>
              <span className="wish-meta">
                <i className="wish-dot" style={{ background: KAT_COLOR[item.kategori] }} />
                {item.kategori === 'market_markasi' && item.market_adi
                  ? item.market_adi
                  : item.kategori === 'yoresel' && item.yore
                    ? item.yore
                    : kategoriEtiketleri[item.kategori]}
                {item.eksi_mi && <em className="wish-eksi">Ekşi</em>}
              </span>
              {item.notlar && <span className="wish-note">{item.notlar}</span>}
            </span>
          </button>

          <button
            type="button"
            className="wish-tried"
            onClick={() => onTried(item)}
          >
            Denedim
          </button>
        </div>
      ))}
    </div>
  );
}
