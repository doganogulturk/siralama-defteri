'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useListeler } from '../hooks/useListeler';
import ListeEkleModal from './ListeEkleModal';

const ArtiIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const AyarIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3.4" />
    <path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.4 5.4l2.1 2.1M16.5 16.5l2.1 2.1M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1" />
  </svg>
);

interface ListeRayiProps {
  /** Rayda vurgulanacak liste. */
  aktifSlug?: string;
}

/**
 * Masaüstü sol rayı: künye, liste indeksi ve yeni liste düğmesi.
 * Sıralama ve ayarlar sayfalarının ikisinde de aynı ray duruyor — liste
 * değiştirmek için ana ekrana dönmek gerekmiyor.
 *
 * Her satır iki hedef taşıyor: sayı + ad listeyi açar, sağdaki dişli o
 * listenin ayarlarına gider. İç içe bağlantı olmaması için satır bir sarmalayıcı.
 */
export default function ListeRayi({ aktifSlug }: ListeRayiProps) {
  const { listeler, sayilar, load } = useListeler();
  const [formAcik, setFormAcik] = useState(false);

  return (
    <>
      <aside className="rail">
        <Link href="/" className="rail-brand">
          <span className="rail-brand-text">
            <strong>Sıralama<br />Defteri</strong>
            <em>{listeler.length} liste</em>
          </span>
        </Link>

        <nav className="rail-index" aria-label="Listeler">
          {listeler.map(l => (
            <div
              key={l.id}
              className={`rail-index-item${l.slug === aktifSlug ? ' is-on' : ''}`}
            >
              <Link
                href={`/l/${l.slug}`}
                className="rail-index-link"
                aria-current={l.slug === aktifSlug ? 'page' : undefined}
              >
                <span className="rail-index-sayi">{sayilar[l.id]?.toplam ?? 0}</span>
                <span className="rail-index-ad">{l.ad}</span>
              </Link>
              <Link
                href={`/l/${l.slug}/ayarlar`}
                className="rail-index-ayar"
                aria-label={`${l.ad} listesinin ayarları`}
              >
                {AyarIkon}
              </Link>
            </div>
          ))}
        </nav>

        <button type="button" className="rail-add" onClick={() => setFormAcik(true)}>
          {ArtiIkon}Yeni liste
        </button>
      </aside>

      <ListeEkleModal isOpen={formAcik} onClose={() => setFormAcik(false)} onCreated={load} />
    </>
  );
}
