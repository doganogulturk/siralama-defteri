'use client';

import React from 'react';
import { Kategori } from '../../types/item';
import type { SecimModu } from '../../hooks/useSecim';
import {
  AslaIkon, DenedimIkon, GeriAlIkon, GeriIkon, KategoriIkon, SilIkon,
} from './Ikonlar';

/**
 * Seçim modunda ekleme düğmesinin yerini alan işlem çubuğu. Mobilde ekranın dibinde
 * sabit bant, masaüstünde orta sütunun dibi. Üst satırda seçili sayısı ve "Tümünü seç",
 * alt satırda sekmeye göre işlemler ya da kategori hapları.
 */
export default function SecimCubugu({ s, sekme, kategoriler }: {
  s: SecimModu;
  sekme: 'siralama' | 'sirada';
  kategoriler: Kategori[];
}) {
  const {
    secim, atamaSuruyor, cubukKip, setCubukKip,
    hepsiSecili, gorunenAdet, aslaSecili, siraliSecili, sadeceAsla,
    kapat, tumunuSec, kategoriyeTasi, bolumIslemi, denedimToplu, silToplu,
  } = s;
  if (!secim) return null;

  return (
    <div className="secim-cubugu" role="toolbar" aria-label="Seçili kayıtlar">
      <div className="secim-cubugu-ust">
        <strong aria-live="polite">
          {secim.size > 0 ? `${secim.size} seçili` : 'Kayıtlara dokunarak seç'}
        </strong>
        <button
          type="button"
          className="secim-link"
          onClick={tumunuSec}
          disabled={gorunenAdet === 0}
        >
          {hepsiSecili ? 'Seçimi temizle' : 'Tümünü seç'}
        </button>
        <button type="button" className="secim-kapat" onClick={kapat} aria-label="Seçimi bitir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {/* Karışık seçimde "Bir daha asla" yalnızca sıralamadakileri taşıyor — söylenmeli. */}
      {sekme === 'siralama' && cubukKip === 'islemler' && aslaSecili.length > 0 && siraliSecili.length > 0 && (
        <p className="secim-not">
          {aslaSecili.length} tanesi zaten Bir daha asla&apos;da; yalnızca diğer {siraliSecili.length} taşınır.
        </p>
      )}
      {cubukKip === 'kategori' ? (
        <div className="secim-islemler">
          <button
            type="button"
            className="secim-geri"
            onClick={() => setCubukKip('islemler')}
            aria-label="İşlemlere dön"
          >
            {GeriIkon}
          </button>
          <div className="secim-kategoriler">
            {kategoriler.map(kat => (
              <button
                key={kat.id}
                type="button"
                className="secim-kat"
                style={{ '--kat': kat.renk } as React.CSSProperties}
                disabled={secim.size === 0 || atamaSuruyor}
                onClick={() => kategoriyeTasi(kat.id)}
              >
                <i aria-hidden="true" />{kat.ad}
              </button>
            ))}
            <button
              type="button"
              className="secim-kat is-kaldir"
              disabled={secim.size === 0 || atamaSuruyor}
              onClick={() => kategoriyeTasi(null)}
            >
              Kategoriden çıkar
            </button>
          </div>
        </div>
      ) : (
        <div className="secim-islemler">
          {kategoriler.length > 0 && (
            <button
              type="button"
              className="secim-islem"
              disabled={secim.size === 0 || atamaSuruyor}
              onClick={() => setCubukKip('kategori')}
            >
              {KategoriIkon}<span>Kategori</span>
            </button>
          )}
          {sekme === 'sirada' ? (
            <button
              type="button"
              className="secim-islem is-vurgu"
              disabled={secim.size === 0 || atamaSuruyor}
              onClick={denedimToplu}
            >
              {DenedimIkon}<span>Denedim</span>
            </button>
          ) : (
            <button
              type="button"
              className="secim-islem"
              disabled={secim.size === 0 || atamaSuruyor}
              onClick={bolumIslemi}
            >
              {sadeceAsla ? GeriAlIkon : AslaIkon}
              <span>{sadeceAsla ? 'Sıralamaya al' : 'Bir daha asla'}</span>
            </button>
          )}
          <button
            type="button"
            className="secim-islem is-tehlike"
            disabled={secim.size === 0 || atamaSuruyor}
            onClick={silToplu}
          >
            {SilIkon}<span>Sil</span>
          </button>
        </div>
      )}
    </div>
  );
}
