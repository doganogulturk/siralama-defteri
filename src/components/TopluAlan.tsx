'use client';

import React from 'react';
import { TopluBlok, topluKayitSayisi } from '../lib/toplu';
import { messages } from '../lib/i18n';

interface TopluAlanProps {
  deger: string;
  onChange: (deger: string) => void;
  bloklar: TopluBlok[];
  etiket?: string;
  autoFocus?: boolean;
  /** `topluSorun`un sonucu: varsa önizlemenin üstünde uyarı, form da kaydetmiyor. */
  sorun?: string | null;
}

/**
 * Örnek tek bir listenin (diyelim "Cips") içini gösteriyor: başlıklar listenin
 * kategorileri. Önceki örnek iki ayrı listeden karışıktı — başlığı liste sanmaya
 * davetiye çıkarıyordu.
 */

/**
 * Toplu giriş kutusu ve ayrıştırma önizlemesi. Önizleme süs değil: virgül ve iki nokta
 * kayıt adının içinde geçtiğinde bölünme yanlış olur, kullanıcı bunu kaydetmeden görsün.
 */
export default function TopluAlan({
  deger, onChange, bloklar, etiket, autoFocus, sorun,
}: TopluAlanProps) {
  const t = messages().toplu;
  const kayit = topluKayitSayisi(bloklar);
  const kategori = bloklar.filter(b => b.kategori).length;

  return (
    <>
      <label className="field">
        <span className="field-label">{etiket ?? t.kayitlar}</span>
        <textarea
          className="field-input field-textarea toplu-alan"
          rows={8}
          placeholder={t.ornek}
          value={deger}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      </label>

      <p className="field-hint">
        {t.ipucu[0]}<code>{t.ipucuKategori}</code>{t.ipucu[1]}<code>{t.ipucuCesit}</code>{t.ipucu[2]}
      </p>

      {sorun && <p className="toplu-sorun" role="alert">{sorun}</p>}

      {kayit > 0 && (
        <div className="toplu-onizleme">
          <p className="toplu-onizleme-ozet">
            {kategori > 0 && <><strong>{t.kategoriAdet(kategori)[0]}</strong>{t.kategoriAdet(kategori)[1]}</>}
            <strong>{t.kayitAdet(kayit)[0]}</strong>{t.kayitAdet(kayit)[1]}
          </p>
          {bloklar.map((blok, i) => (
            <p className="toplu-onizleme-blok" key={i}>
              <span className="toplu-onizleme-kat">{blok.kategori ?? t.kategorisiz}</span>
              {blok.kayitlar.map((k, j) => (
                <React.Fragment key={j}>
                  {j > 0 && ' · '}
                  {k.ad}
                  {k.alt_ad && <span className="toplu-onizleme-alt"> — {k.alt_ad}</span>}
                </React.Fragment>
              ))}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
