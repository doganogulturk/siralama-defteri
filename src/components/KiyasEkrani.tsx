'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { KiyasKayit, KiyasSatiri, kiyasAnahtari, kiyasla, uyumEtiketi } from '../lib/kiyas';
import { denenmemislereEkle } from '../lib/kopya';
import { PaylasilanListe, guvenliFoto, iyelik, paylasimAdresi } from '../lib/paylasim';
import { messages } from '../lib/i18n';
import { sortSirali } from '../lib/sort';
import { hataMetni } from '../lib/hata';
import { titret } from '../lib/his';
import { Item, Kategori, Liste, brandInitials } from '../types/item';
import { uyar } from '../lib/pencere';

/** Sıralama ekranındaki kuralla: denenmiş, "Bir daha asla"da olmayanlar sırayla 1'den. */
function benimKayitlarim(items: Item[]): KiyasKayit[] {
  const denenmis = items.filter(i => i.denendi);
  const sirali = sortSirali(denenmis.filter(i => !i.asla));
  return [
    ...sirali.map((i, n) => ({ ...i, sira: n + 1 })),
    ...denenmis.filter(i => i.asla).map(i => ({ ...i, sira: null })),
  ];
}

const onunKayitlari = (kaynak: PaylasilanListe): KiyasKayit[] => {
  let n = 0;
  return kaynak.kayitlar.map(k => ({ ...k, fotograf_url: guvenliFoto(k.fotograf_url), sira: k.asla ? null : ++n }));
};

const yer = (k: KiyasKayit) => (k.sira === null ? '✕' : `${k.sira}.`);

function Foto({ kayit, buyuk }: { kayit?: KiyasKayit; buyuk?: boolean }) {
  const sinif = `kiyas-foto${buyuk ? ' is-buyuk' : ''}`;
  if (!kayit) return <span className={`${sinif} is-bos`} />;
  return kayit.fotograf_url
    ? <img src={kayit.fotograf_url} className={sinif} alt="" />
    : <span className={sinif}>{brandInitials(kayit.ad)}</span>;
}

/** Yüzde halkası: sayı sıfırdan sayarak, halka dolarak geliyor (hareket azaltılmışsa doğrudan). */
function UyumHalkasi({ uyum }: { uyum: number }) {
  const [sakin] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [gorunen, setGorunen] = useState(sakin ? uyum : 0);
  useEffect(() => {
    if (sakin) return;
    const sure = 1400;
    let bas: number | null = null;
    let kare = 0;
    const adim = (t: number) => {
      bas ??= t;
      const p = Math.min(1, (t - bas) / sure);
      setGorunen(Math.round(uyum * (1 - Math.pow(1 - p, 3))));
      if (p < 1) kare = requestAnimationFrame(adim);
      else titret('basari');
    };
    kare = requestAnimationFrame(adim);
    return () => cancelAnimationFrame(kare);
  }, [uyum, sakin]);

  const r = 52;
  const cevre = 2 * Math.PI * r;
  return (
    <div className="kiyas-halka" role="img" aria-label={messages().kiyas.yuzdeUyum(uyum)}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="kiyas-halka-iz" />
        <circle
          cx="60" cy="60" r={r}
          className="kiyas-halka-dolu"
          strokeDasharray={cevre}
          strokeDashoffset={cevre * (1 - gorunen / 100)}
        />
      </svg>
      <span className="kiyas-halka-sayi">{messages().kiyas.yuzde(gorunen)}</span>
    </div>
  );
}

function AyrilikSatiri({ satir, onunAdi }: { satir: KiyasSatiri; onunAdi: string }) {
  return (
    <li className="kiyas-ayrilik">
      <Foto kayit={satir.benim} />
      <span className="kiyas-ayrilik-ad">
        <strong>{satir.benim.ad}</strong>
        <em>{messages().kiyas.yerler(
          satir.benim.sira === null ? messages().kiyas.birDahaAsla : `${satir.benim.sira}.`,
          onunAdi,
          satir.onun.sira === null ? messages().kiyas.birDahaAsla : `${satir.onun.sira}.`,
        )}</em>
      </span>
    </li>
  );
}

