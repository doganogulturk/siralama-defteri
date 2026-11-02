import { ImageResponse } from 'next/og';
import {
  ADET, SAYILAR_RENK, puanla, sayilariUret, tarihYaz, tohumGecerli, tohumTarihi, yerlesimCoz,
} from '@/lib/sayilar';
import { DIL_PARAMETRE, sozluk } from '@/lib/i18n';
import { baglantiDili } from '@/lib/i18n/sunucu';
import { RENK, yaziTipleri } from '@/lib/gorsel-sunucu';

/*
 * Sayılar sonucunun görseli. Sonuç adreste (`?t=&s=`), hiçbir şey kaydedilmiyor.
 *   • varsayılan: story (1080×1920);
 *   • `boyut=kart`: bağlantı önizlemesi (1200×630). Sonuç yoksa oyunun kendisi.
 * Sayılar görselde yazmıyor, yalnızca hangi yuvaların sırada kaldığı: bağlantıyı açan
 * arkadaş aynı sayılarla oynayacak, görsel onları önceden söylemesin.
 */

export const dynamic = 'force-dynamic';

const SOLUK_KARE = '#e4e2dd';

function Logo({ boyut = 60 }: { boyut?: number }) {
  const o = boyut / 60;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 * o }}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7 * o,
          width: boyut, height: boyut, padding: `0 ${11 * o}px`, borderRadius: 16 * o, background: RENK.murekkep,
        }}
      >
        <div style={{ width: 38 * o, height: 8 * o, borderRadius: 4 * o, background: RENK.vurgu }} />
        <div style={{ width: 27 * o, height: 8 * o, borderRadius: 4 * o, background: RENK.zemin }} />
        <div style={{ width: 17 * o, height: 8 * o, borderRadius: 4 * o, background: RENK.zemin }} />
      </div>
      <div style={{ fontSize: 34 * o }}>Sıralama Defteri</div>
    </div>
  );
}

/** On yuva: sırada kalanlar oyunun renginde, dışında kalanlar soluk ve çarpılı. */
function Kareler({ yerinde, boyut, satir }: { yerinde: boolean[]; boyut: number; satir: number }) {
  const bosluk = Math.round(boyut * 0.16);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: bosluk, width: satir * boyut + (satir - 1) * bosluk }}>
      {yerinde.map((d, i) => (
        <div
          key={i}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: boyut, height: boyut, borderRadius: boyut * 0.22,
            background: d ? SAYILAR_RENK : SOLUK_KARE, color: d ? '#ffffff' : RENK.soluk,
          }}
        >
          <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: boyut * 0.5, lineHeight: 1 }}>
            {d ? String(i + 1) : '×'}
          </div>
        </div>
      ))}
    </div>
  );
}

export async function GET(istek: Request) {
  const adres = new URL(istek.url);
  const dil = baglantiDili(adres.searchParams.get(DIL_PARAMETRE));
  const t = sozluk(dil).sayilar;
  const tohum = adres.searchParams.get('t');
  const sira = yerlesimCoz(adres.searchParams.get('s'));
  const kart = adres.searchParams.get('boyut') === 'kart';
  const sonuc = tohumGecerli(tohum) && sira
    ? puanla(sira.map(i => sayilariUret(tohum)[i]))
    : null;
  if (!kart && !sonuc) return new Response('Sonuç geçersiz', { status: 400 });
  const fonts = await yaziTipleri();
  const tarih = tohum && tohumGecerli(tohum) ? tohumTarihi(tohum) : null;
  const altBaslik = tarih ? t.gorselGunluk(tarihYaz(tarih, dil)) : t.gorselSerbest;
  const etiket = (
    <div style={{ display: 'flex', fontSize: kart ? 26 : 34, letterSpacing: 4, color: SAYILAR_RENK }}>{t.etiket}</div>
  );
  const puanYazisi = (boyut: number) => sonuc && (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: boyut * 0.08 }}>
      <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: boyut, lineHeight: 0.9, color: SAYILAR_RENK }}>
        {String(sonuc.puan)}
      </div>
      <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: boyut * 0.45, color: RENK.soluk }}>{`/${ADET}`}</div>
    </div>
  );

  if (kart) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '56px 64px', gap: 48, background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 470 }}>
            <Logo boyut={52} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {etiket}
              <div style={{ fontFamily: 'Instrument Serif', fontSize: 104, lineHeight: 0.95 }}>{t.ad}</div>
              <div style={{ fontSize: 30, color: RENK.soluk }}>{sonuc ? altBaslik : t.kartAltGorsel}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 28, flex: 1 }}>
            {sonuc ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
                {puanYazisi(150)}
                <Kareler yerinde={sonuc.yerinde} boyut={86} satir={5} />
              </div>
            ) : (
              <Kareler yerinde={new Array(ADET).fill(true)} boyut={86} satir={5} />
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
          padding: '190px 84px 210px', background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist',
        }}
      >
        <Logo />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
          {etiket}
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 160, lineHeight: 0.92, letterSpacing: -2, marginTop: 6 }}>{t.ad}</div>
          <div style={{ display: 'flex', fontSize: 40, color: RENK.soluk, marginTop: 12 }}>{altBaslik}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 56, marginTop: 110 }}>
          {puanYazisi(300)}
          <div style={{ display: 'flex', fontSize: 52 }}>{t.puanEtiketi(sonuc!.puan)}</div>
          <Kareler yerinde={sonuc!.yerinde} boyut={150} satir={5} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 36, alignItems: 'center' }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 76, lineHeight: 1 }}>{t.senKac}</div>
          <div style={{ fontSize: 34, color: RENK.soluk, marginTop: 14 }}>{`${adres.host}/oyna/sayilar`}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } },
  );
}
