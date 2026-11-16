import type { Metadata } from 'next';
import Hakkinda from '@/components/Hakkinda';
import { VERI_SORUMLUSU } from '@/lib/iletisim';

export const metadata: Metadata = {
  title: 'Hakkında',
  description: `Sıralama Defteri'ni ${VERI_SORUMLUSU} geliştirdi. Sürüm geçmişi ve iletişim.`,
};

export default function HakkindaSayfasi() {
  return <Hakkinda />;
}
