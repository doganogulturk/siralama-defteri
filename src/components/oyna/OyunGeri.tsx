'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MOBIL } from '@/lib/site';

/** Bu sekmede site içinde sayfa değiştirildi mi (`GezintiIzi` yazıyor). */
const IZ = 'siralama-defteri:ic-gezinti';
/** Bir önceki sayfanın adresi (yol + sorgu); uygulama paketinde geri düğmesi oraya gidiyor. */
const ONCEKI = 'siralama-defteri:onceki-sayfa';

/**
 * Site içi gezinmenin izi: ilk açılıştan sonra adres değişince sekmeye not düşüyor.
 * İstemci tarafı geçişlerde `document.referrer` değişmiyor; geri düğmesi "geri dönülecek
 * bir sayfa var mı"yı buradan biliyor. Kök düzende bir kez.
 */
export function GezintiIzi() {
  return (
    <React.Suspense fallback={null}>
      <Iz />
    </React.Suspense>
  );
}

function Iz() {
  const yol = usePathname();
  const sorgu = useSearchParams().toString();
  const tam = sorgu ? `${yol}?${sorgu}` : yol;
  const ilk = useRef(yol);
  const simdiki = useRef(tam);
  useEffect(() => {
    if (tam === simdiki.current) return;
    try {
      // Yalnızca sayfa değişince bir önceki sayfa (aynı sayfada sorgu değişmesi, ör. oyun sonucu, değil).
      if (yol !== new URL(simdiki.current, 'http://x').pathname) sessionStorage.setItem(ONCEKI, simdiki.current);
      if (yol !== ilk.current) sessionStorage.setItem(IZ, '1');
    } catch { /* depolama kapalı */ }
    simdiki.current = tam;
  }, [tam, yol]);
  return null;
}

/**
 * Oyunların başlığındaki geri düğmesi: oyuna site içinden gelindiyse (ana ekranın Bugün
 * kartı, Oyna, bir sonuç ekranı) geldiği sayfaya dönüyor; bağlantıyla doğrudan açıldıysa
 * (WhatsApp'tan gelen arkadaş bağlantısı) Oyna'ya. iOS'ta donanım geri tuşu yok: her
 * ekranda görünür bir geri yolu — oyun sırasında da, sonuçta da.
 */
export default function OyunGeri({ etiket }: { etiket: string }) {
  const router = useRouter();
  const geri = (e: React.MouseEvent) => {
    // Yeni sekmede açma (Cmd/Ctrl-tık) olağan bağlantı gibi kalsın.
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    let icerden = false;
    try {
      icerden = window.history.length > 1 && (
        sessionStorage.getItem(IZ) === '1'
        || (!!document.referrer && new URL(document.referrer).origin === window.location.origin)
      );
    } catch { /* depolama kapalı, referrer yok */ }
    if (!icerden) return;
    e.preventDefault();
    // Uygulama paketinde ilk sayfa Next'in geçmiş kaydı olmadan yükleniyor; geçmişte geri gitmek
    // adresi değiştirip ekranı değiştirmiyordu. Orada bir önceki sayfanın adresine gidiliyor.
    if (MOBIL) {
      let onceki: string | null = null;
      try { onceki = sessionStorage.getItem(ONCEKI); } catch { /* depolama kapalı */ }
      router.push(onceki ?? '/oyna');
      return;
    }
    router.back();
  };
  return (
    <Link href="/oyna" className="mobile-brand-back" aria-label={etiket} onClick={geri}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}
