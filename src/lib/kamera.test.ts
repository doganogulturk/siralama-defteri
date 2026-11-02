import { describe, expect, it } from 'vitest';
import {
  KAMERA_GENISLIK, KAMERA_YUKSEKLIK, KART, gruptaBos, isabet, kapakKirp, kayitBicimi, sigdir, sureYaz,
  tuvalNoktasi, uzantiTurden, yuvaKutulari,
} from './kamera';

describe('kamera yerleşimi', () => {
  const yuvalar = yuvaKutulari(10);

  it('on yuva kartın altında, alttaki güvenli şeridin üstünde ve üst üste binmiyor', () => {
    expect(yuvalar).toHaveLength(10);
    expect(yuvalar[0].y).toBeGreaterThan(KART.y + KART.h);
    expect(yuvalar[9].y + yuvalar[9].h).toBeLessThanOrEqual(KAMERA_YUKSEKLIK - 190);
    for (let i = 1; i < 10; i++) expect(yuvalar[i].y).toBeGreaterThanOrEqual(yuvalar[i - 1].y + yuvalar[i - 1].h);
  });

  it('sağdaki düğme şeridine taşmıyor', () => {
    for (const k of yuvalar) expect(k.x + k.w).toBeLessThan(KAMERA_GENISLIK * 0.85);
    expect(KART.x + KART.w).toBeLessThanOrEqual(KAMERA_GENISLIK * 0.88);
  });

  it('dokunuş yuvayı buluyor, aradaki boşluk ve yan taraf hiçbir yuva değil', () => {
    const k = yuvalar[3];
    expect(isabet(k.x + 10, k.y + k.h / 2, yuvalar)).toBe(3);
    expect(isabet(KAMERA_GENISLIK / 2, k.y + k.h / 2, yuvalar)).toBeNull();
    expect(isabet(k.x + 10, KART.y + 10, yuvalar)).toBeNull();
  });
});

describe('tuvalNoktasi', () => {
  it('oranı koruyan ölçekte kenar boşluklarını düşüyor', () => {
    // 9:16 tuval, 900×800'lük alanda: yükseklik sınır, ölçek 0.625, yanlarda 225px boşluk.
    const alan = { left: 0, top: 0, width: 900, height: 800 };
    expect(tuvalNoktasi(225, 0, alan)).toEqual({ x: 0, y: 0 });
    expect(tuvalNoktasi(450, 400, alan)).toEqual({ x: 360, y: 640 });
  });
});

describe('kapakKirp', () => {
  it('yatay kamerayı dikey tuvale ortadan kırpıyor', () => {
    const k = kapakKirp(1280, 720, 720, 1280);
    expect(k.sh).toBe(720);
    expect(k.sw).toBeCloseTo(405);
    expect(k.sx).toBeCloseTo((1280 - 405) / 2);
    expect(k.sy).toBe(0);
  });
});

describe('kayitBicimi', () => {
  it('MP4 destekleniyorsa onu, yoksa WebM, hiçbiri yoksa varsayılan', () => {
    expect(kayitBicimi(m => m.startsWith('video/mp4')).uzanti).toBe('mp4');
    expect(kayitBicimi(m => m === 'video/webm;codecs=vp8,opus')).toEqual({ mime: 'video/webm;codecs=vp8,opus', uzanti: 'webm' });
    expect(kayitBicimi(() => false)).toEqual({ mime: '', uzanti: 'webm' });
  });

  it('dosyanın gerçek türünden uzantı', () => {
    expect(uzantiTurden('video/mp4; codecs=avc1')).toBe('mp4');
    expect(uzantiTurden('video/x-matroska')).toBe('webm');
  });
});

describe('sigdir', () => {
  // Sahte ölçü: her harf boyutun yarısı kadar geniş.
  const olc = (m: string, b: number) => [...m].length * b * 0.5;

  it('sığan ilk boyutu seçiyor', () => {
    expect(sigdir('Mercimek', 400, [80, 64, 48], olc)).toEqual({ metin: 'Mercimek', boyut: 80 });
    expect(sigdir('Düğün çorbası', 400, [80, 64, 48], olc)).toEqual({ metin: 'Düğün çorbası', boyut: 48 });
  });

  it('en küçükte de sığmazsa sonunu kesiyor', () => {
    const s = sigdir('Çok çok uzun bir kayıt adı burada', 200, [40, 20], olc);
    expect(s.boyut).toBe(20);
    expect(s.metin.endsWith('…')).toBe(true);
    expect(olc(s.metin, 20)).toBeLessThanOrEqual(200);
  });
});

describe('sureYaz', () => {
  it('dakika:saniye', () => {
    expect(sureYaz(7400)).toBe('0:07');
    expect(sureYaz(65_000)).toBe('1:05');
    expect(sureYaz(-5)).toBe('0:00');
  });
});

describe('gruplu tahta (Kör Tier)', () => {
  it('ikişerli gruplar arasında ek boşluk, yine güvenli alanda', () => {
    const k = yuvaKutulari(10, 2);
    expect(k[2].y - (k[1].y + k[1].h)).toBeGreaterThan(k[1].y - (k[0].y + k[0].h));
    expect(k[9].y + k[9].h).toBeLessThanOrEqual(KAMERA_YUKSEKLIK - 190);
  });

  it('dolu yuvaya dokununca grubundaki boş yuva', () => {
    const dolu = new Set([2]);
    expect(gruptaBos(2, 2, i => dolu.has(i))).toBe(3);
    expect(gruptaBos(3, 2, i => dolu.has(i))).toBe(3);
    dolu.add(3);
    expect(gruptaBos(2, 2, i => dolu.has(i))).toBeNull();
    expect(gruptaBos(5, 1, i => dolu.has(i))).toBe(5);
  });
});
