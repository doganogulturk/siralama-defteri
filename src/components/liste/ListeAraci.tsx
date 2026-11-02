'use client';

import React from 'react';
import type { Gorunum } from '@/hooks/useGorunum';
import { KartIkon, SatirIkon } from './Ikonlar';
import { messages } from '@/lib/i18n';

export type Sekme = 'siralama' | 'sirada';

/**
 * Sekmelerin satırı. Masaüstünde tek satır: sekmeler solda, filtre ve arama ortada, görünüm ve
 * "Seç" sağda. Mobilde satır sarıyor: sekmeler kendi satırında ortalı, altında filtreler.
 * Görünüm seçici ve "Seç" yalnızca açık sekmede kayıt varken.
 */
export default function ListeAraci({
  sekme, onSekme, siralamaAdet, bekleyenAdet, filtreSeridi, arama,
  gorunum, onGorunum, secimAcik, onSecim,
}: {
  sekme: Sekme;
  onSekme: (s: Sekme) => void;
  siralamaAdet: number;
  bekleyenAdet: number;
  /** Telefondaki kategori şeridi. */
  filtreSeridi: React.ReactNode;
  /** Masaüstündeki arama kutusu (kategoriler orada rayın ağacında). */
  arama: React.ReactNode;
  /** Yalnızca masaüstünde verilir; telefonda görünüm seçici yok. */
  gorunum?: Gorunum;
  onGorunum: (g: Gorunum) => void;
  secimAcik: boolean;
  onSecim: () => void;
}) {
  const t = messages().liste;
  const acikAdet = sekme === 'sirada' ? bekleyenAdet : siralamaAdet;

  const sekmeDugmesi = (s: Sekme, etiket: string) => (
    <button
      type="button"
      className={`tab${sekme === s ? ' is-on' : ''}`}
      aria-current={sekme === s ? 'page' : undefined}
      onClick={() => onSekme(s)}
    >
      {etiket}
    </button>
  );

  const gorunumDugmesi = (g: Gorunum, etiket: string, ikon: React.ReactNode) => (
    <button
      type="button"
      className={gorunum === g ? 'is-on' : ''}
      aria-pressed={gorunum === g}
      aria-label={etiket}
      title={etiket}
      onClick={() => onGorunum(g)}
    >
      {ikon}
    </button>
  );

  return (
    <div className="liste-arac">
      <nav className="tabs" aria-label={t.gorunumMenu}>
        {sekmeDugmesi('siralama', t.sekmeSiralama(siralamaAdet))}
        {sekmeDugmesi('sirada', t.sekmeDenenmemis(bekleyenAdet))}
      </nav>
      <div className="liste-arac-filtre">
        <div className="mobile-filters">{filtreSeridi}</div>
        <div className="desk-arama">{arama}</div>
      </div>
      {gorunum && acikAdet > 0 && (
        <div className="gorunum-secici" role="group" aria-label={t.gorunum}>
          {gorunumDugmesi('kart', t.kartGorunumu, KartIkon)}
          {gorunumDugmesi('satir', t.satirGorunumu, SatirIkon)}
        </div>
      )}
      {acikAdet > 0 && (
        <button
          type="button"
          className={`secim-ac${secimAcik ? ' is-on' : ''}`}
          aria-pressed={secimAcik}
          onClick={onSecim}
        >
          {secimAcik ? t.bitti : t.sec}
        </button>
      )}
    </div>
  );
}
