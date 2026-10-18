'use client';

import { useEffect, useState } from 'react';

/** Kısa süreli geri bildirim ("7 kayıt Yaz kategorisine taşındı"); birkaç saniyede kendiliğinden siliniyor. */
export function useBildirim(sureMs = 2600) {
  const [bildirim, setBildirim] = useState<string | null>(null);
  useEffect(() => {
    if (!bildirim) return;
    const id = window.setTimeout(() => setBildirim(null), sureMs);
    return () => window.clearTimeout(id);
  }, [bildirim, sureMs]);
  return [bildirim, setBildirim] as const;
}
