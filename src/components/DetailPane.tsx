'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useRef, useState } from 'react';
import {
  AlanTanimi, Item, Kategori, alanGorunur, alanKisa, bayrak, kategoriBul, metin,
} from '../types/item';
import { hataMetni } from '../lib/hata';

const KameraIkon = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8h3.5L8 5.5h8L17.5 8H21v12H3z" />
    <circle cx="12" cy="13.5" r="3.6" />
  </svg>
);

interface DetailPaneProps {
  item: Item;
  /** Bekleyen kaydın sırası yok; o zaman null. */
  rank: number | null;
  kategoriler: Kategori[];
  alanlar: AlanTanimi[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  /** Düzenle formunu açmadan fotoğraf ekler ya da değiştirir. */
  onFotograf: (item: Item, file: File) => Promise<void>;
  /** Sıralamadaki bir üstü ve bir altı; sıralamada olmayan kayıtta null. */
  komsular: { ust: Item | null; alt: Item | null } | null;
  /** Komşuya tıklayınca panel o kayda geçiyor. */
  onSelect: (item: Item) => void;
  onClose: () => void;
}

/**
 * Masaüstü detay paneli: seçili kaydın tamamı. Seçim yokken sayfa paneli hiç
 * çizmiyor — sıralamanın özeti filtre şeridinin tekrarıydı.
 */
export default function DetailPane({
  item, rank, kategoriler, alanlar, onEdit, onDelete, onFotograf, komsular, onSelect, onClose,
}: DetailPaneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [surukleniyor, setSurukleniyor] = useState(false);

  const kat = kategoriBul(kategoriler, item.category_id);
  const metinAlanlari = alanlar.filter(a => a.tip === 'metin' && alanGorunur(a, item.category_id));
  const boolAlanlari = alanlar.filter(a => a.tip === 'bool' && alanGorunur(a, item.category_id));

  const dosyaSec = async (file?: File) => {
    if (!file || yukleniyor) return;
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir resim dosyası seç.');
      return;
    }
    setYukleniyor(true);
    try {
      await onFotograf(item, file);
    } catch (e: unknown) {
      alert('Fotoğraf yüklenemedi: ' + hataMetni(e));
    } finally {
      setYukleniyor(false);
    }
  };

  const secimAc = () => inputRef.current?.click();

  return (
    <div className="detail">
      <div className="detail-bar">
        {rank !== null
          ? <span className="detail-rank">#{rank}</span>
          : item.asla
            ? <span className="detail-rank">Bir daha asla</span>
            : <span className="detail-rank detail-rank-bekleyen">Denenmemiş</span>}
        <button type="button" className="detail-close" onClick={onClose} aria-label="Seçimi kaldır">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Fotoğraf alanı aynı zamanda yükleme yeri: tıkla ya da dosyayı bırak. */}
      <div
        className={`detail-hero${surukleniyor ? ' is-surukle' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
        onDragLeave={() => setSurukleniyor(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurukleniyor(false);
          void dosyaSec(e.dataTransfer.files?.[0]);
        }}
      >
        {item.fotograf_url ? (
          <>
            {/* Kırpılmadan sığdırılıyor: ürün fotoğrafları çoğunlukla dikey şişe. */}
            <img src={item.fotograf_url} className="detail-photo" alt="" />
            <button type="button" className="detail-photo-btn" onClick={secimAc} disabled={yukleniyor}>
              {yukleniyor ? 'Yükleniyor…' : 'Fotoğrafı değiştir'}
            </button>
          </>
        ) : (
          <button type="button" className="detail-photo-bos" onClick={secimAc} disabled={yukleniyor}>
            {KameraIkon}
            <b>{yukleniyor ? 'Yükleniyor…' : 'Fotoğraf ekle'}</b>
            {!yukleniyor && <em>Tıkla ya da dosyayı buraya bırak</em>}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void dosyaSec(e.target.files?.[0]);
            // Aynı dosya yeniden seçilebilsin.
            e.target.value = '';
          }}
        />
      </div>

      <div className="detail-body">
        <h2 className="detail-name">{item.ad}</h2>
        {item.alt_ad && <p className="detail-variant">{item.alt_ad}</p>}

        <div className="detail-chips">
          {kat && (
            <span className="chip" style={{ '--chip': kat.renk } as React.CSSProperties}>
              {kat.ad}
            </span>
          )}
          {boolAlanlari.map(a => (
            bayrak(item, a.anahtar)
              ? <span className="chip chip-sour" key={a.anahtar}>{alanKisa(a)}</span>
              : <span className="chip chip-plain" key={a.anahtar}>{alanKisa(a)} değil</span>
          ))}
        </div>

        {/* "#3" tek başına bağlamsız: bir üstü ve bir altıyla birlikte gösteriliyor. */}
        {rank !== null && komsular && (komsular.ust || komsular.alt) && (
          <section className="pane-section detail-yer">
            <h3 className="pane-section-title">Sıralamadaki yeri</h3>
            <div className="detail-komsular">
              {komsular.ust && (
                <button type="button" className="detail-komsu" onClick={() => onSelect(komsular.ust!)}>
                  <i>{rank - 1}</i><span>{komsular.ust.ad}</span>
                </button>
              )}
              <span className="detail-komsu is-on" aria-current="true">
                <i>{rank}</i><span>{item.ad}</span>
              </span>
              {komsular.alt && (
                <button type="button" className="detail-komsu" onClick={() => onSelect(komsular.alt!)}>
                  <i>{rank + 1}</i><span>{komsular.alt.ad}</span>
                </button>
              )}
            </div>
          </section>
        )}

        <dl className="detail-facts">
          {metinAlanlari.map(a => {
            const deger = metin(item, a.anahtar);
            if (!deger) return null;
            return <div key={a.anahtar}><dt>{alanKisa(a)}</dt><dd>{deger}</dd></div>;
          })}
          {item.created_at && (
            <div>
              <dt>Eklendi</dt>
              <dd>{new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
            </div>
          )}
        </dl>

        {item.notlar && (
          <section className="pane-section">
            <h3 className="pane-section-title">Not</h3>
            <p className="detail-not">{item.notlar}</p>
          </section>
        )}
      </div>

      <div className="detail-actions">
        <button type="button" className="btn-danger" onClick={() => onDelete(item)}>Sil</button>
        <button type="button" className="btn-primary" onClick={() => onEdit(item)}>Düzenle</button>
      </div>
    </div>
  );
}
