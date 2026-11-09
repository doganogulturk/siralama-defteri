-- Sıralama Defteri'nin tüm tabloları ve fonksiyonları kendi şemasında durur (proje Ekim 2026'ya kadar başka
-- uygulamalarla paylaşılıyordu; şema adı oradan kaldı). İstemci bu şemaya bağlanır (src/lib/sema.ts); şemanın Dashboard'da
-- Project Settings → Data API → Exposed schemas listesinde olması gerekir.
--
-- Supabase, public'te kurulan her nesneye anon ve authenticated için otomatik yetki verir; bu şemada öyle bir
-- varsayılan yoktur. Tarayıcının erişebildiği her şey aşağıda açıkça izin verilerek açılır.
--
-- Dosya idempotent: boş bir veritabanında şemayı sıfırdan kurar, kurulu olanda tekrar çalıştırılabilir.
create schema if not exists do_siralama_defteri;
grant usage on schema do_siralama_defteri to anon, authenticated, service_role;

-- ── Tablolar ────────────────────────────────────────────────────────────────────────────────

-- Listeler: her satır bir sıralama (Kola, Döner, Türk kahvesi ...)
create table if not exists do_siralama_defteri.lists (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  ad             text not null,
  slug           text not null,
  emoji          text,                              -- kullanılmıyor (docs/kararlar.md)
  sira           int  not null default 0,           -- kullanılmıyor; listeler kayıt sayısına göre diziliyor
  created_at     timestamptz not null default now(),
  -- Listeye özel ek alan tanımları. Alanlar kodda sabit değil, veri olarak tutuluyor:
  -- her liste kendi alanlarını ayarlar ekranından tanımlayabilsin diye.
  -- Biçim: [{ anahtar, tip: 'bool'|'metin', etiket, kisa?, ipucu?,
  --           filtre?: bool alanı filtre şeridinde göster,
  --           kategori_id?: yalnızca bu kategori seçiliyken görünür }]
  alanlar        jsonb not null default '[]',
  renk           text not null default '#e03c10',   -- kullanılmıyor; uygulamanın tek vurgu rengi var
  -- Salt okunur paylaşım bağlantısının kodu (/p/[kod]); boşsa liste paylaşılmıyor. Liste adresinden
  -- (slug) bağımsız ve tahmin edilemez: istemci 16 rastgele harf-rakam üretiyor (~95 bit). Yeni kod
  -- üretmek eski bağlantıyı geçersiz kılar. Kodu yalnızca sahibi yazabiliyor — "kendi listeleri" kapsıyor.
  paylasim_kodu  text unique check (paylasim_kodu ~ '^[A-Za-z0-9]{16,64}$'),
  unique (user_id, slug)
);

-- Paylaşılan bir listeden "Ben de sıralayayım" ile kopyalanan listede kaynağın paylaşım kodu: karşılaştırma
-- ekranı (/kiyasla/[kod]) iki listeyi bununla eşliyor. Kaynak bağlantıyı yenilerse ya da kapatırsa bağ
-- kopar; o zaman karşılaştırma liste adına göre eşleşmeye düşer. Kurulu veritabanı için `add column`.
alter table do_siralama_defteri.lists add column if not exists kaynak_kod text;
alter table do_siralama_defteri.lists drop constraint if exists lists_kaynak_kod_bicim;
alter table do_siralama_defteri.lists add constraint lists_kaynak_kod_bicim
  check (kaynak_kod ~ '^[A-Za-z0-9]{16,64}$');

-- Kategoriler: bir listenin alt kırılımları (Şekerli/Şekersiz, Yaprak/Kıyma ...)
create table if not exists do_siralama_defteri.categories (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references do_siralama_defteri.lists on delete cascade,
  ad          text not null,
  renk        text not null default '#3f6cd4',
  sira        int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (list_id, ad)
);

