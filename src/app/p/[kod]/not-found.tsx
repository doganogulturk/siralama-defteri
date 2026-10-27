'use client';

import Link from 'next/link';
import Marka from '../../../components/Marka';
import { messages } from '../../../lib/i18n';

/** Kod yanlış ya da sahibi paylaşımı kapatmış / bağlantıyı yenilemiş. */
export default function PaylasimYok() {
  const p = messages().paylasimSayfasi;
  return (
    <div className="paylasim">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label={p.markaAnaSayfa}>
          <Marka />
        </Link>
      </header>
      <main className="state-empty">
        <p className="state-empty-title">{p.yokBaslik}</p>
        <p>{p.yokMetin}</p>
      </main>
    </div>
  );
}
