'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SAYILAR_RENK, gununTohumu, puanla as sayiPuanla, sayilariUret, yerlesimCoz } from '@/lib/sayilar';
import { dogruSiraListesi, gununListesi, maddeleriSec, puanla, yuzde } from '@/lib/dogru-sira';
import { katalog } from '@/lib/katalog';
import type { Mod } from './ModGecisi';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';

/*
 * Oyunların ana ekranda ve Oyna sayfasında ortak kartları:
 *   • `BugunKartlari` — günün üç oyunu (Sayılar, Doğru Sıra, İşlemler); oynandıysa puan.
 *   • `OyunSeridi` — ana ekranda modların yatay şeridi.
 *   • `useModlar` — kataloglu modların tanımı (Oyna'nın mod seçicisi de kullanıyor).
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
  islemlerUyumu: number | null;
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
    let islemlerUyumu: number | null = null;
    try {
      const s = yerlesimCoz(localStorage.getItem(sayilarAnahtari(tohum)));
      if (s) sayilarPuani = sayiPuanla(s.map(i => sayilariUret(tohum)[i])).puan;
      const d = yerlesimCoz(localStorage.getItem(dogruSiraAnahtari(tohum, slug)));
      if (d) dogruSiraUyumu = puanla(dogruSiraListesi(slug, 'tr')!, maddeleriSec(slug, tohum), d).uyum;
      const i = yerlesimCoz(localStorage.getItem(dogruSiraAnahtari(tohum, 'islemler')));
      if (i) islemlerUyumu = puanla(dogruSiraListesi('islemler', 'tr')!, maddeleriSec('islemler', tohum), i).uyum;
    } catch { /* depolama kapalı */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGunun({ tohum, dogruSiraSlug: slug, sayilarPuani, dogruSiraUyumu, islemlerUyumu });
  }, []);
  return gunun;
}

/**
 * Günün üç oyunu: Sayılar, Doğru Sıra (listesi günden güne dönüyor) ve İşlemler. Oynandıysa
 * puan, oynanmadıysa davet. Telefonda yatay kayan şerit (üçüncünün ucu görünüyor).
 */
export function BugunKartlari() {
  const dil = useDilim();
  const t = useMesajlar().oyna;
  const gunun = useGunun();
  if (!gunun) return <div className="bugun is-yukleniyor" aria-hidden="true" />;
  const ds = dogruSiraListesi(gunun.dogruSiraSlug, dil)!;
  const islemler = dogruSiraListesi('islemler', dil)!;
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
      <li style={{ '--kor': islemler.renk } as React.CSSProperties}>
        <Link
          href={`/oyna/dogru-sira/islemler?t=${gunun.tohum}`}
          className={`bugun-kart${gunun.islemlerUyumu !== null ? ' is-oynandi' : ''}`}
        >
          <span className="bugun-simge" aria-hidden="true">{islemler.simge}</span>
          <strong>{t.gununIslemleri}</strong>
          <em>{gunun.islemlerUyumu !== null ? t.oynandi(yuzde(gunun.islemlerUyumu, dil)) : t.gununIslemleriAlt}</em>
        </Link>
      </li>
    </ul>
  );
}

/** Kataloglu modların kimliği; Oyna adresinde `?mod=` ve oyun yolu (`/oyna/<id>/<liste>`). */
export type ModId = Mod;
export const MOD_IDLERI: ModId[] = ['kor', 'tier', 'kor-tier', 'dogru-sira'];

export interface ModTanimi {
  id: ModId;
  simge: string;
  renk: string;
  ad: string;
  /** Kartta tek satırlık tanım. */
  kisa: string;
  /** Oyna'da seçiliyken görünen uzun tanım. */
  alt: string;
  /** Yalnızca doğru cevabı olan listelerle mi oynanıyor. */
  yalnizcaDogru: boolean;
}

/** Kataloglu modlar, sırasıyla. Ana ekranın şeridi ve Oyna'nın seçicisi aynı tanımı kullanıyor. */
export function useModlar(): ModTanimi[] {
  const m = useMesajlar();
  return [
    { id: 'kor', simge: '🙈', renk: 'var(--accent)', ad: m.kor.ad, kisa: m.oyna.korKisa, alt: m.oyna.korAlt, yalnizcaDogru: false },
    { id: 'tier', simge: '🏆', renk: '#b45309', ad: m.tier.ad, kisa: m.tier.kisa, alt: m.tier.alt, yalnizcaDogru: false },
    { id: 'kor-tier', simge: '🎲', renk: '#7c3aed', ad: m.tier.korAd, kisa: m.tier.korKisa, alt: m.tier.korAlt, yalnizcaDogru: false },
    { id: 'dogru-sira', simge: '🎯', renk: '#0f766e', ad: m.dogruSira.ad, kisa: m.oyna.dogruSiraKisa, alt: m.dogruSira.bolumAlt, yalnizcaDogru: true },
  ];
}

/** Ana ekranda modların şeridi; her kart Oyna sayfasını o mod seçili açıyor. */
export function OyunSeridi() {
  const dil = useDilim();
  const m = useMesajlar();
  const t = m.oyna;
  const tum = katalog(dil);
  const modlar = [
    ...useModlar().map(o => ({
      // Doğru Sıra Oyna'da kendi bölümü (`#dogru-sira`); zevk modları seçicide.
      href: o.yalnizcaDogru ? '/oyna#dogru-sira' : `/oyna?mod=${o.id}`, simge: o.simge, ad: o.ad, alt: o.kisa, renk: o.renk,
      adet: tum.filter(l => !!l.dogru === o.yalnizcaDogru).length,
    })),
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
