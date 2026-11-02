import { describe, expect, it } from 'vitest';
import { Item } from '@/types/item';
import {
  VARSAYILAN_KADEMELER as K, diziyiCoz, kademeDegistir, kademeGruplari, kademeSil, kademeSirasi,
  kademeGorselYerlesimi, kademeTonu, kademeyeGoreSirala, komsudanKademe, siralamadanDagit, yeniKademe,
} from './kademe';
import { bolumDegistir, denendiYap, siraliSiralama, siralamayaSok } from './siralama';

let saat = 0;
function kayit(id: string, alanlar: Partial<Item> = {}): Item {
  saat += 1;
  return {
    id, list_id: 'L', ad: id, denendi: true, asla: false, sira: 0, ozellikler: {},
    created_at: new Date(2026, 0, 1, 0, 0, saat).toISOString(),
    ...alanlar,
  };
}

/** "id:kademe" dizisi, ekrandaki sırayla. */
const goster = (items: Item[]) => items.map(i => `${i.id}:${i.kademe ?? '-'}`);

/** Kural: sıra numaraları 0'dan ardışık ve kademeler yukarıdan aşağı hiç geri gitmiyor. */
function kuralTutuyor(sirali: Item[]) {
  expect(sirali.map(i => i.sira)).toEqual(sirali.map((_, n) => n));
  const s = sirali.map(i => kademeSirasi(K, i.kademe));
  expect(s).toEqual([...s].sort((a, b) => a - b));
}

const ornek = () => [
  kayit('a', { sira: 0, kademe: 's' }),
  kayit('b', { sira: 1, kademe: 'a' }),
  kayit('c', { sira: 2, kademe: 'a' }),
  kayit('d', { sira: 3, kademe: 'c' }),
  kayit('e', { sira: 4, kademe: null }),
];

describe('kademeSirasi ve sıralama', () => {
  it('kademesiz ve tanımsız anahtar en altta', () => {
    expect(kademeSirasi(K, 's')).toBe(0);
    expect(kademeSirasi(K, null)).toBe(5);
    expect(kademeSirasi(K, 'yok')).toBe(5);
  });

  it('bozuk veride kademe önce, kademe içinde sıra korunuyor', () => {
    const sirali = [kayit('x', { kademe: 'b' }), kayit('y', { kademe: 's' }), kayit('z', { kademe: 'b' }), kayit('w', { kademe: null })];
    expect(kademeyeGoreSirala(sirali, K).map(i => i.id)).toEqual(['y', 'x', 'z', 'w']);
  });

  it('gruplar: her kademe (boş da olsa) ve en sonda kademesizler', () => {
    const g = kademeGruplari(ornek(), K);
    expect(g.map(x => x.kademe?.etiket ?? '-')).toEqual(['S', 'A', 'B', 'C', 'D', '-']);
    expect(g.map(x => x.items.length)).toEqual([1, 2, 0, 1, 0, 1]);
  });
});

describe('siralamadanDagit', () => {
  it('sırayı bozmadan eşit parçalara bölüyor', () => {
    const on = Array.from({ length: 10 }, (_, i) => kayit(`k${i}`, { sira: i }));
    const d = siralamadanDagit(on, K);
    expect(d.map(i => i.kademe)).toEqual(['s', 's', 'a', 'a', 'b', 'b', 'c', 'c', 'd', 'd']);
    kuralTutuyor(d);
  });

  it('kademeden az kayıtta kademelere yayılıyor', () => {
    const d = siralamadanDagit([kayit('x'), kayit('y')], K);
    expect(d.map(i => i.kademe)).toEqual(['s', 'b']);
  });
});

describe('diziyiCoz (sürükle-bırak)', () => {
  const [a, b, c] = [kayit('a', { kademe: 's' }), kayit('b', { kademe: 'a' }), kayit('c', { kademe: 'a' })];

  it('kayıt üstündeki son başlığın kademesini alıyor; asla çizgisinin altı bölüme', () => {
    const sonuc = diziyiCoz(
      [{ kademe: 's' }, a, b, { kademe: 'a' }, { kademe: 'b' }, c, 'asla', kayit('x', { asla: true, kademe: 'b' })], K);
    expect(goster(sonuc)).toEqual(['a:s', 'b:s', 'c:b', 'x:-']);
    expect(sonuc.map(i => [i.sira, i.asla])).toEqual([[0, false], [1, false], [2, false], [0, true]]);
  });

  it('ilk başlığın üstüne bırakılan ilk kademeye giriyor', () => {
    expect(goster(diziyiCoz([b, { kademe: 's' }, a], K))).toEqual(['b:s', 'a:s']);
  });

  it('kademeler kapalıyken kademeye dokunmuyor (eski davranış)', () => {
    const sonuc = diziyiCoz([a, b, 'asla', c], null);
    expect(goster(sonuc)).toEqual(['a:s', 'b:a', 'c:a']);
    expect(sonuc.map(i => i.asla)).toEqual([false, false, true]);
  });
});

describe('komsudanKademe', () => {
  const sirali = ornek();
  it('üstündekininki; en üstte altındakininki; boşsa kademesiz', () => {
    expect(komsudanKademe(sirali, 2)).toBe('a');
    expect(komsudanKademe(sirali, 3)).toBe('a');
    expect(komsudanKademe(sirali, 0)).toBe('s');
    expect(komsudanKademe(sirali, 5)).toBeNull();
    expect(komsudanKademe([], 0)).toBeNull();
  });
});