-- Öğeler: sıralanan ürünler
create table if not exists do_siralama_defteri.items (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references do_siralama_defteri.lists on delete cascade,
  -- Kategori silinince öğe silinmesin, kategorisiz kalsın. Yabancı anahtar aşağıda, bileşik:
  -- kategori kaydın kendi listesinden olmalı.
  category_id  uuid,
  ad           text not null,
  alt_ad       text,
  fotograf_url text,
  -- sira'ya unique konmadı: unique kısıt tek UPDATE içinde de satır satır denetleniyor,
  -- iki kaydın yer değiştirmesi ara durumda çakışırdı.
  sira         int  not null default 0,
  denendi      boolean not null default true,
  notlar       text,
  -- Listeye özel serbest alanlar: lists.alanlar tanımlarının değerleri.
  ozellikler   jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  -- "Bir daha asla": denenmiş ama sıralamaya değil, sıralamanın altında kırmızı çizgiyle ayrılan
  -- bölüme giden kayıtlar. Sıralama ve bu bölüm `sira`'yı kendi içlerinde ayrı ayrı 0'dan
  -- numaralıyor; iki bölümü ayıran bu kolon. Yalnızca denenmiş kayıtlarda anlamlı.
  asla         boolean not null default false
);

-- Kademeler (tier list). Listede açıksa etiketleri yukarıdan aşağı sırasıyla, kapalıysa null.
-- Biçim: [{ anahtar, etiket }] — anahtar kalıcı ("s", "a" ya da üretilmiş), etiket değiştirilebilir
-- ("S", "A", "Efsane" ...). Kayıt kendi kademesini `items.kademe`'de anahtarla taşıyor; boşsa "kademesiz"
-- (kademelerin en altı). İstemci `sira`'yı her zaman kademe sırasıyla tutarlı yazıyor (önce S'nin kayıtları,
-- sonra A'nınkiler ...): sıralamayı okuyan her yer (özetler, paylaşım, karşılaştırma) kademeyi bilmeden de
-- doğru sırayı görüyor. Kurulu veritabanı için `add column`.
alter table do_siralama_defteri.lists add column if not exists kademeler jsonb;
alter table do_siralama_defteri.items add column if not exists kademe text;

create index if not exists items_list_sira_idx      on do_siralama_defteri.items (list_id, sira);
create index if not exists categories_list_sira_idx on do_siralama_defteri.categories (list_id, sira);
-- Kategori silinirken kayıtları `set null` için bulmak: indeks olmadan tablo baştan sona taranır.
create index if not exists items_category_idx       on do_siralama_defteri.items (category_id);

-- Kaydın kategorisi kendi listesinden olmalı. RLS yalnızca `items.list_id`'ye bakıyor; tek kolonlu
-- anahtarla bir kayıt başka bir listenin, hatta başka bir kullanıcının kategorisini gösterebiliyordu.
-- `set null (category_id)`: kategori silinince yalnızca kategori boşalıyor, list_id yerinde kalıyor
-- (Postgres 15+). `not valid`: kurulu veritabanındaki eski satırlar taranmıyor, yeni yazılanlar denetleniyor.
-- Sıra önemli: yabancı anahtarlar düşmeden, onların dayandığı unique kısıt düşürülemiyor.
alter table do_siralama_defteri.items drop constraint if exists items_category_id_fkey;
alter table do_siralama_defteri.items drop constraint if exists items_kategori_ayni_liste;
alter table do_siralama_defteri.categories drop constraint if exists categories_id_list_key;
alter table do_siralama_defteri.categories add constraint categories_id_list_key unique (id, list_id);
alter table do_siralama_defteri.items add constraint items_kategori_ayni_liste
  foreign key (category_id, list_id)
  references do_siralama_defteri.categories (id, list_id)
  on delete set null (category_id)
  not valid;

-- ── RLS: lists doğrudan user_id ile, diğer ikisi liste üzerinden ───────────────────────────────
-- `(select auth.uid())`: Postgres değeri satır başına değil sorgu başına bir kez hesaplıyor.

alter table do_siralama_defteri.lists      enable row level security;
alter table do_siralama_defteri.categories enable row level security;
alter table do_siralama_defteri.items      enable row level security;

drop policy if exists "kendi listeleri" on do_siralama_defteri.lists;
create policy "kendi listeleri" on do_siralama_defteri.lists
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "kendi kategorileri" on do_siralama_defteri.categories;
create policy "kendi kategorileri" on do_siralama_defteri.categories
  for all to authenticated
  using (exists (
    select 1 from do_siralama_defteri.lists l where l.id = categories.list_id and l.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from do_siralama_defteri.lists l where l.id = categories.list_id and l.user_id = (select auth.uid())
  ));

