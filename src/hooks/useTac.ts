'use client';

import { useEffect, useRef, useState } from 'react';
import { titret } from '../lib/his';

/**
 * Şampiyon değiştiğinde kısa bir taç anı: yeni birincinin kimliği ~1.6 sn dönüyor,
 * satır bu sürede tacını takıyor (CSS `is-taclandi`), telefon titriyor. İlk yükleme
 * ve liste değişimi tetiklemiyor — yalnızca kullanıcının yaptığı bir değişiklik.
 *
 * `kapsam` değişince (başka bir listeye geçiş) önceki şampiyon unutuluyor.
 */
export function useTac(sampiyonId: string | undefined, kapsam: string, hazir = true): string | null {
  const onceki = useRef<{ kapsam: string; id: string | undefined } | null>(null);
  const [taclanan, setTaclanan] = useState<string | null>(null);

  useEffect(() => {
    if (!hazir) return;
    const o = onceki.current;
    onceki.current = { kapsam, id: sampiyonId };
    if (!o || o.kapsam !== kapsam || !o.id || !sampiyonId || o.id === sampiyonId) return;
    setTaclanan(sampiyonId);
    titret('sampiyon');
    const t = setTimeout(() => setTaclanan(null), 1600);
    return () => clearTimeout(t);
  }, [sampiyonId, kapsam, hazir]);

  return taclanan;
}
