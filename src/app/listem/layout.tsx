import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Listem | Ayran Gurmesi',
  description: 'Henüz denemediğin, sırasını bekleyen ayranlar.',
};

export default function ListemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
