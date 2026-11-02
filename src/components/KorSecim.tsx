'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Marka from './Marka';
import MobilMenu from './MobilMenu';
import { korListeleri } from '@/lib/kor';
import { SAYILAR_RENK } from '@/lib/sayilar';
import { korBaglantisiGonder, korUygun } from '@/lib/kor-liste';
import { guvenliFoto } from '@/lib/paylasim';
import { useAuth } from '@/hooks/useAuth';
import { useListeler, siralanan } from '@/hooks/useListeler';
import { brandInitials } from '@/types/item';
import { messages } from '@/lib/i18n';

/** Kör Sıralama'nın liste seçimi; sayfa statik, metinler arayüz dilinde istemcide çiziliyor. */
export default function KorSecim() {
  const t = messages().kor;
  const sayi = messages().sayilar;
  const { user } = useAuth();
  return (
    <div className="kor-sayfa">
      <header className="paylasim-bar">
        <Link href="/" className="paylasim-marka" aria-label={t.anaSayfa}>
          <Marka />
        </Link>
      </header>
      <main>
        <h1 className="paylasim-baslik">{t.ad}</h1>
        <p className="kor-sayfa-alt">{t.sayfaAlt}</p>
        {user && <KendiListelerin />}
        <ul className="kor-secim">
          {/* Sayılar: doğru cevabı olan günlük oyun; satırı boydan boya kaplayan ilk kart. */}
          <li className="is-sayilar" style={{ '--kor': SAYILAR_RENK, '--i': 0 } as React.CSSProperties}>
            <Link href="/kor/sayilar" className="kor-secim-kart">
              <span aria-hidden="true">🔢</span>
              <strong>{sayi.ad}</strong>
              <em>{sayi.kartAlt}</em>
            </Link>
          </li>
          {korListeleri().map((l, i) => (
            <li key={l.slug} style={{ '--kor': l.renk, '--i': i + 1 } as React.CSSProperties}>
              <Link href={`/kor/${l.slug}`} className="kor-secim-kart">
                <span aria-hidden="true">{l.simge}</span>
                <strong>{l.ad}</strong>
                <em>{t.kayitAdet(l.kayitlar.length)}</em>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <MobilMenu aktif="kor" />
    </div>
  );
}

/**
 * Giriş yapmış kullanıcının kör sıralatılabilecek listeleri: en az on kayıtlı olanlar.
 * Paylaşılan listede "Gönder" kör sıralama bağlantısını yolluyor; paylaşılmayanda
 * liste ayarlarına (paylaşım bölümü en üstte) götüren bir bağlantı. Liste Paylaş
 * menüsündeki "Kör sıralat"la aynı iş, keşfedilsin diye burada da.
 */
function KendiListelerin() {
  const t = messages().kor;
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
