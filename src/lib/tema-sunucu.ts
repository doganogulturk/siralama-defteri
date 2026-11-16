import { cookies } from 'next/headers';
import { TEMA_CEREZ, kayitliTema, type Tema } from './tema';
import { MOBIL } from './site';

/**
 * İlk çizimin teması (kök düzen → `<html data-tema>`): kişinin seçimi (çerez), yoksa "sistem". Uygulama paketi
 * derlemede çiziliyor, çerez okunamaz; orada seçimi `<head>`'deki betik uyguluyor (`TEMA_BETIGI`).
 */
export async function istekTemasi(): Promise<Tema> {
  if (MOBIL) return 'sistem';
  return kayitliTema(null, (await cookies()).get(TEMA_CEREZ)?.value);
}
