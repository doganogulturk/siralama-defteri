'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle, signOut } from '../lib/auth';
import { hataMetni } from '../lib/hata';

const CikisIkon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const GoogleIkon = (
  <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/** Giriş destesinde sırayla öne geçen örnek listeler — her biri başka bir şey. */
const DESTE = [
  { ad: 'Kola', renk: '#e03c10' },
  { ad: 'Türk kahvesi', renk: '#6b4fbb' },
  { ad: 'Döner', renk: '#127a5b' },
  { ad: 'Baklava', renk: '#b45309' },
  { ad: 'Çay', renk: '#1f6feb' },
  { ad: 'Lahmacun', renk: '#c2436f' },
];
const DESTE_ARALIK_MS = 2800;

/**
 * Kartın destedeki yeri. Görünen üç yuva ön, sağ ve sol; `cikis` az önce öne
 * çıkıp savrulan kart, `bekle` sırasını bekleyenler. Konumları CSS çiziyor,
 * yuva değişince kart transform geçişiyle yeni yerine kayıyor.
 */
type Yuva = '1' | '2' | '3' | 'cikis' | 'bekle';

const yuvaBul = (i: number, adim: number): Yuva => {
  const n = DESTE.length;
  const fark = (((i - adim) % n) + n) % n;
  if (fark < 3) return String(fark + 1) as Yuva;
  return fark === n - 1 ? 'cikis' : 'bekle';
};

/** Kartın üstündeki sıra: savrulan kart 1 olarak gider, bekleyen 3 olarak gelir. */
const YUVA_SIRASI: Record<Yuva, string> = { '1': '1', '2': '2', '3': '3', cikis: '1', bekle: '3' };

function GirisDestesi() {
  const [adim, setAdim] = useState(0);

  useEffect(() => {
    // Hareketi azaltmak isteyen cihazda deste durağan kalıyor.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setAdim(a => a + 1), DESTE_ARALIK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="gate-deste" aria-hidden="true">
      {DESTE.map((kart, i) => {
        const yuva = yuvaBul(i, adim);
        return (
          <span
            key={kart.ad}
            className="gate-kart"
            data-yuva={yuva}
            style={{ '--k': kart.renk } as React.CSSProperties}
          >
            <i>{YUVA_SIRASI[yuva]}</i><b>{kart.ad}</b>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Oturumsuz kullanıcıya giriş ekranını, oturumlu kullanıcıya uygulamayı gösterir.
 * Sunucu tarafı koruma yok — koruma Supabase'deki RLS politikalarında.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Google fotoğrafı yüklenemezse baş harfe dönülüyor. */
  const [fotoBozuk, setFotoBozuk] = useState(false);

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
          <GirisDestesi />

          <h1 className="gate-title">Neyi seviyorsan, sırala.</h1>
          <p className="gate-sub">
            Koladan kahveye kendi listelerini kur. Denediklerini sürükleyerek diz,
            denemediklerini kenara yaz.
          </p>

          <button type="button" className="gate-btn" onClick={handleSignIn} disabled={busy}>
            <span className="gate-g" aria-hidden="true">{GoogleIkon}</span>
            {busy ? 'Yönlendiriliyor…' : 'Google ile devam et'}
          </button>

          {error && <p className="gate-error">{error}</p>}
        </div>
      </div>
    );
  }

  // Google hesabının adı varsa onu, yoksa e-postanın kullanıcı adı kısmını göster.
  const meta = user.user_metadata as
    { full_name?: string; name?: string; avatar_url?: string; picture?: string } | undefined;
  const ad = meta?.full_name ?? meta?.name ?? (user.email ?? '').split('@')[0] ?? 'Hesabım';
  const foto = meta?.avatar_url ?? meta?.picture;

  return (
    <>
      {children}
      {/* Kimlik bir metin, çıkış ayrı bir düğme: bloğa dokunmak oturumu kapatmasın. */}
      <div className="account-btn">
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
    </>
  );
}
