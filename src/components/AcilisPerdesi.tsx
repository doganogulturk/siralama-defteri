'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Perdenin bütün animasyonunun süresi (globals.css → `.acilis-perde` çekilmesinin bitişi) ve biraz pay. */
const PERDE_SURESI = 3150;

/*
 * Açılış perdesi: kareli kâğıdın ortasında uygulama simgesi; üç çubuk karışır ve kendini
 * uzundan kısaya sıralar (en uzun en üste gelince vurgu rengine döner, simgeden bir halka
 * yayılır), altında "Sıralama / Defteri" soldan açılır, ekranın en altında "doğan oğultürk"
 * belirir, sonra perde çekilir. Animasyonların hepsi CSS'te (globals.css → AÇILIŞ PERDESİ).
 *
 * Yalnızca ana sayfayla (`/`) başlayan sayfa yüklemesinde, bir kez: paylaşım sayfaları ve derin
 * bağlantılar içeriği beklemeden açsın. Sunucuda da çiziliyor; yoksa sayfa bir an perdesiz görünür.
 * Karar ilk çizimde donuyor ve kök düzen sayfa geçişlerinde yeniden kurulmadığı için uygulama
 * içinde ana sayfaya dönüşte tekrar oynamıyor. Dokununca hemen kalkıyor; hareket azaltma açıksa
 * hiç görünmüyor (CSS).
 *
 * Simge ekranın tam ortasında: uygulamanın yerel açılış ekranı (LaunchScreen.storyboard) simgeyi
 * aynı yerde ve boyda çiziyor, perde ondan sıçramadan devralıyor.
 */
export default function AcilisPerdesi() {
  const yol = usePathname();
  const [acik, setAcik] = useState(yol === '/');

  useEffect(() => {
    if (!acik) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAcik(false);
      return;
    }
    const zamanlayici = window.setTimeout(() => setAcik(false), PERDE_SURESI);
    return () => window.clearTimeout(zamanlayici);
  }, [acik]);

  if (!acik) return null;

  return (
    <div
      className="acilis-perde"
      aria-hidden="true"
      onPointerDown={() => setAcik(false)}
      onAnimationEnd={e => {
        // Yalnızca perdenin çekilmesi bitince. Adına bakılıyor: kareli kâğıdın belirmesi (`::before`) de
        // perdenin kendisinden olay gönderiyor ve hedefi aynı; ona bakılmazsa perde 0,5 sn'de kalkıyordu
        // (uygulamada sayfa o süreden önce hazır, webde geliştirmede sonra; bu yüzden yalnızca uygulamada).
        if (e.animationName === 'acilis-cekil') setAcik(false);
      }}
    >
      <span className="acilis-simge">
        <svg viewBox="0 0 32 32" width="96" height="96">
          <rect className="acilis-kare" width="32" height="32" rx="8" />
          <rect className="acilis-cubuk acilis-cubuk-1" x="6" y="7.5" width="20" height="4.5" rx="2.25" />
          <rect className="acilis-cubuk acilis-cubuk-2" x="6" y="13.75" width="14.5" height="4.5" rx="2.25" />
          <rect className="acilis-cubuk acilis-cubuk-3" x="6" y="20" width="9" height="4.5" rx="2.25" />
        </svg>
      </span>
      <span className="acilis-ad">Sıralama<br />Defteri</span>
      <span className="acilis-imza">doğan oğultürk</span>
    </div>
  );
}
