import { ImageResponse } from 'next/og';
import { ADET, dogruSiraListesi, maddeleriSec, puanla } from '@/lib/dogru-sira';
import { tarihYaz, tohumGecerli, tohumTarihi, yerlesimCoz } from '@/lib/sayilar';
import { DIL_PARAMETRE, sozluk } from '@/lib/i18n';
import { baglantiDili } from '@/lib/i18n/sunucu';
import { RENK, yaziTipleri } from '@/lib/gorsel-sunucu';
import { GorselLogo, acikTon } from '@/lib/gorsel-parcalari';

/*
 * Doğru Sıra sonucunun görseli. Sonuç adreste (`?t=&s=`), hiçbir şey kaydedilmiyor.
 *   • varsayılan: story (1080×1920);
 *   • `boyut=kart`: bağlantı önizlemesi (1200×630). Sonuç yoksa oyunun kendisi.
 * Maddeler ve değerler görselde yazmıyor, yalnızca her yuvanın doğru yere ne kadar yakın
 * olduğu: bağlantıyı açan arkadaş aynı on maddeyle oynayacak, görsel cevabı söylemesin.
 * Listenin emojisi görselde yok: motor emojiyi çalışma anında bir CDN'den indiriyor.
 */

export const dynamic = 'force-dynamic';

const SOLUK_KARE = '#e4e2dd';

/** On yuva: tam yerinde dolu renk, bir kaymış açık ton, daha uzak soluk ve çarpılı. */
function Kareler({ gercekYer, renk, boyut, satir }: { gercekYer: number[]; renk: string; boyut: number; satir: number }) {
  const bosluk = Math.round(boyut * 0.16);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: bosluk, width: satir * boyut + (satir - 1) * bosluk }}>
      {gercekYer.map((g, i) => {
        const fark = Math.abs(g - i);
        const zemin = fark === 0 ? renk : fark === 1 ? acikTon(renk, 0.6) : SOLUK_KARE;
        return (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: boyut, height: boyut, borderRadius: boyut * 0.22, background: zemin,
              color: fark === 0 ? '#ffffff' : fark === 1 ? RENK.murekkep : RENK.soluk,
              fontFamily: 'Instrument Serif', fontSize: boyut * 0.5, lineHeight: 1,
            }}
          >
            {fark <= 1 ? String(i + 1) : '×'}
          </div>
        );
      })}
    </div>
  );
}

export async function GET(istek: Request, { params }: { params: Promise<{ liste: string }> }) {
  const { liste: slug } = await params;
  const adres = new URL(istek.url);
  const dil = baglantiDili(adres.searchParams.get(DIL_PARAMETRE));
  const t = sozluk(dil).dogruSira;
  const liste = dogruSiraListesi(slug, dil);
  if (!liste) return new Response('Bulunamadı', { status: 404 });
  const tohum = adres.searchParams.get('t');
  const dizilis = yerlesimCoz(adres.searchParams.get('s'));
  const kart = adres.searchParams.get('boyut') === 'kart';
  const sonuc = tohumGecerli(tohum) && dizilis ? puanla(liste, maddeleriSec(slug, tohum), dizilis) : null;
  if (!kart && !sonuc) return new Response('Sonuç geçersiz', { status: 400 });
  const fonts = await yaziTipleri();
  const tarih = tohum && tohumGecerli(tohum) ? tohumTarihi(tohum) : null;
  const altBaslik = tarih ? t.gorselGunluk(tarihYaz(tarih, dil)) : t.kartAlt;
  const etiket = (
    <div style={{ display: 'flex', fontSize: kart ? 26 : 34, letterSpacing: 4, color: liste.renk }}>{t.etiket}</div>
  );
  // Yüzde işareti dile göre önde ya da arkada, sayıdan küçük ve soluk.
  const puanYazisi = (boyut: number) => sonuc && (
    <div style={{ display: 'flex', alignItems: 'baseline', flexDirection: dil === 'tr' ? 'row' : 'row-reverse' }}>
      <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: boyut * 0.5, color: RENK.soluk }}>%</div>
      <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: boyut, lineHeight: 0.9, color: liste.renk }}>
        {String(sonuc.uyum)}
      </div>
    </div>
  );
  const adBoyu = (taban: number) => (liste.ad.length > 22 ? taban * 0.62 : liste.ad.length > 14 ? taban * 0.78 : taban);

  if (kart) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '56px 64px', gap: 48, background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 520 }}>
            <GorselLogo boyut={52} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {etiket}
              <div style={{ fontFamily: 'Instrument Serif', fontSize: adBoyu(92), lineHeight: 0.95 }}>{liste.ad}</div>
              <div style={{ fontSize: 28, color: RENK.soluk }}>{altBaslik}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 28, flex: 1 }}>
            {sonuc ? puanYazisi(150) : null}
            <Kareler gercekYer={sonuc ? sonuc.gercekYer : Array.from({ length: ADET }, (_, i) => i)} renk={liste.renk} boyut={86} satir={5} />
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
        <GorselLogo />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
          {etiket}
          <div style={{ fontFamily: 'Instrument Serif', fontSize: adBoyu(130), lineHeight: 0.95, letterSpacing: -2, marginTop: 8 }}>{liste.ad}</div>
          <div style={{ display: 'flex', fontSize: 40, color: RENK.soluk, marginTop: 12 }}>{altBaslik}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44, marginTop: 70 }}>
          {puanYazisi(280)}
          <div style={{ display: 'flex', fontSize: 52 }}>{t.puanEtiketi(sonuc!.uyum)}</div>
          <Kareler gercekYer={sonuc!.gercekYer} renk={liste.renk} boyut={150} satir={5} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 36, alignItems: 'center' }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 76, lineHeight: 1 }}>{t.senKac}</div>
          <div style={{ fontSize: 34, color: RENK.soluk, marginTop: 14 }}>{`${adres.host}/oyna/dogru-sira/${slug}`}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts, headers: { 'Cache-Control': 'public, max-age=86400, immutable' } },
  );
}
