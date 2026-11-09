import { katalog } from '@/lib/katalog';
import { KorMobil } from '@/components/oyna/MobilOyunlar';

/** Uygulama paketi (statik): Kör Sıralama; adres cihazda okunuyor. Web sürümü `page.web.tsx`. */
export const dynamicParams = false;

/** Statik paket: katalogdaki her liste için bir sayfa. */
export function generateStaticParams() {
  return katalog('tr').map(l => ({ liste: l.slug }));
}

export default async function Sayfa({ params }: { params: Promise<{ liste: string }> }) {
  const { liste } = await params;
  return <KorMobil slug={liste} />;
}
