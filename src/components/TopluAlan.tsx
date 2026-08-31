'use client';

import React from 'react';
import { TopluBlok, topluKayitSayisi } from '../lib/toplu';

interface TopluAlanProps {
  deger: string;
  onChange: (deger: string) => void;
  bloklar: TopluBlok[];
  etiket?: string;
  autoFocus?: boolean;
}

/**
 * Örnek tek bir listenin (diyelim "Cips") içini gösteriyor: başlıklar listenin
 * kategorileri. Önceki örnek iki ayrı listeden karışıktı — başlığı liste sanmaya
 * davetiye çıkarıyordu.
 */
const ORNEK = `Patates:
Lays, Klasik
Ruffles, Originals

Mısır:
Doritos, Nacho`;

/**
 * Toplu giriş kutusu ve ayrıştırma önizlemesi. Önizleme süs değil: virgül ve iki nokta
 * kayıt adının içinde geçtiğinde bölünme yanlış olur, kullanıcı bunu kaydetmeden görsün.
 */
export default function TopluAlan({
  deger, onChange, bloklar, etiket = 'Kayıtlar', autoFocus,
}: TopluAlanProps) {
  const kayit = topluKayitSayisi(bloklar);
  const kategori = bloklar.filter(b => b.kategori).length;

  return (
    <>
      <label className="field">
        <span className="field-label">{etiket}</span>
        <textarea
          className="field-input field-textarea toplu-alan"
          rows={8}
          placeholder={ORNEK}
          value={deger}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
        />
      </label>

      <p className="field-hint">
        Her satır bir kayıt. Sonu iki nokta ile biten satır (<code>Patates:</code>) listenin
        içinde bir kategori açar, altındaki satırlar o kategoriye yazılır. Virgülden sonrası
        kaydın çeşidi olur: <code>Doritos, Nacho</code>.
      </p>

      {kayit > 0 && (
        <div className="toplu-onizleme">
          <p className="toplu-onizleme-ozet">
            {kategori > 0 && <><strong>{kategori}</strong> kategori · </>}
            <strong>{kayit}</strong> kayıt oluşturulacak
          </p>
          {bloklar.map((blok, i) => (
            <p className="toplu-onizleme-blok" key={i}>
              <span className="toplu-onizleme-kat">{blok.kategori ?? 'Kategorisiz'}</span>
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
