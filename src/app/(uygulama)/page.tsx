'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import Hesap from '../../components/Hesap';
import Marka from '../../components/Marka';
import { BosSahne } from '../../components/Sahne';
import { IskeletKartlar } from '../../components/Iskelet';
import Link from 'next/link';
import { useListeler, siralanan } from '../../hooks/useListeler';
import ListeEkleModal from '../../components/ListeEkleModal';
import MobilMenu from '../../components/MobilMenu';
import { useAuth } from '../../hooks/useAuth';
import { brandInitials } from '../../types/item';
import type { OzetKayit } from '../../lib/items';

/**
 * Liste kartının vitrini: ilk üçün fotoğrafları kartın bütün yüksekliğinde, soldan
 * sağa 1-2-3; şampiyonunki biraz daha geniş. Her panonun sol altında sıra ve ad.
 * Sıralar renk tonuyla da ayrışıyor (CSS `data-sira`): birincinin alt gölgesi vurgu
 * renginde, ikinci ve üçüncü giderek nötr. Fotoğrafsız kayıt baş harfleriyle, boş
 * yer (üçten az kayıt) silik bir panoyla.
 */
function Vitrin({ ilkUc }: { ilkUc: OzetKayit[] }) {
  return (
    <span className="vitrin">
      {[0, 1, 2].map(n => {
        const k = ilkUc[n];
        return (
          <span key={n} className={`vitrin-pano${k ? '' : ' is-bos'}`} data-sira={n + 1}>
            {k?.fotograf_url
              ? <img src={k.fotograf_url} alt="" loading="lazy" />
              : k && <b aria-hidden="true">{brandInitials(k.ad)}</b>}
            <span className="vitrin-ad">
              <i>{n + 1}</i>
              {k && <em>{k.ad}{k.alt_ad && <small> {k.alt_ad}</small>}</em>}
            </span>
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
              <Link href="/kor" className="btn-quiet">Kör Sıralama</Link>
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
                  className={`liste-card${sampiyon ? ' has-vitrin' : ' is-bos'}`}
                >
                  {sampiyon && <Vitrin ilkUc={ilkUc} />}

                  <span className="liste-card-bas">
                    <span className="liste-card-baslik">
                      <strong className="liste-card-ad">{l.ad}</strong>
                      {bekleyenAdet > 0 && <em className="liste-card-bekleyen">{bekleyenAdet} denenmemiş</em>}
                    </span>
                    <b className="liste-card-sayi" aria-label={`${adet} sıralandı`}>{adet}</b>
                  </span>

                  {!sampiyon && <span className="liste-card-bos">Henüz sıralama yok</span>}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Telefonda yeni liste, Kör Sıralama ve profil alt menüde; masaüstünde üst çubukta. */}
      <MobilMenu aktif="listeler" />

      <ListeEkleModal
        isOpen={formAcik}
        onClose={() => setFormAcik(false)}
        onCreated={load}
      />
    </div>
  );
}
