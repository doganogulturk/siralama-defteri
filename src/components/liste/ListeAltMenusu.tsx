'use client';

import Link from 'next/link';
import { ArtiIkon, ListelerIkon } from '@/components/MobilMenu';
import { AyarlarIkon, TopluIkon } from './Ikonlar';
import { messages } from '@/lib/i18n';

/**
 * Telefonda liste sayfasının alt menüsü: Listelerim, Kayıt ekle, Toplu ekle, Ayarlar. Açık sekme
 * "Denenmemiş"se eklemeler oraya. Masaüstünde CSS gizliyor, yerine yüzen düğme var.
 */
export default function ListeAltMenusu({ bekleyenSekmesi, hazir, onEkle, onTopluEkle, onAyarlar }: {
  bekleyenSekmesi: boolean;
  /** Liste yüklenmeden düğmeler kapalı. */
  hazir: boolean;
  onEkle: () => void;
  onTopluEkle: () => void;
  onAyarlar: () => void;
}) {
  const m = messages();
  const t = m.liste;
  return (
    <nav className="mobil-menu" aria-label={t.listeMenusu}>
      <Link href="/" className="mobil-menu-oge">
        {ListelerIkon}
        <span>{m.menu.listelerim}</span>
      </Link>
      <button type="button" className="mobil-menu-oge" onClick={onEkle} disabled={!hazir}>
        {ArtiIkon}
        <span>{bekleyenSekmesi ? t.denenmemisEkle : t.kayitEkle}</span>
      </button>
      <button type="button" className="mobil-menu-oge" onClick={onTopluEkle} disabled={!hazir}>
        {TopluIkon}
        <span>{t.topluEkle}</span>
      </button>
      <button type="button" className="mobil-menu-oge" onClick={onAyarlar} disabled={!hazir}>
        {AyarlarIkon}
        <span>{t.ayarlar}</span>
      </button>
    </nav>
  );
}
