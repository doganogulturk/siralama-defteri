'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useListeler, siralanan } from '../hooks/useListeler';
import ListeEkleModal from '../components/ListeEkleModal';
import { useAuth } from '../hooks/useAuth';

export default function ListelerPage() {
  const { listeler, sayilar, loading, error, load } = useListeler();
  const { user } = useAuth();

  const [formAcik, setFormAcik] = useState(false);

  // Künye sayıları tüm listelerin toplamı.
  const toplamKayit = Object.values(sayilar).reduce((a, s) => a + s.toplam, 0);
  const bekleyen = Object.values(sayilar).reduce((a, s) => a + s.bekleyen, 0);
  const siralananToplam = toplamKayit - bekleyen;
  const kullanici = user?.email?.split('@')[0] ?? '';

  return (
    <div className="app app-solo">
      <main className="list">
        <header className="masthead">
          <h1 className="masthead-title">Sıralama<br />Defteri</h1>
        </header>
        <p className="masthead-byline">
          <span>{kullanici}</span>
          <span>{listeler.length} liste · {toplamKayit} kayıt</span>
        </p>

        {/* İki hücreli künye kutusu — vurgu hücresi bekleyenleri taşıyor. */}
        <div className="tally">
          <div className="tally-cell">
            <strong>{siralananToplam}</strong>
            <em>Sıralandı</em>
          </div>
          <div className="tally-cell is-accent">
            <strong>{bekleyen}</strong>
            <em>Denenmemiş</em>
          </div>
        </div>

        <div className="sticky-top">
          <header className="list-head">
            <div className="list-head-top">
              <h1 className="list-title">Listeler</h1>
              <span className="list-count">{listeler.length}</span>
              {/* Masaüstünde alt bant gizli; ekleme düğmesi başlığın yanına geçiyor. */}
              <div className="list-head-actions">
                <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
                  Yeni liste
                </button>
              </div>
            </div>
          </header>
        </div>

        {error && (
          <div className="alert">
            {error}
            <button type="button" onClick={load}>Tekrar dene</button>
          </div>
        )}

        {loading ? (
          <p className="state-msg">Yükleniyor…</p>
        ) : listeler.length === 0 ? (
          <div className="state-empty">
            <p className="state-empty-title">Henüz listen yok</p>
            <p>Sıralamak istediğin şeyle başla: kola, döner, Türk kahvesi…</p>
            <button type="button" className="btn-primary" onClick={() => setFormAcik(true)}>
              İlk Listeyi Oluştur
            </button>
          </div>
        ) : (
          <div className="liste-grid">
            {listeler.map((l) => (
              <Link key={l.id} href={`/l/${l.slug}`} className="liste-card">
                <span className="liste-card-no">{siralanan(sayilar[l.id])}</span>
                <span className="liste-card-text">
                  <strong>{l.ad}</strong>
                  <em>{sayilar[l.id]?.bekleyen ?? 0} denenmemiş</em>
                </span>
                <span className="liste-card-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <button type="button" className="fab" onClick={() => setFormAcik(true)}>
        Yeni liste
      </button>

      <ListeEkleModal
        isOpen={formAcik}
        onClose={() => setFormAcik(false)}
        onCreated={load}
      />

    </div>
  );
}
