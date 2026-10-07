import { redirect } from 'next/navigation';

/**
 * Liste ayarları artık sıralama ekranının üstünde açılan bir popup. Kaydedilmiş
 * eski bağlantılar kırılmasın diye bu adres listeye yönlendirip popup'ı açtırıyor.
 */
export default async function AyarlarYonlendirme({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  redirect(`/l/${encodeURIComponent(slug)}?ayarlar=1`);
}