drop policy if exists "kendi ogeleri" on do_siralama_defteri.items;
create policy "kendi ogeleri" on do_siralama_defteri.items
  for all to authenticated
  using (exists (
    select 1 from do_siralama_defteri.lists l where l.id = items.list_id and l.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from do_siralama_defteri.lists l where l.id = items.list_id and l.user_id = (select auth.uid())
  ));

-- Tablolar yalnızca giriş yapmış kullanıcıya açık; satırları RLS süzüyor. Anonim ziyaretçi (paylaşım
-- sayfası) tablolara hiç erişemiyor, yalnızca paylasilan_liste fonksiyonunu çağırabiliyor.
revoke all on do_siralama_defteri.lists, do_siralama_defteri.categories, do_siralama_defteri.items
  from public, anon, authenticated;
grant select, insert, update, delete
  on do_siralama_defteri.lists, do_siralama_defteri.categories, do_siralama_defteri.items
  to authenticated;

-- ── Sınırlar ────────────────────────────────────────────────────────────────────────────────
--
-- Kötüye kullanıma ve farkında olmadan şişen veriye karşı (ücretsiz plan: 500 MB veritabanı). İstemci
-- aynı değerleri src/lib/sinirlar.ts'ten okuyor; anonim anahtar herkese açık olduğu için asıl kapı burası.
--
-- Metin uzunlukları check constraint. `not valid`: kurulu veritabanındaki eski satırlar taranmıyor,
-- yalnızca yeni yazılanlar denetleniyor — sınırdan uzun eski bir kayıt ancak kısaltılarak güncellenebilir.
alter table do_siralama_defteri.lists drop constraint if exists lists_ad_uzunluk;
alter table do_siralama_defteri.lists add constraint lists_ad_uzunluk
  check (char_length(ad) <= 80) not valid;
alter table do_siralama_defteri.lists drop constraint if exists lists_alanlar_boyut;
alter table do_siralama_defteri.lists add constraint lists_alanlar_boyut
  check (octet_length(alanlar::text) <= 8000) not valid;

alter table do_siralama_defteri.lists drop constraint if exists lists_kademeler_bicim;
alter table do_siralama_defteri.lists add constraint lists_kademeler_bicim
  check (kademeler is null or (
    jsonb_typeof(kademeler) = 'array'
    and jsonb_array_length(kademeler) between 1 and 10
    and octet_length(kademeler::text) <= 1000
  )) not valid;

alter table do_siralama_defteri.categories drop constraint if exists categories_ad_uzunluk;
alter table do_siralama_defteri.categories add constraint categories_ad_uzunluk
  check (char_length(ad) <= 60) not valid;

alter table do_siralama_defteri.items drop constraint if exists items_metin_uzunluk;
alter table do_siralama_defteri.items add constraint items_metin_uzunluk
  check (
    char_length(ad) <= 120
    and char_length(coalesce(alt_ad, '')) <= 120
    and char_length(coalesce(notlar, '')) <= 2000
    and char_length(coalesce(fotograf_url, '')) <= 500
    and octet_length(ozellikler::text) <= 4000
  ) not valid;
alter table do_siralama_defteri.items drop constraint if exists items_kademe_uzunluk;
alter table do_siralama_defteri.items add constraint items_kademe_uzunluk
  check (char_length(coalesce(kademe, '')) <= 16) not valid;

