'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

/**
 * Adresteki kişisel ya da gizli parçalar istatistiğe gitmeden kalıba çevriliyor:
 * paylaşım kodu bağlantının kendisi (alan herkes listeyi görür), liste adresi de
 * kişinin liste adını taşıyor. Panelde yine hangi ekranın kaç kez açıldığı görünüyor.
 */
const KALIPLAR: [RegExp, string][] = [
  [/^\/p\/[^/]+/, '/p/[kod]'],
  [/^\/kiyasla\/[^/]+/, '/kiyasla/[kod]'],
  [/^\/l\/[^/]+/, '/l/[slug]'],
];

function maskele(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  for (const [kalip, yerine] of KALIPLAR) {
    if (kalip.test(url.pathname)) {
      url.pathname = url.pathname.replace(kalip, yerine);
      break;
    }
  }
  // Sorgu parçaları (?ayarlar=1, ?sekme=…) istatistikte gürültü.
  url.search = '';
  return { ...event, url: url.toString() };
}

/**
 * Vercel Web Analytics: çerezsiz, anonim sayfa görüntüleme sayıları (gizlilik
 * politikasında anlatılıyor). Geliştirmede hiçbir şey göndermiyor; Vercel
 * panelinde proje için Analytics açılmadıkça üretimde de veri toplanmıyor.
 */
export default function Analitik() {
  return <Analytics beforeSend={maskele} />;
}
