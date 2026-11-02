import { ImageResponse } from 'next/og';
import { brandInitials } from '@/types/item';
import { iyelik } from '@/lib/paylasim';
import { paylasilanListe } from '@/lib/paylasim-sunucu';
import { KorKayit, korKayitlari, korSonucCoz, korUyum } from '@/lib/kor-liste';
import { DIL_PARAMETRE, sozluk } from '@/lib/i18n';
import { baglantiDili } from '@/lib/i18n/sunucu';
import { RENK, fotoVerisi, yaziTipleri } from '@/lib/gorsel-sunucu';

/*
 * Kendi listenin kör sıralamasının sonuç görseli. Sonuç adreste (`?s=`), hiçbir şey
 * kaydedilmiyor.
 *   • varsayılan: story (1080×1920) — uyum yüzdesi ve on kaydın tamamı, sağda sahibinin sırası;
 *   • `boyut=kart`: bağlantı önizlemesi (1200×630). Sonuç yoksa listenin kendisi, sırasız.
 * Fotoğraflar `fotoVerisi` ile: yalnızca kendi kovadan, sorunlu olan baş harfe düşüyor.
 */

export const dynamic = 'force-dynamic';

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

function Kutu({ kayit, foto, boyut }: { kayit: KorKayit; foto: string | null; boyut: number }) {
  const yaricap = Math.round(boyut * 0.2);
  return foto ? (
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    <img src={foto} width={boyut} height={boyut} style={{ borderRadius: yaricap, objectFit: 'contain', background: RENK.yuzey2 }} />
  ) : (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: boyut, height: boyut,
        borderRadius: yaricap, background: RENK.yuzey2, color: RENK.soluk, fontSize: boyut * 0.3,
      }}
    >
      {brandInitials(kayit.ad)}
    </div>
  );
}

const tekSatir = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const;

/** `uyumEtiketi`nin sunucudaki hâli: istemcinin dili değil bağlantının dili. */
function uyumAdi(uyum: number, adlar: readonly string[]) {
  const sinirlar = [20, 40, 55, 75, 90];
  return adlar[sinirlar.filter(s => uyum >= s).length];
}

