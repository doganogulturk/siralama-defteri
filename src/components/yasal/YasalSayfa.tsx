'use client';

import Link from 'next/link';
import Marka from '../Marka';
import DilSecici from '../DilSecici';
import { ILETISIM_EPOSTA, yasalSayfalar } from '../../lib/iletisim';
import { diliSec, messages } from '../../lib/i18n';
import { useDil } from '../../lib/i18n/useDil';

export const Eposta = () => <a href={`mailto:${ILETISIM_EPOSTA}`}>{ILETISIM_EPOSTA}</a>;

/** Bir dildeki sayfa: başlık, görünen son güncelleme tarihi ve metin. */
export interface YasalSurum {
  baslik: string;
  /** Gizlilik, KVKK ve koşullarda; yalnızca nasıl yapılır anlatan sayfada (hesap silme) yok. */
  tarih?: string;
  govde: React.ReactNode;
  /** Bilgi amaçlı çeviri (KVKK): üstte esas metnin Türkçe olduğunu söyleyen not ve Türkçeye geçiş. */
  bilgiAmacli?: boolean;
}

/**
 * Gizlilik, KVKK, kullanım koşulları ve hesap silme sayfalarının ortak iskeleti. Oturum istemiyor:
 * giriş ekranından, Google'ın OAuth doğrulamasından ve mağaza kayıtlarından da açılabilsin diye
 * uygulama grubunun dışında. Metin arayüz dilinde gösteriliyor; iki dilin metni de sayfanın kendisinde.
 */
export default function YasalSayfa({ tr, en }: { tr: YasalSurum; en: YasalSurum }) {
  const dil = useDil();
  const sayfa = dil === 'en' ? en : tr;
  const m = messages().yasal;
  return (
    <div className="metin-sayfa">
      <header className="paylasim-bar metin-bar">
        <Link href="/" className="paylasim-marka" aria-label={m.markaAnaSayfa}>
          <Marka />
        </Link>
        <DilSecici className="metin-dil" kisa />
        <Link href="/" className="metin-don">{m.uygulamayaDon}</Link>
      </header>

      <main>
        <h1 className="paylasim-baslik">{sayfa.baslik}</h1>
        {sayfa.tarih && <p className="metin-tarih">{m.sonGuncelleme(sayfa.tarih)}</p>}
        {sayfa.bilgiAmacli && (
          <p className="metin-ceviri">
            {m.ceviriNotu}{' '}
            <button type="button" className="metin-ceviri-don" onClick={() => diliSec('tr')}>{m.turkceOku}</button>
          </p>
        )}
        <article className="metin">{sayfa.govde}</article>
      </main>

      <nav className="metin-gezinme" aria-label={messages().hesap.yasalSayfalar}>
        {yasalSayfalar().map(s => <Link key={s.href} href={s.href}>{s.ad}</Link>)}
      </nav>
    </div>
  );
}
