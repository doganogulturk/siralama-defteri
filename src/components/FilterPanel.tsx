'use client';

import React from 'react';
import { AlanTanimi, Kategori, alanKisa, filtreAlanlari } from '../types/item';
import { BayrakDurumu, Filtre, KATEGORISIZ, bayrakDurumu } from '../lib/filtre';

interface FilterPanelProps {
  /** Panel iki kez render ediliyor (mobil şerit + masaüstü şeridi); radio
   *  grupları belge genelinde çakışmasın diye ad benzersiz olmalı. */
  instanceId: string;
  /** 'stack' masaüstü rayı, 'inline' mobil tek satır şeritleri. */
  layout?: 'stack' | 'inline';
  kategoriler: Kategori[];
  alanlar: AlanTanimi[];
  filtre: Filtre;
  onChange: (next: Filtre) => void;
  kategoriSayilari: Record<string, number>;
  bayrakSayilari: Record<string, Record<BayrakDurumu, number>>;
  /** Açık sekmede kategorisi olmayan kayıt sayısı; sıfırdan büyükse şeritte "Kategorisiz" hapı çıkar. */
  kategorisizAdet?: number;
}

const DURUMLAR: BayrakDurumu[] = ['hepsi', 'evet', 'hayir'];

const durumEtiketi = (durum: BayrakDurumu, alan: AlanTanimi, kisaMod: boolean): string => {
  const ad = alanKisa(alan);
  if (durum === 'hepsi') return kisaMod ? 'Tümü' : 'Tüm Kayıtlar';
  if (durum === 'evet') return kisaMod ? ad : `${ad} Olanlar`;
  return kisaMod ? `${ad} değil` : `${ad} Olmayanlar`;
};

export default function FilterPanel({
  instanceId,
  layout = 'stack',
  kategoriler,
  alanlar,
  filtre,
  onChange,
  kategoriSayilari,
  bayrakSayilari,
  kategorisizAdet = 0,
}: FilterPanelProps) {
  const kategorisizAcik = filtre.kategoriler.has(KATEGORISIZ);
  const inline = layout === 'inline';
  const bayrakAlanlari = filtreAlanlari(alanlar);
  /** Şeritte "Tümü" kategori seçimini temizler; hiçbiri seçili değilken açıktır. */
  const tumuAcik = filtre.kategoriler.size === 0;

  // Şerit yalnızca kategori taşıyor: ek alanların Evet/Hayır seçenekleri
  // sıralamanın hemen üstünü kalabalıklaştırdığı için oraya çıkmıyor.
  if (inline && kategoriler.length === 0) return null;

  const setBayrak = (anahtar: string, durum: BayrakDurumu) =>
    onChange({ ...filtre, bayraklar: { ...filtre.bayraklar, [anahtar]: durum } });

  const toggleKategori = (id: string) => {
    const next = new Set(filtre.kategoriler);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange({ ...filtre, kategoriler: next });
  };

  return (
    <div className={`filters filters-${layout}`}>
      {!inline && bayrakAlanlari.map(alan => (
        /* Tek seçim — radio */
        <fieldset className="filter-group" key={alan.anahtar}>
          <legend className="filter-legend">{alanKisa(alan)}</legend>
          <div className="filter-options">
            {DURUMLAR.map(durum => {
              const secili = bayrakDurumu(filtre, alan.anahtar) === durum;
              return (
                <label key={durum} className={`opt opt-radio${secili ? ' is-on' : ''}`}>
                  <input
                    type="radio"
                    name={`${alan.anahtar}-${instanceId}`}
                    value={durum}
                    checked={secili}
                    onChange={() => setBayrak(alan.anahtar, durum)}
                  />
                  <span className="opt-mark" aria-hidden="true" />
                  <span className="opt-label">{durumEtiketi(durum, alan, inline)}</span>
                  {!inline && (
                    <span className="opt-count">{bayrakSayilari[alan.anahtar]?.[durum] ?? 0}</span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {kategoriler.length > 0 && (
        /* Şeritte tek seçim (radio): bir kategori seçmek diğerini bırakır, "Tümü"
           filtreyi temizler. Dikey düzen çoklu seçim (checkbox) olarak kalıyor. */
        <fieldset className="filter-group">
          <legend className="filter-legend">
            Kategoriler
            {filtre.kategoriler.size > 0 && (
              <button
                type="button"
                className="filter-clear"
                onClick={() => onChange({ ...filtre, kategoriler: new Set() })}
              >
                Temizle
              </button>
            )}
          </legend>
          <div className="filter-options">
            {inline && (
              <button
                type="button"
                className={`opt opt-radio${tumuAcik ? ' is-on' : ''}`}
                aria-pressed={tumuAcik}
                onClick={() => onChange({ ...filtre, kategoriler: new Set() })}
              >
                <span className="opt-mark" aria-hidden="true" />
                <span className="opt-label">Tümü</span>
              </button>
            )}
            {/* Kalan atama işini gösteriyor: sonradan açılan kategorilere dağıtılmamış kayıtlar.
                Seçiliyken sayı sıfıra inse de duruyor ki kullanıcı "Tümü"ne kendisi dönsün. */}
            {inline && (kategorisizAdet > 0 || kategorisizAcik) && (
              <button
                type="button"
                className={`opt opt-radio opt-kategorisiz${kategorisizAcik ? ' is-on' : ''}`}
                aria-pressed={kategorisizAcik}
                onClick={() => onChange({ ...filtre, kategoriler: new Set([KATEGORISIZ]) })}
              >
                <span className="opt-mark" aria-hidden="true" />
                <span className="opt-label">Kategorisiz</span>
                <span className="opt-count">{kategorisizAdet}</span>
              </button>
            )}
            {kategoriler.map(kat => {
              const checked = filtre.kategoriler.has(kat.id);
              return (
                <label
                  key={kat.id}
                  className={`opt opt-check${checked ? ' is-on' : ''}`}
                  style={{ '--kat': kat.renk } as React.CSSProperties}
                >
                  <input
                    type={inline ? 'radio' : 'checkbox'}
                    name={inline ? `kategori-${instanceId}` : undefined}
                    checked={checked}
                    onChange={() => (inline
                      ? onChange({ ...filtre, kategoriler: new Set([kat.id]) })
                      : toggleKategori(kat.id))}
                  />
                  <span className="opt-mark" aria-hidden="true" />
                  <span className="opt-label">{kat.ad}</span>
                  {!inline && <span className="opt-count">{kategoriSayilari[kat.id] ?? 0}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
