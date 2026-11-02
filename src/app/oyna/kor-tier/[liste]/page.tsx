import type { Metadata } from 'next';
import { TierSayfasi, tierMetadata, type TierArama } from '@/lib/tier-sayfa';

type Props = { params: Promise<{ liste: string }>; searchParams: Promise<TierArama> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ liste }, arama] = await Promise.all([params, searchParams]);
  return tierMetadata(liste, arama, true);
}

/** Kör Tier: maddeler birer birer, her kademede iki yer. Ortak parçalar `lib/tier-sayfa.tsx`. */
export default async function Sayfa({ params, searchParams }: Props) {
  const [{ liste }, arama] = await Promise.all([params, searchParams]);
  return <TierSayfasi slug={liste} arama={arama} kor={true} />;
}
