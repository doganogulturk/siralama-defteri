import { describe, expect, it } from 'vitest';
import { Item } from '@/types/item';
import { bolumDegistir, denendiYap, denenenleriDegistir, siralamayaSok } from './siralama';
import { sortSirali } from './sort';

/** Küçük kayıt üretici: `created_at` sırayla artıyor, en son eklenen en yeni. */
let saat = 0;
function kayit(id: string, alanlar: Partial<Item> = {}): Item {
  saat += 1;
  return {
    id, list_id: 'L', ad: id, denendi: true, asla: false, sira: 0, ozellikler: {},
    created_at: new Date(2026, 0, 1, 0, 0, saat).toISOString(),
    ...alanlar,
  };
}

/** Bölümün kimlikleri, ekrandaki sırayla. */
const siralama = (items: Item[]) => sortSirali(items.filter(i => i.denendi && !i.asla)).map(i => i.id);
const asla = (items: Item[]) => sortSirali(items.filter(i => i.denendi && i.asla)).map(i => i.id);
const numaralar = (items: Item[], bolum: boolean) =>
  sortSirali(items.filter(i => i.denendi && !!i.asla === bolum)).map(i => i.sira);

const ornek = () => [
  kayit('a', { sira: 0 }),
  kayit('b', { sira: 1 }),
  kayit('c', { sira: 2 }),
  kayit('x', { sira: 0, asla: true }),
  kayit('y', { sira: 1, asla: true }),
  kayit('p', { denendi: false }),
  kayit('q', { denendi: false }),
];

describe('siralamayaSok', () => {
  it('kaydı verilen konuma sokup sıralamayı 0dan numaralıyor', () => {
    const items = ornek();
    const yeni = kayit('n');
    const { items: sonuc, degisenler } = siralamayaSok(items, yeni, 1);
    expect(siralama(sonuc)).toEqual(['a', 'n', 'b', 'c']);
    expect(numaralar(sonuc, false)).toEqual([0, 1, 2, 3]);
    expect(degisenler.map(i => i.id)).toEqual(['a', 'n', 'b', 'c']);
  });

  it('konum yoksa en üste, liste boyundan büyükse en alta koyuyor', () => {
    expect(siralama(siralamayaSok(ornek(), kayit('n')).items)).toEqual(['n', 'a', 'b', 'c']);
    expect(siralama(siralamayaSok(ornek(), kayit('n'), 99).items)).toEqual(['a', 'b', 'c', 'n']);
  });

  it('"Bir daha asla" bölümüne ve bekleyenlere dokunmuyor', () => {
    const { items: sonuc, degisenler } = siralamayaSok(ornek(), kayit('n'), 0);
    expect(asla(sonuc)).toEqual(['x', 'y']);
    expect(numaralar(sonuc, true)).toEqual([0, 1]);
    expect(sonuc.filter(i => !i.denendi).map(i => i.id).sort()).toEqual(['p', 'q']);
    expect(degisenler.some(i => i.asla)).toBe(false);
  });

  it('bekleyenden "Denedim" denen kayıt bekleyenlerden düşüp tek kez sıralamaya giriyor', () => {
    const items = ornek();
    const p = { ...items.find(i => i.id === 'p')!, denendi: true };
    const { items: sonuc } = siralamayaSok(items, p, 3);
    expect(siralama(sonuc)).toEqual(['a', 'b', 'c', 'p']);
    expect(sonuc.filter(i => i.id === 'p')).toHaveLength(1);
    expect(sonuc).toHaveLength(items.length);
  });

  it('girdiyi değiştirmiyor', () => {
    const items = ornek();
    const once = JSON.stringify(items);
    siralamayaSok(items, kayit('n'), 1);
    expect(JSON.stringify(items)).toBe(once);
  });
});

describe('denenenleriDegistir', () => {
  it('denenmişleri yenisiyle değiştiriyor, bekleyenleri koruyor', () => {
    const items = ornek();
    const yeni = [
      { ...items[2], sira: 0 }, { ...items[0], sira: 1 },
      { ...items[1], sira: 0, asla: true },
      { ...items[3], sira: 1, asla: true }, { ...items[4], sira: 2, asla: true },
    ];
    const { items: sonuc, degisenler } = denenenleriDegistir(items, yeni);
    expect(siralama(sonuc)).toEqual(['c', 'a']);
    expect(asla(sonuc)).toEqual(['b', 'x', 'y']);
    expect(sonuc.filter(i => !i.denendi)).toHaveLength(2);
    expect(degisenler).toBe(yeni);
  });
});

describe('bolumDegistir', () => {
  it('"Bir daha asla"ya taşınanlar bölümün sonuna, mevcut sıralarıyla', () => {
    const { items: sonuc, degisenler } = bolumDegistir(ornek(), ['c', 'a'], true);
    expect(siralama(sonuc)).toEqual(['b']);
    expect(asla(sonuc)).toEqual(['x', 'y', 'a', 'c']);
    expect(numaralar(sonuc, false)).toEqual([0]);
    expect(numaralar(sonuc, true)).toEqual([0, 1, 2, 3]);
    // İki bölüm de yeniden numaralandığı için bütün denenmişler yazılıyor.
    expect(degisenler).toHaveLength(5);
  });

  it('sıralamaya geri alınanlar sıralamanın sonuna', () => {
    const { items: sonuc } = bolumDegistir(ornek(), ['x'], false);
    expect(siralama(sonuc)).toEqual(['a', 'b', 'c', 'x']);
    expect(asla(sonuc)).toEqual(['y']);
    expect(numaralar(sonuc, true)).toEqual([0]);
  });

  it('zaten hedef bölümde olan seçimi yok sayıyor', () => {
    const { items: sonuc } = bolumDegistir(ornek(), ['x', 'b'], true);
    expect(asla(sonuc)).toEqual(['x', 'y', 'b']);
    expect(siralama(sonuc)).toEqual(['a', 'c']);
  });
});

describe('denendiYap', () => {
  it('seçili bekleyenleri listede göründükleri sırayla (en yeni önce) sıralamanın sonuna ekliyor', () => {
    const { items: sonuc, degisenler } = denendiYap(ornek(), ['p', 'q']);
    expect(siralama(sonuc)).toEqual(['a', 'b', 'c', 'q', 'p']);
    expect(degisenler.map(i => [i.id, i.sira, i.denendi, i.asla])).toEqual([
      ['q', 3, true, false],
      ['p', 4, true, false],
    ]);
  });

  it('sıralama boşsa 0dan başlıyor', () => {
    const items = [kayit('p', { denendi: false })];
    expect(denendiYap(items, ['p']).degisenler[0].sira).toBe(0);
  });

  it('denenmiş bir kaydı seçimde görse de dokunmuyor', () => {
    const { items: sonuc, degisenler } = denendiYap(ornek(), ['a', 'p']);
    expect(degisenler.map(i => i.id)).toEqual(['p']);
    expect(sonuc.find(i => i.id === 'a')!.sira).toBe(0);
  });
});
