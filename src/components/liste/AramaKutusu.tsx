'use client';

import React, { useEffect, useRef } from 'react';
import { messages } from '../../lib/i18n';

const AraIkon = (
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
}

/**
 * Liste içi arama: ad, çeşit ve notta, harf farkı gözetmeden (`lib/filtre.ts`).
 * Hep açık: masaüstünde araç satırında, telefonda kategorilerin altında. "/" görünen
 * kutuya odaklanıyor; Esc önce metni siliyor, metin boşsa kutudan çıkıyor.
 */
export default function AramaKutusu({ metin, onChange }: AramaKutusuProps) {
  const ref = useRef<HTMLInputElement>(null);
  const t = messages().liste;

  // "/" kısayolu: yazı yazılan bir alanda ya da açık bir pencerede değilken.
  useEffect(() => {
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
  }, []);

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
      ) : (
        <kbd className="arama-kisayol" aria-hidden="true">/</kbd>
      )}
    </div>
  );
}
