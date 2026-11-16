'use client';

import { useEffect } from 'react';
import { temayiBaslat } from '@/lib/tema';

/**
 * Sayfa açılınca seçili temayı bir kez uygular (kök düzen): `data-tema`yı sunucu ve `<head>`'deki betik zaten
 * koydu; burada tarayıcı çubuğunun rengi ve uygulamada iOS'un durum çubuğu seçimle uyumlu hâle geliyor.
 */
export default function TemaKoku() {
  useEffect(() => temayiBaslat(), []);
  return null;
}
