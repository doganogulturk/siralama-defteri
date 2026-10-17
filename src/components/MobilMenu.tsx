'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { listeleriTazele } from '../hooks/useListeler';
import { hesapBilgisi } from './Hesap';
import HesapPenceresi from './HesapPenceresi';
import ListeEkleModal from './ListeEkleModal';

const ListelerIkon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h16M4 12h11M4 18h6" />
  </svg>
);

const KorIkon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const ArtiIkon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * Telefonda üst düzey ekranların alt menüsü (ana ekran ve Kör Sıralama'nın liste
 * seçimi): Listelerim · Yeni liste · Kör Sıralama · Profil. Masaüstünde gizli (CSS);
 * orada aynı işler üst çubukta ve rayda. Bir listenin içinde ve oyun sırasında yok:
 * alt kısım oralarda "Kayıt ekle"ye ve on yuvaya ait.
 *
 * Kendi yeni liste formunu ve "Hesabım"ını taşıyor ki her sayfada aynı çalışsın;
 * oturum yoksa (Kör Sıralama girişsiz oynanabiliyor) hiç çizilmiyor.
 */
export default function MobilMenu({ aktif }: { aktif: 'listeler' | 'kor' }) {
  const { user } = useAuth();
  const [formAcik, setFormAcik] = useState(false);
  const [hesapAcik, setHesapAcik] = useState(false);
  const [fotoBozuk, setFotoBozuk] = useState(false);
  if (!user) return null;
  const { ad, foto } = hesapBilgisi(user);

  return (
    <>
      <nav className="mobil-menu" aria-label="Ana menü">
        <Link
          href="/"
          className={`mobil-menu-oge${aktif === 'listeler' ? ' is-on' : ''}`}
          aria-current={aktif === 'listeler' ? 'page' : undefined}
        >
          {ListelerIkon}
          <span>Listelerim</span>
        </Link>
        <button type="button" className="mobil-menu-ekle" onClick={() => setFormAcik(true)} aria-label="Yeni liste">
          {ArtiIkon}
        </button>
        <Link
          href="/kor"
          className={`mobil-menu-oge${aktif === 'kor' ? ' is-on' : ''}`}
          aria-current={aktif === 'kor' ? 'page' : undefined}
        >
          {KorIkon}
          <span>Kör Sıralama</span>
        </Link>
        <button type="button" className="mobil-menu-oge" onClick={() => setHesapAcik(true)}>
          <span className="mobil-menu-foto" aria-hidden="true">
            {foto && !fotoBozuk
              ? <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFotoBozuk(true)} />
              : ad.charAt(0).toLocaleUpperCase('tr')}
          </span>
          <span>Profil</span>
        </button>
      </nav>

      <ListeEkleModal isOpen={formAcik} onClose={() => setFormAcik(false)} onCreated={listeleriTazele} />
      {hesapAcik && <HesapPenceresi user={user} ad={ad} onClose={() => setHesapAcik(false)} />}
    </>
  );
}
