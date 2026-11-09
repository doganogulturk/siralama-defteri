'use client';

import { useEffect } from 'react';
import { MOBIL } from '@/lib/site';
import { uygulamaDonusunuDinle } from '@/lib/auth';

/**
 * Uygulama paketinin (Capacitor) yerel tarafıyla köprü: girişten dönüşü dinliyor. Webde hiçbir
 * şey yapmıyor; `MOBIL` derlemede sabit olduğu için webde Capacitor modülleri yüklenmiyor.
 * Kök düzende bir kez.
 */
export default function UygulamaKoprusu() {
  useEffect(() => (MOBIL ? uygulamaDonusunuDinle() : undefined), []);
  return null;
}
