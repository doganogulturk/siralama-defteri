'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Marka from './Marka';
import DilSecici from './DilSecici';
import { messages } from '../lib/i18n';

/*
 * Oturumsuz açılış: tek ekranlık, kaydırılabilir tanıtım. Dört adım yatayda yan yana
 * (scroll-snap — parmakla kaydırma tarayıcının kendisi), altta noktalar ve hep görünen
 * giriş düğmesi. Adımlar kendiliğinden ilerliyor; kullanıcı dokununca duruyor.
 * Sahneler genel ikon değil, uygulamanın kendi arayüzünden küçük, hareketli parçalar.
 */

interface OrnekKayit { ad: string; foto: string }

/**
 * Giriş destesinde sırayla öne geçen örnek listeler — her biri başka bir şey.
 * Her kart küçük bir sıralama ekranı: kategoriler, fotoğraflı ilk üç ve çizginin
 * altında bir "Bir daha asla". Adlar sözlükte (`tanitim.deste`); burada kartın
 * vurgu rengi ve fotoğraf yerine duran kutucukların renkleri, aynı sırayla.
 */
const DESTE_RENKLERI: { renk: string; sira: [string, string, string]; asla: string }[] = [
  { renk: '#e03c10', sira: ['#5a2d1a', '#b8321a', '#8c1f12'], asla: '#7a1f3d' },
  { renk: '#6b4fbb', sira: ['#6f4a2f', '#b07a4a', '#3d2a1f'], asla: '#8a8577' },
  { renk: '#127a5b', sira: ['#b8742f', '#8a4b22', '#d9a55a'], asla: '#c9b79c' },
  { renk: '#b45309', sira: ['#7c9a3a', '#c8932f', '#a86b2a'], asla: '#b5a58a' },
  { renk: '#1f6feb', sira: ['#9b2d1f', '#c5501f', '#5e7d3a'], asla: '#b58a4a' },
  { renk: '#c2436f', sira: ['#b3421f', '#d0662e', '#8f3a1c'], asla: '#a39a8c' },
];

function deste() {
  return messages().tanitim.deste.map((kart, i) => {
    const r = DESTE_RENKLERI[i];
    return {
      ad: kart.ad,
      renk: r.renk,
      kategoriler: kart.kategoriler,
      sira: kart.sira.map((ad, n): OrnekKayit => ({ ad, foto: r.sira[n] })),
      asla: { ad: kart.asla, foto: r.asla } as OrnekKayit,
    };
  });
}
const DESTE_ARALIK_MS = 2800;

/**
 * Kartın destedeki yeri. Görünen üç yuva ön, sağ ve sol; `cikis` az önce öne
 * çıkıp savrulan kart, `bekle` sırasını bekleyenler. Konumları CSS çiziyor,
 * yuva değişince kart transform geçişiyle yeni yerine kayıyor.
 */
type Yuva = '1' | '2' | '3' | 'cikis' | 'bekle';

const yuvaBul = (i: number, adim: number, n: number): Yuva => {
  const fark = (((i - adim) % n) + n) % n;
  if (fark < 3) return String(fark + 1) as Yuva;
  return fark === n - 1 ? 'cikis' : 'bekle';
};

const OrnekSatir = ({ kayit, no }: { kayit: OrnekKayit; no: string }) => (
  <span className="gk-row">
    <i>{no}</i>
    <span className="gk-foto" style={{ '--f': kayit.foto } as React.CSSProperties} />
    <span className="gk-ad">{kayit.ad}</span>
  </span>
);

