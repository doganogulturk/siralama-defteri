import { ikonGorseli } from '../../../lib/ikon-cizim';

/*
 * Manifest ikonları (`app/manifest.ts`): /ikon/192, /ikon/512 ve kenara kadar zeminli
 * /ikon/maskable. Derlemede bir kez üretiliyor.
 */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ boyut: '192' }, { boyut: '512' }, { boyut: 'maskable' }];
}

export async function GET(_: Request, { params }: { params: Promise<{ boyut: string }> }) {
  const { boyut } = await params;
  return boyut === 'maskable' ? ikonGorseli(512, { tamZemin: true }) : ikonGorseli(Number(boyut));
}
