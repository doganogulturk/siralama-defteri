/**
 * Fotoğrafların kovası. Ekim 2026'da uygulamanın kendi Supabase projesine taşınırken
 * ilk kurulumdaki `ayran` kovasından kopyalandı ve kayıtlardaki adresler yeniden yazıldı.
 * Supabase kovaları yeniden adlandırılamıyor; yeni bir kovaya geçilirse eski URL'ler
 * ya yeniden yazılmalı ya da `guvenliFoto` iki kovayı birden kabul etmeli (`kovaYolu`
 * adı zaten sabitten değil adresten okuyor).
 *
 * Ayrı dosyada: hem istemci (`items.ts`) hem sunucu (`paylasim.ts`) okuyor, sunucu
 * tarafı Supabase istemcisini içeri çekmesin.
 */
export const KOVA = 'fotograflar';
