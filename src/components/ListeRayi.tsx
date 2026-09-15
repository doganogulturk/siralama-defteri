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

interface ListeRayiProps {
  /** Rayda vurgulanacak liste. */
  aktifSlug?: string;
}

/**
 * Masaüstü sol rayı: künye, liste indeksi ve yeni liste düğmesi. Satırlarda ayar
 * simgesi yok — liste ayarları sıralama ekranının başlığındaki "Liste ayarları"
 * düğmesinden açılıyor.
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
          {listeler.map(l => {
            const aktif = l.slug === aktifSlug;
            const sampiyon = sayilar[l.id]?.ilkUc[0];
            return (
              <div key={l.id} className={`rail-index-item${aktif ? ' is-on' : ''}`}>
                <Link
                  href={`/l/${l.slug}`}
                  className="rail-index-link"
                  aria-current={aktif ? 'page' : undefined}
                >
                  <span className="rail-index-sayi">{siralanan(sayilar[l.id])}</span>
                  <span className="rail-index-metin">
                    <span className="rail-index-ad">{l.ad}</span>
                    {sampiyon && <span className="rail-index-sampiyon">{sampiyon.ad}</span>}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        <button type="button" className="rail-add" onClick={() => setFormAcik(true)}>
          {ArtiIkon}Yeni liste
        </button>
      </aside>

      <ListeEkleModal isOpen={formAcik} onClose={() => setFormAcik(false)} onCreated={load} />
    </>
  );
}
