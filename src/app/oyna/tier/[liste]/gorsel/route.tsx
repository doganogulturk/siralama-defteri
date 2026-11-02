import { ImageResponse } from 'next/og';
import { katalogListesi, oyunSecimi, tohumGerekli } from '@/lib/katalog';
import { KOR_TIER_SINIR, TIER_KADEMELERI, tierCoz, tierGruplari } from '@/lib/tier-oyun';
import { klasikRenk } from '@/lib/kademe';
import { tohumGecerli } from '@/lib/sayilar';
import { DIL_PARAMETRE, sozluk } from '@/lib/i18n';
import { baglantiDili } from '@/lib/i18n/sunucu';
import { RENK, yaziTipleri } from '@/lib/gorsel-sunucu';
import { GorselLogo } from '@/lib/gorsel-parcalari';

/*
 * Tier ve Kör Tier sonucunun görseli. Sonuç adreste (`?t=&s=`, Kör Tier `mod=kor`).
 *   • varsayılan: story (1080×1920) — beş kademe, maddeler yazı hapları;
 *   • `boyut=kart`: bağlantı önizlemesi (1200×630). Sonuç yoksa boş tablo.
 * Kademeler klasik tier renklerinde (kişisel listelerin görseliyle aynı). Emoji yok.
 */

export const dynamic = 'force-dynamic';

function Tablo({ gruplar, adlar, etiket, yazi, satir }: {
  gruplar: number[][]; adlar: string[]; etiket: number; yazi: number; satir: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {gruplar.map((g, k) => (
        <div key={k} style={{ display: 'flex', minHeight: satir }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: etiket, flexShrink: 0,
              borderRadius: '16px 0 0 16px', background: klasikRenk(k), color: RENK.murekkep,
              fontFamily: 'Instrument Serif', fontSize: satir * 0.55,
            }}
          >
            {TIER_KADEMELERI[k]}
          </div>
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', alignContent: 'center', gap: 8, flex: 1,
              padding: '10px 12px', borderRadius: '0 16px 16px 0', background: RENK.yuzey,
              border: `2px solid ${RENK.cizgi}`, borderLeft: 'none',
            }}
          >
            {g.map(i => (
              <div
                key={i}
                style={{
                  display: 'flex', padding: `${yazi * 0.25}px ${yazi * 0.55}px`, borderRadius: 999,
                  background: RENK.yuzey2, fontSize: yazi, lineHeight: 1.15,
                }}
              >
                {adlar[i]}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export async function GET(istek: Request, { params }: { params: Promise<{ liste: string }> }) {
  const { liste: slug } = await params;
  const adres = new URL(istek.url);
  const dil = baglantiDili(adres.searchParams.get(DIL_PARAMETRE));
  const t = sozluk(dil).tier;
  const liste = katalogListesi(slug, dil);
  if (!liste) return new Response('Bulunamadı', { status: 404 });
  const kor = adres.searchParams.get('mod') === 'kor';
  const t0 = adres.searchParams.get('t');
  const tohum = tohumGerekli(liste) && tohumGecerli(t0) ? t0 : null;
  const secim = oyunSecimi(liste, tohum);
  const kademeler = secim.length ? tierCoz(adres.searchParams.get('s'), kor ? KOR_TIER_SINIR : undefined) : null;
  const kart = adres.searchParams.get('boyut') === 'kart';
  if (!kart && !kademeler) return new Response('Sonuç geçersiz', { status: 400 });
  const fonts = await yaziTipleri();
  const adlar = secim.map(i => liste.havuz[i]);
  const gruplar = kademeler ? tierGruplari(kademeler) : TIER_KADEMELERI.map(() => [] as number[]);
  const etiket = (
    <div style={{ display: 'flex', fontSize: kart ? 24 : 34, letterSpacing: 4, color: liste.renk }}>
      {kor ? t.korEtiket : t.etiket}
    </div>
  );
  const adBoyu = (taban: number) => (liste.ad.length > 22 ? taban * 0.62 : liste.ad.length > 14 ? taban * 0.78 : taban);

  if (kart) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '48px 56px', gap: 40, background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 380 }}>
            <GorselLogo boyut={48} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {etiket}
              <div style={{ fontFamily: 'Instrument Serif', fontSize: adBoyu(84), lineHeight: 0.95 }}>{liste.ad}</div>
              <div style={{ fontSize: 26, color: RENK.soluk }}>{t.senNasil}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
            <Tablo gruplar={gruplar} adlar={adlar} etiket={78} yazi={20} satir={92} />
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
          padding: '190px 64px 200px', background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist',
        }}
      >
        <GorselLogo />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40 }}>
          {etiket}
          <div style={{ fontFamily: 'Instrument Serif', fontSize: adBoyu(120), lineHeight: 0.95, letterSpacing: -1.5, marginTop: 8 }}>{liste.ad}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 48 }}>
          <Tablo gruplar={gruplar} adlar={adlar} etiket={150} yazi={36} satir={170} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 76, lineHeight: 1 }}>{t.senNasil}</div>
          <div style={{ fontSize: 34, color: RENK.soluk, marginTop: 14 }}>{`${adres.host}/oyna/${kor ? 'kor-tier' : 'tier'}/${slug}`}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } },
  );
}
