'use client';

import React, { useEffect, useState } from 'react';
import Sheet from './Sheet';
import { Liste } from '../types/item';
import { paylasimAdresi, paylasimMetni } from '../lib/paylasim';
import { slugify } from '../lib/slug';
import { DIL_PARAMETRE, messages, simdikiDil } from '../lib/i18n';

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
  const m = messages();
  const t = m.paylasim;
  const [gorsel, setGorsel] = useState<File | null>(null);
  const [gorselHata, setGorselHata] = useState(false);

  useEffect(() => {
    let iptal = false;
    fetch(`/p/${kod}/hikaye?${DIL_PARAMETRE}=${simdikiDil()}`)
      .then(y => (y.ok ? y.blob() : Promise.reject(new Error(String(y.status)))))
      .then(b => {
        if (!iptal) setGorsel(new File([b], `${t.dosyaAdi(slugify(liste.ad) || 'liste')}.png`, { type: 'image/png' }));
      })
      .catch(() => { if (!iptal) setGorselHata(true); });
    return () => { iptal = true; };
  }, [kod, liste.ad, t]);

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
      onBildirim(t.baglantiKopyalandi);
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
    onBildirim(t.gorselIndirildi);
    onClose();
  };

  return (
    <Sheet onClose={onClose} className="form-screen-short" label={t.paylas}>
      <header className="form-screen-header">
        <button type="button" className="form-screen-back" onClick={onClose} aria-label={m.genel.kapat}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <h2 className="form-screen-title">{t.menuBaslik(liste.ad)}</h2>
        <span className="form-screen-header-spacer" />
      </header>
      <div className="form-screen-body paylas-menu">
        <button type="button" className="paylas-secenek" onClick={baglanti}>
          <strong>{t.baglantiyiGonder}</strong>
          <em>{t.baglantiAciklama}</em>
        </button>
        <button type="button" className="paylas-secenek" onClick={story} disabled={!gorsel}>
          <strong>{t.story}</strong>
          <em>
            {gorselHata
              ? t.storyHata
              : gorsel
                ? t.storyAciklama
                : t.hazirlaniyor}
          </em>
        </button>
        <button type="button" className="btn-quiet" onClick={onAyarlar}>{t.ayarlar}</button>
      </div>
    </Sheet>
  );
}
