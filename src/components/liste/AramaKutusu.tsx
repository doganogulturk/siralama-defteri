'use client';

import React, { useEffect, useRef } from 'react';
import { messages } from '../../lib/i18n';

export const AraIkon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" />
  </svg>
);

const KapatIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

interface AramaKutusuProps {
  metin: string;
  onChange: (metin: string) => void;
  /** Telefonda kutu başlıktaki büyüteçle açılıyor; kapatınca arama da temizleniyor. */
  onKapat?: () => void;
  /** Açıldığı an odaklanır (telefonda büyütece basınca). */
  odaklan?: boolean;
}

/**
 * Liste içi arama: ad, çeşit ve notta, harf farkı gözetmeden (`lib/filtre.ts`).
 * Masaüstünde araç satırında hep açık, "/" ile odaklanıyor; Esc önce metni,
 * metin boşsa kutuyu bırakıyor.
 */
export default function AramaKutusu({ metin, onChange, onKapat, odaklan }: AramaKutusuProps) {
  const ref = useRef<HTMLInputElement>(null);
  const t = messages().liste;

  useEffect(() => {
    if (odaklan) ref.current?.focus();
  }, [odaklan]);

  // "/" kısayolu: yazı yazılan bir alanda ya da açık bir pencerede değilken.
  useEffect(() => {
    if (onKapat) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const hedef = e.target as HTMLElement | null;
      if (hedef?.closest('input, textarea, select, [contenteditable], dialog[open]')) return;
      if (!ref.current?.offsetParent) return; // kutu bu ekranda görünmüyor
      e.preventDefault();
      ref.current.focus();
    };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  }, [onKapat]);

  return (
    <div className={`arama${metin ? ' is-dolu' : ''}`} role="search">
      <span className="arama-ikon">{AraIkon}</span>
      <input
        ref={ref}
        type="search"
        className="arama-alan"
        placeholder={t.araYer}
        aria-label={t.araYer}
        value={metin}
        maxLength={60}
        enterKeyHint="search"
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key !== 'Escape') return;
          e.preventDefault();
          if (metin) onChange('');
          else if (onKapat) onKapat();
          else ref.current?.blur();
        }}
      />
      {metin ? (
        <button
          type="button"
          className="arama-temizle"
          aria-label={t.araTemizle}
          onClick={() => { onChange(''); ref.current?.focus(); }}
        >
          {KapatIkon}
        </button>
      ) : onKapat ? (
        <button type="button" className="arama-temizle" aria-label={t.araKapat} onClick={onKapat}>
          {KapatIkon}
        </button>
      ) : (
        <kbd className="arama-kisayol" aria-hidden="true">/</kbd>
      )}
    </div>
  );
}
