import React from 'react';

/*
 * Sıralama ekranının simgeleri — uygulamanın çizgi simgeleriyle aynı kalınlıkta.
 * Başlık, filtre şeridi, işlem çubuğu ve alt menü paylaşıyor.
 */
const Ikon = ({ children }: { children: React.ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
export const KategoriIkon = <Ikon><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></Ikon>;
export const AslaIkon = <Ikon><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></Ikon>;
export const GeriAlIkon = <Ikon><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></Ikon>;
export const DenedimIkon = <Ikon><path d="M5 12.5l4.5 4.5L19 7.5" /></Ikon>;
export const SilIkon = <Ikon><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Ikon>;
export const GeriIkon = <Ikon><path d="M15 5l-7 7 7 7" /></Ikon>;
export const KartIkon = (
  <Ikon>
    <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
  </Ikon>
);
export const PaylasIkon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 15V3M7.5 7.5L12 3l4.5 4.5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);
export const SatirIkon = <Ikon><path d="M4 6h16M4 12h16M4 18h16" /></Ikon>;

/** Liste ayarları: başlıkta (masaüstü) ve alt menüde (telefon). */
export const AyarlarIkon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
    <path d="M3 6h7M16 6h5M3 12h3M12 12h9M3 18h9M18 18h3" />
    <circle cx="13" cy="6" r="2.1" /><circle cx="9" cy="12" r="2.1" /><circle cx="15" cy="18" r="2.1" />
  </svg>
);

/** Alt menüdeki "Toplu ekle": alt alta satırlar. */
export const TopluIkon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h10M4 12h10M4 18h7M18 15v6M15 18h6" />
  </svg>
);
