import { dogruSiraListeleri } from '@/lib/dogru-sira';
import { DogruSiraMobil } from '@/components/oyna/MobilOyunlar';

/** Uygulama paketi (statik): Doğru Sıra; adres cihazda okunuyor. Web sürümü `page.web.tsx`. */
export const dynamicParams = false;

export function generateStaticParams() {
  return dogruSiraListeleri('tr').map(l => ({ liste: l.slug }));
}

export default async function Sayfa({ params }: { params: Promise<{ liste: string }> }) {
  const { liste } = await params;
  return <DogruSiraMobil slug={liste} />;
}