-- Adet sınırları tetikleyiciyle: liste başına 200 kayıt, 50 kategori; kullanıcı başına 50 liste.
-- Üst satır (liste ya da kullanıcı) `for update` ile kilitleniyor: aynı anda gelen iki ekleme sayımı
-- birbirini görmeden geçemesin. Satır tetikleyicisi aynı komutta önce eklenen satırları gördüğü için
-- toplu ekleme de doğru sayılıyor. Hata kodu `SDLIM` (src/lib/hata.ts mesajı olduğu gibi gösteriyor).
create or replace function do_siralama_defteri.sinir_denetle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  n int;
begin
  -- `update of` sütun SET listesindeyse değer değişmese de tetikleniyor (kayıt formu list_id'yi her
  -- kaydedişte gönderiyor); dolu listede düzenleme kendini sayıp reddedilmesin. Her dal yalnızca kendi
  -- tablosunun sütununa dokunuyor: plpgsql çalışmayan dalın ifadesini çözmüyor.
  if tg_table_name = 'items' then
    if tg_op = 'UPDATE' and new.list_id = old.list_id then return new; end if;
    perform 1 from do_siralama_defteri.lists where id = new.list_id for update;
    select count(*) into n from do_siralama_defteri.items where list_id = new.list_id;
    if n >= 200 then
      raise exception 'Bir listede en fazla 200 kayıt olabilir.' using errcode = 'SDLIM';
    end if;
  elsif tg_table_name = 'categories' then
    if tg_op = 'UPDATE' and new.list_id = old.list_id then return new; end if;
    perform 1 from do_siralama_defteri.lists where id = new.list_id for update;
    select count(*) into n from do_siralama_defteri.categories where list_id = new.list_id;
    if n >= 50 then
      raise exception 'Bir listede en fazla 50 kategori olabilir.' using errcode = 'SDLIM';
    end if;
  elsif tg_table_name = 'lists' then
    if tg_op = 'UPDATE' and new.user_id = old.user_id then return new; end if;
    perform pg_advisory_xact_lock(hashtext('do_siralama_defteri.lists:' || new.user_id::text));
    select count(*) into n from do_siralama_defteri.lists where user_id = new.user_id;
    if n >= 50 then
      raise exception 'En fazla 50 liste oluşturabilirsin.' using errcode = 'SDLIM';
    end if;
  end if;
  return new;
end;
$$;

-- `update of list_id`: istemci kaydı başka listeye taşımıyor, ama API'den taşıyan sınırı aşamasın.
drop trigger if exists items_sinir on do_siralama_defteri.items;
create trigger items_sinir
  before insert or update of list_id on do_siralama_defteri.items
  for each row execute function do_siralama_defteri.sinir_denetle();

drop trigger if exists categories_sinir on do_siralama_defteri.categories;
create trigger categories_sinir
  before insert or update of list_id on do_siralama_defteri.categories
  for each row execute function do_siralama_defteri.sinir_denetle();

drop trigger if exists lists_sinir on do_siralama_defteri.lists;
create trigger lists_sinir
  before insert or update of user_id on do_siralama_defteri.lists
  for each row execute function do_siralama_defteri.sinir_denetle();

-- Tetikleyici fonksiyonu doğrudan çağrılamıyor; yine de PostgREST'in listesinde görünmesin.
revoke all on function do_siralama_defteri.sinir_denetle() from public, anon, authenticated;

-- ── Fonksiyonlar ────────────────────────────────────────────────────────────────────────────

-- Ana ekranın liste özetleri: her liste için kayıt sayıları ve sıralamanın ilk üçü.
--
-- Sayım veritabanında yapılıyor ve liste başına tek satır dönüyor: istemcinin bütün kayıtları çekip
-- sayması PostgREST'in 1000 satır sınırında sessizce yanlış sonuç veriyordu.
--
-- security invoker: fonksiyon çağıranın yetkisiyle çalışır, RLS politikaları geçerli kalır —
-- kullanıcı yalnızca kendi listelerini görür.
--
-- İlk üç, uygulamadaki sıralamayla aynı kuralla seçiliyor (lib/sort.ts): denenmiş, "Bir daha asla"
-- bölümünde olmayan; `sira` artan, eşitlikte en yeni önce.
create or replace function do_siralama_defteri.liste_ozetleri()
returns table (
  list_id  uuid,
  toplam   int,
  bekleyen int,
  ilk_uc   jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.id,
    count(i.id)::int,
    (count(i.id) filter (where not i.denendi))::int,
    coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', t.id,
                 'ad', t.ad,
                 'alt_ad', t.alt_ad,
                 'fotograf_url', t.fotograf_url
               )
               order by t.sira, t.created_at desc
             )
      from (
        select s.id, s.ad, s.alt_ad, s.fotograf_url, s.sira, s.created_at
        from do_siralama_defteri.items s
        where s.list_id = l.id and s.denendi and not s.asla
        order by s.sira, s.created_at desc
        limit 3
      ) t
    ), '[]'::jsonb)
  from do_siralama_defteri.lists l
  left join do_siralama_defteri.items i on i.list_id = l.id
  group by l.id;
$$;

revoke all on function do_siralama_defteri.liste_ozetleri() from public, anon;
grant execute on function do_siralama_defteri.liste_ozetleri() to authenticated;

