import { describe, expect, it } from 'vitest';
import { KiyasKayit, kiyasAnahtari, kiyasla, uyumEtiketi } from './kiyas';

const k = (ad: string, sira: number | null, alt_ad: string | null = null): KiyasKayit =>
  ({ id: ad, ad, alt_ad, sira });
const anahtarlar = (kayitlar: KiyasKayit[]) => new Set(kayitlar.map(kiyasAnahtari));

describe('kiyasAnahtari', () => {
  it('büyük-küçük harf ve boşluk farkını gözetmiyor, çeşidi ayırıyor', () => {
    expect(kiyasAnahtari({ ad: '  İskender  Kebap' })).toBe(kiyasAnahtari({ ad: 'iskender kebap' }));
    expect(kiyasAnahtari({ ad: 'Döner', alt_ad: 'Tavuk' })).not.toBe(kiyasAnahtari({ ad: 'Döner' }));
  });
});

describe('kiyasla', () => {
  const benim = [k('A', 1), k('B', 2), k('C', 3), k('D', 4)];

  it('aynı sıra %100, ters sıra %0', () => {
    expect(kiyasla(benim, benim, anahtarlar(benim)).uyum).toBe(100);
    const ters = [k('D', 1), k('C', 2), k('B', 3), k('A', 4)];
    expect(kiyasla(benim, ters, anahtarlar(benim)).uyum).toBe(0);
  });

  it('tek bir yer değişimi altı çiftten birini bozuyor', () => {
    const onun = [k('B', 1), k('A', 2), k('C', 3), k('D', 4)];
    expect(kiyasla(benim, onun, anahtarlar(benim)).uyum).toBe(Math.round(500 / 6));
  });

  it('üçten az ortak kayıtta yüzde yok', () => {
    const onun = [k('A', 1), k('B', 2), k('X', 3)];
    expect(kiyasla(benim, onun, anahtarlar(benim)).uyum).toBeNull();
  });

  it('"Bir daha asla" sıralamanın altında ve kendi içinde eşit', () => {
    const b = [k('A', 1), k('B', 2), k('C', null), k('D', null)];
    const o = [k('A', 1), k('B', 2), k('D', null), k('C', null)];
    // C–D çifti iki tarafta da eşit: hesaba girmiyor, kalan beş çift aynı.
    expect(kiyasla(b, o, anahtarlar(b)).uyum).toBe(100);
  });

  it('yalnız onda olanlar, benim denenmemişlerimi saymıyor', () => {
    const onun = [k('A', 1), k('B', 2), k('Y', 3), k('Z', 4)];
    const tum = new Set([...anahtarlar(benim), kiyasAnahtari({ ad: 'Y' })]);
    const sonuc = kiyasla(benim, onun, tum);
    expect(sonuc.yalnizOnda.map(x => x.ad)).toEqual(['Z']);
    expect(sonuc.yalnizBende).toBe(2);
    expect(sonuc.ayniYer).toBe(2);
  });

  it('en büyük ayrılıklar başta, en az iki basamak fark', () => {
    const onun = [k('D', 1), k('B', 2), k('C', 3), k('A', 4)];
    expect(kiyasla(benim, onun, anahtarlar(benim)).ayriliklar.map(s => s.benim.ad)).toEqual(['A', 'D']);
  });
});

describe('uyumEtiketi', () => {
  it('sınırlarda doğru ad', () => {
    expect(uyumEtiketi(100)).toBe('Damak ikizi');
    expect(uyumEtiketi(75)).toBe('Aynı damak');
    expect(uyumEtiketi(19)).toBe('Zıt kutuplar');
  });
});
