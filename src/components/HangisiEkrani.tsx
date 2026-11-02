'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import { Item, brandInitials } from '@/types/item';
import {
  hangisiBaslat, hangisiCevapla, hangisiGeriAl, hangisiKalanEnFazla, hangisiSiradaki, hangisiSonuc,
} from '@/lib/hangisi';
import { useMesajlar } from '@/lib/i18n/DilBaglami';

type Kart = Pick<Item, 'ad' | 'alt_ad' | 'fotograf_url'>;

/**
 * "Hangisi?" ile yerleştirme (`lib/hangisi.ts`): yeni kayıt solda, sıralamadan biri sağda; kişi daha
 * çok sevdiğine dokunuyor. Her cevap aralığı yarıya indiriyor, yer bulununca `onBitti` konumla
 * çağrılıyor ve form kaydı oraya yazıyor. Masaüstünde ← / → da cevap, Backspace önceki soru.
 */
export default function HangisiEkrani({ yeni, siralama, kaydediliyor, onBitti, onForma }: {
  yeni: Kart;
  /** Sıralamanın şu anki hâli, birinciden sona. */
  siralama: Item[];
  kaydediliyor: boolean;
  onBitti: (konum: number) => void;
  onForma: () => void;
}) {
  const f = useMesajlar().form;
  const [durum, setDurum] = useState(() => hangisiBaslat(siralama.length));
  const orta = hangisiSiradaki(durum);
  // Yer bulunup kaydedilirken son sorulan kayıt ekranda kalıyor; kayıt başarısız olursa "Önceki soru" var.
  const sonOrta = orta ?? (durum.gecmis.length ? hangisiSiradaki({ ...durum.gecmis.at(-1)!, gecmis: [] }) : null);
  const rakip = sonOrta === null ? null : siralama[sonOrta];

  const cevapla = (yeniDahaIyi: boolean) => {
    if (kaydediliyor || orta === null) return;
    const sonraki = hangisiCevapla(durum, yeniDahaIyi);
    setDurum(sonraki);
    const konum = hangisiSonuc(sonraki);
    if (konum !== null) onBitti(konum);
  };
  const geri = () => { if (!kaydediliyor) setDurum(hangisiGeriAl); };

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); cevapla(true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); cevapla(false); }
      else if (e.key === 'Backspace' && durum.gecmis.length > 0) { e.preventDefault(); geri(); }
    };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  });

  const kart = (k: Kart, yeniMi: boolean, sira?: number) => (
    <button
      type="button"
      className={`hangisi-kart${yeniMi ? ' is-yeni' : ''}`}
      onClick={() => cevapla(yeniMi)}
      disabled={kaydediliyor || orta === null}
      aria-label={f.hangisiSecim(k.alt_ad ? `${k.ad} — ${k.alt_ad}` : k.ad)}
      // Yeni soru: rakip kart yeniden kurulup içeri kayıyor.
      key={yeniMi ? 'yeni' : `rakip-${sonOrta}`}
    >
      <span className="hangisi-etiket">{yeniMi ? f.hangisiYeni : `${(sira ?? 0) + 1}.`}</span>
      {k.fotograf_url
        ? <img src={k.fotograf_url} alt="" className="hangisi-foto" />
        : <span className="hangisi-foto thumb-fallback" aria-hidden="true">{brandInitials(k.ad)}</span>}
      <span className="hangisi-ad">{k.ad}</span>
      {k.alt_ad && <span className="hangisi-alt">{k.alt_ad}</span>}
    </button>
  );

  return (
    <div className="form-screen-body hangisi">
      <div className="hangisi-ust">
        <h3 className="hangisi-baslik">{f.hangisiBaslik}</h3>
        <p className="field-hint" aria-live="polite">
          {f.hangisiIpucu} · {f.hangisiKalan(hangisiKalanEnFazla(durum))}
        </p>
      </div>

      <div className="hangisi-ikili">
        {kart(yeni, true)}
        <span className="hangisi-ya" aria-hidden="true">/</span>
        {rakip && kart(rakip, false, sonOrta ?? 0)}
      </div>

      <div className="form-screen-actions">
        {durum.gecmis.length > 0
          ? <button type="button" className="btn-quiet" onClick={geri} disabled={kaydediliyor}>{f.hangisiOnceki}</button>
          : <button type="button" className="btn-quiet" onClick={onForma} disabled={kaydediliyor}>{f.hangisiForma}</button>}
      </div>
    </div>
  );
}
