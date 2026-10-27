import { FOTO } from './sinirlar';
import { messages } from './i18n';

/**
 * Fotoğrafı yüklemeden önce tarayıcıda küçültür: uzun kenar `FOTO.kenar`, JPEG.
 * Telefon fotoğrafları 3–8 MB geliyor, ekranda en fazla ~460 px gösteriliyor;
 * küçültülmüş hâli çoğunlukla 50–200 KB.
 *
 * WebP daha küçük olurdu ama paylaşım önizlemesini çizen motor (satori) WebP
 * okuyamıyor: WhatsApp kartındaki fotoğraflar baş harfe düşerdi.
 *
 * Yeniden kodlamanın iki yan kazancı var: EXIF (konum dahil) dosyada kalmıyor,
 * yön bilgisi piksellere işlendiği için yan yatmış fotoğraf da çıkmıyor.
 */
export async function fotoKucult(file: File): Promise<Blob> {
  const kaynak = await coz(file);
  try {
    // Kova sınırına sığana kadar önce kaliteyi, sonra ölçüyü düşür.
    for (const [kenar, kalite] of [[FOTO.kenar, 0.82], [FOTO.kenar, 0.7], [800, 0.7], [640, 0.6]]) {
      const blob = await ciz(kaynak, kenar, kalite);
      if (blob.size <= FOTO.enFazlaBayt) return blob;
    }
    throw new Error(messages().foto.kucultulemedi);
  } finally {
    if ('close' in kaynak) kaynak.close();
  }
}

type Kaynak = ImageBitmap | HTMLImageElement;

async function coz(file: File): Promise<Kaynak> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Bazı tarayıcılar createImageBitmap'te çözemediği biçimi <img> ile açabiliyor.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } catch {
      throw new Error(messages().foto.acilamadi);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function ciz(kaynak: Kaynak, kenar: number, kalite: number): Promise<Blob> {
  const g = 'naturalWidth' in kaynak ? kaynak.naturalWidth : kaynak.width;
  const y = 'naturalHeight' in kaynak ? kaynak.naturalHeight : kaynak.height;
  const oran = Math.min(1, kenar / Math.max(g, y));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(g * oran));
  canvas.height = Math.max(1, Math.round(y * oran));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(messages().foto.islenemedi);
  // JPEG saydamlık taşımıyor: saydam PNG siyah zemine düşmesin.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(kaynak, 0, 0, canvas.width, canvas.height);

  const jpeg = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', kalite));
  if (!jpeg) throw new Error(messages().foto.islenemedi);
  return jpeg;
}
