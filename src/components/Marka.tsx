import React from 'react';

/**
 * Uygulamanın işareti: azalan uzunlukta üç çizgi — bir sıralamanın en sade hâli.
 * Sekme simgesiyle (app/icon.svg) aynı çizim; renkler temadan.
 */
export const MarkaIsareti = () => (
  <span className="marka-isaret" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="2.5" width="12" height="2.6" rx="1.3" />
      <rect x="2" y="6.7" width="8.6" height="2.6" rx="1.3" />
      <rect x="2" y="10.9" width="5.2" height="2.6" rx="1.3" />
    </svg>
  </span>
);

/** İşaret ve ad: ana ekranın üst çubuğu, masaüstü rayı ve giriş ekranı. */
export default function Marka({ className = '' }: { className?: string }) {
  return (
    <span className={`marka ${className}`}>
      <MarkaIsareti />
      <span className="marka-ad">Sıralama Defteri</span>
    </span>
  );
}
