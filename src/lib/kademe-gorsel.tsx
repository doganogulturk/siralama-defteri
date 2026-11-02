import { Kademe, brandInitials } from '@/types/item';
import { PaylasilanKayit, PaylasilanListe, iyelik } from './paylasim';
import { sozluk, type Dil } from './i18n';
import { RENK, fotoVerisi } from './gorsel-sunucu';
import { GorselLogo } from './gorsel-parcalari';
import { kademeGorselYerlesimi, kademeGruplari, klasikRenk } from './kademe';

/*
 * Kademeli listenin story görseli (1080×1920, `p/[kod]/hikaye`): her kademe bir satır,
 * solda klasik tier renginde etiket, sağda kayıtların fotoğrafları (fotoğrafsızın adı).
 * Uygulamanın içinde tek vurgu renginin tonları var; görselde tanıdık klasik renkler
 * (docs/kararlar.md). Kutucuk boyu her şey sığacak biçimde hesaplanıyor
 * (`kademeGorselYerlesimi`); "Bir daha asla" görselde yok.
 */

const KENAR = 60;
const ETIKET = 150;
const ARALIK = 10;
const IC = 10;
/** Kutunun 2 px çerçevesi: satori'de kutular border-box, içerik o kadar daralıyor. */
const CERCEVE = 2;
const SATIR_ARALIGI = 10;
/** Kademelere kalan yükseklik: üst/alt güvenli alan, başlık ve kapanış çıkınca. */
const KADEMELER_YUKSEKLIK = 1000;
const ICERIK_GENISLIK = 1080 - KENAR * 2 - ETIKET - 2;

/** Etiket uzadıkça yazı küçülüyor: "S" iri, "Efsane" sığsın. */
const etiketBoyu = (etiket: string, satir: number) =>
  Math.min(satir * 0.62, etiket.length <= 2 ? 96 : Math.max(30, 96 - (etiket.length - 2) * 14));

function Kutucuk({ kayit, foto, kutu }: { kayit: PaylasilanKayit; foto: string | null; kutu: number }) {
  if (foto) {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img src={foto} width={kutu} height={kutu} style={{ borderRadius: 12, objectFit: 'cover' }} />;
  }
  // Fotoğrafsız kayıt: adı kutunun içinde; çok küçük kutuda baş harfler.
  const kucuk = kutu < 80;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: kutu, height: kutu,
        padding: kucuk ? 0 : 8, borderRadius: 12, background: RENK.yuzey2, color: RENK.murekkep,
        fontSize: kucuk ? kutu * 0.32 : Math.max(17, Math.round(kutu * 0.16)), lineHeight: 1.1,
        textAlign: 'center', overflow: 'hidden',
      }}
    >
      {kucuk ? brandInitials(kayit.ad) : kayit.ad}
    </div>
  );
}

export async function KademeHikayesi({ liste, kademeler, dil, site }: {
  liste: PaylasilanListe; kademeler: Kademe[]; dil: Dil; site: string;
}) {
  const t = sozluk(dil);
  const siralama = liste.kayitlar.filter(k => !k.asla);
  // Kademesizler doluysa en altta etiketsiz bir satır.
  const gruplar = kademeGruplari(siralama, kademeler).filter(g => g.kademe || g.items.length > 0);
  const yer = kademeGorselYerlesimi(gruplar.map(g => g.items.length), {
    genislik: ICERIK_GENISLIK - (IC + CERCEVE) * 2, yukseklik: KADEMELER_YUKSEKLIK, aralik: ARALIK,
    ic: IC + CERCEVE, satirAraligi: SATIR_ARALIGI,
  });
  const gosterilenler = gruplar.map((g, i) => g.items.slice(0, yer.gosterilen[i]));
  const fotolar = new Map(await Promise.all(
    gosterilenler.flat().map(async k => [k.id, await fotoVerisi(k.fotograf_url)] as const)));
  const sahip = t.paylasimSayfasi.storySahibi(liste.sahip ? iyelik(liste.sahip.split(' ')[0], dil) : null);
  const adBoyu = liste.ad.length > 18 ? 76 : liste.ad.length > 11 ? 96 : 120;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
        // Üst ve alt ~200 px'i Instagram'ın kendi arayüzü kaplıyor: içerik güvenli alanda.
        padding: `200px ${KENAR}px 200px`, background: RENK.zemin, color: RENK.murekkep, fontFamily: 'Geist',
      }}
    >
      <GorselLogo />
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32 }}>
        <div style={{ fontSize: 38, color: RENK.soluk }}>{sahip}</div>
        <div style={{ fontFamily: 'Instrument Serif', fontSize: adBoyu, lineHeight: 0.95, letterSpacing: -1.5, marginTop: 4 }}>
          {liste.ad}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SATIR_ARALIGI, marginTop: 36 }}>
        {gruplar.map((g, i) => {
          const boy = yer.satirlar[i];
          const etiket = g.kademe?.etiket ?? '–';
          return (
            <div key={g.kademe?.anahtar ?? '-'} style={{ display: 'flex', height: boy }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: ETIKET, height: boy,
                  borderRadius: '18px 0 0 18px', background: g.kademe ? klasikRenk(i) : '#d9d5cf',
                  color: '#1a1512', fontFamily: 'Instrument Serif', fontSize: etiketBoyu(etiket, boy),
                  lineHeight: 1, textAlign: 'center', padding: '0 8px',
                }}
              >
                {etiket}
              </div>
              <div
                style={{
                  display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: ARALIK, width: ICERIK_GENISLIK,
                  height: boy, padding: IC, borderRadius: '0 18px 18px 0', background: RENK.yuzey,
                  border: `${CERCEVE}px solid ${RENK.cizgi}`, borderLeft: 'none',
                }}
              >
                {gosterilenler[i].map(k => <Kutucuk key={k.id} kayit={k} foto={fotolar.get(k.id) ?? null} kutu={yer.kutu} />)}
                {yer.gizlenen[i] > 0 && (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', width: yer.kutu, height: yer.kutu,
                      borderRadius: 12, background: RENK.cizgi, color: RENK.soluk, fontSize: yer.kutu * 0.3,
                    }}
                  >
                    +{yer.gizlenen[i]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Instrument Serif', fontSize: 76, lineHeight: 1 }}>{t.paylasimSayfasi.nasilSiralardin}</div>
        <div style={{ fontSize: 34, color: RENK.soluk, marginTop: 14 }}>{site}</div>
      </div>
    </div>
  );
}
