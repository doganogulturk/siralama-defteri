'use client';

import { useEffect, useState } from 'react';

/** Masaüstündeki Kart / Satır tercihinin tarayıcıdaki anahtarı. */
const GORUNUM_ANAHTARI = 'siralama-defteri:gorunum';

export type Gorunum = 'kart' | 'satir';

/**
 * Masaüstünde kayıtlar kart ya da satır; tercih tarayıcıda hatırlanıyor. Mobil hep
 * satır (`kart` false): dar ekranda kart tek sütuna düşüp ekrana 2–3 kayıt sığdırırdı.
 */
export function useGorunum(isDesktop: boolean) {
  const [gorunum, setGorunum] = useState<Gorunum>('kart');
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(GORUNUM_ANAHTARI) === 'satir') setGorunum('satir');
    } catch { /* depolama kapalı: varsayılan kart */ }
  }, []);
  const gorunumSec = (next: Gorunum) => {
    setGorunum(next);
    try { window.localStorage.setItem(GORUNUM_ANAHTARI, next); } catch { /* yok say */ }
  };
  return { gorunum, gorunumSec, kart: isDesktop && gorunum === 'kart' };
}
