import React from 'react';

/**
 * Yüklenirken içeriğin yerini tutan soluk taslaklar: sayfa boş bir "Yükleniyor…"
 * satırından dolu bir ekrana sıçramıyor, veri geldiğinde yerleşim yerinde kalıyor.
 */
export function IskeletSatirlar({ adet = 6 }: { adet?: number }) {
  return (
    <div className="rows iskelet" role="status" aria-label="Yükleniyor">
      {Array.from({ length: adet }, (_, i) => (
        <div className="row iskelet-row" key={i} style={{ '--i': i } as React.CSSProperties}>
          <span className="iskelet-blok iskelet-no" />
          <span className="iskelet-blok iskelet-foto" />
          <span className="iskelet-metin">
            <span className="iskelet-blok" />
            <span className="iskelet-blok is-kisa" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function IskeletKartlar({ adet = 4 }: { adet?: number }) {
  return (
    <div className="liste-grid iskelet" role="status" aria-label="Yükleniyor">
      {Array.from({ length: adet }, (_, i) => (
        <div className="liste-card iskelet-kart" key={i} style={{ '--i': i } as React.CSSProperties}>
          <span className="iskelet-blok iskelet-baslik" />
          <span className="iskelet-blok iskelet-sahne" />
          <span className="iskelet-blok" />
          <span className="iskelet-blok is-kisa" />
        </div>
      ))}
    </div>
  );
}
