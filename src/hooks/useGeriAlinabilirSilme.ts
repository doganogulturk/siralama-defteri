'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Item } from '../types/item';

interface Secenekler {
  /** Asıl silme: süre dolunca, yeni bir silme başlayınca ya da sayfadan çıkılınca. */
  sil: (item: Item) => Promise<void>;
  geriAlindi?: (item: Item) => void;
  sureMs?: number;
}

/**
 * Tek kaydın geri alınabilir silinmesi. Kayıt hemen gizleniyor (sayfa `bekleyen`i
 * listelerden süzüyor), veritabanından ve kovadan ancak süre dolunca gidiyor;
 * "Geri al" süre içinde hiçbir şey yazmadan kaydı geri getiriyor.
 *
 * Bekleyen silme sayfa gizlenince (sekme kapanıyor, uygulama arka plana geçiyor)
 * ya da bileşen kapanınca hemen yapılıyor. Tarayıcı isteği tamamlamadan kapanırsa
 * kayıt silinmeden kalır — kaybolmaktansa geri gelmesi daha az zararlı.
 */
export function useGeriAlinabilirSilme({ sil, geriAlindi, sureMs = 5000 }: Secenekler) {
  const [bekleyen, setBekleyen] = useState<Item | null>(null);
  const bekleyenRef = useRef<Item | null>(null);
  const zamanlayici = useRef<number | undefined>(undefined);
  // En güncel geri çağırmalar: zamanlayıcı ve olay dinleyicileri eski kapanışla kalmasın.
  const silRef = useRef(sil);
  const geriAlindiRef = useRef(geriAlindi);
  useEffect(() => {
    silRef.current = sil;
    geriAlindiRef.current = geriAlindi;
  });

  const tamamla = useCallback(() => {
    window.clearTimeout(zamanlayici.current);
    const item = bekleyenRef.current;
    if (!item) return;
    bekleyenRef.current = null;
    setBekleyen(null);
    void silRef.current(item);
  }, []);

  const baslat = useCallback((item: Item) => {
    tamamla(); // önceki bekleyen varsa onu şimdi sil
    bekleyenRef.current = item;
    setBekleyen(item);
    zamanlayici.current = window.setTimeout(tamamla, sureMs);
  }, [tamamla, sureMs]);

  const geriAl = useCallback(() => {
    window.clearTimeout(zamanlayici.current);
    const item = bekleyenRef.current;
    bekleyenRef.current = null;
    setBekleyen(null);
    if (item) geriAlindiRef.current?.(item);
  }, []);

  useEffect(() => {
    const gizlendi = () => { if (document.visibilityState === 'hidden') tamamla(); };
    document.addEventListener('visibilitychange', gizlendi);
    return () => {
      document.removeEventListener('visibilitychange', gizlendi);
      tamamla();
    };
  }, [tamamla]);

  return { bekleyen, baslat, geriAl };
}
