'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Marka from '../Marka';
import MobilMenu from '../MobilMenu';
import { katalog } from '@/lib/katalog';
import { SAYILAR_RENK } from '@/lib/sayilar';
import { BugunKartlari, MOD_IDLERI, useModlar, type ModId } from './OyunKartlari';
import DilSecici from '../DilSecici';
import { korBaglantisiGonder, korUygun } from '@/lib/kor-liste';
import { guvenliFoto } from '@/lib/paylasim';
import { useAuth } from '@/hooks/useAuth';
import { useListeler, siralanan } from '@/hooks/useListeler';
import { brandInitials } from '@/types/item';
import ListeRayi from '../ListeRayi';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';
import { listeAdresi } from '@/lib/site';

/**
 * Oyna: giriş istemeyen oyunların merkezi (`/oyna`; giriş yapmamış ziyaretçiye ana sayfada
 * da). Önce günün oyunları, sonra iki tür oyun:
 *   • Zevkine göre (doğru cevap yok): mod seçici (Kör Sıralama, Tier, Kör Tier) ve zevk
 *     listeleri bir kez; seçili mod kataloğun hangi oyuna açılacağını belirliyor. Seçim
 *     adreste (`?mod=tier`); eski `#tier` bağlantıları da aynı modu açıyor.
 *   • Doğrusunu bul (doğru cevap var): Sayılar ve Doğru Sıra listeleri, seçicisiz (`#dogru-sira`).
 * Doğru cevabı olan listeler Kör Sıralama ve Tier'de de oynanıyor (sonuçtaki "başka modda
 * oyna", doğrudan adres); yalnızca zevk kataloğunda görünmüyorlar. En altta kendi listeleri.
 * `misafir` verilirse (giriş yapmamış, ana sayfa) en üstte kendi defterini kurma çağrısı.
 */
export default function OynaMerkezi({ misafir }: { misafir?: React.ReactNode }) {
  const dil = useDilim();
  const mesajlar = useMesajlar();
  const t = mesajlar.kor;
  const o = mesajlar.oyna;
  const { user } = useAuth();
  const tumModlar = useModlar();
  /** Zevk modları seçicide; Doğru Sıra kendi bölümünde. */
  const modlar = tumModlar.filter(x => !x.yalnizcaDogru);
  const dogruMod = tumModlar.find(x => x.yalnizcaDogru)!;
  const [modId, setModId] = useState<ModId>('kor');
  const mod = modlar.find(x => x.id === modId) ?? modlar[0];

  // Adresteki mod: sunucu çizimi varsayılanla, tarayıcı adresi okuyunca düzeltiyor.
  // Doğru Sıra (`?mod=dogru-sira`, eski `#dogru-sira`) artık bir bölüm: oraya kaydırıyor.
  useEffect(() => {
    const adres = new URL(window.location.href);
    const aday = adres.searchParams.get('mod') ?? adres.hash.slice(1);
    if (aday === 'dogru-sira') {
      document.getElementById('dogru-sira')?.scrollIntoView({ block: 'start' });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((MOD_IDLERI as string[]).includes(aday)) setModId(aday as ModId);
  }, []);

  const sec = (id: ModId) => {
    setModId(id);
    const adres = new URL(window.location.href);
    adres.searchParams.set('mod', id);
    adres.hash = '';
    window.history.replaceState(window.history.state, '', adres);
  };

  const tum = katalog(dil);
  const zevkListeleri = tum.filter(l => !l.dogru);
  // İşlemler Sayılar'ın hemen yanında (ikisi de sayı oyunu), sonra veri listeleri.
  const dogruListeleri = tum.filter(l => l.dogru).sort((x, y) => Number(y.slug === 'islemler') - Number(x.slug === 'islemler'));
  return (
    <div className={user ? 'oyna-kabuk' : undefined}>
      {/* Giriş yapmışa masaüstünde ana ekranla aynı sol ray. */}
      {user && <ListeRayi aktifSayfa="oyna" />}
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
              </div>
            </section>
          )}

          <section className="oyna-katalog" aria-labelledby="oyna-zevk">
            <h2 id="oyna-zevk" className="oyna-bolum-baslik">{o.zevkBaslik}</h2>
            <p className="oyna-bolum-alt">{o.zevkAlt}</p>
            <div className="mod-secici" role="tablist" aria-label={o.modSecici}>
              {modlar.map(x => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  id={`mod-${x.id}`}
                  aria-selected={x.id === mod.id}
                  aria-controls="oyna-katalog"
                  className={`mod-sekme${x.id === mod.id ? ' is-secili' : ''}`}
                  style={{ '--kor': x.renk } as React.CSSProperties}
                  onClick={() => sec(x.id)}
                >
                  <span aria-hidden="true">{x.simge}</span>
                  {x.ad}
                </button>
              ))}
            </div>
            <div id="oyna-katalog" role="tabpanel" aria-labelledby={`mod-${mod.id}`}
                 style={{ '--mod': mod.renk } as React.CSSProperties}>
              <p className="oyna-mod-alt">{mod.alt}</p>
              <ul className="katalog-izgara">
                {zevkListeleri.map(l => (
                  <li key={l.slug} style={{ '--kor': l.renk } as React.CSSProperties}>
                    <KatalogKarti href={`/oyna/${mod.id}/${l.slug}`} simge={l.simge} ad={l.ad}
                                  alt={`${l.havuz.slice(0, 3).join(', ')}…`} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Doğru cevabı olan oyunlar: mod seçicisiz, Sayılar ve Doğru Sıra listeleri. */}
          <section id="dogru-sira" className="oyna-katalog" aria-labelledby="oyna-dogru"
                   style={{ '--mod': dogruMod.renk } as React.CSSProperties}>
            <h2 id="oyna-dogru" className="oyna-bolum-baslik">{o.dogruBaslik}</h2>
            <p className="oyna-bolum-alt">{o.dogruAlt}</p>
            <ul className="katalog-izgara">
              <li style={{ '--kor': SAYILAR_RENK } as React.CSSProperties}>
                <KatalogKarti href="/oyna/sayilar" simge="🔢" ad={mesajlar.sayilar.ad} alt={o.sayilarKisa} />
              </li>
              {dogruListeleri.map(l => (
                <li key={l.slug} style={{ '--kor': l.renk } as React.CSSProperties}>
                  <KatalogKarti href={`/oyna/dogru-sira/${l.slug}`} simge={l.simge} ad={l.ad}
                                alt={l.dogru ? `${l.dogru.ust} → ${l.dogru.alt}` : ''} />
                </li>
              ))}
            </ul>
          </section>

          {user && <KendiListelerin />}
        </main>
        <MobilMenu aktif="kor" />
      </div>
    </div>
  );
}

