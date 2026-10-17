-- Fotoğraf kovasının erişim kuralları. Kova `storage` şemasında; aynı projedeki diğer uygulamaların
-- kovalarıyla aynı tabloyu (storage.objects) paylaşıyor, bu yüzden her politika bucket_id ile süzülüyor.
--
-- Kova public: fotoğraflar /storage/v1/object/public/ayran/... adresinden politikaya bakılmadan
-- sunuluyor (uygulama, paylaşım sayfası ve önizleme görseli böyle okuyor). Aşağıdaki politikalar
-- yalnızca API üzerinden yükleme, listeleme ve silmeyi düzenliyor:
--
--   • yükleme yalnızca giriş yapmış kullanıcıya açık — anonim anahtar tarayıcı paketinde herkese açık;
--   • listeleme ve silme yalnızca dosyanın sahibine (yükleyen kullanıcı, owner_id). Silme Storage
--     API'de hem delete hem select yetkisi istiyor;
--   • kovanın kendisi yalnızca küçük JPEG kabul ediyor ve kullanıcı başına dosya sayısı sınırlı
--     (aşağıda). İstemci fotoğrafı yüklemeden önce küçültüyor (src/lib/foto.ts); bu sınırlar onu
--     atlayıp API'yi doğrudan çağıran biri için.
--
-- Dosya idempotent: tekrar çalıştırılabilir. schema.sql'den sonra çalıştırılmalı (sayım fonksiyonu
-- do_siralama_defteri şemasında).

-- Kova ayarları: en fazla 300 KB (src/lib/sinirlar.ts → FOTO.enFazlaBayt), yalnızca istemcinin
-- ürettiği biçim. JPEG, çünkü paylaşım önizlemesini çizen motor WebP okuyamıyor. Yalnızca yeni yüklemeleri etkiler; kovadaki eski dosyalar olduğu gibi kalır.
update storage.buckets
   set file_size_limit = 300 * 1024,
       allowed_mime_types = array['image/jpeg']
 where id = 'ayran';

drop policy if exists "Public okuma" on storage.objects;
drop policy if exists "Public yükleme" on storage.objects;

-- Kullanıcı başına en fazla 1000 dosya: 1000 × 300 KB ile tek bir hesabın en kötü durumda kaplayacağı
-- yer ~300 MB. Sayım ayrı bir fonksiyonda: politika kendi tablosunu doğrudan sorgulayınca Postgres
-- "infinite recursion detected in policy" veriyor. security definer, ama yalnızca çağıranın kendi
-- dosyalarını sayıyor — başka kimsenin bilgisini döndürmüyor.
create or replace function do_siralama_defteri.foto_sayisi()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from storage.objects
  where bucket_id = 'ayran' and owner_id = (select auth.uid())::text;
$$;

revoke all on function do_siralama_defteri.foto_sayisi() from public, anon;
grant execute on function do_siralama_defteri.foto_sayisi() to authenticated;

drop policy if exists "siralama-defteri yükleme" on storage.objects;
create policy "siralama-defteri yükleme" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ayran' and do_siralama_defteri.foto_sayisi() < 1000);

drop policy if exists "siralama-defteri kendi fotoğrafları" on storage.objects;
create policy "siralama-defteri kendi fotoğrafları" on storage.objects
  for select to authenticated
  using (bucket_id = 'ayran' and owner_id = (select auth.uid())::text);

drop policy if exists "siralama-defteri silme" on storage.objects;
create policy "siralama-defteri silme" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ayran' and owner_id = (select auth.uid())::text);
