import type { Metadata } from 'next';
import { TierSayfasi, tierMetadata, type TierArama } from '@/lib/tier-sayfa';

type Props = { params: Promise<{ liste: string }>; searchParams: Promise<TierArama> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ liste }, arama] = await Promise.all([params, searchParams]);
  return tierMetadata(liste, arama, false);
}

/** Tier: on maddeyi S–D kademelerine yerleştir. Ortak parçalar `lib/tier-sayfa.tsx`. */
export default async function Sayfa({ params, searchParams }: Props) {
  const [{ liste }, arama] = await Promise.all([params, searchParams]);
  return <TierSayfasi slug={liste} arama={arama} kor={false} />;
}
