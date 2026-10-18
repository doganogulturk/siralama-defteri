/**
 * Fotoğraflar hâlâ ilk kurulumdaki kovada. Kova adı kullanıcıya görünmüyor ve
 * Supabase kovaları yeniden adlandırılamıyor; yeni bir kovaya geçilirse eski
 * URL'lerin çalışmaya devam etmesi için `kovaYolu` adı sabitten türetmiyor
 * (`guvenliFoto` da o zaman iki kovayı birden kabul etmeli).
 *
 * Ayrı dosyada: hem istemci (`items.ts`) hem sunucu (`paylasim.ts`) okuyor, sunucu
 * tarafı Supabase istemcisini içeri çekmesin.
 */
export const KOVA = 'ayran';
