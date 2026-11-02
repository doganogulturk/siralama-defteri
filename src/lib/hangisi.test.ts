import { describe, expect, it } from 'vitest';
import {
  HangisiDurumu, hangisiBaslat, hangisiCevapla, hangisiGeriAl, hangisiKalanEnFazla,
  hangisiSiradaki, hangisiSonuc,
} from './hangisi';

/**
 * Sıralama 0..n-1 puanlı kayıtlar (0 en iyi); yeni kaydın puanı `puan`. Sorulara dürüst cevap
 * verip bulunan konumu ve soru sayısını döndürüyor.
 */
function oyna(n: number, puan: number) {
  let d: HangisiDurumu = hangisiBaslat(n);
  let soru = 0;
  for (let orta = hangisiSiradaki(d); orta !== null; orta = hangisiSiradaki(d)) {
    soru += 1;
    d = hangisiCevapla(d, puan < orta);
  }
  return { konum: hangisiSonuc(d), soru };
}

describe('hangisi', () => {
  it('her konumu doğru buluyor ve en fazla ⌈log₂(n+1)⌉ soru soruyor', () => {
    for (const n of [0, 1, 2, 3, 7, 10, 64, 200]) {
      const sinir = Math.ceil(Math.log2(n + 1));
      for (let k = 0; k <= n; k++) {
        // k. konuma girmesi gereken kayıt: k-1'den kötü, k'den iyi.
        const { konum, soru } = oyna(n, k - 0.5);
        expect(konum).toBe(k);
        expect(soru).toBeLessThanOrEqual(sinir);
      }
    }
  });

  it('boş sıralamada soru yok, konum 0', () => {
    const d = hangisiBaslat(0);
    expect(hangisiSiradaki(d)).toBeNull();
    expect(hangisiSonuc(d)).toBe(0);
  });

  it('sorular bitmeden sonuç yok', () => {
    expect(hangisiSonuc(hangisiBaslat(5))).toBeNull();
  });

  it('geri alma bir önceki aralığa dönüyor; başta bir şey yapmıyor', () => {
    const bas = hangisiBaslat(10);
    const bir = hangisiCevapla(bas, true);
    const iki = hangisiCevapla(bir, false);
    expect(hangisiGeriAl(iki)).toEqual(bir);
    expect(hangisiGeriAl(hangisiGeriAl(iki))).toEqual(bas);
    expect(hangisiGeriAl(bas)).toEqual(bas);
  });

  it('bitmiş durumda cevap değişiklik yapmıyor', () => {
    const d = hangisiCevapla(hangisiBaslat(1), true);
    expect(hangisiSonuc(d)).toBe(0);
    expect(hangisiCevapla(d, false)).toBe(d);
  });

  it('kalan soru tahmini her cevapta azalıyor, sonda 0', () => {
    let d = hangisiBaslat(10);
    let once = hangisiKalanEnFazla(d);
    expect(once).toBe(4);
    while (hangisiSiradaki(d) !== null) {
      d = hangisiCevapla(d, false);
      const simdi = hangisiKalanEnFazla(d);
      expect(simdi).toBeLessThan(once);
      once = simdi;
    }
    expect(once).toBe(0);
  });
});
