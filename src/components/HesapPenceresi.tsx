'use client';

import React from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import Sheet from './Sheet';
import { signOut } from '../lib/auth';
import { YASAL_SAYFALAR } from '../lib/iletisim';

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
  return (
    <Sheet onClose={onClose} className="form-screen-short" label="Hesabım">
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={onClose} aria-label="Kapat">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 className="form-screen-title">Hesabım</h2>
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
            aria-label="Çıkış yap"
            title="Çıkış yap"
          >
            {CikisIkon}
          </button>
        </div>

        <nav className="hesap-yasal" aria-label="Yasal sayfalar">
          {YASAL_SAYFALAR.map(s => (
            <Link key={s.href} href={s.href} onClick={onClose}>{s.ad}</Link>
          ))}
        </nav>
      </div>
    </Sheet>
  );
}
