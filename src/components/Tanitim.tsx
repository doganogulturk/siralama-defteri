'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Marka from './Marka';

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
 * altında bir "Bir daha asla". `foto` fotoğraf yerine duran kutucuğun rengi.
 */
const DESTE: {
  ad: string; renk: string; kategoriler: [string, string]; sira: OrnekKayit[]; asla: OrnekKayit;
}[] = [
  {
    ad: 'Kola', renk: '#e03c10', kategoriler: ['Şekerli', 'Şekersiz'],
    sira: [{ ad: 'Cam şişe', foto: '#5a2d1a' }, { ad: 'Kutu', foto: '#b8321a' }, { ad: 'Pet şişe', foto: '#8c1f12' }],
    asla: { ad: 'Vişneli kola', foto: '#7a1f3d' },
  },
  {
    ad: 'Türk kahvesi', renk: '#6b4fbb', kategoriler: ['Sade', 'Orta'],
    sira: [{ ad: 'Közde', foto: '#6f4a2f' }, { ad: 'Bakır cezve', foto: '#b07a4a' }, { ad: 'Makinede', foto: '#3d2a1f' }],
    asla: { ad: 'Mikrodalgada', foto: '#8a8577' },
  },
  {
    ad: 'Döner', renk: '#127a5b', kategoriler: ['Et', 'Tavuk'],
    sira: [{ ad: 'Yaprak', foto: '#b8742f' }, { ad: 'İskender', foto: '#8a4b22' }, { ad: 'Dürüm', foto: '#d9a55a' }],
    asla: { ad: 'Dünden kalma', foto: '#c9b79c' },
  },
  {
    ad: 'Baklava', renk: '#b45309', kategoriler: ['Fıstıklı', 'Cevizli'],
    sira: [{ ad: 'Havuç dilimi', foto: '#7c9a3a' }, { ad: 'Şöbiyet', foto: '#c8932f' }, { ad: 'Burma', foto: '#a86b2a' }],
    asla: { ad: 'Kuru baklava', foto: '#b5a58a' },
  },
  {
    ad: 'Çay', renk: '#1f6feb', kategoriler: ['Siyah', 'Bitki'],
    sira: [{ ad: 'Tavşan kanı', foto: '#9b2d1f' }, { ad: 'Semaver', foto: '#c5501f' }, { ad: 'Ihlamur', foto: '#5e7d3a' }],
    asla: { ad: 'Poşet çay', foto: '#b58a4a' },
  },
  {
    ad: 'Lahmacun', renk: '#c2436f', kategoriler: ['Acılı', 'Acısız'],
    sira: [{ ad: 'Urfa usulü', foto: '#b3421f' }, { ad: 'Antep usulü', foto: '#d0662e' }, { ad: 'Kıbrıs usulü', foto: '#8f3a1c' }],
    asla: { ad: 'Donmuş', foto: '#a39a8c' },
  },
];
const DESTE_ARALIK_MS = 2800;

/**
 * Kartın destedeki yeri. Görünen üç yuva ön, sağ ve sol; `cikis` az önce öne
 * çıkıp savrulan kart, `bekle` sırasını bekleyenler. Konumları CSS çiziyor,
 * yuva değişince kart transform geçişiyle yeni yerine kayıyor.
 */
type Yuva = '1' | '2' | '3' | 'cikis' | 'bekle';