/**
 * Karşılaştırma: kullanıcının listesi ile paylaşılan liste. Uyum yüzdesi, şampiyonlar,
 * en büyük ayrılıklar, ortak kayıtların yan yana sırası ve "onda olup sende olmayanlar".
 */
export default function KiyasEkrani({ kod, kaynak, liste, items, kategoriler, onDegisti }: {
  kod: string;
  kaynak: PaylasilanListe;
  liste: Liste;
  items: Item[];
  kategoriler: Kategori[];
  onDegisti: () => void;
}) {
  const benim = useMemo(() => benimKayitlarim(items), [items]);
  const onun = useMemo(() => onunKayitlari(kaynak), [kaynak]);
  const sonuc = useMemo(
    () => kiyasla(benim, onun, new Set(items.map(kiyasAnahtari))),
    [benim, onun, items],
  );
  const [ekleniyor, setEkleniyor] = useState(false);
  const [bildirim, setBildirim] = useState<string | null>(null);

  const m = messages();
  const t = m.kiyas;
  const onunAdi = kaynak.sahip?.split(' ')[0] ?? t.o;
  const benimSampiyon = benim.find(k => k.sira === 1);
  const onunSampiyon = onun.find(k => k.sira === 1);
  const ayniSampiyon = !!benimSampiyon && !!onunSampiyon
    && kiyasAnahtari(benimSampiyon) === kiyasAnahtari(onunSampiyon);

  useEffect(() => {
    if (!bildirim) return;
    const t = setTimeout(() => setBildirim(null), 2600);
    return () => clearTimeout(t);
  }, [bildirim]);

  const paylas = async () => {
    const url = paylasimAdresi(kod, window.location.origin);
    const metin = sonuc.uyum !== null
      ? t.paylasimUyum(kaynak.sahip, kaynak.ad, sonuc.uyum)
      : t.paylasimDuz(kaynak.ad);
    try {
      if (navigator.share) {
        await navigator.share({ title: kaynak.ad, text: metin, url });
        return;
      }
      await navigator.clipboard.writeText(`${metin} ${url}`);
      setBildirim(t.kopyalandi);
    } catch { /* paylaşım menüsü kapatıldı */ }
  };

  const ekle = async () => {
    if (ekleniyor) return;
    setEkleniyor(true);
    try {
      const kaynakKayitlari = kaynak.kayitlar.filter(k =>
        sonuc.yalnizOnda.some(y => y.id === k.id));
      const n = await denenmemislereEkle(liste, kategoriler, kaynak, kaynakKayitlari, items.length);
      setBildirim(t.eklendi(n));
      onDegisti();
    } catch (e: unknown) {
      void uyar(t.eklenemedi(hataMetni(e)));
    } finally {
      setEkleniyor(false);
    }
  };

  return (
    <div className="kiyas">
      <section className="kiyas-bas kiyas-bas-sonuc">
        <p className="paylasim-sahip">{t.ileKarsilastirma(kaynak.sahip)}</p>
        <h1 className="paylasim-baslik">{kaynak.ad}</h1>
      </section>

      <section className="kiyas-kart kiyas-uyum">
        {sonuc.uyum !== null ? (
          <>
            <UyumHalkasi uyum={sonuc.uyum} />
            <p className="kiyas-uyum-etiket">{uyumEtiketi(sonuc.uyum)}</p>
            <p className="kiyas-uyum-metin">
              {t.uyumMetni[0]}<strong>{sonuc.ortak.length}</strong>{t.uyumMetni[1]}
              <strong>{sonuc.uyum}</strong>{t.uyumMetni[2]}
              {sonuc.ayniYer > 0 && <>{t.ayniYer[0]}<strong>{sonuc.ayniYer}</strong>{t.ayniYer[1]}</>}
            </p>
          </>
        ) : (
          <p className="kiyas-uyum-metin">
            {t.yetersiz}
            {sonuc.ortak.length > 0 && <>{t.suAn[0]}<strong>{sonuc.ortak.length}</strong>{t.suAn[1]}</>}.
          </p>
        )}
        <button type="button" className="btn-primary" onClick={paylas}>{t.sonucuPaylas}</button>
      </section>

      {(benimSampiyon || onunSampiyon) && (
        <section className="kiyas-kart">
          <h2 className="kiyas-alt-baslik">{ayniSampiyon ? t.ayniSampiyon : t.sampiyonlar}</h2>
          <div className="kiyas-sampiyonlar">
            <div className="kiyas-sampiyon">
              <Foto kayit={benimSampiyon} buyuk />
              <em>{t.senin}</em>
              <strong>{benimSampiyon?.ad ?? '—'}</strong>
            </div>
            <div className="kiyas-sampiyon">
              <Foto kayit={onunSampiyon} buyuk />
              <em>{kaynak.sahip ? iyelik(onunAdi) : t.onun}</em>
              <strong>{onunSampiyon?.ad ?? '—'}</strong>
            </div>
          </div>
        </section>
      )}

      {sonuc.ayriliklar.length > 0 && (
        <section className="kiyas-kart">
          <h2 className="kiyas-alt-baslik">{t.ayriliklar}</h2>
          <ul className="kiyas-ayriliklar">
            {sonuc.ayriliklar.map(s => <AyrilikSatiri key={s.anahtar} satir={s} onunAdi={onunAdi} />)}
          </ul>
        </section>
      )}

      {sonuc.ortak.length > 0 && (
        <section className="kiyas-kart">
          <h2 className="kiyas-alt-baslik">{t.yanYana}</h2>
          <div className="kiyas-tablo" role="table" aria-label={t.ortakSira}>
            <div className="kiyas-tablo-bas" role="row">
              <span role="columnheader">{t.sen}</span>
              <span role="columnheader" />
              <span role="columnheader">{onunAdi}</span>
            </div>
            {sonuc.ortak.map(s => {
              const fark = s.benim.sira !== null && s.onun.sira !== null ? s.onun.sira - s.benim.sira : null;
              return (
                <div className="kiyas-tablo-satir" role="row" key={s.anahtar}>
                  <span role="cell" className="kiyas-yer">{yer(s.benim)}</span>
                  <span role="cell" className="kiyas-tablo-ad">
                    {s.benim.ad}
                    {s.benim.alt_ad && <em> {s.benim.alt_ad}</em>}
                  </span>
                  <span
                    role="cell"
                    className={`kiyas-yer${fark === 0 ? ' is-ayni' : ''}${fark === null && s.benim.sira !== s.onun.sira ? ' is-zit' : ''}`}
                  >
                    {yer(s.onun)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {sonuc.yalnizOnda.length > 0 && (
        <section className="kiyas-kart">
          <h2 className="kiyas-alt-baslik">
            {t.ondaVar} <span>{sonuc.yalnizOnda.length}</span>
          </h2>
          <p className="kiyas-ipucu">
            {sonuc.yalnizOnda.slice(0, 6).map(k => k.ad).join(', ')}
            {sonuc.yalnizOnda.length > 6 && t.veDaha(sonuc.yalnizOnda.length - 6)}.
          </p>
          <button type="button" className="btn-quiet" onClick={ekle} disabled={ekleniyor}>
            {ekleniyor ? t.ekleniyor : t.denenmemislereEkle}
          </button>
        </section>
      )}

      <footer className="kiyas-son">
        <Link href={`/l/${liste.slug}`} className="btn-primary">{t.listemeGit}</Link>
        <Link href={`/p/${kod}`} className="btn-quiet">{kaynak.sahip ? m.paylasim.sahibinListesi(iyelik(onunAdi)) : t.onunListesi}</Link>
      </footer>

      {bildirim && <div className="toast" role="status">{bildirim}</div>}
    </div>
  );
}
