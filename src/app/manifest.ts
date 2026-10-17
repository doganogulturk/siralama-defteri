import type { MetadataRoute } from 'next';

/**
 * Ana ekrana eklenebilir uygulama (PWA). Telefonda "Ana ekrana ekle" ile tarayıcı
 * çubuğu olmadan, kendi penceresinde açılıyor. Çevrimdışı çalışma yok: veriler
 * Supabase'de, bağlantısız açılınca tarayıcının kendi hata sayfası çıkar.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sıralama Defteri',
    short_name: 'Sıralama',
    description: 'Denediklerini kendi listelerinde sırala: kola, döner, kahve — ne istersen.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'tr',
    background_color: '#f8f7f4',
    theme_color: '#f8f7f4',
    icons: [
      { src: '/ikon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/ikon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/ikon/maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
