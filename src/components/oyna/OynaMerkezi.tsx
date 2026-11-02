'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Marka from '../Marka';
import MobilMenu from '../MobilMenu';
import { katalog, type KatalogListe } from '@/lib/katalog';
import { BugunKartlari } from './OyunKartlari';
import DilSecici from '../DilSecici';
import { korBaglantisiGonder, korUygun } from '@/lib/kor-liste';
import { guvenliFoto } from '@/lib/paylasim';
import { useAuth } from '@/hooks/useAuth';
import { useListeler, siralanan } from '@/hooks/useListeler';
import { brandInitials } from '@/types/item';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';

/**
 * Oyna: giriş istemeyen oyunların merkezi (`/oyna`; giriş yapmamış ziyaretçiye ana sayfada
 * da). Önce günün oyunları, sonra modlar kendi bölümlerinde: Kör Sıralama (giriş yapmışsa
 * kendi listeleri de), Tier, Kör Tier, Doğru Sıra. Her modun altında katalogdaki listeler
 * yatay bir şeritte (`lib/katalog.ts`). Sayılar tek oyun; günün kartında.
 * `misafir` verilirse (giriş yapmamış, ana sayfa) en üstte kendi defterini kurma çağrısı.
 */
export default function OynaMerkezi({ misafir }: { misafir?: React.ReactNode }) {
  const dil = useDilim();
  const mesajlar = useMesajlar();
  const t = mesajlar.kor;
  const o = mesajlar.oyna;
  const { user } = useAuth();
  /** Ortak katalog: her mod aynı listelerle (Doğru Sıra yalnızca doğru cevabı olanlarla). */
  const tum = katalog(dil);
  return (
    <div className="kor-sayfa oyna">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label={t.anaSayfa}>
          <Marka />
        </Link>
        {misafir && <DilSecici />}
      </header>
      <main>

        <h1 className="paylasim-baslik">{o.baslik}</h1>
        <p className="kor-sayfa-alt">{o.alt}</p>

        <h2 className="oyna-etiket">{o.bugun}</h2>
        <BugunKartlari />

        {misafir && (
          <section className="oyna-misafir">
            <h2>{o.misafirBaslik}</h2>
            <p>{o.misafirAlt}</p>
            <div className="oyna-misafir-islem">
              {misafir}
              <Link href="/tanitim" className="oyna-nasil">{o.nasil}</Link>
            </div>
          </section>
        )}

        <OyunBolumu id="kor" baslik={t.ad} alt={o.korAlt} yol="kor" listeler={tum}>
          {user && <KendiListelerin />}
        </OyunBolumu>
        <OyunBolumu id="tier" baslik={mesajlar.tier.ad} alt={mesajlar.tier.alt} yol="tier" listeler={tum} />
        <OyunBolumu id="kor-tier" baslik={mesajlar.tier.korAd} alt={mesajlar.tier.korAlt} yol="kor-tier" listeler={tum} />
        <OyunBolumu id="dogru-sira" baslik={mesajlar.dogruSira.ad} alt={mesajlar.dogruSira.bolumAlt} yol="dogru-sira"
                    listeler={tum.filter(l => l.dogru)} />
      </main>
      <MobilMenu aktif="kor" />
    </div>
  );
}

/** Bir modun bölümü: başlık, kısa açıklama ve katalog listelerinin yatay şeridi. */
function OyunBolumu({ id, baslik, alt, yol, listeler, children }: {
  id: string; baslik: string; alt: string; yol: string; listeler: KatalogListe[]; children?: React.ReactNode;
}) {
  return (
    <section id={id} className="oyna-bolum" aria-labelledby={`${id}-baslik`}>
      <h2 id={`${id}-baslik`} className="oyna-bolum-baslik">{baslik}</h2>
      <p className="oyna-bolum-alt">{alt}</p>
      {children}
      <ul className="katalog-seridi">
        {listeler.map(l => (
          <li key={l.slug} style={{ '--kor': l.renk } as React.CSSProperties}>
            <Link href={`/oyna/${yol}/${l.slug}`} className="katalog-kart">
              <span aria-hidden="true">{l.simge}</span>
              <strong>{l.ad}</strong>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Giriş yapmış kullanıcının kör sıralatılabilecek listeleri: en az on kayıtlı olanlar.
 * Paylaşılan listede "Gönder" kör sıralama bağlantısını yolluyor; paylaşılmayanda
 * liste ayarlarına (paylaşım bölümü en üstte) götüren bir bağlantı. Liste Paylaş
 * menüsündeki "Kör sıralat"la aynı iş, keşfedilsin diye burada da.
 */
function KendiListelerin() {
  const t = useMesajlar().kor;
  const { listeler, sayilar, loading } = useListeler();
  const [bildirim, setBildirim] = useState<string | null>(null);
  const [hepsi, setHepsi] = useState(false);
  // Paylaşılanlar önde (hemen gönderilebilir); oyunları aşağı itmesin diye ilk üçü açık.
  const uygunlar = listeler
    .filter(l => korUygun(siralanan(sayilar[l.id])))
    .sort((a, b) => Number(!!b.paylasim_kodu) - Number(!!a.paylasim_kodu));
  const gorunen = hepsi ? uygunlar : uygunlar.slice(0, 3);

  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(null), 2400);
    return () => clearTimeout(z);
  }, [bildirim]);

  if (loading) return null;
  return (
    <section className="kor-kendi-bolum">
      <h2>{t.kendiListelerin}</h2>
      <p>{uygunlar.length ? t.kendiAlt : t.kendiBos}</p>
      {uygunlar.length > 0 && (
        <ul className="kor-kendi-listeler">
          {gorunen.map(l => {
            const sampiyon = sayilar[l.id]?.ilkUc[0];
            const foto = guvenliFoto(sampiyon?.fotograf_url);
            return (
              <li key={l.id}>
                {foto
                  ? <img src={foto} alt="" className="kor-kendi-kapak" />
                  : <span className="kor-kendi-kapak is-bos" aria-hidden="true">{brandInitials(l.ad)}</span>}
                <span className="kor-kendi-ad">
                  <strong>{l.ad}</strong>
                  <em>{t.kayitAdet(siralanan(sayilar[l.id]))}</em>
                </span>
                {l.paylasim_kodu ? (
                  <button
                    type="button"
                    className="btn-primary kor-kendi-gonder"
                    onClick={async () => {
                      if (await korBaglantisiGonder(l.paylasim_kodu!, l.ad) === 'kopyalandi') setBildirim(t.kopyalandi);
                    }}
                  >
                    {t.gonder}
                  </button>
                ) : (
                  <Link href={`/l/${l.slug}?ayarlar=1`} className="kor-kendi-ac">{t.paylasimiAc}</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {uygunlar.length > gorunen.length && (
        <button type="button" className="kor-kendi-daha" onClick={() => setHepsi(true)}>
          {t.dahaFazla(uygunlar.length - gorunen.length)}
        </button>
      )}
      {bildirim && <div className="toast" role="status">{bildirim}</div>}
    </section>
  );
}
