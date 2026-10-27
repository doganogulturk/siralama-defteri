'use client';

import React from 'react';
import { messages } from '../lib/i18n';

/**
 * Uygulamanın arayüzünden küçük parçalar (.oz-*): giriş ekranındaki özellik
 * kartları ve boş durumlar aynı dili konuşsun diye tek yerde.
 */
export const SahneSatiri = ({ no, ad, foto, className = '' }: {
  no: string; ad: string; foto?: string; className?: string;
}) => (
  <span className={`oz-row ${className}`}>
    <span className="oz-tutamak" />
    <i>{no}</i>
    {/* Renk verilmezse kesik çizgili taslak kutu. */}
    <span
      className={`oz-foto${foto ? '' : ' is-taslak'}`}
      style={foto ? ({ '--f': foto } as React.CSSProperties) : undefined}
    />
    <span className="oz-ad">{ad}</span>
  </span>
);

/** Boş durum kartlarının üstündeki sahne: ne olacağını metinden önce gösteriyor. */
export function BosSahne({ tur }: { tur: 'listeler' | 'siralama' | 'denenmemis' }) {
  const t = messages().sahne;
  return (
    <div className="oz-sahne" aria-hidden="true">
      {tur === 'listeler' && (
        <span className="oz-listeler">
          {t.listeler.map(ad => (
            <span className="oz-liste is-taslak" key={ad}><em>{ad}</em></span>
          ))}
        </span>
      )}
      {tur === 'siralama' && (
        <>
          <SahneSatiri no="1" ad={t.ilkKayit} foto="#c5501f" className="is-kalkik" />
          <SahneSatiri no="2" ad={t.siradaki} className="is-taslak" />
        </>
      )}
      {tur === 'denenmemis' && (
        <>
          <span className="oz-segment"><em>{t.siralamam}</em><em className="is-on">{t.denenmemis}</em></span>
          <span className="oz-row is-taslak">
            <span className="oz-foto is-taslak" />
            <span className="oz-ad">{t.denemekIstedigin}</span>
            <em className="oz-denedim">{t.denedim}</em>
          </span>
        </>
      )}
    </div>
  );
}
