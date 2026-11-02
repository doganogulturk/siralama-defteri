/*
 * Kameralı Kör Sıralama: ön kameranın görüntüsü, başın üstünde sıradaki kayıt ve yanda
 * yuvalar tek bir tuvalde (canvas) çiziliyor; kayıt da o tuvalden alınıyor. Ekranda
 * görülen ile videoya giren aynı şey. Burada React yok, yalnızca ölçüler ve seçimler:
 * yerleşim, dokunuşun hangi yuvaya düştüğü, kayıt biçimi, kırpma, metni sığdırma.
 *
 * Video cihazdan çıkmıyor: kayıt tarayıcıda bir dosyaya dönüşüyor, kişi onu sistemin
 * paylaşım menüsüyle kendisi gönderiyor ya da indiriyor.
 */

/** Tuvalin boyu: dikey 9:16, Instagram ve TikTok'un tam ekran videosu. */
export const KAMERA_GENISLIK = 720;
export const KAMERA_YUKSEKLIK = 1280;

export interface Kutu { x: number; y: number; w: number; h: number }

/*
 * Güvenli alanlar: Instagram ve TikTok videonun üstünü (~%9) ve altını (~%15) kendi
 * yazılarıyla, sağ kenarını (~%15) düğmeleriyle örtüyor. Kart üstte ama o şeridin
 * altında, yuvalar solda ve alttaki şeridin üstünde bitiyor.
 */
const UST_BOSLUK = 120;
const ALT_BOSLUK = 190;
const KENAR = 28;

/** Başın üstündeki kart: yatayda ortada. */
export const KART: Kutu = { x: 110, y: UST_BOSLUK + 56, w: KAMERA_GENISLIK - 220, h: 168 };

/** Kartın üstündeki başlık hapının dikey ortası. */
export const BASLIK_Y = UST_BOSLUK + 22;

/** Yuvalar: sol kenarda alt alta; yüz çoğunlukla ortada kaldığı için dar bir sütun. */
export function yuvaKutulari(adet: number): Kutu[] {
  const ust = KART.y + KART.h + 40;
  const alt = KAMERA_YUKSEKLIK - ALT_BOSLUK;
  const aralik = 8;
  const h = Math.min(68, Math.floor((alt - ust - aralik * (adet - 1)) / adet));
  return Array.from({ length: adet }, (_, i) => ({ x: KENAR, y: ust + i * (h + aralik), w: 262, h }));
}

/** Dokunuşun tuval koordinatı hangi yuvaya düşüyor; kenarlarda biraz pay bırakılıyor. */
export function isabet(x: number, y: number, kutular: Kutu[], pay = 4): number | null {
  const i = kutular.findIndex(k => x >= k.x - pay && x <= k.x + k.w + pay && y >= k.y - pay && y <= k.y + k.h + pay);
  return i === -1 ? null : i;
}

/**
 * Ekrandaki noktayı tuval koordinatına çevirir. Tuval ekranda 9:16 oranını koruyarak
 * ölçekleniyor (`object-fit: contain` gibi); kenarda kalan boşluklar hesaba katılıyor.
 */
export function tuvalNoktasi(
  istemciX: number, istemciY: number,
  alan: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  const olcek = Math.min(alan.width / KAMERA_GENISLIK, alan.height / KAMERA_YUKSEKLIK);
  const solBosluk = (alan.width - KAMERA_GENISLIK * olcek) / 2;
  const ustBosluk = (alan.height - KAMERA_YUKSEKLIK * olcek) / 2;
  return { x: (istemciX - alan.left - solBosluk) / olcek, y: (istemciY - alan.top - ustBosluk) / olcek };
}

/** Kaynağı hedefi tamamen dolduracak biçimde ortadan kırpar (`object-fit: cover`). */
export function kapakKirp(kaynakW: number, kaynakH: number, hedefW: number, hedefH: number) {
  const oran = Math.max(hedefW / kaynakW, hedefH / kaynakH);
  const sw = hedefW / oran;
  const sh = hedefH / oran;
  return { sx: (kaynakW - sw) / 2, sy: (kaynakH - sh) / 2, sw, sh };
}

/**
 * Kayıt biçimi. MP4 önce: Instagram ve TikTok WebM'i her yerde kabul etmiyor; iOS Safari
 * zaten yalnızca MP4 yazıyor, Android Chrome (126+) da MP4 yazabiliyor. Hiçbiri
 * desteklenmiyorsa tarayıcının varsayılanı (boş biçim).
 */
const BICIMLER: { mime: string; uzanti: 'mp4' | 'webm' }[] = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', uzanti: 'mp4' },
  { mime: 'video/mp4;codecs=avc1,mp4a', uzanti: 'mp4' },
  { mime: 'video/mp4', uzanti: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', uzanti: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', uzanti: 'webm' },
  { mime: 'video/webm', uzanti: 'webm' },
];

export function kayitBicimi(destekli: (mime: string) => boolean): { mime: string; uzanti: 'mp4' | 'webm' } {
  return BICIMLER.find(b => destekli(b.mime)) ?? { mime: '', uzanti: 'webm' };
}

/** Kaydedilen dosyanın gerçek türünden uzantı: tarayıcı istenenden başka bir tür yazabilir. */
export const uzantiTurden = (tur: string): 'mp4' | 'webm' => (tur.includes('mp4') ? 'mp4' : 'webm');

/**
 * Metni genişliğe sığdırır: önce yazı boyutunu kademe kademe küçültür, en küçükte de
 * sığmazsa sonunu "…" ile keser. `olc` verilen boyuttaki genişliği döndürür (tuvalde
 * `measureText`; testte sahte bir ölçü).
 */
export function sigdir(
  metin: string, enGenis: number, boyutlar: number[], olc: (metin: string, boyut: number) => number,
): { metin: string; boyut: number } {
  for (const boyut of boyutlar) {
    if (olc(metin, boyut) <= enGenis) return { metin, boyut };
  }
  const boyut = boyutlar[boyutlar.length - 1];
  let kes = [...metin];
  while (kes.length > 1 && olc(`${kes.join('').trimEnd()}…`, boyut) > enGenis) kes = kes.slice(0, -1);
  return { metin: `${kes.join('').trimEnd()}…`, boyut };
}

/** Kayıt süresi "0:07" biçiminde. */
export const sureYaz = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** 0→1 arası ilerlemeye yumuşak çıkış. */
export const yumusak = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/**
 * Tarayıcı kameralı oyunu kaldırabilir mi: kamera, tuvalden akış ve kayıt. Biri yoksa
 * "Kamerayla oyna" hiç gösterilmiyor. Yalnızca tarayıcıda çağrılmalı.
 */
export function kameraDestekleniyor(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'captureStream' in HTMLCanvasElement.prototype
  );
}