function GirisDestesi() {
  const [adim, setAdim] = useState(0);
  const kartlar = deste();
  const asla = messages().tanitim.birDahaAsla;

  useEffect(() => {
    // Hareketi azaltmak isteyen cihazda deste durağan kalıyor.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setAdim(a => a + 1), DESTE_ARALIK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="gate-deste" aria-hidden="true">
      {kartlar.map((kart, i) => {
        const yuva = yuvaBul(i, adim, kartlar.length);
        return (
          <span
            key={kart.ad}
            className="gate-kart"
            data-yuva={yuva}
            style={{ '--k': kart.renk } as React.CSSProperties}
          >
            <b className="gk-bas">{kart.ad}</b>
            <span className="gk-kat">
              <em className="is-on">{kart.kategoriler[0]}</em><em>{kart.kategoriler[1]}</em>
            </span>
            <span className="gk-sira">
              {kart.sira.map((k, n) => <OrnekSatir key={k.ad} kayit={k} no={String(n + 1)} />)}
            </span>
            <span className="gk-cizgi">{asla}</span>
            <span className="gk-asla"><OrnekSatir kayit={kart.asla} no="✕" /></span>
          </span>
        );
      })}
    </div>
  );
}

const TacIkon = (
  <svg width="22" height="17" viewBox="0 0 26 20" aria-hidden="true">
    <path d="M2 6l5.5 5L13 2l5.5 9L24 6l-2.4 12H4.4z" fill="currentColor" />
  </svg>
);

/** Sürükle, taçlandır: ikinci satır döngüyle en üste çıkıp tacı takıyor. */
function SiralaSahnesi() {
  const t = messages().tanitim;
  const [s1, s2, s3] = t.sirala.satirlar;
  return (
    <div className="tn-sirala" aria-hidden="true">
      {/* Numaralar yerinde duruyor, satırlar altlarında yer değiştiriyor. */}
      <span className="tn-nolar"><i>1</i><i>2</i><i>3</i></span>
      <span className="tn-satirlar">
        <span className="tn-satir tn-s1"><b style={{ '--f': '#5a2d1a' } as React.CSSProperties} />{s1}</span>
        <span className="tn-satir tn-s2"><b style={{ '--f': '#c5501f' } as React.CSSProperties} />{s2}<em className="tn-tac">{TacIkon}</em></span>
        <span className="tn-satir tn-s3"><b style={{ '--f': '#8a8f2b' } as React.CSSProperties} />{s3}</span>
      </span>
      <span className="tn-cizgi">{t.birDahaAsla}</span>
      <span className="tn-satir tn-asla"><i>✕</i><b style={{ '--f': '#8a8577' } as React.CSSProperties} />{t.sirala.asla}</span>
    </div>
  );
}

/** Paylaş, karşılaştır: iki şampiyon ve dolan uyum halkası. */
function KarsilastirSahnesi() {
  const k = messages().tanitim.kiyas;
  return (
    <div className="tn-kiyas" aria-hidden="true">
      <span className="tn-kisi"><b style={{ '--f': '#b8742f' } as React.CSSProperties} /><em>{k.sen}</em><strong>{k.senin}</strong></span>
      <span className="tn-halka">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" className="tn-halka-iz" /><circle cx="60" cy="60" r="52" className="tn-halka-dolu" /></svg>
        <strong>%72</strong>
      </span>
      <span className="tn-kisi"><b style={{ '--f': '#8a4b22' } as React.CSSProperties} /><em>{k.arkadas}</em><strong>{k.onun}</strong></span>
      <span className="tn-etiket">{k.etiket}</span>
    </div>
  );
}

/** Kör Sıralama: kart düşüyor, boş bir yuvaya oturuyor; sıradaki geliyor. */
function KorSahnesi() {
  const k = messages().tanitim.kor;
  return (
    <div className="tn-kor" aria-hidden="true">
      <span className="tn-kor-kart">{k.kart}</span>
      <span className="tn-yuvalar">
        <span className="tn-yuva is-dolu"><i>1</i>{k.dolu1}</span>
        <span className="tn-yuva"><i>2</i></span>
        <span className="tn-yuva tn-hedef"><i>3</i><em>{k.kart}</em></span>
        <span className="tn-yuva"><i>4</i></span>
        <span className="tn-yuva is-dolu"><i>5</i>{k.dolu5}</span>
      </span>
    </div>
  );
}

const SAHNELER: React.ReactNode[] = [<GirisDestesi key="deste" />, <SiralaSahnesi key="sirala" />, <KarsilastirSahnesi key="kiyas" />, <KorSahnesi key="kor" />];
const ADIM_SAYISI = SAHNELER.length;

function adimlar() {
  return messages().tanitim.adimMetinleri.map((a, i) => ({
    etiket: a.etiket,
    baslik: <>{a.baslik[0]}<em>{a.baslik[1]}</em>{a.baslik[2]}</>,
    metin: a.metin,
    sahne: SAHNELER[i],
  }));
}

const ARALIK_MS = 5200;

export default function Tanitim({ girisDugmesi }: { girisDugmesi: React.ReactNode }) {
  const iz = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(0);
  /** Kullanıcı dokunduysa kendiliğinden ilerleme duruyor: elindekini kaydırmasın. */
  const [elle, setElle] = useState(false);
  const m = messages();
  const ADIMLAR = adimlar();

  const git = (i: number) => {
    const el = iz.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (elle || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => git((aktif + 1) % ADIM_SAYISI), ARALIK_MS);
    return () => window.clearTimeout(t);
  }, [aktif, elle]);

  return (
    <div className="tn">
      <header className="tn-bar">
        <Marka />
        <DilSecici className="tn-dil" kisa />
        <Link href="/kor" className="tn-oyna">{m.tanitim.oyna}</Link>
      </header>

      <div
        ref={iz}
        className="tn-iz"
        onPointerDown={() => setElle(true)}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== aktif) setAktif(i);
        }}
      >
        {ADIMLAR.map((a, i) => (
          <section
            key={a.etiket}
            className={`tn-adim${i === aktif ? ' is-aktif' : ''}`}
            aria-roledescription={m.tanitim.adim}
            aria-label={`${i + 1} / ${ADIMLAR.length}`}
          >
            <div className="tn-sahne">{a.sahne}</div>
            <p className="tn-etiket-ust">{i + 1} / {ADIMLAR.length} · {a.etiket}</p>
            <h1 className="tn-baslik">{a.baslik}</h1>
            <p className="tn-metin">{a.metin}</p>
            {i === ADIMLAR.length - 1 && <Link href="/kor" className="tn-kor-dugme">{m.tanitim.hemenOyna}</Link>}
          </section>
        ))}
      </div>

      <footer className="tn-alt">
        <div className="tn-noktalar" role="tablist" aria-label={m.tanitim.adimlar}>
          {ADIMLAR.map((a, i) => (
            <button
              key={a.etiket}
              type="button"
              role="tab"
              aria-selected={i === aktif}
              aria-label={m.tanitim.adimEtiketi(i + 1, a.etiket)}
              className={i === aktif ? 'is-on' : ''}
              onClick={() => { setElle(true); git(i); }}
            />
          ))}
        </div>
        {girisDugmesi}
        <p className="gate-yasal">
          {m.giris.yasalOnay[0]}<a href="/kullanim-kosullari">{m.giris.kosullar}</a>{m.giris.yasalOnay[1]}
          <a href="/gizlilik">{m.giris.gizlilik}</a>{m.giris.yasalOnay[2]}
        </p>
      </footer>
    </div>
  );
}
