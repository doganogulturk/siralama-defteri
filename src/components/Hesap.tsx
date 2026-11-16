'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { dilEtiketi, messages } from '@/lib/i18n';

/** Google hesabının adı varsa o, yoksa e-postanın kullanıcı adı kısmı; ve profil fotoğrafı. */
export function hesapBilgisi(user: User): { ad: string; foto?: string } {
  const meta = user.user_metadata as
    { full_name?: string; name?: string; avatar_url?: string; picture?: string } | undefined;
  return {
    ad: meta?.full_name ?? meta?.name ?? (user.email ?? '').split('@')[0] ?? messages().hesap.hesabim,
    foto: meta?.avatar_url ?? meta?.picture,
  };
}

/** Profil fotoğrafı; Google fotoğrafı yüklenemezse adın baş harfi. Boyutu `className`den. */
export function Avatar({ ad, foto, className = '' }: { ad: string; foto?: string; className?: string }) {
  const [fotoBozuk, setFotoBozuk] = useState(false);
  return (
    <span className={`account-avatar ${className}`} aria-hidden="true">
      {foto && !fotoBozuk
        // Google fotoğrafları yönlendiren sayfa bilgisi gidince 403 verebiliyor.
        ? <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFotoBozuk(true)} />
        : ad.charAt(0).toLocaleUpperCase(dilEtiketi())}
    </span>
  );
}

/**
 * Hesap bloğu: Google fotoğrafı (masaüstü rayında yanında ad). Dokununca Profil sayfası
 * (`/profil`): kim olarak giriş yapıldığı, dil, Hakkında, yasal sayfalar ve çıkış. Sıralama
 * ekranlarında `AuthGate` rayın dibine, ana ekranda üst çubuğun sağına çiziyor — yerleşim `className`den.
 */
export default function Hesap({ user, className }: { user: User; className: string }) {
  const { ad, foto } = hesapBilgisi(user);
  const m = messages();

  return (
    // Çıkış burada değil, Profil'de: yanlışlıkla dokunup oturumu kapatmak kolaydı.
    <div className={className}>
      <Link href="/profil" className="account-ac" aria-label={m.profil.baslik}>
        <Avatar ad={ad} foto={foto} />
        <span className="account-text">
          <strong>{ad}</strong>
        </span>
      </Link>
    </div>
  );
}