-- Sürükle-bırak ve bölüm taşımalarının yazıldığı yer: bütün değişiklikler tek komutta, yani tek
-- transaction'da — yarısı yazılıp yarısı kalmış bir sıralama olmuyor ve istemci kayıt başına bir
-- istek atmıyor. Biçim: [{id, sira, asla?, denendi?, kademe?}]; verilmeyen kolon olduğu gibi kalıyor.
-- `kademe` null da yazılabiliyor (kademesiz): bu yüzden "verildi mi" anahtarın varlığına bakıyor.
-- security invoker: RLS geçerli, kullanıcı yalnızca kendi kayıtlarını değiştirebiliyor.
create or replace function do_siralama_defteri.siralamayi_yaz(degisiklikler jsonb)
returns void
language sql
security invoker
set search_path = ''
as $$
  update do_siralama_defteri.items i
     set sira    = (d ->> 'sira')::int,
         asla    = coalesce((d ->> 'asla')::boolean, i.asla),
         denendi = coalesce((d ->> 'denendi')::boolean, i.denendi),
         kademe  = case when d ? 'kademe' then d ->> 'kademe' else i.kademe end
    from jsonb_array_elements(degisiklikler) d
   where i.id = (d ->> 'id')::uuid;
$$;

revoke all on function do_siralama_defteri.siralamayi_yaz(jsonb) from public, anon;
grant execute on function do_siralama_defteri.siralamayi_yaz(jsonb) to authenticated;

-- Paylaşılan listenin okunduğu tek kapı. Tablolara anonim okuma açılmıyor; bunun yerine bu fonksiyon
-- tabloları sahibinin yetkisiyle okuyup yalnızca sayfada gösterilecek alanları döndürüyor:
--
--   • sahibin adı Google profilinden — e-posta, kullanıcı kimliği ve fotoğrafı dönmüyor;
--   • sıralama ve "Bir daha asla" — denenmemişler (istek listesi) dönmüyor;
--   • kayıtların notları dönmüyor.
--
-- Kod eşleşmezse null. `search_path` boş: security definer fonksiyonda tablolar şemasıyla yazılıyor,
-- çağıranın şema yolu araya giremiyor.
create or replace function do_siralama_defteri.paylasilan_liste(kod text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'ad', l.ad,
    'alanlar', l.alanlar,
    'kademeler', l.kademeler,
    'sahip', nullif(trim(coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name'
    )), ''),
    'kategoriler', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', c.id, 'ad', c.ad, 'renk', c.renk)
               order by c.sira, c.created_at
             )
      from do_siralama_defteri.categories c
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
                 'kademe', i.kademe,
                 'ozellikler', i.ozellikler
               )
               order by i.asla, i.sira, i.created_at desc
             )
      from do_siralama_defteri.items i
      where i.list_id = l.id and i.denendi
    ), '[]'::jsonb)
  )
  from do_siralama_defteri.lists l
  join auth.users u on u.id = l.user_id
  where l.paylasim_kodu = kod;
$$;

revoke all on function do_siralama_defteri.paylasilan_liste(text) from public;
grant execute on function do_siralama_defteri.paylasilan_liste(text) to anon, authenticated;

-- Hesap silme: App Store ve Google Play, hesabın uygulamanın içinden silinebilmesini şart koşuyor.
-- Yalnızca oturumdaki kullanıcı kendi hesabını silebilir. auth.users satırı silinince listeler, kategoriler ve
-- kayıtlar "on delete cascade" ile gidiyor; oturumları Supabase Auth'ta kapanıyor. Fotoğraflar burada
-- silinemiyor (Supabase kova tablolarına doğrudan silmeyi kapatıyor): istemci önce onları Storage API'yle
-- siliyor (src/lib/items.ts → hesabiSil), sonra bunu çağırıyor.
create or replace function do_siralama_defteri.hesabimi_sil()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kullanici uuid := auth.uid();
begin
  if v_kullanici is null then
    raise exception 'Hesabı silmek için giriş gerekir.';
  end if;

  delete from auth.users where id = v_kullanici;
end;
$$;

revoke all on function do_siralama_defteri.hesabimi_sil() from public, anon;
grant execute on function do_siralama_defteri.hesabimi_sil() to authenticated;