/** Bir sıra satırı: benim sıram, fotoğraf, ad ve sağda sahibinin sırası. */
function Satir({ kayit, foto, sira, olcek }: {
  kayit: KorKayit; foto: string | null; sira: number; olcek: number;
}) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 22 * olcek, height: 104 * olcek, padding: `0 ${28 * olcek}px 0 ${18 * olcek}px`,
        borderRadius: 26 * olcek, background: sira === 1 ? RENK.vurguYikama : RENK.yuzey,
        border: `2px solid ${sira === 1 ? '#f3c3ad' : RENK.cizgi}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', width: 60 * olcek, fontFamily: 'Instrument Serif', fontSize: 62 * olcek, lineHeight: 1, color: RENK.vurgu }}>
        {String(sira)}
      </div>
      <Kutu kayit={kayit} foto={foto} boyut={Math.round(76 * olcek)} />
      <div style={{ display: 'flex', flex: 1, minWidth: 0, fontSize: 40 * olcek, ...tekSatir }}>
        {kayit.alt_ad ? `${kayit.ad} ${kayit.alt_ad}` : kayit.ad}
      </div>
      <div style={{ display: 'flex', fontSize: 34 * olcek, color: RENK.soluk }}>
        {kayit.sahipSirasi !== null ? `${kayit.sahipSirasi}.` : '×'}
      </div>
    </div>
  );
}

export async function GET(istek: Request, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const adres = new URL(istek.url);
  const dil = baglantiDili(adres.searchParams.get(DIL_PARAMETRE));
  const t = sozluk(dil);
  const [liste, fonts] = await Promise.all([paylasilanListe(kod), yaziTipleri()]);
  if (!liste) return new Response('Bulunamadı', { status: 404 });
  const kayitlar = korKayitlari(liste.kayitlar);
  const sira = korSonucCoz(kayitlar, adres.searchParams.get('s'));
  const kart = adres.searchParams.get('boyut') === 'kart';
  if (!kart && !sira) return new Response('Sonuç geçersiz', { status: 400 });

  const uyum = sira ? korUyum(sira) : null;
  const sahip = liste.sahip ? t.paylasim.sahibinListesi(iyelik(liste.sahip.split(' ')[0], dil)) : null;
  // Sonuç yokken sahibinin sırası ele verilmesin: kayıtlar alfabetik.
  const gosterilen = (sira ?? [...kayitlar].sort((a, b) => a.ad.localeCompare(b.ad, dil))).slice(0, kart ? 5 : 10);
  const fotolar = await Promise.all(gosterilen.map(k => fotoVerisi(k.foto)));
  const etiket = (
    <div style={{ display: 'flex', fontSize: kart ? 26 : 34, letterSpacing: 4, color: RENK.vurgu }}>{t.kor.etiket}</div>
  );
  const uyumKutusu = (olcek: number) => uyum !== null && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26 * olcek }}>
      <div style={{ display: 'flex', fontFamily: 'Instrument Serif', fontSize: 150 * olcek, lineHeight: 0.9, color: RENK.vurgu }}>
        {`%${uyum}`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * olcek }}>
        <div style={{ display: 'flex', fontSize: 40 * olcek }}>{uyumAdi(uyum, t.kiyas.uyumAdlari)}</div>
        <div style={{ display: 'flex', fontSize: 30 * olcek, color: RENK.soluk }}>
          {t.korListe.uyumGorsel(liste.sahip ? liste.sahip.split(' ')[0] : null)}
        </div>
      </div>
    </div>
  );

  if (kart) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', padding: '52px 60px', gap: 44, background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 480 }}>
            <Logo boyut={48} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {etiket}
              <div style={{ fontFamily: 'Instrument Serif', fontSize: liste.ad.length > 12 ? 78 : 100, lineHeight: 0.95 }}>{liste.ad}</div>
              {sahip && <div style={{ display: 'flex', fontSize: 28, color: RENK.soluk }}>{sahip}</div>}
            </div>
            {uyumKutusu(0.62) || <div style={{ display: 'flex', fontSize: 28, color: RENK.soluk }}>{t.kor.nasilSiralardin}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {gosterilen.map((k, i) => (
              sira ? (
                <Satir key={k.id} kayit={k} foto={fotolar[i]} sira={i + 1} olcek={0.82} />
              ) : (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 18, height: 86, padding: '0 20px', borderRadius: 22, background: RENK.yuzey, border: `2px solid ${RENK.cizgi}` }}>
                  <Kutu kayit={k} foto={fotolar[i]} boyut={62} />
                  <div style={{ display: 'flex', fontSize: 32, ...tekSatir }}>{k.ad}</div>
                  <div style={{ display: 'flex', marginLeft: 'auto', fontFamily: 'Instrument Serif', fontSize: 44, color: RENK.soluk }}>?</div>
                </div>
              )
            ))}
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
          padding: '150px 72px 190px', background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist',
        }}
      >
        <Logo />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 36 }}>
          {etiket}
          <div style={{ fontFamily: 'Instrument Serif', fontSize: liste.ad.length > 12 ? 110 : 140, lineHeight: 0.92, letterSpacing: -2, marginTop: 6 }}>
            {liste.ad}
          </div>
          {sahip && <div style={{ display: 'flex', fontSize: 36, color: RENK.soluk, marginTop: 8 }}>{sahip}</div>}
        </div>

        <div style={{ display: 'flex', marginTop: 26 }}>{uyumKutusu(0.9)}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 26 }}>
          {gosterilen.map((k, i) => (
            <Satir key={k.id} kayit={k} foto={fotolar[i]} sira={i + 1} olcek={0.9} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 28, alignItems: 'center' }}>
          <div style={{ fontFamily: 'Instrument Serif', fontSize: 70, lineHeight: 1 }}>{t.kor.nasilSiralardin}</div>
          <div style={{ display: 'flex', fontSize: 30, color: RENK.soluk, marginTop: 12 }}>{t.korListe.lejant}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, fonts, headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
