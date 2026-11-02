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
  gorunum, onGorunum, kademeGorunumu, onKademeGorunumu, secimAcik, onSecim,
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
  /** Sıralama sekmesinde 1→n / Tier seçimi (kademeler kapalıysa false); verilmezse seçici yok. */
  kademeGorunumu?: boolean;
  onKademeGorunumu: (acik: boolean) => void;
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
      {kademeGorunumu !== undefined && acikAdet > 0 && !secimAcik && (
        <SiraTierSecici acik={kademeGorunumu} onSec={onKademeGorunumu} />
      )}
      {gorunum && acikAdet > 0 && !kademeGorunumu && (
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

/**
 * Sıralamanın iki görünümü: "1→n" (numaralı sıralama; kademeler açıksa başlıklarıyla) ve
 * "Tier" (her kademe bir satır). Kademeleri kapalı listede de görünüyor: "Tier" onları açıyor
 * (sayfa, `kademeleriAc`). Masaüstünde araç satırında, telefonda arama satırında.
 */
export function SiraTierSecici({ acik, onSec }: { acik: boolean; onSec: (tier: boolean) => void }) {
  const k = messages().kademe;
  return (
    <div className="gorunum-secici sira-tier" role="group" aria-label={messages().liste.gorunum}>
      <button type="button" className={acik ? '' : 'is-on'} aria-pressed={!acik} title={k.listeGorunumu} onClick={() => onSec(false)}>
        {k.siraEtiketi}
      </button>
      <button type="button" className={acik ? 'is-on' : ''} aria-pressed={acik} title={k.tierGorunumu} onClick={() => onSec(true)}>
        {k.tierEtiketi}
      </button>
    </div>
  );
}
