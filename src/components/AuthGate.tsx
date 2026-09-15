'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle } from '../lib/auth';
import { hataMetni } from '../lib/hata';
import Hesap from './Hesap';
import { SahneSatiri } from './Sahne';

const GoogleIkon = (
  <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

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

/**
 * Giriş ekranındaki özellikler. Sahneler genel ikon değil, uygulamanın kendi
 * arayüzünden küçük parçalar: kullanıcı içeri girince aynı şeyleri tanısın.
 */
const OZELLIKLER: { baslik: string; metin: string; sahne: React.ReactNode }[] = [
  {
    baslik: 'Her şey için ayrı liste',
    metin: 'Kola, döner, kahve — ne denersen onun listesini aç.',
    sahne: (
      <span className="oz-listeler">
        {[['Kola', 12], ['Döner', 7], ['Çay', 5]].map(([ad, adet]) => (
          <span className="oz-liste" key={ad}><b>{adet}</b><em>{ad}</em></span>
        ))}
      </span>
    ),
  },
  {
    baslik: 'Sürükle, diz',
    metin: 'En sevdiğin en üstte; fikrin değişince yerini değiştir.',
    sahne: (
      <>
        <SahneSatiri no="1" ad="Cam şişe" foto="#5a2d1a" className="is-kalkik" />
        <SahneSatiri no="2" ad="Kutu" foto="#b8321a" />
      </>
    ),
  },
  {
    baslik: 'Kendi kategorilerin',
    metin: 'Şekerli–şekersiz, yaprak–kıyma; ayrımı sen koy.',
    sahne: (
      <span className="oz-chipler">
        <em className="oz-chip is-on">Tümü</em>
        <em className="oz-chip">Şekerli</em>
        <em className="oz-chip">Şekersiz</em>
        <em className="oz-chip is-yeni">+ Kategori</em>
      </span>
    ),
  },
  {
    baslik: 'Denemediklerini kenara yaz',
    metin: 'Duyduğun, gördüğün her şey dursun; denedikçe sıralamaya al.',
    sahne: (
      <>
        <span className="oz-segment"><em>Sıralamam</em><em className="is-on">Denenmemiş · 4</em></span>
        <span className="oz-row">
          <span className="oz-foto" style={{ '--f': '#c5501f' } as React.CSSProperties} />
          <span className="oz-ad">Rize turpu</span>
          <em className="oz-denedim">Denedim</em>
        </span>
      </>
    ),
  },
  {
    baslik: 'Bir daha asla',
    metin: 'Beğenmediklerin sıralamayı kirletmesin, çizginin altında dursun.',
    sahne: (
      <>
        <SahneSatiri no="3" ad="Pet şişe" foto="#8c1f12" />
        <span className="oz-cizgi">Bir daha asla</span>
        <SahneSatiri no="✕" ad="Vişneli kola" foto="#7a1f3d" className="is-asla" />
      </>
    ),
  },
  {
    baslik: 'Fotoğrafla hatırla',
    metin: 'Şişesini, paketini çek; hangisi olduğunu karıştırma.',
    sahne: (
      <span className="oz-fotolar">
        <span className="oz-foto-kutu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h3.5L8 5.5h8L17.5 8H21v12H3z" />
            <circle cx="12" cy="13.5" r="3.6" />
          </svg>
        </span>
        <span className="oz-ok">→</span>
        <span className="oz-foto-dolu">
          <svg width="30" height="46" viewBox="0 0 30 46" fill="rgba(255,255,255,0.75)">
            <path d="M11 1h8v8c0 3 5 6 5 12v21a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V21c0-6 5-9 5-12z" />
          </svg>
        </span>
      </span>
    ),
  },
];

/**
 * Oturumsuz kullanıcıya giriş ekranını, oturumlu kullanıcıya uygulamayı gösterir.
 * Sunucu tarafı koruma yok — koruma Supabase'deki RLS politikalarında.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <p className="state-msg">Yükleniyor…</p>;
  }

  if (!user) {
    const handleSignIn = async () => {
      setBusy(true);
      setError(null);
      try {
        await signInWithGoogle();   // Başarılıysa sayfa Google'a gider, dönüş beklenmez.
      } catch (e: unknown) {
        setError(hataMetni(e));
        setBusy(false);
      }
    };

    // Aşağıya kadar okuyan yukarı dönmek zorunda kalmasın: düğme sayfanın dibinde tekrar ediyor.
    const girisDugmesi = (
      <>
        <button type="button" className="gate-btn" onClick={handleSignIn} disabled={busy}>
          <span className="gate-g" aria-hidden="true">{GoogleIkon}</span>
          {busy ? 'Yönlendiriliyor…' : 'Google ile devam et'}
        </button>
        {error && <p className="gate-error">{error}</p>}
      </>
    );

    return (
      <div className="gate">
        <section className="gate-hero">
          <div className="gate-card">
            <GirisDestesi />

            <h1 className="gate-title">Neyi seviyorsan, sırala.</h1>
            <p className="gate-sub">
              Koladan kahveye kendi listelerini kur. Denediklerini sürükleyerek diz,
              denemediklerini kenara yaz.
            </p>

            {girisDugmesi}

            <a href="#ozellikler" className="gate-ipucu">Neler yapabileceğine bak ↓</a>
          </div>
        </section>

        <section id="ozellikler" className="gate-ozellikler" aria-labelledby="ozellikler-baslik">
          <h2 id="ozellikler-baslik" className="gate-bolum-baslik">Neler yapabilirsin?</h2>
          <div className="oz-grid">
            {OZELLIKLER.map(oz => (
              <article className="oz-kart" key={oz.baslik}>
                <div className="oz-sahne" aria-hidden="true">{oz.sahne}</div>
                <h3>{oz.baslik}</h3>
                <p>{oz.metin}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="gate-son">
          <h2 className="gate-bolum-baslik">İlk listeni şimdi aç.</h2>
          {girisDugmesi}
        </section>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Ana ekran hesabı kendi başlığında çiziyor; CSS bu bloğu orada gizliyor. */}
      <Hesap user={user} className="account-btn" />
    </>
  );
}
