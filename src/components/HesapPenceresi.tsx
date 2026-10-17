'use client';

import React from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import Sheet from './Sheet';
import { signOut } from '../lib/auth';
import { YASAL_SAYFALAR } from '../lib/iletisim';

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
        <p className="hesap-kim">
          <strong>{ad}</strong>
          {user.email && <span>{user.email}</span>}
        </p>

        <button type="button" className="btn-quiet hesap-cikis" onClick={() => { void signOut(); }}>
          Çıkış yap
        </button>

        <nav className="hesap-yasal" aria-label="Yasal sayfalar">
          {YASAL_SAYFALAR.map(s => (
            <Link key={s.href} href={s.href} onClick={onClose}>{s.ad}</Link>
          ))}
        </nav>
      </div>
    </Sheet>
  );
}
