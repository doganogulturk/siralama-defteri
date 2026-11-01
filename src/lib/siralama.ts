import { Item } from '../types/item';
import { sortIstekListesi, sortSirali } from './sort';

/*
 * Sıralamanın saf hesapları: kaydı sıralamaya sokmak, iki bölüm arasında taşımak, bekleyenleri
 * sıralamaya almak. `useListStore` bunları çağırıp sonucu hem duruma hem veritabanına yazıyor;
 * burada ne React ne Supabase var, hepsi test ediliyor (`siralama.test.ts`).
 *
 * Sıralama ve "Bir daha asla" aynı `sira` kolonunu kendi içlerinde ayrı ayrı 0'dan numaralıyor;
 * iki bölümü ayıran `asla`. Bekleyenlerin (denenmemiş) sırası yok.
 */

/** Sıralamadaki kayıt: denenmiş ve "Bir daha asla" bölümünde değil. */
export const siralamada = (i: Item) => i.denendi && !i.asla;

/** Bir hesabın sonucu: listenin yeni hâli ve veritabanına yazılacak kayıtlar. */
export interface SiraSonucu {
  items: Item[];
  degisenler: Item[];
}

/**
 * Kaydı sıralamaya `hedef` konumundan sokup sıralamayı yeniden numaralar (hedef yoksa en üste).
 * "Bir daha asla" bölümüne dokunmuyor: onun numaraları kendine ait.
 */
export function siralamayaSok(items: Item[], item: Item, hedef?: number): SiraSonucu {
  const sira = sortSirali(items.filter(i => siralamada(i) && i.id !== item.id));
  const at = hedef !== undefined && hedef >= 0 ? Math.min(hedef, sira.length) : 0;
  sira.splice(at, 0, item);
  const degisenler = sira.map((it, idx) => ({ ...it, sira: idx }));
  return {
    items: [...items.filter(i => !siralamada(i) && i.id !== item.id), ...degisenler],
    degisenler,
  };
}

/**
 * Sürükle-bırak sonrası: `denenenler` sıralama ve "Bir daha asla" birlikte, her kaydın `sira`'sı
 * ve `asla`'sı yeni hâliyle. Bekleyenler olduğu gibi kalıyor.
 */
export function denenenleriDegistir(items: Item[], denenenler: Item[]): SiraSonucu {
  return { items: [...items.filter(i => !i.denendi), ...denenenler], degisenler: denenenler };
}

/**
 * Seçili denenmiş kayıtları sıralama ile "Bir daha asla" arasında taşır (`asla` hedef bölüm).
 * Taşınanlar mevcut sıralarıyla hedef bölümün sonuna ekleniyor; iki bölüm de 0'dan yeniden
 * numaralanıyor.
 */
export function bolumDegistir(items: Item[], ids: string[], asla: boolean): SiraSonucu {
  const secili = new Set(ids);
  const sira = sortSirali(items.filter(siralamada));
  const bolum = sortSirali(items.filter(i => i.denendi && i.asla));
  const [kaynak, varis] = asla ? [sira, bolum] : [bolum, sira];
  const kalan = kaynak.filter(i => !secili.has(i.id));
  const yeniVaris = [...varis, ...kaynak.filter(i => secili.has(i.id))];
  const [yeniSira, yeniBolum] = asla ? [kalan, yeniVaris] : [yeniVaris, kalan];
  return denenenleriDegistir(items, [
    ...yeniSira.map((it, idx) => ({ ...it, sira: idx, asla: false })),
    ...yeniBolum.map((it, idx) => ({ ...it, sira: idx, asla: true })),
  ]);
}

/** Toplu "Denedim": seçili bekleyenler, listede göründükleri sırayla sıralamanın sonuna. */
export function denendiYap(items: Item[], ids: string[]): SiraSonucu {
  const secili = new Set(ids);
  const sira = sortSirali(items.filter(siralamada));
  const baslangic = sira.length > 0 ? (sira[sira.length - 1].sira ?? 0) + 1 : 0;
  const degisenler = sortIstekListesi(items.filter(i => !i.denendi && secili.has(i.id)))
    .map((it, n) => ({ ...it, denendi: true, asla: false, sira: baslangic + n }));
  const yeni = new Map(degisenler.map(i => [i.id, i]));
  return { items: items.map(i => yeni.get(i.id) ?? i), degisenler };
}