-- ── Apple jetonu: hesap silinirken iptal ────────────────────────────────────────────────────
-- Apple, "Apple ile giriş" kullanan uygulamada hesap silinirken Apple jetonlarının iptalini istiyor
-- (App Store 5.1.1(v)). İptal için Apple'ın yenileme jetonu gerekiyor; Supabase onu yalnızca girişin
-- hemen ardından istemciye veriyor (provider_refresh_token). İstemci burada saklıyor; hesap silinirken
-- `apple-iptal` Edge Function'ı (supabase/functions) kullanıcının oturumuyla `apple_jetonu_al`'ı çağırıp
-- jetonu .p8 anahtarıyla imzalı bir istekle Apple'a iptal ettiriyor. Tabloya politika yok: kullanıcı
-- yalnızca kendi satırına, yalnızca bu iki fonksiyonla erişiyor. Jeton bizim istemci sırrımız olmadan
-- işe yaramıyor. Hesap silinince satır cascade ile gidiyor. `istemci`: jetonun verildiği Apple kimliği
-- (web: Services ID; iOS uygulaması: bundle ID) — iptal isteği aynı kimlikle yapılmalı.
create table if not exists do_siralama_defteri.apple_jetonlari (
  user_id uuid primary key references auth.users(id) on delete cascade,
  yenileme_jetonu text not null,
  istemci text not null default 'com.siralamadefteri.web',
  guncellendi timestamptz not null default now()
);
alter table do_siralama_defteri.apple_jetonlari
  add column if not exists istemci text not null default 'com.siralamadefteri.web';
alter table do_siralama_defteri.apple_jetonlari enable row level security;
revoke all on do_siralama_defteri.apple_jetonlari from public, anon, authenticated;

