import { describe, expect, it } from 'vitest';
import { sortIstekListesi, sortSirali } from './sort';
import { benzersizSlug, slugify } from './slug';
import { KOR_LISTELERI, sonucCoz, sonucYaz } from './kor';
import { KATEGORISIZ, bosFiltre, filtreBos, filtreUygula } from './filtre';
import { KOD_BICIMI, guvenliFoto, kodUret, tamlayan } from './paylasim';
import { brandInitials } from '../types/item';
import { Item } from '../types/item';

const item = (o: Partial<Item>): Item =>
  ({ id: 'x', list_id: 'l', ad: 'x', denendi: true, ozellikler: {}, ...o }) as Item;

describe('sort', () => {
  it('sira artan, eşitlikte en yeni önce', () => {
    const a = item({ id: 'a', sira: 1, created_at: '2026-01-01' });
    const b = item({ id: 'b', sira: 0, created_at: '2026-01-01' });
    const c = item({ id: 'c', sira: 1, created_at: '2026-02-01' });
    expect(sortSirali([a, b, c]).map(i => i.id)).toEqual(['b', 'c', 'a']);
    expect(sortIstekListesi([a, b, c]).map(i => i.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('slug', () => {
  it('Türkçe harfleri sadeleştiriyor', () => {
    expect(slugify('Türk Kahvesi')).toBe('turk-kahvesi');
    expect(slugify('  Çiğ Köfte & Şalgam!  ')).toBe('cig-kofte-salgam');
    expect(slugify('IĞDIR')).toBe('igdir');
  });

  it('çakışmada sonuna sayı ekliyor, boşsa yedek', () => {
    expect(benzersizSlug('kola', ['kola', 'kola-2'])).toBe('kola-3');
    expect(benzersizSlug('', [])).toBe('liste');
  });
});

describe('Kör Sıralama sonucu', () => {
  const liste = KOR_LISTELERI[0];

  it('her liste tam on kayıt', () => {
    for (const l of KOR_LISTELERI) expect(l.kayitlar).toHaveLength(10);
  });

  it('geçerli permütasyon gidip geliyor', () => {
    const sira = [3, 0, 7, 1, 9, 2, 8, 4, 6, 5];
    expect(sonucCoz(liste, sonucYaz(sira))).toEqual(sira);
  });

  it('elle bozulmuş adres reddediliyor', () => {
    expect(sonucCoz(liste, '0-1-2')).toBeNull();
    expect(sonucCoz(liste, '0-0-1-2-3-4-5-6-7-8')).toBeNull();
    expect(sonucCoz(liste, '0-1-2-3-4-5-6-7-8-10')).toBeNull();
    expect(sonucCoz(liste, '0-1-2-3-4-5-6-7-8-x')).toBeNull();
    expect(sonucCoz(liste, null)).toBeNull();
  });
});

describe('filtre', () => {
  const items = [item({ id: 'a', category_id: 'k1' }), item({ id: 'b', category_id: null })];

  it('boş filtre hepsini geçiriyor', () => {
    expect(filtreBos(bosFiltre())).toBe(true);
    expect(filtreUygula(items, bosFiltre())).toHaveLength(2);
  });

  it('kategorisiz işareti kategorisi olmayanları seçiyor', () => {
    const f = { ...bosFiltre(), kategoriler: new Set([KATEGORISIZ]) };
    expect(filtreUygula(items, f).map(i => i.id)).toEqual(['b']);
  });
});

describe('paylaşım', () => {
  it('tamlayan eki ünlü uyumuna ve kaynaştırmaya göre', () => {
    expect(tamlayan('Doğan')).toBe("Doğan'ın");
    expect(tamlayan('Ayşe')).toBe("Ayşe'nin");
    expect(tamlayan('Doğan Oğultürk')).toBe("Doğan Oğultürk'ün");
    expect(tamlayan('Umut')).toBe("Umut'un");
  });

  it('üretilen kod veritabanındaki biçime uyuyor', () => {
    for (let i = 0; i < 50; i++) expect(kodUret()).toMatch(KOD_BICIMI);
  });

  it('yalnızca kendi kovasındaki fotoğraf geçiyor', () => {
    const kok = 'https://test.supabase.co/storage/v1/object/public';
    expect(guvenliFoto(`${kok}/fotograflar/u/1.jpg`)).toBe(`${kok}/fotograflar/u/1.jpg`);
    expect(guvenliFoto(`${kok}/baska-uygulama/1.jpg`)).toBeNull();
    expect(guvenliFoto(`${kok}/fotograflar/../baska-uygulama/1.jpg`)).toBeNull();
    expect(guvenliFoto('https://kotu.example/storage/v1/object/public/fotograflar/1.jpg')).toBeNull();
    expect(guvenliFoto('javascript:alert(1)')).toBeNull();
    expect(guvenliFoto(null)).toBeNull();
  });
});

describe('brandInitials', () => {
  it('ilk iki kelimenin baş harfi, Türkçe büyük harfle', () => {
    expect(brandInitials('ıhlamur çayı')).toBe('IÇ');
    expect(brandInitials('ilik')).toBe('İ');
    expect(brandInitials('  ')).toBe('?');
  });
});
