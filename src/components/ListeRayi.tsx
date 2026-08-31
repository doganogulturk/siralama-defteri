'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useListeler, siralanan } from '../hooks/useListeler';
import ListeEkleModal from './ListeEkleModal';

const ArtiIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * Ayar simgesi: üç kural çizgisi ve tutamakları. Dişli yerine sürgü, çünkü sekme
 * simgesi de (`app/icon.svg`) üç kural çizgisinden kurulu — aynı sözlük.
 * Öncesinde ışınlı bir daire vardı, 15 pikselde güneşe benziyordu.
 */
const AyarIkon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
    <path d="M3 6h7M16 6h5M3 12h3M12 12h9M3 18h9M18 18h3" />
    <circle cx="13" cy="6" r="2.1" /><circle cx="9" cy="12" r="2.1" /><circle cx="15" cy="18" r="2.1" />
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
              // Satır kendi listesinin vurgu rengini taşıyor: sayı bloğu ve ayar
              // hücresinin üstüne gelme rengi buradan geliyor.
              style={{ '--satir': l.renk } as React.CSSProperties}
            >
              <Link
                href={`/l/${l.slug}`}
                className="rail-index-link"
                aria-current={l.slug === aktifSlug ? 'page' : undefined}
              >
                <span className="rail-index-sayi">{siralanan(sayilar[l.id])}</span>
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
