'use client';

import React, { useEffect, useRef, useState } from 'react';
import { messages } from '@/lib/i18n';

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
 * Kapalıyken yalnızca büyüteç düğmesi (masaüstünde araç satırında, telefonda arama
 * satırında); basınca ya da "/" ile kutu açılıp odaklanıyor. Boşken kutudan çıkınca
 * yeniden kapanıyor, içinde arama varken açık kalıyor. Esc önce metni siliyor, metin
 * boşsa kutudan çıkıyor (ve kutu kapanıyor).
 */
export default function AramaKutusu({ metin, onChange }: AramaKutusuProps) {
  const ref = useRef<HTMLInputElement>(null);
  const kapRef = useRef<HTMLDivElement>(null);
  const t = messages().liste;
  const [acikTercih, setAcik] = useState(false);
  /** Metin varken kutu her zaman açık (örneğin "Şimdi ata" köprüsünden ya da geri dönüşte). */
  const acik = acikTercih || !!metin;

  // Açılınca odak: input o çizimde doğuyor.
  useEffect(() => { if (acikTercih) ref.current?.focus(); }, [acikTercih]);

  // "/" kısayolu: yazı yazılan bir alanda ya da açık bir pencerede değilken.
  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const hedef = e.target as HTMLElement | null;
      if (hedef?.closest('input, textarea, select, [contenteditable], dialog[open]')) return;
      if (!kapRef.current?.offsetParent) return; // bu ekranda görünmüyor
      e.preventDefault();
      setAcik(true);
      ref.current?.focus();
    };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  }, []);

  if (!acik) {
    return (
      <div ref={kapRef} className="arama-kap" role="search">
        <button type="button" className="arama-ac" aria-label={t.araAc} title={t.araAc} onClick={() => setAcik(true)}>
          {AraIkon}
        </button>
      </div>
    );
  }

  return (
    <div ref={kapRef} className={`arama${metin ? ' is-dolu' : ''}`} role="search">
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
        onBlur={e => { if (!e.target.value) setAcik(false); }}
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
          // Basış odağı inputtan almasın: boş kutu kapanmasın, yazmaya devam edilebilsin.
          onMouseDown={e => e.preventDefault()}
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
