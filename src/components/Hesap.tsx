'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import HesapPenceresi from './HesapPenceresi';
import { dilEtiketi, messages } from '../lib/i18n';

/** Google hesabının adı varsa o, yoksa e-postanın kullanıcı adı kısmı; ve profil fotoğrafı. */
export function hesapBilgisi(user: User): { ad: string; foto?: string } {
  const meta = user.user_metadata as
    { full_name?: string; name?: string; avatar_url?: string; picture?: string } | undefined;
  return {
    ad: meta?.full_name ?? meta?.name ?? (user.email ?? '').split('@')[0] ?? messages().hesap.hesabim,
    foto: meta?.avatar_url ?? meta?.picture,
  };
}

/**
 * Hesap bloğu: Google fotoğrafı (masaüstü rayında yanında ad). Dokununca "Hesabım"
 * açılıyor: e-posta, gizlilik, çıkış, verileri silme. Sıralama ekranlarında `AuthGate`
 * rayın dibine, ana ekranda üst çubuğun sağına çiziyor — yerleşim `className`den.
 */
export default function Hesap({ user, className }: { user: User; className: string }) {
  /** Google fotoğrafı yüklenemezse baş harfe dönülüyor. */
  const [fotoBozuk, setFotoBozuk] = useState(false);
  const [pencere, setPencere] = useState(false);

  const { ad, foto } = hesapBilgisi(user);

  return (
    // Çıkış burada değil, "Hesabım"ın içinde: yanlışlıkla dokunup oturumu kapatmak kolaydı.
    <div className={className}>
      <button type="button" className="account-ac" onClick={() => setPencere(true)} aria-label={messages().hesap.hesabim}>
        <span className="account-avatar" aria-hidden="true">
          {foto && !fotoBozuk
            // Google fotoğrafları yönlendiren sayfa bilgisi gidince 403 verebiliyor.
            ? <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFotoBozuk(true)} />
            : ad.charAt(0).toLocaleUpperCase(dilEtiketi())}
        </span>
        <span className="account-text">
          <strong>{ad}</strong>
        </span>
      </button>
      {pencere && <HesapPenceresi user={user} ad={ad} onClose={() => setPencere(false)} />}
    </div>
  );
}