/**
 * Katalogda bir liste. Telefonda tek sütunluk satır (renkli simge kutusu, ad ve altında
 * listeyi tanıtan bir satır: zevk listesinde ilk maddeler, Doğru Sıra'da yön), masaüstünde
 * ızgarada kart. Alt satır neye dokunulduğunu söylüyor; yalnızca ad ve emoji yetmiyordu.
 */
function KatalogKarti({ href, simge, ad, alt }: { href: string; simge: string; ad: string; alt: string }) {
  return (
    <Link href={href} className="katalog-kart">
      <span className="katalog-simge" aria-hidden="true">{simge}</span>
      <span className="katalog-metin">
        <strong>{ad}</strong>
        {alt && <em>{alt}</em>}
      </span>
    </Link>
  );
}

/**
 * Giriş yapmış kullanıcının kör sıralatılabilecek listeleri: en az on kayıtlı olanlar.
 * Paylaşılan listede "Gönder" kör sıralama bağlantısını yolluyor; paylaşılmayanda
 * liste ayarlarına (paylaşım bölümü en üstte) götüren bir bağlantı. Liste Paylaş
 * menüsündeki "Kör sıralat"la aynı iş, keşfedilsin diye burada ve ana ekranda da: "liste
 * ekleyince ne olacak?" sorusunun cevabı, listenin arkadaşa oyun olması.
 */
/** `bosGizle`: uygun liste yoksa hiç çizme (ana ekran; Oyna'da nasıl uygun olunacağını söylüyor). */
export function KendiListelerin({ bosGizle }: { bosGizle?: boolean }) {
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

  if (loading || (bosGizle && uygunlar.length === 0)) return null;
  return (
    <section className="kor-kendi-bolum oyna-kendi">
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
                  <Link href={`${listeAdresi(l.slug)}&ayarlar=1`} className="kor-kendi-ac">{t.paylasimiAc}</Link>
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
