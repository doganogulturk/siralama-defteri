'use client';

import Tanitim from '@/components/Tanitim';
import GirisDugmesi from '@/components/GirisDugmesi';
import { useAuth } from '@/hooks/useAuth';

/**
 * Tanıtım: uygulamanın dört adımda anlatımı. Uygulama ilk açılışta bir kez kendiliğinden
 * gösteriyor (`AuthGate`); sonra Hesabım → "Nasıl çalışır?" buraya getiriyor. Oturum yoksa
 * altta giriş, varsa listelere dönüş.
 */
export default function TanitimSayfasi() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Tanitim girisDugmesi={user ? undefined : <GirisDugmesi />} />;
}
