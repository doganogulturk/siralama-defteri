'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useMemo, useState } from 'react';
import {
  AlanTanimi, Item, Kategori, alanGorunur, alanKisa, bayrak, filtreAlanlari, kategoriBul, metin,
} from '../types/item';
import { brandColor, brandInitials } from './ItemRow';

/** 'genel' | 'kat:<id>' | 'bayrak:<anahtar>:evet' | 'bayrak:<anahtar>:hayir' */
type Scope = string;

const matchesScope = (item: Item, scope: Scope): boolean => {
  if (scope === 'genel') return true;
  const [tip, a, b] = scope.split(':');
  if (tip === 'kat') return item.category_id === a;
  if (tip === 'bayrak') return bayrak(item, a) === (b === 'evet');
  return true;
};

interface DetailPaneProps {
  item: Item | null;
  rank: number | null;
  total: number;
  /** Sıraya dizilmiş tam liste — sekme podyumları ve son eklenenler buradan türetiliyor. */
  ranked: Item[];
  kategoriler: Kategori[];
  alanlar: AlanTanimi[];
  kategoriSayilari: Record<string, number>;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onSelect: (item: Item) => void;
  onClose: () => void;
}

function Thumb({ item, className }: { item: Item; className: string }) {
  return item.fotograf_url
    ? <img src={item.fotograf_url} className={className} alt="" />
    : (
      <span className={`${className} thumb-fallback`} style={{ background: brandColor(item.ad || '') }}>
        {brandInitials(item.ad)}
      </span>
    );
}

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';

export default function DetailPane({
  item, rank, total, ranked, kategoriler, alanlar, kategoriSayilari,
  onEdit, onDelete, onSelect, onClose,
}: DetailPaneProps) {
  const [scope, setScope] = useState<Scope>('genel');

  const bayrakAlanlari = filtreAlanlari(alanlar);

  const scopes = useMemo(() => {
    const list: { key: Scope; label: string }[] = [{ key: 'genel', label: 'Genel' }];
    kategoriler.forEach(k => list.push({ key: `kat:${k.id}`, label: k.ad }));
    bayrakAlanlari.forEach(a => {
      list.push({ key: `bayrak:${a.anahtar}:evet`, label: alanKisa(a) });
      list.push({ key: `bayrak:${a.anahtar}:hayir`, label: `${alanKisa(a)} Değil` });
    });
    return list;
  }, [kategoriler, bayrakAlanlari]);

  const podium = useMemo(
    () => ranked.filter(i => matchesScope(i, scope)).slice(0, 3),
    [ranked, scope]
  );

  // Son eklenenler de aktif sekmenin kapsamına göre daralıyor.
  const recent = useMemo(
    () => ranked
      .filter(i => i.created_at && matchesScope(i, scope))
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 3),
    [ranked, scope]
  );

  /* ── Bir kayıt seçili ─────────────────────────────── */
  if (item) {
    const kat = kategoriBul(kategoriler, item.category_id);
    const metinAlanlari = alanlar.filter(a => a.tip === 'metin' && alanGorunur(a, item.category_id));
    const boolAlanlari = alanlar.filter(a => a.tip === 'bool' && alanGorunur(a, item.category_id));

    return (
      <div className="detail">
        <div className="detail-bar">
          {rank !== null
            ? <span className="detail-rank">#{rank}</span>
            : <span className="detail-rank detail-rank-bekleyen">Denenmemiş</span>}
          <button type="button" className="detail-close" onClick={onClose} aria-label="Seçimi kaldır">✕</button>
        </div>

        <div className="detail-hero">
          <Thumb item={item} className="detail-photo" />
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

  /* ── Seçim yok: genel bakış ───────────────────────── */

  return (
    <div className="detail detail-overview">
      <div className="overview-head">
        <p className="overview-eyebrow">Sıralaman</p>
        <h2 className="overview-title">
          {total > 0 ? `${total} kayıt sıraladın` : 'Henüz kayıt yok'}
        </h2>
      </div>

      {total > 0 && (
        <>
          <div className="scope-tabs" role="tablist">
            {scopes.map(s => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={scope === s.key}
                className={`scope-tab${scope === s.key ? ' is-on' : ''}`}
                onClick={() => setScope(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {podium.length > 0 ? (
            <div className="podium">
              {podium.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  className={`podium-slot podium-${i + 1}`}
                  onClick={() => onSelect(p)}
                >
                  <span className="podium-medal">{i + 1}</span>
                  <Thumb item={p} className="podium-thumb" />
                  <span className="podium-name">{p.ad}</span>
                  {p.alt_ad && <span className="podium-variant">{p.alt_ad}</span>}
                </button>
              ))}
            </div>
          ) : (
            <p className="scope-empty">Bu grupta henüz kayıt yok.</p>
          )}

          <section className="pane-section">
            <h3 className="pane-section-title">Son Eklenenler</h3>
            {recent.length === 0 && <p className="scope-empty">Bu grupta kayıt yok.</p>}
            <div className="recent-list">
              {recent.map(r => (
                <button type="button" key={r.id} className="recent-item" onClick={() => onSelect(r)}>
                  <Thumb item={r} className="recent-thumb" />
                  <span className="recent-text">
                    <span className="recent-name">{r.ad}</span>
                    {r.alt_ad && <span className="recent-variant">{r.alt_ad}</span>}
                  </span>
                  <span className="recent-date">{formatDate(r.created_at)}</span>
                </button>
              ))}
            </div>
          </section>

          {kategoriler.length > 0 && (
            <section className="pane-section">
              <h3 className="pane-section-title">Kategori Dağılımı</h3>
              <div className="overview-breakdown">
                {kategoriler.map(kat => {
                  const count = kategoriSayilari[kat.id] ?? 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div className="breakdown-row" key={kat.id}>
                      <span className="breakdown-label">
                        <i style={{ background: kat.renk }} />
                        {kat.ad}
                      </span>
                      <span className="breakdown-bar">
                        <span style={{ width: `${pct}%`, background: kat.renk }} />
                      </span>
                      <span className="breakdown-value">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
