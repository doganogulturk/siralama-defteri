'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Hesap from '../components/Hesap';
import Link from 'next/link';
import { useListeler, siralanan } from '../hooks/useListeler';
import ListeEkleModal from '../components/ListeEkleModal';
import { useAuth } from '../hooks/useAuth';

export default function ListelerPage() {
  const { listeler, sayilar, loading, error, load } = useListeler();
  const { user } = useAuth();

  const [formAcik, setFormAcik] = useState(false);

  // Özet sayılar tüm listelerin toplamı.
  const toplamKayit = Object.values(sayilar).reduce((a, s) => a + s.toplam, 0);
  const bekleyen = Object.values(sayilar).reduce((a, s) => a + s.bekleyen, 0);
  const siralananToplam = toplamKayit - bekleyen;

  // Selamlamada yalnızca ilk ad: Google adı yoksa e-postanın kullanıcı adı kısmı.
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const adTam = meta?.full_name ?? meta?.name ?? user?.email?.split('@')[0] ?? '';
  const ilkAd = adTam.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="app app-solo">
      <main className="list">
        <header className="home-head">
          <div className="home-head-text">
            {ilkAd && <p className="home-hello">Merhaba {ilkAd}</p>}
            <h1 className="home-title">Listelerin</h1>
            {listeler.length > 0 && (
              <p className="home-summary">
                <strong>{listeler.length}</strong> liste · <strong>{siralananToplam}</strong> sıralandı ·{' '}
                <strong>{bekleyen}</strong> denenmemiş
              </p>
            )}
          </div>
          <div className="home-head-yan">
            {/* Masaüstünde yüzen düğme gizli; ekleme başlığın yanına geçiyor. */}
            <div className="list-head-actions">
              <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
                + Yeni liste
              </button>
            </div>
            {user && <Hesap user={user} className="home-hesap" />}
          </div>
        </header>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>Tekrar dene</button>
          </div>
        )}

        {loading ? (
          <p className="state-msg">Yükleniyor…</p>
        ) : listeler.length === 0 ? (
          <div className="state-empty">
            <p className="state-empty-title">Henüz listen yok</p>
            <p>Sıralamak istediğin şeyle başla: kola, döner, Türk kahvesi…</p>
            <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
              İlk listeyi oluştur
            </button>
          </div>
        ) : (
          <div className="liste-grid">
            {listeler.map((l) => {
              const adet = siralanan(sayilar[l.id]);
              const bekleyenAdet = sayilar[l.id]?.bekleyen ?? 0;
              const ilkUc = sayilar[l.id]?.ilkUc ?? [];
              const sampiyon = ilkUc[0];
              return (
                <Link
                  key={l.id}
                  href={`/l/${l.slug}`}
                  className={`liste-card${sampiyon ? '' : ' is-bos'}`}
                >
                  {/* Şampiyonun fotoğrafı kartın arkasında soluk bir zemin; yoksa kart sade kalıyor. */}
                  {sampiyon?.fotograf_url && (
                    <span className="liste-card-kapak" aria-hidden="true">
                      <img src={sampiyon.fotograf_url} alt="" />
                    </span>
                  )}

                  <span className="liste-card-bas">
                    <strong className="liste-card-ad">{l.ad}</strong>
                    <b className="liste-card-sayi" aria-label={`${adet} sıralandı`}>{adet}</b>
                  </span>

                  {sampiyon ? (
                    <ol className="liste-card-podyum">
                      {ilkUc.map((k, n) => (
                        <li key={k.id}>
                          <i>{n + 1}</i>
                          <span>
                            {k.ad}
                            {k.alt_ad && <small> {k.alt_ad}</small>}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <span className="liste-card-bos">Henüz sıralama yok</span>
                  )}

                  {bekleyenAdet > 0 && <em className="liste-card-bekleyen">{bekleyenAdet} denenmemiş</em>}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <button type="button" className="fab" onClick={() => setFormAcik(true)}>
        Yeni liste
      </button>

      <ListeEkleModal
        isOpen={formAcik}
        onClose={() => setFormAcik(false)}
        onCreated={load}
      />
    </div>
  );
}
