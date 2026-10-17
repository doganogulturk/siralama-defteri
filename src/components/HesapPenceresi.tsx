'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import Sheet from './Sheet';
import { signOut } from '../lib/auth';
import { tumVerileriSil } from '../lib/items';
import { hataMetni } from '../lib/hata';

/** Silmeyi onaylamak için yazılacak kelime: yanlışlıkla iki dokunuşla silinmesin. */
const ONAY = 'SİL';

/**
 * "Hesabım": kim olarak giriş yapıldığı, gizlilik politikası, verileri silme ve çıkış.
 * Silme bu uygulamadaki her şeyi kaldırıyor (`tumVerileriSil`); giriş kaydı kalıyor,
 * gizlilik politikası nedenini ve onun nasıl silineceğini anlatıyor.
 */
export default function HesapPenceresi({ user, ad, onClose }: {
  user: User;
  ad: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [silmeAcik, setSilmeAcik] = useState(false);
  const [onay, setOnay] = useState('');
  const [siliniyor, setSiliniyor] = useState(false);

  const sil = async () => {
    if (onay.trim().toLocaleUpperCase('tr') !== ONAY || siliniyor) return;
    setSiliniyor(true);
    try {
      await tumVerileriSil();
      await signOut();   // AuthGate giriş ekranına dönüyor.
      router.replace('/');
    } catch (e: unknown) {
      alert('Veriler silinemedi: ' + hataMetni(e));
      setSiliniyor(false);
    }
  };

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

        <div className="hesap-islemler">
          <Link href="/gizlilik" className="btn-quiet" onClick={onClose}>Gizlilik politikası</Link>
          <button type="button" className="btn-quiet" onClick={() => { void signOut(); }}>Çıkış yap</button>
        </div>

        <section className="hesap-sil">
          {!silmeAcik ? (
            <button type="button" className="btn-danger" onClick={() => setSilmeAcik(true)}>
              Verilerimi sil
            </button>
          ) : (
            <>
              <p>
                Bütün listelerin, kayıtların, fotoğrafların ve paylaşım bağlantıların <strong>kalıcı
                olarak</strong> silinecek. Bu geri alınamaz. Onaylamak için <strong>{ONAY}</strong> yaz.
              </p>
              <input
                className="field-input"
                value={onay}
                onChange={(e) => setOnay(e.target.value)}
                aria-label={`Onay için ${ONAY} yaz`}
                autoComplete="off"
                autoCapitalize="characters"
                data-autofocus
              />
              <div className="hesap-islemler">
                <button type="button" className="btn-quiet" onClick={() => { setSilmeAcik(false); setOnay(''); }}>
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={sil}
                  disabled={onay.trim().toLocaleUpperCase('tr') !== ONAY || siliniyor}
                >
                  {siliniyor ? 'Siliniyor…' : 'Kalıcı olarak sil'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </Sheet>
  );
}
