'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './Sheet';
import { Liste } from '../types/item';
import { paylasimAdresi, paylasimMetni } from '../lib/paylasim';
import { slugify } from '../lib/slug';

/**
 * Başlıktaki "Paylaş"ın menüsü (liste paylaşılıyorken): bağlantıyı göndermek ya da
 * story görseli (`/p/[kod]/hikaye`). Görsel menü açılınca hazırlanıyor: iOS Safari
 * paylaşım menüsünü yalnızca dokunuşun hemen ardından açıyor, dokunuştan sonra
 * indirmeye başlamak menüyü engellerdi.
 */
export default function PaylasMenusu({ liste, onClose, onAyarlar, onBildirim }: {
  liste: Liste;
  onClose: () => void;
  onAyarlar: () => void;
  onBildirim: (mesaj: string) => void;
}) {
  const kod = liste.paylasim_kodu!;
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [gorselHata, setGorselHata] = useState(false);

  useEffect(() => {
    let iptal = false;
    fetch(`/p/${kod}/hikaye`)
      .then(y => (y.ok ? y.blob() : Promise.reject(new Error(String(y.status)))))
      .then(b => {
        if (!iptal) setGorsel(new File([b], `${slugify(liste.ad) || 'liste'}-siralamam.png`, { type: 'image/png' }));
      })
      .catch(() => { if (!iptal) setGorselHata(true); });
    return () => { iptal = true; };
  }, [kod, liste.ad]);

  const baglanti = async () => {
    const url = paylasimAdresi(kod, window.location.origin);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: liste.ad, text: paylasimMetni(liste.ad), url });
        onClose();
      } catch { /* Menü kapatıldı. */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      onBildirim('Paylaşım bağlantısı kopyalandı');
      onClose();
    } catch {
      onAyarlar();   // Pano kapalı: bağlantı ayarlarda seçilip kopyalanabilir.
    }
  };

  const story = async () => {
    if (!gorsel) return;
    if (navigator.canShare?.({ files: [gorsel] })) {
      try {
        await navigator.share({ files: [gorsel] });
        onClose();
      } catch { /* Menü kapatıldı. */ }
      return;
    }
    // Dosya paylaşamayan tarayıcı (çoğunlukla masaüstü): indir.
    const url = URL.createObjectURL(gorsel);
    const a = document.createElement('a');
    a.href = url;
    a.download = gorsel.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onBildirim('Görsel indirildi');
    onClose();
  };

  return (
    <Sheet onClose={onClose} className="form-screen-short" label="Paylaş">
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={onClose} aria-label="Kapat">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 className="form-screen-title">{liste.ad} · Paylaş</h2>
        <span className="form-screen-header-spacer" />
      </header>
      <div className="form-screen-body paylas-menu">
        <button type="button" className="paylas-secenek" onClick={baglanti}>
          <strong>Bağlantıyı gönder</strong>
          <em>Açan herkes sıralamanı görür, kendi sırasını yapıp seninkiyle karşılaştırabilir.</em>
        </button>
        <button type="button" className="paylas-secenek" onClick={story} disabled={!gorsel}>
          <strong>Story görseli</strong>
          <em>
            {gorselHata
              ? 'Görsel hazırlanamadı. Biraz sonra tekrar dene.'
              : gorsel
                ? 'Şampiyon ve ilk beş, Instagram ya da WhatsApp durumu için dikey görsel.'
                : 'Hazırlanıyor…'}
          </em>
        </button>
        <button type="button" className="btn-quiet" onClick={onAyarlar}>Paylaşım ayarları</button>
      </div>
    </Sheet>
  );
}
