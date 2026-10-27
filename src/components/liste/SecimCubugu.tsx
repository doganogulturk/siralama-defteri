'use client';

import React from 'react';
import { Kategori } from '../../types/item';
import type { SecimModu } from '../../hooks/useSecim';
import {
  AslaIkon, DenedimIkon, GeriAlIkon, GeriIkon, KategoriIkon, SilIkon,
} from './Ikonlar';
import { messages } from '../../lib/i18n';

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
  const t = messages().secim;

  return (
    <div className="secim-cubugu" role="toolbar" aria-label={t.seciliKayitlar}>
      <div className="secim-cubugu-ust">
        <strong aria-live="polite">
          {secim.size > 0 ? t.seciliAdet(secim.size) : t.dokunarakSec}
        </strong>
        <button
          type="button"
          className="secim-link"
          onClick={tumunuSec}
          disabled={gorunenAdet === 0}
        >
          {hepsiSecili ? t.temizle : t.tumunuSec}
        </button>
        <button type="button" className="secim-kapat" onClick={kapat} aria-label={t.bitir}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {/* Karışık seçimde "Bir daha asla" yalnızca sıralamadakileri taşıyor — söylenmeli. */}
      {sekme === 'siralama' && cubukKip === 'islemler' && aslaSecili.length > 0 && siraliSecili.length > 0 && (
        <p className="secim-not">
          {t.karisikNot(aslaSecili.length, siraliSecili.length)}
        </p>
      )}
      {cubukKip === 'kategori' ? (
        <div className="secim-islemler">
          <button
            type="button"
            className="secim-geri"
            onClick={() => setCubukKip('islemler')}
            aria-label={t.islemlereDon}
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
              {t.kategoridenCikar}
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
              {KategoriIkon}<span>{t.kategori}</span>
            </button>
          )}
          {sekme === 'sirada' ? (
            <button
              type="button"
              className="secim-islem is-vurgu"
              disabled={secim.size === 0 || atamaSuruyor}
              onClick={denedimToplu}
            >
              {DenedimIkon}<span>{t.denedim}</span>
            </button>
          ) : (
            <button
              type="button"
              className="secim-islem"
              disabled={secim.size === 0 || atamaSuruyor}
              onClick={bolumIslemi}
            >
              {sadeceAsla ? GeriAlIkon : AslaIkon}
              <span>{sadeceAsla ? t.siralamayaAl : t.birDahaAsla}</span>
            </button>
          )}
          <button
            type="button"
            className="secim-islem is-tehlike"
            disabled={secim.size === 0 || atamaSuruyor}
            onClick={silToplu}
          >
            {SilIkon}<span>{t.sil}</span>
          </button>
        </div>
      )}
    </div>
  );
}
