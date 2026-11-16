'use client';

import React, { useSyncExternalStore } from 'react';
import { TEMALAR, temaOku, temaSec, temayaAbone } from '@/lib/tema';
import { useMesajlar } from '@/lib/i18n/DilBaglami';

/** Sistem / Açık / Koyu: Profil'de, dil seçiminin altında; görünümü dil seçicininki (`.dil-secici`). */
export default function TemaSecici() {
  const secili = useSyncExternalStore(temayaAbone, temaOku, () => 'sistem' as const);
  const m = useMesajlar().profil;
  return (
    <div className="dil-secici" role="group" aria-label={m.tema}>
      {TEMALAR.map(t => (
        <button
          key={t}
          type="button"
          className={t === secili ? 'is-on' : ''}
          aria-pressed={t === secili}
          onClick={() => temaSec(t)}
        >
          {m.temalar[t]}
        </button>
      ))}
    </div>
  );
}
