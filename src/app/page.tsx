'use client';

import React, { useState } from 'react';
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
                <strong>{siralananToplam}</strong> sıralandı · <strong>{bekleyen}</strong> denenmemiş
              </p>
            )}
          </div>
          {/* Masaüstünde yüzen düğme gizli; ekleme başlığın yanına geçiyor. */}
          <div className="list-head-actions">
            <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
              + Yeni liste
            </button>
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
              return (
                <Link
                  key={l.id}
                  href={`/l/${l.slug}`}
                  className="liste-card"
                  style={{ '--satir': l.renk } as React.CSSProperties}
                >
                  {/* Hane sayısı punto için: sayı kartın boyunu dolduruyor, uzun sayı küçülmeli. */}
                  <span className="liste-card-no" data-hane={Math.min(String(adet).length, 4)}>
                    {adet}
                  </span>
                  <span className="liste-card-text">
                    <strong>{l.ad}</strong>
                    {bekleyenAdet > 0 && <em>{bekleyenAdet} denenmemiş</em>}
                  </span>
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
