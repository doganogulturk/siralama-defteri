'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SAYILAR_RENK, gununTohumu, puanla as sayiPuanla, sayilariUret, yerlesimCoz } from '@/lib/sayilar';
import { dogruSiraListeleri, dogruSiraListesi, gununListesi, maddeleriSec, puanla, yuzde } from '@/lib/dogru-sira';
import { katalog } from '@/lib/katalog';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';

/*
 * Oyunların ana ekranda ve Oyna sayfasında ortak kartları:
 *   • `BugunKartlari` — günün iki oyunu (Sayılar, Doğru Sıra); oynandıysa puan.
 *   • `OyunSeridi` — ana ekranda modların yatay şeridi.
 * Oyunlar kendi renkleriyle (`--kor`); kişisel listeler uygulamanın tek vurgu rengiyle.
 */

/** Günlük sonuçların bu cihazdaki anahtarları (SayiOyun, DogruSiraOyun yazıyor). */
const sayilarAnahtari = (tohum: string) => `siralama-defteri:sayilar:${tohum}`;
const dogruSiraAnahtari = (tohum: string, slug: string) => `siralama-defteri:dogru-sira:${tohum}:${slug}`;

interface Gunun {
  tohum: string;
  dogruSiraSlug: string;
  sayilarPuani: number | null;
  dogruSiraUyumu: number | null;
}

/**
 * Bugünün tohumu ve bu cihazda oynanmış sonuçlar. Tarayıcıda hesaplanıyor (ilk çizimde
 * null): sayfa sunucuda da çiziliyor, gece yarısı iki taraf farklı gün görebilirdi.
 */
function useGunun(): Gunun | null {
  const [gunun, setGunun] = useState<Gunun | null>(null);
  useEffect(() => {
    const tohum = gununTohumu();
    const slug = gununListesi(tohum)!;
    let sayilarPuani: number | null = null;
    let dogruSiraUyumu: number | null = null;
    try {
      const s = yerlesimCoz(localStorage.getItem(sayilarAnahtari(tohum)));
      if (s) sayilarPuani = sayiPuanla(s.map(i => sayilariUret(tohum)[i])).puan;
      const d = yerlesimCoz(localStorage.getItem(dogruSiraAnahtari(tohum, slug)));
      if (d) dogruSiraUyumu = puanla(dogruSiraListesi(slug, 'tr')!, maddeleriSec(slug, tohum), d).uyum;
    } catch { /* depolama kapalı */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGunun({ tohum, dogruSiraSlug: slug, sayilarPuani, dogruSiraUyumu });
  }, []);
  return gunun;
}

/** Günün iki oyunu yan yana. Oynandıysa puan, oynanmadıysa davet. */
export function BugunKartlari() {
  const dil = useDilim();
  const t = useMesajlar().oyna;
  const gunun = useGunun();
  if (!gunun) return <div className="bugun is-yukleniyor" aria-hidden="true" />;
  const ds = dogruSiraListesi(gunun.dogruSiraSlug, dil)!;
  return (
    <ul className="bugun" aria-label={t.bugun}>
      <li style={{ '--kor': SAYILAR_RENK } as React.CSSProperties}>
        <Link href="/oyna/sayilar" className={`bugun-kart${gunun.sayilarPuani !== null ? ' is-oynandi' : ''}`}>
          <span className="bugun-simge" aria-hidden="true">🔢</span>
          <strong>{t.gununSayilari}</strong>
          <em>{gunun.sayilarPuani !== null ? t.oynandi(`${gunun.sayilarPuani}/10`) : t.gununSayilariAlt}</em>
        </Link>
      </li>
      <li style={{ '--kor': ds.renk } as React.CSSProperties}>
        <Link
          href={`/oyna/dogru-sira/${ds.slug}?t=${gunun.tohum}`}
          className={`bugun-kart${gunun.dogruSiraUyumu !== null ? ' is-oynandi' : ''}`}
        >
          <span className="bugun-simge" aria-hidden="true">{ds.simge}</span>
          <strong>{t.gununDogruSirasi}</strong>
          <em>{gunun.dogruSiraUyumu !== null ? t.oynandi(yuzde(gunun.dogruSiraUyumu, dil)) : ds.ad}</em>
        </Link>
      </li>
    </ul>
  );
}

/** Ana ekranda modların yatay şeridi; her kart Oyna sayfasının ilgili bölümüne. */
export function OyunSeridi() {
  const dil = useDilim();
  const m = useMesajlar();
  const t = m.oyna;
  const modlar = [
    { href: '/oyna#kor', simge: '🙈', ad: m.kor.ad, alt: t.korKisa, adet: katalog(dil).length, renk: 'var(--accent)' },
    { href: '/oyna#tier', simge: '🏆', ad: m.tier.ad, alt: m.tier.kisa, adet: katalog(dil).length, renk: '#b45309' },
    { href: '/oyna#kor-tier', simge: '🎲', ad: m.tier.korAd, alt: m.tier.korKisa, adet: katalog(dil).length, renk: '#7c3aed' },
    { href: '/oyna#dogru-sira', simge: '🎯', ad: m.dogruSira.ad, alt: t.dogruSiraKisa, adet: dogruSiraListeleri(dil).length, renk: '#0f766e' },
    { href: '/oyna/sayilar', simge: '🔢', ad: m.sayilar.ad, alt: t.sayilarKisa, adet: null, renk: SAYILAR_RENK },
  ];
  return (
    <ul className="oyun-seridi" aria-label={t.oyunlar}>
      {modlar.map(o => (
        <li key={o.href} style={{ '--kor': o.renk } as React.CSSProperties}>
          <Link href={o.href} className="oyun-kart">
            <span className="oyun-kart-simge" aria-hidden="true">{o.simge}</span>
            <strong>{o.ad}</strong>
            <em>{o.alt}</em>
            {o.adet !== null && <small>{t.listeAdet(o.adet)}</small>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
