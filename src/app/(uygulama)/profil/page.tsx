'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MetinCubugu from '@/components/MetinCubugu';
import DilSecici from '@/components/DilSecici';
import TemaSecici from '@/components/TemaSecici';
import { Avatar, hesapBilgisi } from '@/components/Hesap';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { yasalSayfalar } from '@/lib/iletisim';
import { GUNCEL_SURUM } from '@/lib/surumler';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';

const Ok = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/**
 * Profil: kim olarak giriş yapıldığı, dil ve tema seçimi, Hakkında ve tanıtım, yasal sayfalar ve çıkış. Profil
 * fotoğrafı (`Hesap`) buraya getiriyor. Oturum istiyor (uygulama grubunda); `AuthGate` burada hesap
 * bloğunu çizmiyor, sayfa kendisi gösteriyor. Verileri silme burada değil, Hesap Silme sayfasının en
 * altında: menüde görünmesi insanı silmeye yöneltirdi.
 */
export default function ProfilSayfasi() {
  const { user } = useAuth();
  const router = useRouter();
  const dil = useDilim();
  const mesajlar = useMesajlar();
  const m = mesajlar.profil;
  if (!user) return null;
  const { ad, foto } = hesapBilgisi(user);

  const cikisYap = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <div className="metin-sayfa profil">
      <MetinCubugu />

      <main>
        <h1 className="paylasim-baslik">{m.baslik}</h1>

        <section className="profil-kim">
          <Avatar ad={ad} foto={foto} className="profil-avatar" />
          <p>
            <strong>{ad}</strong>
            {user.email && <span>{user.email}</span>}
          </p>
        </section>

        <section className="profil-bolum" aria-labelledby="profil-dil">
          <div>
            <h2 id="profil-dil">{m.dil}</h2>
            <p>{m.dilAlt}</p>
          </div>
          <DilSecici />
        </section>

        <section className="profil-bolum profil-bolum-bitisik" aria-labelledby="profil-tema">
          <div>
            <h2 id="profil-tema">{m.tema}</h2>
            <p>{m.temaAlt}</p>
          </div>
          <TemaSecici />
        </section>

        <nav className="profil-satirlar">
          <Link href="/hakkinda" className="profil-satir">
            <span>
              <strong>{m.hakkinda}</strong>
              <small>{m.hakkindaAlt(GUNCEL_SURUM)}</small>
            </span>
            {Ok}
          </Link>
          <Link href="/tanitim" className="profil-satir">
            <span>
              <strong>{m.nasil}</strong>
              <small>{m.nasilAlt}</small>
            </span>
            {Ok}
          </Link>
        </nav>

        <button type="button" className="profil-cikis" onClick={() => { void cikisYap(); }}>
          {mesajlar.hesap.cikis}
        </button>
      </main>

      <nav className="metin-gezinme" aria-label={mesajlar.hesap.yasalSayfalar}>
        {yasalSayfalar(dil).map(s => <Link key={s.href} href={s.href}>{s.ad}</Link>)}
      </nav>
    </div>
  );
}
