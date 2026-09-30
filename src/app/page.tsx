'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Hesap from '../components/Hesap';
import Marka from '../components/Marka';
import { BosSahne } from '../components/Sahne';
import { IskeletKartlar } from '../components/Iskelet';
import Link from 'next/link';
import { useListeler, siralanan } from '../hooks/useListeler';
import ListeEkleModal from '../components/ListeEkleModal';
import { useAuth } from '../hooks/useAuth';
import { brandInitials } from '../types/item';
import type { OzetKayit } from '../lib/items';

/** Podyumun basamakları soldan sağa: ikinci, birinci, üçüncü. */
const BASAMAKLAR = [1, 0, 2];

/**
 * Liste kartındaki podyum: ilk üçün fotoğrafları basamak basamak, şampiyon ortada
 * ve en yüksekte. Fotoğrafsız kayıt baş harfleriyle, boş basamak kesik çizgiyle.
 */
function Podyum({ ilkUc }: { ilkUc: OzetKayit[] }) {
  return (
    <span className="podyum" aria-hidden="true">
      {BASAMAKLAR.map(n => {
        const k = ilkUc[n];
        return (
          <span key={n} className={`podyum-basamak${k ? '' : ' is-bos'}`} data-sira={n + 1}>
            {k?.fotograf_url
              ? <img src={k.fotograf_url} alt="" loading="lazy" />
              : k && <b>{brandInitials(k.ad)}</b>}
            <i>{n + 1}</i>
          </span>
        );
      })}
    </span>
  );
}

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
        {/* Üst çubuk: marka solda; masaüstünde ekleme düğmesi ve hesap sağda. */}
        <div className="home-bar">
          <Marka />
          <div className="home-head-yan">
            {/* Masaüstünde yüzen düğme gizli; ekleme üst çubuğa geçiyor. */}
            <div className="list-head-actions">
              <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
                <span aria-hidden="true">+</span> Yeni liste
              </button>
            </div>
            {user && <Hesap user={user} className="home-hesap" />}
          </div>
        </div>

        <header className="home-head">
          {ilkAd && <p className="home-hello">Merhaba {ilkAd},</p>}
          <h1 className="home-title">Listelerin</h1>
          {listeler.length > 0 && (
            <ul className="home-stats">
              <li><strong>{listeler.length}</strong> liste</li>
              <li><strong>{siralananToplam}</strong> sıralandı</li>
              <li><strong>{bekleyen}</strong> denenmemiş</li>
            </ul>
          )}
        </header>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>Tekrar dene</button>
          </div>
        )}

        {loading ? (
          <IskeletKartlar />
        ) : listeler.length === 0 ? (
          <div className="state-empty">
            <BosSahne tur="listeler" />
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
                  <span className="liste-card-bas">
                    <strong className="liste-card-ad">{l.ad}</strong>
                    <b className="liste-card-sayi" aria-label={`${adet} sıralandı`}>{adet}</b>
                  </span>

                  <Podyum ilkUc={ilkUc} />

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
