-- Salt okunur paylaşım: listenin sahibi bir bağlantı açar, bağlantıyı bilen
-- herkes (giriş yapmadan) sıralamayı görür.
--
-- Bağlantıdaki kod liste adresinden (slug) bağımsız ve tahmin edilemez:
-- istemci 16 rastgele harf-rakam üretiyor (~95 bit). Kod boşsa liste paylaşılmıyor;
-- yeni kod üretmek eski bağlantıyı geçersiz kılar. Kodu yalnızca sahibi
-- yazabiliyor — mevcut "kendi listeleri" politikası kapsıyor.
alter table si_lists
  add column paylasim_kodu text unique
  check (paylasim_kodu ~ '^[A-Za-z0-9]{16,64}$');

-- Paylaşılan listenin okunduğu tek kapı. Tablolardaki RLS'e anonim okuma
-- eklenmiyor; bunun yerine bu fonksiyon tabloları sahibinin yetkisiyle okuyup
-- yalnızca sayfada gösterilecek alanları döndürüyor:
--
--   • sahibin adı Google profilinden — e-posta, kullanıcı kimliği ve fotoğrafı dönmüyor;
--   • sıralama ve "Bir daha asla" — denenmemişler (istek listesi) dönmüyor;
--   • kayıtların notları dönmüyor.
--
-- Kod eşleşmezse null. `search_path` boş: security definer fonksiyonda
-- tablolar şemasıyla yazılıyor, çağıranın şema yolu araya giremiyor.
create or replace function si_paylasilan_liste(kod text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'ad', l.ad,
    'alanlar', l.alanlar,
    'sahip', nullif(trim(coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name'
    )), ''),
    'kategoriler', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', c.id, 'ad', c.ad, 'renk', c.renk)
               order by c.sira, c.created_at
             )
      from public.si_categories c
      where c.list_id = l.id
    ), '[]'::jsonb),
    -- Uygulamadaki sırayla (lib/sort.ts): önce sıralama, sonra "Bir daha asla";
    -- her bölüm `sira` artan, eşitlikte en yeni önce.
    'kayitlar', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', i.id,
                 'category_id', i.category_id,
                 'ad', i.ad,
                 'alt_ad', i.alt_ad,
                 'fotograf_url', i.fotograf_url,
                 'asla', i.asla,
                 'ozellikler', i.ozellikler
               )
               order by i.asla, i.sira, i.created_at desc
             )
      from public.si_items i
      where i.list_id = l.id and i.denendi
    ), '[]'::jsonb)
  )
  from public.si_lists l
  join auth.users u on u.id = l.user_id
  where l.paylasim_kodu = kod;
$$;

revoke all on function si_paylasilan_liste(text) from public;
grant execute on function si_paylasilan_liste(text) to anon, authenticated;
