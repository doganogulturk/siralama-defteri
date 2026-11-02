'use client';

import { usePathname } from 'next/navigation';
import { Fragment, useEffect, useSyncExternalStore } from 'react';
import { dileAbone, diliOku, diliUygula, sozluk, type Dil } from '@/lib/i18n';
import { DilBaglami } from '@/lib/i18n/DilBaglami';

/**
 * Bütün sayfanın dilini belirler. Sunucu isteğin dilini bulup (`istekDili`: çerez, sonra tarayıcının dili)
 * `baslangic` olarak veriyor; sayfa o dilde çiziliyor ve hidrasyon aynı dille yapılıyor. Tarayıcı başka bir
 * dil bulursa (bağlantıdaki `?l=` ya da sonradan yapılan seçim) altındaki her şey baştan, o dilde kurulur
 * (anahtar değişir). Dil hem bağlamda (`useMesajlar`) hem tarayıcıda `messages()` için modül durumunda.
 * Sayfanın `lang` özniteliği ve sekmede görünen başlığı da dile uyar.
 */
export default function DilKoku({ baslangic, children }: { baslangic: Dil; children: React.ReactNode }) {
  const dil = useSyncExternalStore(dileAbone, diliOku, () => baslangic);
  const yol = usePathname();
  // Sunucuda modül durumu bütün isteklerin ortak değişkeni: orada yazılmıyor (bkz. DilBaglami.tsx).
  if (typeof window !== 'undefined') diliUygula(dil);

  useEffect(() => {
    document.documentElement.lang = dil;
    const baslik = sozluk(dil).sayfaBasliklari[yol.replace(/\/$/, '') || '/'];
    if (!baslik) return;
    // Next.js sayfanın metadata başlığını bizden sonra da yazabilir; değişirse dile uygun olanı geri konur.
    const uygula = () => {
      if (document.title !== baslik) document.title = baslik;
    };
    uygula();
    const gozcu = new MutationObserver(uygula);
    gozcu.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => gozcu.disconnect();
  }, [dil, yol]);

  return (
    <DilBaglami value={dil}>
      <Fragment key={dil}>{children}</Fragment>
    </DilBaglami>
  );
}
