'use client';

import Link from 'next/link';
import MetinCubugu from '@/components/MetinCubugu';
import { Eposta } from '@/components/yasal/YasalSayfa';
import { VERI_SORUMLUSU, yasalSayfalar } from '@/lib/iletisim';
import { GUNCEL_SURUM, SURUMLER } from '@/lib/surumler';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';

/**
 * Hakkında: simge, ad ve sürüm; uygulamayı kimin geliştirdiği, iletişim ve sürüm geçmişi (`lib/surumler.ts`).
 * Oturum istemiyor; yasal sayfalar gibi uygulama grubunun dışında. Dil seçimi yalnızca Profil'de.
 */
export default function Hakkinda() {
  const dil = useDilim();
  const mesajlar = useMesajlar();
  const m = mesajlar.hakkinda;
  return (
    <div className="metin-sayfa hakkinda">
      <MetinCubugu />

      <main>
        <header className="hakkinda-bas">
          <svg className="hakkinda-simge" viewBox="0 0 32 32" width="72" height="72" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="var(--ink)" />
            <rect x="6" y="7.5" width="20" height="4.5" rx="2.25" fill="var(--accent)" />
            <rect x="6" y="13.75" width="14.5" height="4.5" rx="2.25" fill="var(--bg)" />
            <rect x="6" y="20" width="9" height="4.5" rx="2.25" fill="var(--bg)" />
          </svg>
          <h1>{mesajlar.marka}</h1>
          <p className="hakkinda-surum">{m.surum(GUNCEL_SURUM)}</p>
        </header>

        <article className="metin">
          <p><strong>{m.gelistiren(VERI_SORUMLUSU)}</strong></p>
          <p>{m.tanim}</p>
          <p>{m.iletisim} <Eposta /></p>
        </article>

        <h2>{m.surumGecmisi}</h2>
        <ol className="surumler">
          {SURUMLER.map(s => (
            <li key={s.surum} className="surum">
              <div className="surum-bas">
                <strong>{s.surum}</strong>
                <span>{s.tarih[dil]}</span>
              </div>
              <ul>
                {s.maddeler[dil].map(madde => <li key={madde}>{madde}</li>)}
              </ul>
            </li>
          ))}
        </ol>
      </main>

      <nav className="metin-gezinme" aria-label={mesajlar.hesap.yasalSayfalar}>
        {yasalSayfalar(dil).map(s => <Link key={s.href} href={s.href}>{s.ad}</Link>)}
      </nav>
    </div>
  );
}
