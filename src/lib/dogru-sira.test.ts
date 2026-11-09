import { describe, expect, it } from 'vitest';
import { DOGRU_SIRA_LISTELERI } from './dogru-sira-listeler';
import {
  ADET, ayriMi, degerYaz, dogruDizi, dogruSiraListesi, gununListesi, maddeleriSec, puanla,
} from './dogru-sira';
import { gununTohumu } from './sayilar';

describe('listelerin verisi', () => {
  it('slug benzersiz, iki dilde de ad ve kaynak var', () => {
    expect(new Set(DOGRU_SIRA_LISTELERI.map(l => l.slug)).size).toBe(DOGRU_SIRA_LISTELERI.length);
    for (const l of DOGRU_SIRA_LISTELERI) {
      for (const dil of ['tr', 'en'] as const) {
        expect(l.metin[dil].ad && l.metin[dil].soru && l.metin[dil].kaynak).toBeTruthy();
      }
    }
  });

  it('her listede değerler ve adlar benzersiz, havuz en az on madde', () => {
    for (const l of DOGRU_SIRA_LISTELERI) {
      expect(l.maddeler.length, l.slug).toBeGreaterThanOrEqual(ADET);
      // Üretilen listede aynı sonuç birden çok işlemde; eşitler aynı oyuna `ayrim` yüzünden girmiyor.
      if (!l.uretilmis) expect(new Set(l.maddeler.map(x => x.deger)).size, l.slug).toBe(l.maddeler.length);
      expect(new Set(l.maddeler.map(x => x.tr)).size, l.slug).toBe(l.maddeler.length);
      expect(new Set(l.maddeler.map(x => x.en)).size, l.slug).toBe(l.maddeler.length);
    }
  });
});

describe('maddeleriSec', () => {
  it('her liste, 300 farklı tohumda on madde veriyor ve hepsi birbirinden yeterince ayrı', () => {
    for (const l of DOGRU_SIRA_LISTELERI) {
      for (let n = 0; n < 300; n++) {
        const secim = maddeleriSec(l.slug, `r${n.toString(36).padStart(6, '0')}`);
        expect(secim.length, `${l.slug} tohum ${n}`).toBe(ADET);
        expect(new Set(secim).size).toBe(ADET);
        for (let i = 0; i < secim.length; i++) {
          for (let j = i + 1; j < secim.length; j++) {
            expect(ayriMi(l.ayrim, l.maddeler[secim[i]].deger, l.maddeler[secim[j]].deger), l.slug).toBe(true);
          }
        }
      }
    }
  });

  it('aynı tohum aynı seçimi veriyor, başka liste başka maddeleri', () => {
    expect(maddeleriSec('ulke-nufusu', 'g20261102')).toEqual(maddeleriSec('ulke-nufusu', 'g20261102'));
    expect(maddeleriSec('ulke-nufusu', 'g20261102')).not.toEqual(maddeleriSec('ulke-nufusu', 'g20261103'));
    expect(maddeleriSec('yok', 'g20261102')).toEqual([]);
  });

  it('%5 kuralı: Hindistan ile Çin aynı oyuna girmiyor', () => {
    const l = dogruSiraListesi('ulke-nufusu', 'tr')!;
    const hindistan = l.maddeler.findIndex(x => x.ad === 'Hindistan');
    const cin = l.maddeler.findIndex(x => x.ad === 'Çin');
    for (let n = 0; n < 200; n++) {
      const s = maddeleriSec('ulke-nufusu', `r${n.toString(36).padStart(6, 'a')}`);
      expect(s.includes(hindistan) && s.includes(cin)).toBe(false);
    }
  });
});

describe('dogruDizi ve puanla', () => {
  const liste = { yon: 'azalan' as const, maddeler: [10, 50, 30, 20, 40].map(d => ({ ad: String(d), deger: d })) };
  const secim = [0, 1, 2, 3, 4];

  it('azalan listede büyükten küçüğe; artanda tersi', () => {
    expect(dogruDizi(liste, secim)).toEqual([1, 4, 2, 3, 0]);
    expect(dogruDizi({ ...liste, yon: 'artan' }, secim)).toEqual([0, 3, 2, 4, 1]);
  });

  it('kusursuz: 100, hepsi yerinde; tam tersinde yalnızca ortadaki yerinde', () => {
    expect(puanla(liste, secim, [1, 4, 2, 3, 0])).toMatchObject({ uyum: 100, tamYerinde: 5 });
    expect(puanla(liste, secim, [0, 3, 2, 4, 1])).toMatchObject({ uyum: 20, tamYerinde: 1 });
  });

  it('yerinde olan her madde 10 puan: on maddede iki yer değişmiş, 80', () => {
    const on = { yon: 'artan' as const, maddeler: Array.from({ length: 10 }, (_, i) => ({ ad: String(i), deger: i })) };
    const hepsi = Array.from({ length: 10 }, (_, i) => i);
    expect(puanla(on, hepsi, [0, 1, 2, 4, 3, 5, 6, 7, 8, 9])).toMatchObject({ uyum: 80, tamYerinde: 8 });
  });

  it('kayma: en alttakini en üste koymak altındakilerin hepsini yerinden ediyor', () => {
    const s = puanla(liste, secim, [0, 1, 4, 2, 3]);
    expect(s.tamYerinde).toBe(0);
    expect(s.uyum).toBe(0);
    expect(s.gercekYer).toEqual([4, 0, 1, 2, 3]);
  });
});

describe('gununListesi', () => {
  it('günler listeler arasında dönüyor; serbest tohumda yok', () => {
    const a = gununListesi('g20261102');
    const b = gununListesi('g20261103');
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
    expect(gununListesi('rabc123')).toBeNull();
    expect(gununListesi(gununTohumu())).toBeTruthy();
  });
});

describe('degerYaz', () => {
  it('Türkçe ve İngilizce okunur biçimler', () => {
    expect(degerYaz('kisi', 1_450_900_000, 'tr')).toBe('1,45 milyar');
    expect(degerYaz('kisi', 87_500_000, 'tr')).toBe('87,5 milyon');
    expect(degerYaz('kisi', 345_400_000, 'en')).toBe('345 million');
    expect(degerYaz('kisi', 823_323, 'tr')).toBe('823 bin');
    expect(degerYaz('km2', 17_098_242, 'tr')).toBe('17,1 milyon km²');
    expect(degerYaz('km2', 783_562, 'tr')).toBe('783.562 km²');
    expect(degerYaz('metre', 8849, 'en')).toBe('8,849 m');
    expect(degerYaz('milyonKm', 778.5, 'tr')).toBe('778,5 milyon km');
    expect(degerYaz('milyonKm', 4515, 'tr')).toBe('4,52 milyar km');
    expect(degerYaz('yil', 1453, 'tr')).toBe('1453');
    expect(degerYaz('kisi', 64_000_000, 'en')).toBe('64 million');
  });
});
