'use client';

import Link from 'next/link';
import { Liste } from '@/types/item';
import { AyarlarIkon, PaylasIkon } from './Ikonlar';
import { messages } from '@/lib/i18n';
import { kiyasAdresi } from '@/lib/site';

/**
 * Liste sayfasının başlığı: geri, listenin adı, kopyalanmış listede "Karşılaştır", Paylaş ve
 * Liste ayarları. Masaüstünde Paylaş ve ayarlar burada; telefonda Paylaş arama kutusunun yanında,
 * ayarlar alt menüde (CSS).
 */
export default function ListeBasligi({ liste, ad, yukleniyor, onPaylas, onAyarlar }: {
  liste: Liste | null;
  ad: string;
  yukleniyor: boolean;
  onPaylas: () => void;
  onAyarlar: () => void;
}) {
  const m = messages();
  const t = m.liste;
  return (
    <div className="mobile-brand">
      <Link href="/" className="mobile-brand-back" aria-label={m.menu.listelerim}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>
      {/* Başlıkta yalnızca ad: şampiyon hemen aşağıda 1. sırada, sayılar sekmelerde. */}
      <span className="mobile-brand-text">
        {/* Yüklenirken boş: yedek ad ("Sıralama") bir an görünüp listenin adına sıçramasın. */}
        <strong>{yukleniyor && !liste ? ' ' : ad}</strong>
        {/* "Ben de sıralayayım" ile kopyalanan listede kaynağıyla karşılaştırmaya kısa yol. */}
        {liste?.kaynak_kod && (
          <Link href={kiyasAdresi(liste.kaynak_kod)} className="mobile-brand-kiyas">{t.karsilastir}</Link>
        )}
      </span>
      <div className="mobile-brand-yan">
        <button
          type="button"
          className="mobile-brand-settings"
          aria-label={t.paylasEtiket}
          onClick={onPaylas}
          disabled={!liste}
        >
          {PaylasIkon}
          <span className="mobile-brand-settings-ad">{t.paylas}</span>
        </button>
        <button
          type="button"
          className="mobile-brand-settings is-ayarlar"
          aria-label={t.ayarlarEtiket}
          onClick={onAyarlar}
          disabled={!liste}
        >
          {AyarlarIkon}
          {/* Etiket yalnızca masaüstünde: mobil başlıkta sığmaz, adı keserdi. */}
          <span className="mobile-brand-settings-ad">{t.ayarlarEtiket}</span>
        </button>
      </div>
    </div>
  );
}
