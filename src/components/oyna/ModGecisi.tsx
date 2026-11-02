'use client';

import Link from 'next/link';
import { katalogListesi } from '@/lib/katalog';
import { useDilim, useMesajlar } from '@/lib/i18n/DilBaglami';

export type Mod = 'kor' | 'tier' | 'kor-tier' | 'dogru-sira';

/**
 * "Bu listeyi başka modda oyna": sonuç ekranlarının altında, aynı listenin diğer
 * modlarına bağlantılar (katalog: her liste her modda, Doğru Sıra yalnızca doğru
 * cevabı olanlarla). Bir oyun bitince sıradakine tek dokunuş.
 */
export default function ModGecisi({ slug, simdiki }: { slug: string; simdiki: Mod }) {
  const dil = useDilim();
  const m = useMesajlar();
  const liste = katalogListesi(slug, dil);
  if (!liste) return null;
  const modlar: { mod: Mod; ad: string }[] = [
    { mod: 'kor', ad: m.kor.ad },
    { mod: 'tier', ad: m.tier.ad },
    { mod: 'kor-tier', ad: m.tier.korAd },
    ...(liste.dogru ? [{ mod: 'dogru-sira' as Mod, ad: m.dogruSira.ad }] : []),
  ];
  return (
    <nav className="mod-gecisi" aria-label={m.oyna.baskaModda(liste.ad)}>
      <span>{m.oyna.baskaModda(liste.ad)}</span>
      <div>
        {modlar.filter(x => x.mod !== simdiki).map(x => (
          <Link key={x.mod} href={`/oyna/${x.mod}/${slug}`} className="mod-gecisi-hap">{x.ad} →</Link>
        ))}
      </div>
    </nav>
  );
}
