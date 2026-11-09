'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import OyunSahnesi from '@/components/oyna/OyunSahnesi';
import OyunGeri from '@/components/oyna/OyunGeri';
import { katalogListesi, gercekYerler, oyunSecimi, tohumGerekli } from '@/lib/katalog';
import {
  KOR_TIER_SINIR, TIER_KADEMELERI, ayniKademe, dogruKademeler, tierGruplari, tierYaz, yakinKademe,
} from '@/lib/tier-oyun';
import { klasikRenk } from '@/lib/kademe';
import { rastgeleTohum } from '@/lib/sayilar';
import { DIL_PARAMETRE } from '@/lib/i18n';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';
import { titret } from '@/lib/his';
import { useAuth } from '@/hooks/useAuth';
import ModGecisi from './oyna/ModGecisi';
import KorKamera, { KameraDugmesi, useKameraVar } from './KorKamera';

type Asama = 'giris' | 'oyun' | 'sonuc';

function karistir<T>(dizi: T[]): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Kademe etiketi klasik tier renginde (oyunlar kendi renkleriyle; görselle aynı renkler). */
function Etiket({ k, buyuk = false }: { k: number; buyuk?: boolean }) {
  return (
    <span className={`tier-etiket${buyuk ? ' is-buyuk' : ''}`} style={{ background: klasikRenk(k) }}>
      {TIER_KADEMELERI[k]}
    </span>
  );
}

/**
 * Tier ve Kör Tier modları (`lib/tier-oyun.ts`). Katalogdaki listenin on maddesi S–D
 * kademelerine konuyor:
 *   • Tier (`kor` false): maddeye dokun, sonra kademesine; bitirene kadar değiştirilebiliyor.
 *   • Kör Tier (`kor` true): maddeler birer birer, karışık geliyor; konduğu yerde kalıyor,
 *     her kademede iki yer var.
 * Sonuç adreste (`?t=&s=`), hiçbir şey kaydedilmiyor. Doğru cevabı olan listede gerçek
 * kademeyle, arkadaşın bağlantısında arkadaşın kademeleriyle karşılaştırma.
 */
