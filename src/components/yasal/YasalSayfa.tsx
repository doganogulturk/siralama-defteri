import Link from 'next/link';
import Marka from '../Marka';
import { ILETISIM_EPOSTA, YASAL_SAYFALAR } from '../../lib/iletisim';

export const Eposta = () => <a href={`mailto:${ILETISIM_EPOSTA}`}>{ILETISIM_EPOSTA}</a>;

/**
 * Gizlilik, KVKK, kullanım koşulları ve hesap silme sayfalarının ortak iskeleti.
 * Oturum istemiyor: giriş ekranından, Google'ın OAuth doğrulamasından ve mağaza
 * kayıtlarından da açılabilsin diye uygulama grubunun dışında.
 */
export default function YasalSayfa({ baslik, tarih, children }: {
  baslik: string;
  /** Gizlilik, KVKK ve koşullarda; yalnızca nasıl yapılır anlatan sayfada (hesap silme) yok. */
  tarih?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="metin-sayfa">
      <header className="paylasim-bar metin-bar">
        <Link href="/" className="paylasim-marka" aria-label="Sıralama Defteri ana sayfa">
          <Marka />
        </Link>
        <Link href="/" className="metin-don">← Uygulamaya dön</Link>
      </header>

      <main>
        <h1 className="paylasim-baslik">{baslik}</h1>
        {tarih && <p className="metin-tarih">Son güncelleme: {tarih}</p>}
        <article className="metin">{children}</article>
      </main>

      <nav className="metin-gezinme" aria-label="Yasal sayfalar">
        {YASAL_SAYFALAR.map(s => <Link key={s.href} href={s.href}>{s.ad}</Link>)}
      </nav>
    </div>
  );
}
