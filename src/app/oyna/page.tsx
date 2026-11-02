import type { Metadata } from 'next';
import OynaMerkezi from '@/components/oyna/OynaMerkezi';

export const metadata: Metadata = {
  title: 'Oyna',
  description: 'Kör Sıralama, Doğru Sıra ve Sayılar: giriş gerekmeden sırala, sonucu paylaş, arkadaşınla karşılaştır.',
};

export default function OynaSayfasi() {
  return <OynaMerkezi />;
}
