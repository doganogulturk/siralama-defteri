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
 * Ayar simgesi: üç çizgi ve tutamakları. Dişli yerine sürgü, çünkü sekme
 * simgesi de (`app/icon.svg`) üç çizgiden kurulu — aynı sözlük.
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
  /** Açık listenin ayar simgesi: sayfa kendi ayarlar popup'ını açar. */
  onAyarlar?: () => void;
}

/**
 * Masaüstü sol rayı: künye, liste indeksi ve yeni liste düğmesi.
 *
 * Her satır iki hedef taşıyor: sayı + ad listeyi açar, sağdaki simge o listenin
 * ayarlarını. Açık listede simge popup'ı yerinde açıyor; başka bir listede o
 * listeye `?ayarlar=1` ile gidiyor, popup orada açık doğuyor. İç içe bağlantı
 * olmaması için satır bir sarmalayıcı.
 */
export default function ListeRayi({ aktifSlug, onAyarlar }: ListeRayiProps) {
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
            const ayarEtiketi = `${l.ad} listesinin ayarları`;
            return (
              <div key={l.id} className={`rail-index-item${aktif ? ' is-on' : ''}`}>
                <Link
                  href={`/l/${l.slug}`}
                  className="rail-index-link"
                  aria-current={aktif ? 'page' : undefined}
                >
                  <span className="rail-index-sayi">{siralanan(sayilar[l.id])}</span>
                  <span className="rail-index-ad">{l.ad}</span>
                </Link>
                {aktif && onAyarlar ? (
                  <button type="button" className="rail-index-ayar" onClick={onAyarlar} aria-label={ayarEtiketi}>
                    {AyarIkon}
                  </button>
                ) : (
                  <Link href={`/l/${l.slug}?ayarlar=1`} className="rail-index-ayar" aria-label={ayarEtiketi}>
                    {AyarIkon}
                  </Link>
                )}
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
