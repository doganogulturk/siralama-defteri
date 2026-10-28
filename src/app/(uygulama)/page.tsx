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
import { messages } from '../../lib/i18n';

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
  const denendiYuzde = toplamKayit > 0 ? Math.round((siralananToplam / toplamKayit) * 100) : 0;

  // Selamlamada yalnızca ilk ad: Google adı yoksa e-postanın kullanıcı adı kısmı.
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  const adTam = meta?.full_name ?? meta?.name ?? user?.email?.split('@')[0] ?? '';
  const ilkAd = adTam.trim().split(/\s+/)[0] ?? '';
  const m = messages();
  const a = m.ana;

  return (
    <div className="app app-solo">
      <main className="list">
        {/* Üst çubuk: marka solda; masaüstünde ekleme düğmesi ve hesap sağda. */}
        <div className="home-bar">
          <Marka />
          <div className="home-head-yan">
            {/* Masaüstünde yüzen düğme gizli; ekleme üst çubuğa geçiyor. */}
            <div className="list-head-actions">
              <Link href="/kor" className="btn-quiet">{m.menu.kor}</Link>
              <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
                <span aria-hidden="true">+</span> {m.menu.yeniListe}
              </button>
            </div>
            {user && <Hesap user={user} className="home-hesap" />}
          </div>
        </div>

        <header className="home-head">
          {ilkAd && <p className="home-hello">{a.merhaba(ilkAd)}</p>}
          <h1 className="home-title">{a.baslik}</h1>
          {listeler.length > 0 && (
            // Üç gösterge kutusu: iri serif sayı, altında etiket; Sıralandı kutusunda denenme oranı çubuğu.
            <dl className="home-stats" aria-label={a.ozetEtiket}>
              <div className="home-stat">
                <dt>{a.liste}</dt>
                <dd>{listeler.length}</dd>
              </div>
              <div className="home-stat is-vurgu">
                <dt>{a.siralandi}</dt>
                <dd>{siralananToplam}</dd>
                {toplamKayit > 0 && (
                  <span className="home-stat-oran">
                    <span className="home-stat-cubuk" aria-hidden="true">
                      <span style={{ width: `${denendiYuzde}%` }} />
                    </span>
                    {a.denendiOrani(denendiYuzde)}
                  </span>
                )}
              </div>
              <div className="home-stat">
                <dt>{a.denenmemis}</dt>
                <dd>{bekleyen}</dd>
              </div>
            </dl>
          )}
        </header>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>{a.tekrarDene}</button>
          </div>
        )}

        {loading ? (
          <IskeletKartlar />
        ) : listeler.length === 0 ? (
          <div className="state-empty">
            <BosSahne tur="listeler" />
            <p className="state-empty-title">{a.bosBaslik}</p>
            <p>{a.bosMetin}</p>
            <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
              {a.ilkListe}
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
                      {bekleyenAdet > 0 && <em className="liste-card-bekleyen">{a.adetDenenmemis(bekleyenAdet)}</em>}
                    </span>
                    <b className="liste-card-sayi" aria-label={a.adetSiralandi(adet)}>{adet}</b>
                  </span>

                  {!sampiyon && <span className="liste-card-bos">{a.siralamaYok}</span>}
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