const yuvaBul = (i: number, adim: number): Yuva => {
  const n = DESTE.length;
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

  useEffect(() => {
    // Hareketi azaltmak isteyen cihazda deste durağan kalıyor.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setAdim(a => a + 1), DESTE_ARALIK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="gate-deste" aria-hidden="true">
      {DESTE.map((kart, i) => {
        const yuva = yuvaBul(i, adim);
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
            <span className="gk-cizgi">Bir daha asla</span>
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
  return (
    <div className="tn-sirala" aria-hidden="true">
      {/* Numaralar yerinde duruyor, satırlar altlarında yer değiştiriyor. */}
      <span className="tn-nolar"><i>1</i><i>2</i><i>3</i></span>
      <span className="tn-satirlar">
        <span className="tn-satir tn-s1"><b style={{ '--f': '#5a2d1a' } as React.CSSProperties} />Mercimek</span>
        <span className="tn-satir tn-s2"><b style={{ '--f': '#c5501f' } as React.CSSProperties} />Ezogelin<em className="tn-tac">{TacIkon}</em></span>
        <span className="tn-satir tn-s3"><b style={{ '--f': '#8a8f2b' } as React.CSSProperties} />Yayla</span>
      </span>
      <span className="tn-cizgi">Bir daha asla</span>
      <span className="tn-satir tn-asla"><i>✕</i><b style={{ '--f': '#8a8577' } as React.CSSProperties} />Kelle paça</span>
    </div>
  );
}

/** Paylaş, karşılaştır: iki şampiyon ve dolan uyum halkası. */
function KarsilastirSahnesi() {
  return (
    <div className="tn-kiyas" aria-hidden="true">
      <span className="tn-kisi"><b style={{ '--f': '#b8742f' } as React.CSSProperties} /><em>Sen</em><strong>Yaprak</strong></span>
      <span className="tn-halka">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" className="tn-halka-iz" /><circle cx="60" cy="60" r="52" className="tn-halka-dolu" /></svg>
        <strong>%72</strong>
      </span>
      <span className="tn-kisi"><b style={{ '--f': '#8a4b22' } as React.CSSProperties} /><em>Ayşe</em><strong>İskender</strong></span>
      <span className="tn-etiket">Aynı damak</span>
    </div>
  );
}

/** Kör Sıralama: kart düşüyor, boş bir yuvaya oturuyor; sıradaki geliyor. */
function KorSahnesi() {
  return (
    <div className="tn-kor" aria-hidden="true">
      <span className="tn-kor-kart">Künefe</span>
      <span className="tn-yuvalar">
        <span className="tn-yuva is-dolu"><i>1</i>Baklava</span>
        <span className="tn-yuva"><i>2</i></span>
        <span className="tn-yuva tn-hedef"><i>3</i><em>Künefe</em></span>
        <span className="tn-yuva"><i>4</i></span>
        <span className="tn-yuva is-dolu"><i>5</i>Sütlaç</span>
      </span>
    </div>
  );
}

const ADIMLAR: { etiket: string; baslik: React.ReactNode; metin: React.ReactNode; sahne: React.ReactNode }[] = [
  {
    etiket: 'Sıralama Defteri',
    baslik: <>Neyi seviyorsan, <em>sırala.</em></>,
    metin: 'Koladan kahveye kendi listelerini kur. Denediklerini fotoğraflarıyla diz, denemediklerini kenara yaz.',
    sahne: <GirisDestesi />,
  },
  {
    etiket: 'Sürükle',
    baslik: <>Fikrin değişti mi? <em>Yerini</em> değiştir.</>,
    metin: 'Sürükleyerek sırala; yeni şampiyon tacını takar. Beğenmediklerin “Bir daha asla” çizgisinin altında durur.',
    sahne: <SiralaSahnesi />,
  },
  {
    etiket: 'Paylaş',
    baslik: <>Arkadaşınla <em>karşılaştır.</em></>,
    metin: 'Listeni bir bağlantıyla gönder; o da kendi sırasını yapsın. Zevkleriniz yüzde kaç uyuşuyor, birlikte görün.',
    sahne: <KarsilastirSahnesi />,
  },
  {
    etiket: 'Oyun',
    baslik: <>Kör <em>Sıralama.</em></>,
    metin: 'On kayıt birer birer gelir; sıradakini bilmeden her birini bir sıraya koy. Giriş yapmadan hemen oyna.',
    sahne: <KorSahnesi />,
  },
];

const ARALIK_MS = 5200;

export default function Tanitim({ girisDugmesi }: { girisDugmesi: React.ReactNode }) {
  const iz = useRef<HTMLDivElement>(null);
  const [aktif, setAktif] = useState(0);
  /** Kullanıcı dokunduysa kendiliğinden ilerleme duruyor: elindekini kaydırmasın. */
  const [elle, setElle] = useState(false);

  const git = (i: number) => {
    const el = iz.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (elle || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setTimeout(() => git((aktif + 1) % ADIMLAR.length), ARALIK_MS);
    return () => window.clearTimeout(t);
  }, [aktif, elle]);

  return (
    <div className="tn">
      <header className="tn-bar">
        <Marka />
        <Link href="/kor" className="tn-oyna">Oyna</Link>
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
            aria-roledescription="adım"
            aria-label={`${i + 1} / ${ADIMLAR.length}`}
          >
            <div className="tn-sahne">{a.sahne}</div>
            <p className="tn-etiket-ust">{i + 1} / {ADIMLAR.length} · {a.etiket}</p>
            <h1 className="tn-baslik">{a.baslik}</h1>
            <p className="tn-metin">{a.metin}</p>
            {i === ADIMLAR.length - 1 && <Link href="/kor" className="tn-kor-dugme">Hemen oyna →</Link>}
          </section>
        ))}
      </div>

      <footer className="tn-alt">
        <div className="tn-noktalar" role="tablist" aria-label="Tanıtım adımları">
          {ADIMLAR.map((a, i) => (
            <button
              key={a.etiket}
              type="button"
              role="tab"
              aria-selected={i === aktif}
              aria-label={`${i + 1}. adım: ${a.etiket}`}
              className={i === aktif ? 'is-on' : ''}
              onClick={() => { setElle(true); git(i); }}
            />
          ))}
        </div>
        {girisDugmesi}
        <p className="gate-yasal">
          Devam ederek <a href="/gizlilik">gizlilik politikasını</a> kabul etmiş olursun.
        </p>
      </footer>
    </div>
  );
}
