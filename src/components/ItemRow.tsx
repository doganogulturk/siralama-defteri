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

/** Sıralama ile "Bir daha asla" bölümünü ayıran çizginin sıralanabilir listedeki kimliği. */
export const ASLA_SINIRI = 'asla-siniri';

const AslaIkon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

interface RowProps {
  item: Item;
  alanlar: AlanTanimi[];
  rank: number;
  /** "Bir daha asla" bölümündeki kart: numara yerine çarpı. */
  asla?: boolean;
  isSelected: boolean;
  onSelect: (item: Item) => void;
  draggable?: boolean;
}

function RowShell({
  item, alanlar, rank, asla, isSelected, onSelect, draggable,
  handleProps, nodeRef, style, dragging,
}: RowProps & {
  handleProps?: Record<string, unknown>;
  nodeRef?: (n: HTMLElement | null) => void;
  style?: React.CSSProperties;
  dragging?: boolean;
}) {
  const isPodium = !asla && rank <= 3;
  const alt = altBilgi(item, alanlar);
  const tags = rozetler(item, alanlar);

  return (
    <div
      ref={nodeRef}
      style={style}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      className={`row${asla ? ' is-asla' : ''}${isSelected ? ' is-selected' : ''}${dragging ? ' is-dragging' : ''}`}
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

      {asla ? (
        <span className="row-rank is-asla" aria-label="Bir daha asla">{AslaIkon}</span>
      ) : (
        <span className={`row-rank${isPodium ? ' is-podium' : ''}`} data-rank={rank}>
          {rank}
        </span>
      )}

      {item.fotograf_url
        ? <img src={item.fotograf_url} className="row-thumb" alt="" />
        : (
          // Renk değişkenle veriliyor ki CSS gerektiğinde ezebilsin; satır içi
          // `background` olsaydı ezemezdi.
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

      {/* Rozetler tek sarmalayıcıda; rozet yoksa CSS sarmalayıcıyı gizliyor. */}
      <span className="row-tags">
        {tags.map(t => <span key={t} className="row-tag">{t}</span>)}
      </span>
    </div>
  );
}

function AslaSiniriIcerik({ adet }: { adet: number }) {
  return (
    <>
      <span className="asla-siniri-ad">Bir daha asla</span>
      {adet > 0 && <span className="asla-siniri-sayi">{adet}</span>}
    </>
  );
}

/** Filtreli görünümdeki çizgi: sürükleme yok. */
export function AslaSiniri({ adet }: { adet: number }) {
  return (
    <div className="asla-siniri" role="separator">
      <AslaSiniriIcerik adet={adet} />
    </div>
  );
}

/**
 * Filtresiz görünümdeki çizgi. Kendisi sürüklenmiyor ama sıralanabilir listenin bir
 * öğesi: kartlar üstünden geçip yer değiştirebiliyor, bırakıldığında çizginin
 * hangi yanında kaldıkları bölümlerini belirliyor.
 */
export function SuruklenebilirAslaSiniri({ adet }: { adet: number }) {
  const { setNodeRef, transform, transition } = useSortable({
    id: ASLA_SINIRI,
    disabled: { draggable: true, droppable: false },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="asla-siniri"
      role="separator"
    >
      <AslaSiniriIcerik adet={adet} />
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
        // Yalnızca öteleme: alt bilgisi olan satır daha uzun, ölçekleme onu ezerdi.
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
      handleProps={{ ...attributes, ...listeners }}
    />
  );
}
