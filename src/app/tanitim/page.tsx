'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Tanitim from '@/components/Tanitim';
import GirisDugmesi from '@/components/GirisDugmesi';
import { useAuth } from '@/hooks/useAuth';

/**
 * Tanıtım: uygulamanın dört adımda anlatımı ve Google girişi. Giriş yapmamış ziyaretçi
 * ana sayfada oyunları görüyor; "Nasıl çalışır?" buraya getiriyor. Oturum açıksa ana sayfaya.
 */
export default function TanitimSayfasi() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { if (user) router.replace('/'); }, [user, router]);
  return <Tanitim girisDugmesi={<GirisDugmesi />} />;
}
