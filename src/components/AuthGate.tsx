'use client';

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle, signOut } from '../lib/auth';
import { hataMetni } from '../lib/hata';

const CikisIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

/**
 * Oturumsuz kullanıcıya giriş ekranını, oturumlu kullanıcıya uygulamayı gösterir.
 * Sunucu tarafı koruma yok — koruma Supabase'deki RLS politikalarında.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <p className="state-msg">Yükleniyor…</p>;
  }

  if (!user) {
    const handleSignIn = async () => {
      setBusy(true);
      setError(null);
      try {
        await signInWithGoogle();   // Başarılıysa sayfa Google'a gider, dönüş beklenmez.
      } catch (e: unknown) {
        setError(hataMetni(e));
        setBusy(false);
      }
    };

    return (
      <div className="gate">
        <div className="gate-card">
          <span className="gate-mark">🏆</span>
          <h1 className="gate-title">Sıralama Defteri</h1>
          <p className="gate-sub">
            Denediğin her şeyi kendi listende sırala. Ayran, kola, döner, kahve —
            ne sıralamak istersen.
          </p>

          <dl className="gate-facts">
            <div><dt>Sürükle</dt><dd>kendi sıranı kur</dd></div>
            <div><dt>Grupla</dt><dd>kendi kategorilerin</dd></div>
            <div><dt>Biriktir</dt><dd>denemediklerin sırada</dd></div>
          </dl>

          <button type="button" className="gate-btn" onClick={handleSignIn} disabled={busy}>
            {busy ? 'Yönlendiriliyor…' : 'Google ile devam et'}
          </button>

          {error && <p className="gate-error">{error}</p>}
        </div>
      </div>
    );
  }

  // Google hesabının adı varsa onu, yoksa e-postanın kullanıcı adı kısmını göster.
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const ad = meta?.full_name ?? meta?.name ?? (user.email ?? '').split('@')[0] ?? 'Hesabım';

  return (
    <>
      {children}
      {/* Kimlik bir metin, çıkış ayrı bir düğme: bloğa dokunmak oturumu kapatmasın. */}
      <div className="account-btn">
        <span className="account-avatar" aria-hidden="true">
          {ad.charAt(0).toLocaleUpperCase('tr')}
        </span>
        <span className="account-text">
          <strong>{ad}</strong>
          {user.email && <em>{user.email}</em>}
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
    </>
  );
}
