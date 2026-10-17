import type { Metadata } from 'next';
import Link from 'next/link';
import Marka from '../../components/Marka';
import { KOR_LISTELERI } from '../../lib/kor';

export const metadata: Metadata = {
  title: 'Kör Sıralama',
  description: 'On kayıt birer birer gelir; her birini hemen bir sıraya koy, sonradan değiştiremezsin.',
};

/**
 * Kör Sıralama'nın liste seçimi. Oturum istemiyor (uygulama grubunun dışında):
 * giriş ekranından ve paylaşılan sonuçlardan doğrudan oynanabilsin.
 */
export default function KorListeleri() {
  return (
    <div className="kor-sayfa">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label="Sıralama Defteri ana sayfa">
          <Marka />
        </Link>
      </header>
      <main>
        <h1 className="paylasim-baslik">Kör Sıralama</h1>
        <p className="kor-sayfa-alt">
          On kayıt birer birer gelir. Her birini hemen bir sıraya koy — sonradan değiştiremezsin,
          sıradakini de bilemezsin.
        </p>
        <ul className="kor-secim">
          {KOR_LISTELERI.map((l, i) => (
            <li key={l.slug} style={{ '--kor': l.renk, '--i': i } as React.CSSProperties}>
              <Link href={`/kor/${l.slug}`} className="kor-secim-kart">
                <span aria-hidden="true">{l.simge}</span>
                <strong>{l.ad}</strong>
                <em>{l.kayitlar.length} kayıt</em>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