export default function TierOyun({ slug, kor, tohum: adresTohumu, arkadas }: {
  slug: string; kor: boolean; tohum: string | null; arkadas: number[] | null;
}) {
  const dil = useDilim();
  const m = useMesajlar();
  const t = m.tier;
  const liste = useMemo(() => katalogListesi(slug, dil)!, [slug, dil]);
  const tohumlu = tohumGerekli(liste);
  const [asama, setAsama] = useState<Asama>('giris');
  const [tohum, setTohum] = useState<string | null>(adresTohumu);
  const secim = useMemo(() => oyunSecimi(liste, tohum), [liste, tohum]);
  const ad = (k: number) => liste.havuz[secim[k]];
  /** Seçimdeki her maddenin kademesi; yerleşmemişse null. */
  const [kademeler, setKademeler] = useState<(number | null)[]>(() => new Array(10).fill(null));
  /** Tier: dokunulup kademesi beklenen madde. */
  const [secili, setSecili] = useState<number | null>(null);
  /** Kör Tier: geliş sırası ve kaçıncı maddede olunduğu. */
  const [gelis, setGelis] = useState<number[]>([]);
  const [adim, setAdim] = useState(0);
  const [kilit, setKilit] = useState(false);
  /** Kör Tier'in kameralı hâli: tahta on yuva, ikişerli kademe grupları (KorKamera). */
  const [kamera, setKamera] = useState(false);
  const [kameraAnahtari, setKameraAnahtari] = useState(0);
  const kameraVar = useKameraVar();

  const basla = (yeni = false) => {
    titret('dokunus');
    // Tohumsuz arkadaş bağlantısı (havuzlar büyümeden önceki) ilk onla oynanıyor: tohum üretme.
    if (tohumlu && (yeni || (!tohum && !arkadas))) setTohum(rastgeleTohum());
    setKademeler(new Array(10).fill(null));
    setSecili(null);
    setGelis(karistir(Array.from({ length: 10 }, (_, i) => i)));
    setAdim(0);
    setAsama('oyun');
  };

  /** Tier: seçili maddeyi kademeye (null: yerleştirilecekler) taşı. */
  const tasi = (kademe: number | null) => {
    if (secili === null) return;
    titret('dokunus');
    setKademeler(k => k.map((x, i) => (i === secili ? kademe : x)));
    setSecili(null);
  };

  /**
   * Tier: bir maddeye dokunmak. Seçili madde yoksa onu seçer, kendisine yeniden dokunmak
   * bırakır; başka bir madde seçiliyken dokunmak seçiliyi bu maddenin kademesine (ya da
   * yerleştirilecekler alanına) taşır — dokunulan yer her zaman "buraya" demek.
   */
  const maddeDokun = (i: number, yer: number | null) => {
    if (secili === null || secili === i) { setSecili(x => (x === i ? null : i)); return; }
    tasi(yer);
  };

  /** Kör Tier: gelen maddeyi kademeye koy; kademe doluysa olmaz. */
  const koy = (kademe: number) => {
    if (kilit || asama !== 'oyun') return;
    if (kademeler.filter(x => x === kademe).length >= KOR_TIER_SINIR) return;
    const madde = gelis[adim];
    setKademeler(k => k.map((x, i) => (i === madde ? kademe : x)));
    titret(kademe === 0 ? 'sampiyon' : 'dokunus');
    setKilit(true);
    setTimeout(() => {
      setKilit(false);
      if (adim + 1 >= 10) { setAsama('sonuc'); titret('basari'); } else setAdim(a => a + 1);
    }, 320);
  };

  const kameraylaBasla = () => {
    basla(asama === 'sonuc' && !arkadas);
    setKameraAnahtari(x => x + 1);
    setKamera(true);
  };

  const gruplar = tierGruplari(kademeler);
  /** Kamera tahtası: kademe başına iki yuva; içinde yerleşen maddelerin geliş sırası. */
  const kameraYuvalari = TIER_KADEMELERI.flatMap((_, k) => {
    const g = gelis.flatMap((madde, sira) => (kademeler[madde] === k ? [sira] : []));
    return Array.from({ length: KOR_TIER_SINIR }, (_, j) => g[j] ?? null);
  });
  const yuvaEtiketleri = TIER_KADEMELERI.flatMap((h, k) =>
    Array.from({ length: KOR_TIER_SINIR }, () => ({ metin: h, renk: klasikRenk(k) })));
  const paylasimAdresi = () =>
    `${window.location.origin}/oyna/kor-tier/${slug}${tohumlu && tohum ? `?t=${tohum}` : ''}`;
  const yerlesmemis = kademeler.flatMap((k, i) => (k === null ? [i] : []));

  return (
    <div className="kor tier-oyun" style={{ '--kor': liste.renk } as React.CSSProperties}>
      <header className="kor-bar">
        <OyunGeri etiket={m.kor.listeler} />
        <span className="kor-bar-ad">
          <em>{kor ? t.korAd : t.ad}</em>
          {asama !== 'giris' && <strong>{liste.simge} {liste.ad}</strong>}
        </span>
        <span className="kor-bar-sayac" aria-live="polite">{asama === 'oyun' && kor ? `${adim + 1}/10` : ''}</span>
      </header>

      {asama === 'giris' && (
        <main className="kor-giris">
          <OyunSahnesi tur={kor ? 'kor-tier' : 'tier'} renk={liste.renk} simge={liste.simge}
                       etiket={kor ? t.korAd : t.ad} maddeler={liste.havuz.slice(0, 4)} />
          <h1 className="kor-giris-baslik">{liste.ad}</h1>
          {arkadas && <p className="kor-arkadas">{t.arkadas}</p>}
          <ul className="kor-kurallar">
            {kor ? (
              <>
                <li><b>1</b><span>{t.korKural1}</span></li>
                <li><b>2</b><span>{t.korKural2[0]}<strong>{t.korKural2[1]}</strong>{t.korKural2[2]}</span></li>
                <li><b>3</b><span>{t.korKural3}</span></li>
              </>
            ) : (
              <>
                <li><b>1</b><span>{t.kural1}</span></li>
                <li><b>2</b><span>{t.kural2}</span></li>
                <li><b>3</b><span>{t.kural3}</span></li>
              </>
            )}
          </ul>
          <button type="button" className="btn-primary kor-basla" onClick={() => basla()}>{t.basla}</button>
          {kor && kameraVar && <KameraDugmesi onKamera={kameraylaBasla} />}
        </main>
      )}

      {asama === 'oyun' && !kor && (
        <main className="tier-tahta">
          <p className="tier-ipucu" aria-live="polite">{secili !== null ? t.ipucuSecili(ad(secili)) : t.ipucu}</p>
          <div className="tier-satirlar">
            {gruplar.map((g, k) => (
              <div
                key={k}
                className={`tier-satir${secili !== null ? ' is-hedef' : ''}`}
                onClick={() => tasi(k)}
              >
                <button type="button" className="tier-satir-etiket" onClick={(e) => { e.stopPropagation(); tasi(k); }}
                        disabled={secili === null} aria-label={t.kademeyeKoy(TIER_KADEMELERI[k])}>
                  <Etiket k={k} buyuk />
                </button>
                <div className="tier-satir-maddeler">
                  {g.map(i => (
                    <button key={i} type="button" className={`tier-madde${secili === i ? ' is-secili' : ''}`}
                            onClick={(e) => { e.stopPropagation(); maddeDokun(i, k); }}>
                      {ad(i)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className={`tier-havuz${secili !== null && kademeler[secili] !== null ? ' is-hedef' : ''}`} onClick={() => tasi(null)}>
            <h2>{yerlesmemis.length ? t.yerlestirilecek : t.hepsiYerlesti}</h2>
            <div className="tier-satir-maddeler">
              {yerlesmemis.map(i => (
                <button key={i} type="button" className={`tier-madde${secili === i ? ' is-secili' : ''}`}
                        onClick={(e) => { e.stopPropagation(); maddeDokun(i, null); }}>
                  {ad(i)}
                </button>
              ))}
            </div>
          </div>
          <div className="ds-cubuk">
            <button type="button" className="btn-primary ds-kontrol" disabled={yerlesmemis.length > 0}
                    onClick={() => { titret('basari'); setAsama('sonuc'); }}>
              {t.bitti}
            </button>
          </div>
        </main>
      )}

      {asama === 'oyun' && kor && gelis.length > 0 && (
        <main className="kor-oyun">
          <div className="kor-sahne">
            <div key={adim} className={`kor-kart${kilit ? ' is-gidiyor' : ''}`}>
              <span className="kor-kart-no">{m.kor.kacinciKayit(adim + 1)}</span>
              <strong>{ad(gelis[adim])}</strong>
            </div>
            <p className="kor-soru">{t.soru}</p>
          </div>
          <div className="tier-satirlar is-kor">
            {gruplar.map((g, k) => {
              const kalan = KOR_TIER_SINIR - g.length;
              return (
                <button key={k} type="button" className="tier-satir" onClick={() => koy(k)}
                        disabled={kalan <= 0 || kilit} aria-label={t.kademeyeKoy(TIER_KADEMELERI[k])}>
                  <Etiket k={k} buyuk />
                  <span className="tier-satir-maddeler">
                    {g.map(i => <span key={i} className="tier-madde is-sabit">{ad(i)}</span>)}
                  </span>
                  <em className="tier-yer">{t.yer(kalan)}</em>
                </button>
              );
            })}
          </div>
        </main>
      )}

      {kor && kamera && asama !== 'giris' && gelis.length > 0 && (
        <KorKamera
          key={kameraAnahtari}
          etiket={`${liste.simge} ${liste.ad}`}
          oyunEtiketi={t.korEtiket}
          renk={liste.renk}
          kayitlar={gelis.map(i => ({ ad: ad(i) }))}
          yuvalar={kameraYuvalari}
          yuvaEtiketleri={yuvaEtiketleri}
          grup={KOR_TIER_SINIR}
          adim={adim}
          kilit={kilit}
          bitti={asama === 'sonuc'}
          onYerlestir={(yuva) => koy(Math.floor(yuva / KOR_TIER_SINIR))}
          adres={`${window.location.host}/oyna/kor-tier/${slug}`}
          dosyaAdi={m.kor.kamera.dosyaAdi(slug)}
          paylasimMetni={`${t.paylasimKor(liste.ad)} ${paylasimAdresi()}`}
          onSonuc={() => setKamera(false)}
          onYenidenCek={kameraylaBasla}
          onKapat={() => setKamera(false)}
        />
      )}

      {asama === 'sonuc' && (
        <TierSonuc
          slug={slug}
          kor={kor}
          tohum={tohumlu ? tohum : null}
          kademeler={kademeler as number[]}
          arkadas={arkadas}
          onTekrar={() => basla(!arkadas)}
        />
      )}
    </div>
  );
}

function TierSonuc({ slug, kor, tohum, kademeler, arkadas, onTekrar }: {
  slug: string; kor: boolean; tohum: string | null; kademeler: number[]; arkadas: number[] | null; onTekrar: () => void;
}) {
  const dil = useDilim();
  const m = useMesajlar();
  const t = m.tier;
  const { user } = useAuth();
  const liste = useMemo(() => katalogListesi(slug, dil)!, [slug, dil]);
  const secim = useMemo(() => oyunSecimi(liste, tohum), [liste, tohum]);
  const ad = (k: number) => liste.havuz[secim[k]];
  const s = tierYaz(kademeler);
  const sorgu = `${tohum ? `t=${tohum}&` : ''}s=${s}`;
  const yol = `/oyna/${kor ? 'kor-tier' : 'tier'}/${slug}`;
  const gercek = useMemo(() => {
    const yer = gercekYerler(liste, secim);
    return yer ? dogruKademeler(yer) : null;
  }, [liste, secim]);
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [bildirim, setBildirim] = useState<string | null>(null);

  useEffect(() => {
    let iptal = false;
    fetch(`/oyna/tier/${slug}/gorsel?${sorgu}${kor ? '&mod=kor' : ''}&${DIL_PARAMETRE}=${dil}`)
      .then(y => (y.ok ? y.blob() : Promise.reject(new Error(String(y.status)))))
      .then(b => { if (!iptal) setGorsel(new File([b], `${t.dosyaAdi(slug)}.png`, { type: 'image/png' })); })
      .catch(() => { /* görsel yoksa yalnızca bağlantı */ });
    return () => { iptal = true; };
  }, [slug, sorgu, kor, dil, t]);

  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(null), 2400);
    return () => clearTimeout(z);
  }, [bildirim]);

  const paylas = async () => {
    const url = `${window.location.origin}${yol}?${sorgu}${dil === 'tr' ? '' : `&${DIL_PARAMETRE}=${dil}`}`;
    const metin = kor ? t.paylasimKor(liste.ad) : t.paylasim(liste.ad);
    try {
      if (gorsel && navigator.canShare?.({ files: [gorsel] })) {
        await navigator.share({ files: [gorsel], text: `${metin} ${url}` });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: kor ? t.korBaslik(liste.ad) : t.baslik(liste.ad), text: metin, url });
        return;
      }
      await navigator.clipboard.writeText(`${metin} ${url}`);
      setBildirim(m.kor.kopyalandi);
    } catch { /* menü kapatıldı */ }
  };

  const indir = () => {
    if (!gorsel) return;
    const u = URL.createObjectURL(gorsel);
    const a = document.createElement('a');
    a.href = u;
    a.download = gorsel.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  };

  return (
    <main className="kor-sonuc">
      <h1 className="kor-sonuc-baslik">{t.seninTablon}</h1>

      {gercek && (
        <div className="kor-uyum">
          <strong>{ayniKademe(kademeler, gercek)}<small>/10</small></strong>
          <span><b>{t.gercekte}</b>{t.gercekMetni(ayniKademe(kademeler, gercek), yakinKademe(kademeler, gercek))}</span>
        </div>
      )}
      {arkadas && (
        <div className="kor-uyum">
          <strong>{ayniKademe(kademeler, arkadas)}<small>/10</small></strong>
          <span><b>{t.arkadasla}</b>{t.arkadasMetni(ayniKademe(kademeler, arkadas))}</span>
        </div>
      )}

      <div className="tier-satirlar is-sonuc">
        {tierGruplari(kademeler).map((g, k) => (
          <div key={k} className="tier-satir">
            <Etiket k={k} buyuk />
            <div className="tier-satir-maddeler">
              {g.map(i => (
                <span key={i} className="tier-madde is-sabit">
                  {ad(i)}
                  {gercek && (gercek[i] === k
                    ? <i className="tier-isaret is-dogru" aria-label={t.gercekte}>✓</i>
                    : <i className="tier-isaret">→{TIER_KADEMELERI[gercek[i]]}</i>)}
                  {!gercek && arkadas && arkadas[i] !== k && <i className="tier-isaret">{TIER_KADEMELERI[arkadas[i]]}</i>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="kor-islemler">
        <button type="button" className="btn-primary" onClick={paylas}>{m.kor.paylas}</button>
        {gorsel && <button type="button" className="btn-quiet kor-indir" onClick={indir}>{m.kor.gorseliIndir}</button>}
        <button type="button" className="btn-quiet" onClick={onTekrar}>{t.tekrar}</button>
        <Link href="/oyna" className="btn-quiet">{m.kor.baskaListe}</Link>
      </div>

      <ModGecisi slug={slug} simdiki={kor ? 'kor-tier' : 'tier'} />

      <Link href="/" className="kor-davet">
        {user ? (
          <><strong>{m.kor.listelerimeDon}</strong><span>{m.kor.listelerimeDonAlt}</span></>
        ) : (
          <><strong>{m.kor.listeKur}</strong><span>{m.kor.listeKurAlt}</span></>
        )}
      </Link>

      {bildirim && <div className="toast" role="status">{bildirim}</div>}
    </main>
  );
}
