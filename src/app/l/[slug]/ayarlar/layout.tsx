import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Liste Ayarları',
};

export default function AyarlarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
