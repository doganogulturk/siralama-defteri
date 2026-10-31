'use client';

import React from 'react';
import Link from 'next/link';
import Marka from './Marka';
import MobilMenu from './MobilMenu';
import { korListeleri } from '../lib/kor';
import { SAYILAR_RENK } from '../lib/sayilar';
import { messages } from '../lib/i18n';

/** Kör Sıralama'nın liste seçimi; sayfa statik, metinler arayüz dilinde istemcide çiziliyor. */
export default function KorSecim() {
  const t = messages().kor;
  const sayi = messages().sayilar;
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
          {/* Sayılar: doğru cevabı olan günlük oyun; satırı boydan boya kaplayan ilk kart. */}
          <li className="is-sayilar" style={{ '--kor': SAYILAR_RENK, '--i': 0 } as React.CSSProperties}>
            <Link href="/kor/sayilar" className="kor-secim-kart">
              <span aria-hidden="true">🔢</span>
              <strong>{sayi.ad}</strong>
              <em>{sayi.kartAlt}</em>
            </Link>
          </li>
          {korListeleri().map((l, i) => (
            <li key={l.slug} style={{ '--kor': l.renk, '--i': i + 1 } as React.CSSProperties}>
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
