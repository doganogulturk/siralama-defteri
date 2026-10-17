'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { signOut } from '../lib/auth';
import HesapPenceresi from './HesapPenceresi';

const CikisIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

/** Google hesabının adı varsa o, yoksa e-postanın kullanıcı adı kısmı; ve profil fotoğrafı. */
export function hesapBilgisi(user: User): { ad: string; foto?: string } {
  const meta = user.user_metadata as
    { full_name?: string; name?: string; avatar_url?: string; picture?: string } | undefined;
  return {
    ad: meta?.full_name ?? meta?.name ?? (user.email ?? '').split('@')[0] ?? 'Hesabım',
    foto: meta?.avatar_url ?? meta?.picture,
  };
}

/**
 * Hesap bloğu: Google fotoğrafı, ad ve çıkış. Sıralama ekranlarında `AuthGate`
 * rayın dibine, ana ekranda sayfa başlığın sağına çiziyor — yerleşim `className`den.
 */
export default function Hesap({ user, className }: { user: User; className: string }) {
  /** Google fotoğrafı yüklenemezse baş harfe dönülüyor. */
  const [fotoBozuk, setFotoBozuk] = useState(false);
  const [pencere, setPencere] = useState(false);

  const { ad, foto } = hesapBilgisi(user);

  return (
    // Kimlik "Hesabım"ı açan düğme, çıkış ayrı bir düğme: bloğa dokunmak oturumu kapatmasın.
    <div className={className}>
      {/* Fotoğraf ve ad "Hesabım"ı açıyor: gizlilik, verileri silme. */}
      <button type="button" className="account-ac" onClick={() => setPencere(true)} aria-label="Hesabım">
        <span className="account-avatar" aria-hidden="true">
          {foto && !fotoBozuk
            // Google fotoğrafları yönlendiren sayfa bilgisi gidince 403 verebiliyor.
            ? <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFotoBozuk(true)} />
            : ad.charAt(0).toLocaleUpperCase('tr')}
        </span>
        <span className="account-text">
          <strong>{ad}</strong>
        </span>
      </button>
      <button
        type="button"
        className="account-out"
        onClick={() => { void signOut(); }}
        aria-label="Çıkış yap"
        title="Çıkış yap"
      >
        {CikisIkon}
      </button>
      {pencere && <HesapPenceresi user={user} ad={ad} onClose={() => setPencere(false)} />}
    </div>
  );
}
