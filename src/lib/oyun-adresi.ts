import { sonucCoz } from './kor';
import { katalogListesi, korOyunListesi, tohumGerekli } from './katalog';
import { KOR_TIER_SINIR, tierCoz } from './tier-oyun';
import { tohumGecerli, yerlesimCoz } from './sayilar';

/*
 * Oyun adreslerindeki tohum (`?t=`) ve arkadaşın sonucu (`?s=`): webde sunucu sayfası
 * (önizleme kartı için), uygulama paketinde istemci okuyor (statik; `*.mobil.tsx`). İki yol
 * aynı kuralla okusun diye burada, React'sız (`oyun-adresi.test.ts`).
 */

type Deger = string | null | undefined;

/**
 * Kör Sıralama. Sonuç ancak oynanan on madde biliniyorsa çözülüyor: tohum gereken listede
 * (doğru cevabı olan) tohumsuz sonuç geçersiz; zevk listesinde tohumsuz sonuç havuzun ilk onu.
 * Liste katalogda yoksa null.
 */
export function korAdresi(slug: string, t: Deger, s: Deger) {
  const katalogda = katalogListesi(slug, 'tr');
  if (!katalogda) return null;
  const tohum = tohumGecerli(t ?? undefined) ? t! : null;
  const liste = korOyunListesi(slug, tohum, 'tr');
  return {
    tohum: tohumGerekli(katalogda) ? tohum : null,
    /** Önizleme kartı için tohum (tohum gerekmese de adresteki geçerli tohum). */
    adresTohumu: tohum,
    sonuc: liste ? sonucCoz(liste, s) : null,
  };
}

/** Tier ve Kör Tier (Kör Tier'de bir kademede ikiden fazla madde olan sonuç geçersiz). */
export function tierAdresi(slug: string, kor: boolean, t: Deger, s: Deger) {
  const liste = katalogListesi(slug, 'tr');
  if (!liste) return null;
  const tohum = tohumGerekli(liste) && tohumGecerli(t ?? undefined) ? t! : null;
  const gecerli = !tohumGerekli(liste) || tohum || !liste.dogru;
  return { tohum, arkadas: gecerli ? tierCoz(s ?? undefined, kor ? KOR_TIER_SINIR : undefined) : null };
}

/** Doğru Sıra ve Sayılar: ikisi de geçerliyse sonuç; yalnızca tohum taşıyan bağlantı o maddelerle oynatıyor. */
export function tohumluAdres(t: Deger, s: Deger) {
  const tohum = tohumGecerli(t ?? undefined) ? t! : null;
  const dizilis = tohum ? yerlesimCoz(s ?? undefined) : null;
  return { tohum, sonuc: tohum && dizilis ? { tohum, dizilis } : null };
}
