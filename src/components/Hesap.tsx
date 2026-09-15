'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { signOut } from '../lib/auth';

const CikisIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

/**
 * Hesap bloğu: Google fotoğrafı, ad ve çıkış. Sıralama ekranlarında `AuthGate`
 * rayın dibine, ana ekranda sayfa başlığın sağına çiziyor — yerleşim `className`den.
 */
export default function Hesap({ user, className }: { user: User; className: string }) {
  /** Google fotoğrafı yüklenemezse baş harfe dönülüyor. */
  const [fotoBozuk, setFotoBozuk] = useState(false);

  // Google hesabının adı varsa onu, yoksa e-postanın kullanıcı adı kısmını göster.
  const meta = user.user_metadata as
    { full_name?: string; name?: string; avatar_url?: string; picture?: string } | undefined;
  const ad = meta?.full_name ?? meta?.name ?? (user.email ?? '').split('@')[0] ?? 'Hesabım';
  const foto = meta?.avatar_url ?? meta?.picture;

  return (
    // Kimlik bir metin, çıkış ayrı bir düğme: bloğa dokunmak oturumu kapatmasın.
    <div className={className}>
      <span className="account-avatar" aria-hidden="true">
        {foto && !fotoBozuk
          // Google fotoğrafları yönlendiren sayfa bilgisi gidince 403 verebiliyor.
          ? <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFotoBozuk(true)} />
          : ad.charAt(0).toLocaleUpperCase('tr')}
      </span>
      <span className="account-text">
        <strong>{ad}</strong>
      </span>
      <button
        type="button"
        className="account-out"
        onClick={() => { void signOut(); }}
        aria-label="Çıkış yap"
        title="Çıkış yap"
      >
        {CikisIkon}
      </button>
    </div>
  );
}
