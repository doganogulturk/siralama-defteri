'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlanTanimi, Item, alanGorunur, alanKisa, bayrak, metin,
} from '../types/item';

export const brandColor = (ad: string) => {
  let hash = 0;
  for (let i = 0; i < ad.length; i++) {
    hash = ad.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 42%, 44%)`;
};

export const brandInitials = (ad: string | null | undefined) => {
  const words = (ad || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words.slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
};

/** Kayda ait ilk dolu metin alanı — satırın altındaki ince açıklama. */
export function altBilgi(item: Item, alanlar: AlanTanimi[]): string {
  for (const alan of alanlar) {
    if (alan.tip !== 'metin' || !alanGorunur(alan, item.category_id)) continue;
    const deger = metin(item, alan.anahtar);
    if (deger) return deger;
  }
  return '';
}

/** Kayıtta işaretli bool alanların kısa adları — satır ve panellerdeki rozetler. */
export function rozetler(item: Item, alanlar: AlanTanimi[]): string[] {
  return alanlar
    .filter(a => a.tip === 'bool' && bayrak(item, a.anahtar))
    .map(alanKisa);
}

interface RowProps {
  item: Item;
  alanlar: AlanTanimi[];
  rank: number;
  isSelected: boolean;
  onSelect: (item: Item) => void;
  draggable?: boolean;
}

function RowShell({
  item, alanlar, rank, isSelected, onSelect, draggable,
  handleProps, nodeRef, style, dragging,
}: RowProps & {
  handleProps?: Record<string, unknown>;
  nodeRef?: (n: HTMLElement | null) => void;
  style?: React.CSSProperties;
  dragging?: boolean;
}) {
  const isPodium = rank <= 3;
  const alt = altBilgi(item, alanlar);
  const tags = rozetler(item, alanlar);

  return (
    <div
      ref={nodeRef}
      style={style}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`row${isSelected ? ' is-selected' : ''}${dragging ? ' is-dragging' : ''}`}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
    >
      {draggable && (
        <span
          className="row-grip"
          aria-label="Sürükleyerek sırala"
          onClick={(e) => e.stopPropagation()}
          {...handleProps}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
            <circle cx="2" cy="2" r="1.4" /><circle cx="8" cy="2" r="1.4" />
            <circle cx="2" cy="8" r="1.4" /><circle cx="8" cy="8" r="1.4" />
            <circle cx="2" cy="14" r="1.4" /><circle cx="8" cy="14" r="1.4" />
          </svg>
        </span>
      )}

      <span className={`row-rank${isPodium ? ' is-podium' : ''}`} data-rank={rank}>
        {rank}
      </span>

      {item.fotograf_url
        ? <img src={item.fotograf_url} className="row-thumb" alt="" />
        : (
          // Renk değişkenle veriliyor: podyum kartları yedek görseli liste renginin
          // tonuna çeviriyor, satır içi `background` olsaydı CSS ezemezdi.
          <span className="row-thumb row-thumb-fallback" style={{ '--marka': brandColor(item.ad || '') } as React.CSSProperties}>
            {brandInitials(item.ad)}
          </span>
        )
      }

      <span className="row-text">
        <span className="row-name">
          {item.ad}
          {item.alt_ad && <span className="row-variant"> {item.alt_ad}</span>}
        </span>
        {alt && <span className="row-sub">{alt}</span>}
      </span>

      {/* Rozetler tek sarmalayıcıda: podyum kartında ızgaranın tek hücresine oturuyor. */}
      <span className="row-tags">
        {tags.map(t => <span key={t} className="row-tag">{t}</span>)}
      </span>
    </div>
  );
}

export function StaticRow(props: RowProps) {
  return <RowShell {...props} draggable={false} />;
}

export function DraggableRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.item.id });

  return (
    <RowShell
      {...props}
      draggable
      nodeRef={setNodeRef}
      dragging={isDragging}
      style={{
        // Yalnızca öteleme: podyum kartları farklı boyda, ölçekleme onları eziyordu.
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
      handleProps={{ ...attributes, ...listeners }}
    />
  );
}
