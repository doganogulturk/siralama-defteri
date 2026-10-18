import { describe, expect, it } from 'vitest';
import { eksikKategoriler, topluAyristir, topluKayitSayisi, topluSorun } from './toplu';
import { SINIR } from './sinirlar';
import { Kategori } from '../types/item';

describe('topluAyristir', () => {
  it('her satır bir kayıt, boş satırlar atlanıyor', () => {
    expect(topluAyristir('Coca-Cola\n\n  Pepsi  \n')).toEqual([
      { kategori: null, kayitlar: [{ ad: 'Coca-Cola', alt_ad: null }, { ad: 'Pepsi', alt_ad: null }] },
    ]);
  });

  it('iki noktayla biten satır kategori açıyor, alttakiler oraya yazılıyor', () => {
    expect(topluAyristir('Şekerli:\nCoca-Cola\nPepsi\nŞekersiz:\nCola Zero')).toEqual([
      { kategori: 'Şekerli', kayitlar: [{ ad: 'Coca-Cola', alt_ad: null }, { ad: 'Pepsi', alt_ad: null }] },
      { kategori: 'Şekersiz', kayitlar: [{ ad: 'Cola Zero', alt_ad: null }] },
    ]);
  });

  it('satır içi kategori ve ilk virgülden sonrası alt ad', () => {
    expect(topluAyristir('Cips: Doritos, Nacho, acılı')).toEqual([
      { kategori: 'Cips', kayitlar: [{ ad: 'Doritos', alt_ad: 'Nacho, acılı' }] },
    ]);
  });

  it('aynı kategori (büyük-küçük harf farkıyla) tek blokta toplanıyor', () => {
    const bloklar = topluAyristir('İçecek: Ayran\nSOĞUK:\nKola\niçecek: Şalgam');
    expect(bloklar.map(b => b.kategori)).toEqual(['İçecek', 'SOĞUK']);
    expect(bloklar[0].kayitlar.map(k => k.ad)).toEqual(['Ayran', 'Şalgam']);
  });

  it('kaydı olmayan başlık blok açmıyor', () => {
    expect(topluAyristir('Ayran\nÇorba:')).toEqual([
      { kategori: null, kayitlar: [{ ad: 'Ayran', alt_ad: null }] },
    ]);
  });
});

describe('topluSorun', () => {
  const bloklar = topluAyristir('a\nb\nc');

  it('sınır içinde sorun yok', () => {
    expect(topluKayitSayisi(bloklar)).toBe(3);
    expect(topluSorun(bloklar, 0)).toBeNull();
  });

  it('kalan yer yetmiyorsa ya da liste doluysa söylüyor', () => {
    expect(topluSorun(bloklar, SINIR.listeKayit - 2)).toContain('en fazla 2 kayıt daha');
    expect(topluSorun(bloklar, SINIR.listeKayit)).toContain('Bu liste dolu');
  });

  it('uzun kategori ya da kayıt adını yakalıyor', () => {
    expect(topluSorun(topluAyristir(`${'k'.repeat(SINIR.kategoriAdi + 1)}: x`), 0)).toContain('kategori adı');
    expect(topluSorun(topluAyristir('a'.repeat(SINIR.kayitAdi + 1)), 0)).toContain('çok uzun');
  });
});

describe('eksikKategoriler', () => {
  it('listede karşılığı olmayan adları döndürüyor, harf farkını gözetmiyor', () => {
    const mevcut = [{ id: '1', list_id: 'l', ad: 'İçecek' }] as Kategori[];
    expect(eksikKategoriler(topluAyristir('içecek: a\nTatlı: b\nc'), mevcut)).toEqual(['Tatlı']);
  });
});
