'use client';

import React from 'react';
import { diliSec, messages, type Dil } from '../lib/i18n';
import { useDil } from '../lib/i18n/useDil';

const DILLER: Dil[] = ['tr', 'en'];

/**
 * Türkçe / English seçimi: iki küçük düğme. Giriş ekranında (oturum yokken "Hesabım" açılamıyor),
 * "Hesabım"da ve yasal sayfalarda duruyor. Seçim hatırlanıyor ve bütün sayfa o dilde yeniden kuruluyor.
 * `kisa`: dar üst çubuklarda "TR / EN"; tam ad ekran okuyucu için etikette kalıyor.
 */
export default function DilSecici({ className = '', kisa = false }: { className?: string; kisa?: boolean }) {
  const dil = useDil();
  const m = messages();
  return (
    <div className={`dil-secici ${className}`} role="group" aria-label={m.dil.baslik}>
      {DILLER.map(d => (
        <button
          key={d}
          type="button"
          lang={d}
          aria-label={kisa ? m.dil[d] : undefined}
          className={d === dil ? 'is-on' : ''}
          aria-pressed={d === dil}
          onClick={() => diliSec(d)}
        >
          {kisa ? d.toUpperCase() : m.dil[d]}
        </button>
      ))}
    </div>
  );
}
