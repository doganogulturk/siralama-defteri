'use client';

import { usePathname } from 'next/navigation';
import { Fragment, useEffect } from 'react';
import { diliUygula, messages } from '../lib/i18n';
import { useDil } from '../lib/i18n/useDil';

/**
 * Bütün sayfanın dilini belirler: dil değişince altındaki her şey baştan, o dilde kurulur (anahtar değişir).
 * Böylece bileşenler metinleri `messages()`tan doğrudan okur. Sayfanın `lang` özniteliği ve sekmede görünen
 * başlığı da dile uyar (statik sayfaların metadata başlığı derlemede Türkçe sabitlenir).
 */
export default function DilKoku({ children }: { children: React.ReactNode }) {
  const dil = useDil();
  const yol = usePathname();
  diliUygula(dil);

  useEffect(() => {
    document.documentElement.lang = dil;
    const baslik = messages().sayfaBasliklari[yol.replace(/\/$/, '') || '/'];
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

  return <Fragment key={dil}>{children}</Fragment>;
}
