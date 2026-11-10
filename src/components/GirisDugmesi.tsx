'use client';

import React, { useState } from 'react';
import { appleGirisAcik, girisYap as yonlendir, type GirisSaglayici } from '@/lib/auth';
import { MOBIL } from '@/lib/site';
import { hataMetni } from '@/lib/hata';
import { useMesajlar } from '@/lib/i18n/DilBaglami';

const GoogleIkon = (
  <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const AppleIkon = (
  <svg width="17" height="20" viewBox="0 0 17 20" aria-hidden="true">
    <path fill="currentColor" d="M14.2 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2.1-.9-3.4-.9C3.6 4.8 2 5.8 1.1 7.4c-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.8-.8 3.4-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.9-1.1-2.9-4.4zM11.6 3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.5-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.4z" />
  </svg>
);

/**
 * "Google ile devam et" ve (açıksa) "Apple ile devam et": ana sayfadaki Oyna'nın çağrısında,
 * tanıtımda ve `/tanitim`'de. Başarılıysa sayfa sağlayıcıya gidiyor, dönüş beklenmiyor; hata
 * altında yazıyor. Apple düğmesi Apple'ın kuralıyla siyah zemin, beyaz logo ve Google'ınkiyle
 * aynı boyda.
 */
export default function GirisDugmesi() {
  const m = useMesajlar();
  const [busy, setBusy] = useState<GirisSaglayici | null>(null);
  const [error, setError] = useState<string | null>(null);

  const girisYap = async (saglayici: GirisSaglayici) => {
    setBusy(saglayici);
    setError(null);
    try {
      await yonlendir(saglayici);
      // Uygulamada sayfa değişmiyor: giriş penceresi kapanınca (vazgeçilse de) düğme geri gelsin.
      if (MOBIL) setBusy(null);
    } catch (e: unknown) {
      setError(hataMetni(e));
      setBusy(null);
    }
  };

  return (
    <div className="giris-dugmeleri">
      <button type="button" className="gate-btn" onClick={() => girisYap('google')} disabled={!!busy}>
        <span className="gate-g" aria-hidden="true">{GoogleIkon}</span>
        {busy === 'google' ? m.giris.yonlendiriliyor : m.giris.googleIle}
      </button>
      {appleGirisAcik && (
        <button type="button" className="gate-btn is-apple" onClick={() => girisYap('apple')} disabled={!!busy}>
          <span className="gate-apple" aria-hidden="true">{AppleIkon}</span>
          {busy === 'apple' ? m.giris.yonlendiriliyor : m.giris.appleIle}
        </button>
      )}
      {error && <p className="gate-error">{error}</p>}
    </div>
  );
}
