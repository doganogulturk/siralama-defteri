'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/** Bu sekmede site içinde sayfa değiştirildi mi (`GezintiIzi` yazıyor). */
const IZ = 'siralama-defteri:ic-gezinti';

/**
 * Site içi gezinmenin izi: ilk açılıştan sonra adres değişince sekmeye not düşüyor.
 * İstemci tarafı geçişlerde `document.referrer` değişmiyor; geri düğmesi "geri dönülecek
 * bir sayfa var mı"yı buradan biliyor. Kök düzende bir kez.
 */
export function GezintiIzi() {
  const yol = usePathname();
  const ilk = useRef(yol);
  useEffect(() => {
    if (yol === ilk.current) return;
    try { sessionStorage.setItem(IZ, '1'); } catch { /* depolama kapalı */ }
  }, [yol]);
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
