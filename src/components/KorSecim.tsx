'use client';

import React from 'react';
import Link from 'next/link';
import Marka from './Marka';
import MobilMenu from './MobilMenu';
import { korListeleri } from '../lib/kor';
import { messages } from '../lib/i18n';

/** Kör Sıralama'nın liste seçimi; sayfa statik, metinler arayüz dilinde istemcide çiziliyor. */
export default function KorSecim() {
  const t = messages().kor;
  return (
    <div className="kor-sayfa">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label={t.anaSayfa}>
          <Marka />
        </Link>
      </header>
      <main>
        <h1 className="paylasim-baslik">{t.ad}</h1>
        <p className="kor-sayfa-alt">{t.sayfaAlt}</p>
        <ul className="kor-secim">
          {korListeleri().map((l, i) => (
            <li key={l.slug} style={{ '--kor': l.renk, '--i': i } as React.CSSProperties}>
              <Link href={`/kor/${l.slug}`} className="kor-secim-kart">
                <span aria-hidden="true">{l.simge}</span>
                <strong>{l.ad}</strong>
                <em>{t.kayitAdet(l.kayitlar.length)}</em>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <MobilMenu aktif="kor" />
    </div>
  );
}
