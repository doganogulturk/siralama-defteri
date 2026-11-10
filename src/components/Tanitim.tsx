'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Marka from './Marka';
import DilSecici from './DilSecici';
import OyunSahnesi from './oyna/OyunSahnesi';
import { messages } from '@/lib/i18n';

/*
 * Oturumsuz açılış: tek ekranlık, kaydırılabilir tanıtım. Beş adım yatayda yan yana
 * (scroll-snap — parmakla kaydırma tarayıcının kendisi), altta noktalar ve hep görünen
 * giriş düğmesi. Adımlar kendiliğinden ilerliyor; kullanıcı dokununca duruyor.
 * Sahneler genel ikon değil, uygulamanın kendi arayüzünden küçük, hareketli parçalar:
 *   1. defter — sırayla öne geçen örnek listeler;
 *   2. Bugün — Günün İşlemleri'nin tanıtım kartı (Doğru Sıra'nın iki hamlesi);
 *   3. Kör Sıralama — oyunun tanıtım kartı ("ister 1'den 10'a…");
 *   4. Kör Tier — oyunun tanıtım kartı ("…ister S'den D'ye"; başlık 3 ile aynı, metin devamı);
 *   5. paylaş — iki şampiyon ve uyum halkası.
 * 2–4 oyunların giriş ekranındaki kartın kendisi (`OyunSahnesi`): oyun değişirse tanıtım da.
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
  { renk: '#b45309', sira: ['#7c9a3a', '#c8932f', '#e6d6b0'], asla: '#b5a58a' },
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

/** Günün İşlemleri: dört işlem sonuca göre diziliyor. İşlemler iki dilde aynı. */
const ISLEM_ORNEGI = ['24 ÷ 2', '35 − 9', '6 × 8', '9 × 9'];

function BugunSahnesi() {
  const m = messages();
  return <OyunSahnesi tur="dogru-sira" renk="#9333ea" simge="🧮" etiket={m.oyna.gununIslemleri} maddeler={ISLEM_ORNEGI} />;
}

function KorSahnesi() {
  const m = messages();
  return <OyunSahnesi tur="kor" renk="#c2410c" simge="🍲" etiket={m.kor.ad} maddeler={m.tanitim.korSahne} />;
}

function KorTierSahnesi() {
  const m = messages();
  return <OyunSahnesi tur="kor-tier" renk="#c2436f" simge="🍮" etiket={m.tier.korAd} maddeler={m.tanitim.korTierSahne} />;
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

const SAHNELER = [GirisDestesi, BugunSahnesi, KorSahnesi, KorTierSahnesi, KarsilastirSahnesi];
const ADIM_SAYISI = SAHNELER.length;
/** Oyun adımlarında "Hemen oyna": oyunlar giriş istemiyor; Kör Sıralama ve Kör Tier kendi modunu açıyor. */
const OYUN_ADRESLERI: (string | null)[] = [null, '/oyna', '/oyna?mod=kor', '/oyna?mod=kor-tier', null];

function adimlar() {
  return messages().tanitim.adimMetinleri.map((a, i) => ({
    etiket: a.etiket,
    baslik: <>{a.baslik[0]}<em>{a.baslik[1]}</em>{a.baslik[2]}</>,
    metin: a.metin,
    sahne: SAHNELER[i],
  }));
}

/** Adımın ekranda kalma süresi; oyun kartlarının iki hamlesi 8 saniyede bitiyor. */
const SURELER_MS = [5200, 8400, 8400, 8400, 5200];

/**
 * `girisDugmesi` yoksa (giriş yapmış kullanıcı Hesabım → "Nasıl çalışır?" ile açtı) altta
 * giriş yerine listelerine dönüş.
 */
export default function Tanitim({ girisDugmesi }: { girisDugmesi?: React.ReactNode }) {
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

  // Ekran dönünce (iPad) ya da pencere boyu değişince iz yarım kartta kalmasın: öndeki adıma otur.
  const aktifRef = useRef(aktif);
  aktifRef.current = aktif;
  useEffect(() => {
    const otur = () => {
      const el = iz.current;
      if (el) el.scrollTo({ left: aktifRef.current * el.clientWidth, behavior: 'instant' });
    };
    window.addEventListener('resize', otur);
    return () => window.removeEventListener('resize', otur);
  }, []);

  useEffect(() => {
    if (elle || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => git((aktif + 1) % ADIM_SAYISI), SURELER_MS[aktif]);
    return () => window.clearTimeout(t);
  }, [aktif, elle]);

  return (
    <div className="tn">
      <header className="tn-bar">
        <Marka />
        <DilSecici className="tn-dil" kisa />
        <Link href="/oyna" className="tn-oyna">{m.tanitim.oyna}</Link>
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
            {/* Adım öne gelince sahne baştan başlıyor: oyun kartı ilk hamleden oynasın. */}
            <div className="tn-sahne" key={i === aktif ? 'aktif' : 'bekle'}><a.sahne /></div>
            <div className="tn-yazi">
              <p className="tn-etiket-ust">{i + 1} / {ADIMLAR.length} · {a.etiket}</p>
              <h1 className="tn-baslik">{a.baslik}</h1>
              <p className="tn-metin">{a.metin}</p>
              {OYUN_ADRESLERI[i] && <Link href={OYUN_ADRESLERI[i]} className="tn-kor-dugme">{m.tanitim.hemenOyna}</Link>}
            </div>
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
        {girisDugmesi ? (
          <>
            {girisDugmesi}
            <p className="gate-yasal">
              {m.giris.yasalOnay[0]}<a href="/kullanim-kosullari">{m.giris.kosullar}</a>{m.giris.yasalOnay[1]}
              <a href="/gizlilik">{m.giris.gizlilik}</a>{m.giris.yasalOnay[2]}
            </p>
          </>
        ) : (
          <Link href="/" className="gate-btn tn-don">{m.liste.listelerimeDon}</Link>
        )}
      </footer>
    </div>
  );
}