create or replace function do_siralama_defteri.apple_jetonu_kaydet(
  p_jeton text, p_istemci text default 'com.siralamadefteri.web'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Giriş gerekir.';
  end if;
  if p_jeton is null or char_length(p_jeton) = 0 or char_length(p_jeton) > 2000 then
    raise exception 'Geçersiz jeton.';
  end if;
  if p_istemci not in ('com.siralamadefteri.web', 'com.siralamadefteri.app') then
    raise exception 'Geçersiz istemci.';
  end if;
  insert into do_siralama_defteri.apple_jetonlari (user_id, yenileme_jetonu, istemci)
  values (auth.uid(), p_jeton, p_istemci)
  on conflict (user_id) do update
    set yenileme_jetonu = excluded.yenileme_jetonu, istemci = excluded.istemci, guncellendi = now();
end;
$$;

/** Kendi Apple jetonun (yoksa boş); yalnızca hesap silmedeki iptal için. */
create or replace function do_siralama_defteri.apple_jetonu_al()
returns table (yenileme_jetonu text, istemci text)
language sql
stable
security definer
set search_path = ''
as $$
  select j.yenileme_jetonu, j.istemci
  from do_siralama_defteri.apple_jetonlari j
  where j.user_id = auth.uid();
$$;

drop function if exists do_siralama_defteri.apple_jetonu_kaydet(text);
revoke all on function do_siralama_defteri.apple_jetonu_kaydet(text, text) from public, anon;
grant execute on function do_siralama_defteri.apple_jetonu_kaydet(text, text) to authenticated;
revoke all on function do_siralama_defteri.apple_jetonu_al() from public, anon;
grant execute on function do_siralama_defteri.apple_jetonu_al() to authenticated;

-- ── Bildir ve engelle (App Store 1.2) ───────────────────────────────────────────────────────
-- Başkalarının içeriği uygulamada yalnızca paylaşım bağlantısıyla görünüyor (/p/[kod], kör sıralatma,
-- karşılaştırma). Orada herkes paylaşımı bildirebiliyor; giriş yapmış kullanıcı paylaşanı
-- engelleyebiliyor (onun paylaşımları bu kişiye perdeyle görünüyor). Sahibinin kimliği istemciye hiç
-- verilmiyor: fonksiyonlar paylaşım kodundan buluyor.

create table if not exists do_siralama_defteri.bildirimler (
  id uuid primary key default gen_random_uuid(),
  paylasim_kodu text not null,
  list_id uuid references do_siralama_defteri.lists(id) on delete set null,
  sahip_id uuid references auth.users(id) on delete set null,
  bildiren uuid references auth.users(id) on delete set null,
  neden text not null check (neden in ('uygunsuz', 'taciz', 'spam', 'telif', 'diger')),
  aciklama text check (aciklama is null or char_length(aciklama) <= 1000),
  durum text not null default 'yeni' check (durum in ('yeni', 'incelendi', 'kaldirildi')),
  created_at timestamptz not null default now()
);
create index if not exists bildirimler_durum_idx on do_siralama_defteri.bildirimler (durum, created_at);
alter table do_siralama_defteri.bildirimler enable row level security;
revoke all on do_siralama_defteri.bildirimler from public, anon, authenticated;

/** Paylaşımı bildirir; giriş istemiyor. Aynı paylaşıma bir saatte en fazla 30 bildirim (kötüye kullanım). */
create or replace function do_siralama_defteri.paylasimi_bildir(p_kod text, p_neden text, p_aciklama text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_liste do_siralama_defteri.lists%rowtype;
begin
  select * into v_liste from do_siralama_defteri.lists where paylasim_kodu = p_kod;
  if not found then
    raise exception 'Paylaşım bulunamadı.';
  end if;
  if (select count(*) from do_siralama_defteri.bildirimler
      where paylasim_kodu = p_kod and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Bu paylaşım için çok fazla bildirim var; biraz sonra yeniden dene.';
  end if;
  insert into do_siralama_defteri.bildirimler (paylasim_kodu, list_id, sahip_id, bildiren, neden, aciklama)
  values (p_kod, v_liste.id, v_liste.user_id, auth.uid(), p_neden, nullif(trim(p_aciklama), ''));
end;
$$;

revoke all on function do_siralama_defteri.paylasimi_bildir(text, text, text) from public;
grant execute on function do_siralama_defteri.paylasimi_bildir(text, text, text) to anon, authenticated;

create table if not exists do_siralama_defteri.engellenenler (
  user_id uuid not null references auth.users(id) on delete cascade,
  engellenen uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, engellenen),
  check (user_id <> engellenen)
);
alter table do_siralama_defteri.engellenenler enable row level security;
revoke all on do_siralama_defteri.engellenenler from public, anon, authenticated;

/** Paylaşımın sahibini engeller (kendini engelleyemez). */
create or replace function do_siralama_defteri.paylasani_engelle(p_kod text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sahip uuid;
begin
  if auth.uid() is null then
    raise exception 'Engellemek için giriş gerekir.';
  end if;
  select user_id into v_sahip from do_siralama_defteri.lists where paylasim_kodu = p_kod;
  if v_sahip is null then
    raise exception 'Paylaşım bulunamadı.';
  end if;
  if v_sahip = auth.uid() then
    raise exception 'Kendini engelleyemezsin.';
  end if;
  insert into do_siralama_defteri.engellenenler (user_id, engellenen)
  values (auth.uid(), v_sahip)
  on conflict do nothing;
end;
$$;

/** Engeli kaldırır. */
create or replace function do_siralama_defteri.paylasanin_engelini_kaldir(p_kod text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from do_siralama_defteri.engellenenler e
  using do_siralama_defteri.lists l
  where l.paylasim_kodu = p_kod and e.user_id = auth.uid() and e.engellenen = l.user_id;
$$;

/** Bu paylaşımın sahibini engelledim mi; oturum yoksa false. */
create or replace function do_siralama_defteri.paylasan_engelli_mi(p_kod text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from do_siralama_defteri.engellenenler e
    join do_siralama_defteri.lists l on l.user_id = e.engellenen
    where l.paylasim_kodu = p_kod and e.user_id = auth.uid()
  );
$$;

revoke all on function do_siralama_defteri.paylasani_engelle(text) from public, anon;
revoke all on function do_siralama_defteri.paylasanin_engelini_kaldir(text) from public, anon;
revoke all on function do_siralama_defteri.paylasan_engelli_mi(text) from public, anon;
grant execute on function do_siralama_defteri.paylasani_engelle(text) to authenticated;
grant execute on function do_siralama_defteri.paylasanin_engelini_kaldir(text) to authenticated;
grant execute on function do_siralama_defteri.paylasan_engelli_mi(text) to authenticated;

-- ── Sunucu tarafı ───────────────────────────────────────────────────────────────────────────

-- service_role RLS'ye takılmaz ama tablo yetkisine yine de ihtiyaç duyar (Dashboard, betikler).
grant all on all tables in schema do_siralama_defteri to service_role;
grant all on all sequences in schema do_siralama_defteri to service_role;
grant execute on all functions in schema do_siralama_defteri to service_role;

notify pgrst, 'reload schema';
