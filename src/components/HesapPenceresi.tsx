'use client';

import React from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import Sheet from './Sheet';
import { signOut } from '../lib/auth';
import { yasalSayfalar } from '../lib/iletisim';
import { messages } from '../lib/i18n';
import DilSecici from './DilSecici';

const CikisIkon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

/**
 * "Hesabım": kim olarak giriş yapıldığı, çıkış ve yasal sayfalar. Verileri silme
 * burada değil, Hesap Silme sayfasının en altında (`VeriSilmePaneli`): menüde
 * görünmesi insanı silmeye yöneltirdi; oraya buradaki "Hesap silme" bağlantısı gidiyor.
 */
export default function HesapPenceresi({ user, ad, onClose }: {
  user: User;
  ad: string;
  onClose: () => void;
}) {
  const m = messages();
  return (
    <Sheet onClose={onClose} className="form-screen-short" label={m.hesap.hesabim}>
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={onClose} aria-label={m.genel.kapat}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 className="form-screen-title">{m.hesap.hesabim}</h2>
        <span className="form-screen-header-spacer" />
      </header>

      <div className="form-screen-body hesap-pencere">
        <div className="hesap-ust">
          <p className="hesap-kim">
            <strong>{ad}</strong>
            {user.email && <span>{user.email}</span>}
          </p>
          <button
            type="button"
            className="hesap-cikis"
            onClick={() => { void signOut(); }}
            aria-label={m.hesap.cikis}
            title={m.hesap.cikis}
          >
            {CikisIkon}
          </button>
        </div>

        <DilSecici className="hesap-dil" />

        <nav className="hesap-yasal" aria-label={m.hesap.yasalSayfalar}>
          {yasalSayfalar().map(s => (
            <Link key={s.href} href={s.href} onClick={onClose}>{s.ad}</Link>
          ))}
        </nav>
      </div>
    </Sheet>
  );
}
