import type { Metadata } from 'next';
import KorSecim from '../../components/KorSecim';

export const metadata: Metadata = {
  title: 'Kör Sıralama',
  description: 'On kayıt birer birer gelir; her birini hemen bir sıraya koy, sonradan değiştiremezsin.',
};

export default function KorListeleri() {
  return <KorSecim />;
}