describe('kademeDegistir', () => {
  it('yukarı çıkan hedef kademenin sonuna giriyor', () => {
    const s = kademeDegistir(ornek(), K, 'd', 's')!;
    expect(goster(s)).toEqual(['a:s', 'd:s', 'b:a', 'c:a', 'e:-']);
    kuralTutuyor(s);
  });

  it('aşağı inen hedef kademenin başına giriyor', () => {
    const s = kademeDegistir(ornek(), K, 'a', 'c')!;
    expect(goster(s)).toEqual(['b:a', 'c:a', 'a:c', 'd:c', 'e:-']);
    kuralTutuyor(s);
  });

  it('boş kademeye ve kademesize de taşınıyor; aynı kademe değişiklik değil', () => {
    expect(goster(kademeDegistir(ornek(), K, 'b', 'b')!)).toEqual(['a:s', 'c:a', 'b:b', 'd:c', 'e:-']);
    expect(goster(kademeDegistir(ornek(), K, 'a', null)!)).toEqual(['b:a', 'c:a', 'd:c', 'a:-', 'e:-']);
    expect(kademeDegistir(ornek(), K, 'b', 'a')).toBeNull();
  });
});

describe('kademeSil', () => {
  it('kayıtlar bir alttakine geçiyor, en alttakininkiler bir üsttekine', () => {
    const s = kademeSil(ornek(), K, 'a')!;
    expect(s.kademeler.map(k => k.etiket)).toEqual(['S', 'B', 'C', 'D']);
    expect(goster(s.degisenler)).toEqual(['b:b', 'c:b']);
    const son = kademeSil([kayit('z', { kademe: 'd' })], K, 'd')!;
    expect(goster(son.degisenler)).toEqual(['z:c']);
  });

  it('tek kademe silinmiyor', () => {
    expect(kademeSil([], [K[0]], 's')).toBeNull();
  });
});

describe('yeniKademe ve ton', () => {
  it('sıradaki harf, benzersiz anahtar', () => {
    const k = yeniKademe(K, 1_000_000);
    expect(k.etiket).toBe('E');
    expect(K.some(x => x.anahtar === k.anahtar)).toBe(false);
    expect(k.anahtar.length).toBeLessThanOrEqual(16);
    expect(yeniKademe([{ anahtar: 'x', etiket: 'Efsane' }]).etiket).toBe('S');
  });

  it('ton yukarıdan aşağı azalıyor', () => {
    expect(kademeTonu(0, 5)).toBe(100);
    expect(kademeTonu(4, 5)).toBe(22);
    expect(kademeTonu(0, 1)).toBe(100);
  });
});

describe('siralama.ts kademelerle', () => {
  const liste = () => [...ornek(), kayit('x', { sira: 0, asla: true }), kayit('p', { denendi: false })];

  it('siralamayaSok: araya giren komşusunun kademesini alıyor', () => {
    const { items } = siralamayaSok(liste(), kayit('n', { denendi: true }), 3, K);
    const s = siraliSiralama(items, K);
    expect(goster(s)).toEqual(['a:s', 'b:a', 'c:a', 'n:a', 'd:c', 'e:-']);
    kuralTutuyor(s);
  });

  it('siralamayaSok: en üste giren ilk kaydın kademesinde', () => {
    const { items } = siralamayaSok(liste(), kayit('n'), 0, K);
    expect(goster(siraliSiralama(items, K)).slice(0, 2)).toEqual(['n:s', 'a:s']);
  });

  it('bolumDegistir: bölüme giden ve dönen kademesiz, dönen en altta', () => {
    const git = bolumDegistir(liste(), ['b'], true, K);
    expect(git.items.find(i => i.id === 'b')).toMatchObject({ asla: true, kademe: null });
    const don = bolumDegistir(liste(), ['x'], false, K);
    const s = siraliSiralama(don.items, K);
    expect(goster(s).at(-1)).toBe('x:-');
    kuralTutuyor(s);
  });

  it('denendiYap: sıralamanın sonuna, kademesiz', () => {
    const { items } = denendiYap(liste(), ['p'], K);
    const s = siraliSiralama(items, K);
    expect(goster(s).at(-1)).toBe('p:-');
    kuralTutuyor(s);
  });
});

describe('kademeGorselYerlesimi', () => {
  const o = { genislik: 800, yukseklik: 1000, aralik: 10, ic: 10, satirAraligi: 10 };
  const toplam = (y: { satirlar: number[] }) => y.satirlar.reduce((a, b) => a + b, 0) + 10 * (y.satirlar.length - 1);

  it('az kayıtta sığan en büyük kutucuk, hepsi gösteriliyor', () => {
    // Beş tek satır: 5 × (kutu + 20) + 40 ≤ 1000 → kutu ≤ 172.
    const y = kademeGorselYerlesimi([2, 2, 1, 1, 1], o);
    expect(y.kutu).toBe(172);
    expect(y.gizlenen).toEqual([0, 0, 0, 0, 0]);
    expect(toplam(y)).toBeLessThanOrEqual(1000);
  });

  it('kalabalıkta kutucuk küçülüyor ama yine hepsi sığıyor', () => {
    const y = kademeGorselYerlesimi([12, 20, 15, 8, 5], o);
    expect(y.kutu).toBeLessThan(180);
    expect(y.gizlenen.every(g => g === 0)).toBe(true);
    expect(toplam(y)).toBeLessThanOrEqual(1000);
  });

  it('en küçükte de sığmazsa kalabalık satır kırpılıyor, toplam korunuyor', () => {
    const adetler = [150, 30, 10, 5, 5];
    const y = kademeGorselYerlesimi(adetler, o);
    expect(y.kutu).toBe(56);
    expect(toplam(y)).toBeLessThanOrEqual(1000);
    expect(y.gizlenen[0]).toBeGreaterThan(0);
    adetler.forEach((a, i) => expect(y.gosterilen[i] + y.gizlenen[i]).toBe(a));
  });
});
