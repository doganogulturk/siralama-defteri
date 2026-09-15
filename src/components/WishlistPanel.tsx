'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { AlanTanimi, Item, Kategori, kategoriBul } from '../types/item';
import { brandInitials, altBilgi, rozetler, SecimIkon } from './ItemRow';
import { BosSahne } from './Sahne';

interface WishlistPanelProps {
  items: Item[];
  kategoriler: Kategori[];
  alanlar: AlanTanimi[];
  /** Sağ panelde açık olan kayıt — sıralama satırlarındaki vurgunun aynısı. */
  selectedId?: string | null;
  /** Kayda dokunulduğunda: masaüstünde sağ panelde seçer, mobilde formu açar. */
  onSelect: (item: Item) => void;
  /** "Denedim": kaydı sıralamaya taşıyan dönüşüm formunu açar. */
  onTried: (item: Item) => void;
  onAdd: () => void;
  /** Toplu seçim modu: dokunmak kaydı seçer, "Denedim" gizlenir. */
  secimModu?: boolean;
  secililer?: Set<string> | null;
  /** Masaüstü kart görünümü — sıralamanın kartlarıyla aynı ızgara. */
  kart?: boolean;
}

export default function WishlistPanel({
  items, kategoriler, alanlar, selectedId, onSelect, onTried, onAdd, secimModu, secililer, kart,
}: WishlistPanelProps) {
  if (items.length === 0) {
    return (
      <div className="wish-empty">
        <BosSahne tur="denenmemis" />
        <p className="wish-empty-title">Listen boş</p>
        <p>Denemek istediğin ama henüz sırası gelmemiş kayıtları buraya ekle.</p>
        <button type="button" className="btn-primary" onClick={onAdd}>Listeye Ekle</button>
      </div>
    );
  }

  return (
    <div className={`wish-rows${kart ? ' wish-kart' : ''}`}>
      {items.map(item => {
        const kat = kategoriBul(kategoriler, item.category_id);
        // Kategoriye bağlı bir metin alanı doluysa onu, değilse kategorinin adını göster.
        const alt = altBilgi(item, alanlar) || kat?.ad || '';
        const secili = secimModu ? !!secililer?.has(item.id) : selectedId === item.id;

        return (
          <div
            key={item.id}
            className={`wish-row${secili ? ' is-selected' : ''}${secimModu ? ' is-secim' : ''}`}
          >
            <button
              type="button"
              className="wish-row-main"
              aria-pressed={secili}
              onClick={() => onSelect(item)}
            >
              {secimModu && <span className="row-check" aria-hidden="true">{SecimIkon}</span>}
              {item.fotograf_url
                ? <img src={item.fotograf_url} className="wish-thumb" alt="" />
                : (
                  <span className="wish-thumb thumb-fallback">
                    {brandInitials(item.ad)}
                  </span>
                )
              }

              <span className="wish-text">
                <span className="wish-name">
                  {item.ad}
                  {item.alt_ad && <span className="wish-variant"> {item.alt_ad}</span>}
                </span>
                <span className="wish-meta">
                  {kat && <i className="wish-dot" style={{ background: kat.renk }} />}
                  {alt}
                  {rozetler(item, alanlar).map(r => (
                    <em className="wish-eksi" key={r}>{r}</em>
                  ))}
                </span>
                {item.notlar && <span className="wish-note">{item.notlar}</span>}
              </span>
            </button>

            {!secimModu && (
              <button
                type="button"
                className="wish-tried"
                onClick={() => onTried(item)}
              >
                Denedim
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
