'use client';

import { useSyncExternalStore } from 'react';
import { dileAbone, diliOku, type Dil } from './index';

/** Kişinin dili; değişince yeniden çizer. Sunucuda ve ilk istemci çiziminde Türkçe (hidrasyon uyuşsun). */
export function useDil(): Dil {
  return useSyncExternalStore(dileAbone, diliOku, () => 'tr');
}
