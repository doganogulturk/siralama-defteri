'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { GIRIS_SONRASI, appleJetonunuIzle } from '@/lib/auth';
import Hesap from './Hesap';
import Tanitim from './Tanitim';
import GirisDugmesi from './GirisDugmesi';
import OynaMerkezi from './oyna/OynaMerkezi';
import { useMesajlar } from '@/lib/i18n/DilBaglami';

/**
 * Oturumsuz kullanıcıya ana sayfada oyunları (Oyna), uygulamanın başka sayfalarında tanıtımı
 * ve girişi; oturumlu kullanıcıya uygulamayı gösterir.
 * Sunucu tarafı koruma yok — koruma Supabase'deki RLS politikalarında.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const m = useMesajlar();
  const router = useRouter();
  const yol = usePathname();

  // Apple ile girişin ardından Apple jetonunu sakla (hesap silmede iptal için).
  useEffect(() => appleJetonunuIzle(), []);

  // Girişten dönüldü: kişi giriş ekranını hangi sayfada gördüyse oraya.
  useEffect(() => {
    if (!user) return;
    let donus: string | null = null;
    try {
      donus = sessionStorage.getItem(GIRIS_SONRASI);
      sessionStorage.removeItem(GIRIS_SONRASI);
    } catch { /* depolama kapalı */ }
    // Yalnızca site içi yol: "//başka.site" gibi bir değer dışarı yönlendirmesin.
    if (donus && donus.startsWith('/') && !donus.startsWith('//') && donus !== window.location.pathname) {
      router.replace(donus);
    }
  }, [user, router]);

  if (loading) {
    return <p className="state-msg">{m.genel.yukleniyor}</p>;
  }

  if (!user) {
    // Ana sayfada oyunlar (giriş istemiyorlar) ve kendi defterini kurma çağrısı; uygulamanın
    // başka bir sayfasında (bir liste bağlantısı) tanıtım ve giriş.
    if (yol === '/') return <OynaMerkezi misafir={<GirisDugmesi />} />;
    return <Tanitim girisDugmesi={<GirisDugmesi />} />;
  }

  return (
    <>
      {children}
      {/* Ana ekran hesabı kendi başlığında çiziyor; CSS bu bloğu orada gizliyor. */}
      <Hesap user={user} className="account-btn" />
    </>
  );
}
