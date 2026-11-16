'use client';

import Link from 'next/link';
import Marka from '@/components/Marka';
import DilSecici from '@/components/DilSecici';
import { useMesajlar } from '@/lib/i18n/DilBaglami';

/**
 * Metin sayfalarının üst çubuğu: solda marka (ana sayfaya), sağda "← Uygulamaya dön". Yasal sayfalar oturumsuz
 * da açılıyor (Google doğrulaması, mağaza kayıtları), o yüzden dil seçiciyi taşıyor (`dilSecici`); Profil'de dil
 * sayfanın içinde, Hakkında'da yok.
 */
export default function MetinCubugu({ dilSecici = false }: { dilSecici?: boolean }) {
  const m = useMesajlar().yasal;
  return (
    <header className="paylasim-bar metin-bar">
      <Link href="/" className="paylasim-marka" aria-label={m.markaAnaSayfa}>
        <Marka />
      </Link>
      {dilSecici && <DilSecici className="metin-dil" kisa />}
      <Link href="/" className="metin-don">{m.uygulamayaDon}</Link>
    </header>
  );
}
