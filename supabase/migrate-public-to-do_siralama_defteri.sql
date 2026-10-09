-- Tek seferlik: Sıralama Defteri'nin nesnelerini public'ten do_siralama_defteri şemasına taşır ve si_
-- önekini atar. SQL Editor'da bir kez çalıştırın; işi bitince bu dosya silinebilir, kalıcı tanım
-- supabase/schema.sql'dedir. Şema dosyasını bunun yerine ya da bundan önce tek başına çalıştırmayın:
-- tabloları taşımaz, yeni şemada boş kopyalar kurar.
--
-- Hepsi tek transaction'dır; herhangi bir adım hata verirse hiçbir şey değişmez. cascade kullanılmadığı
-- için bilinmeyen bir bağımlılık varsa DROP'lar hata verip işlemi durdurur.
--
-- Dokunulmayanlar: storage.* (fotoğraf kovası ve politikaları) ve auth.*.

begin;

create schema if not exists do_siralama_defteri;

-- 1. Fonksiyonlar, tam imzalarıyla. Gövdeleri public.si_* adlarını metin olarak tuttuğu için
--    taşınmıyor; şema dosyası yeni adlarla yeniden kuruyor.
drop function if exists public.si_liste_ozetleri();
drop function if exists public.si_paylasilan_liste(text);

-- 2. Tablolar, verileri, indeksleri, kısıtları, RLS politikaları ve yabancı anahtarlarıyla
alter table public.si_lists      set schema do_siralama_defteri;
alter table public.si_categories set schema do_siralama_defteri;
alter table public.si_items      set schema do_siralama_defteri;

alter table do_siralama_defteri.si_lists      rename to lists;
alter table do_siralama_defteri.si_categories rename to categories;
alter table do_siralama_defteri.si_items      rename to items;

-- 3. Kısıt ve indeks adlarından si_ öneki: sıfırdan kurulumdaki adlarla aynı olsunlar diye
--    (lists_pkey, items_list_id_fkey, items_list_sira_idx ...). Birincil anahtar ve unique
--    kısıtlarının indeksleri kısıtla birlikte yeniden adlanıyor.
do $$
declare
  r record;
begin
  for r in
    select c.conrelid::regclass as tablo, c.conname
    from pg_constraint c
    where c.connamespace = 'do_siralama_defteri'::regnamespace and c.conname like 'si\_%'
  loop
    execute format('alter table %s rename constraint %I to %I', r.tablo, r.conname, substr(r.conname, 4));
  end loop;

  for r in
    select i.relname
    from pg_class i
    where i.relnamespace = 'do_siralama_defteri'::regnamespace and i.relkind = 'i'
      and i.relname like 'si\_%'
  loop
    execute format('alter index do_siralama_defteri.%I rename to %I', r.relname, substr(r.relname, 4));
  end loop;
end $$;

-- 4. Şema dosyası (aşağısı supabase/schema.sql'in kopyasıdır): politikaları yeni adlarla, yetkileri ve
--    fonksiyonları kurar. Taşınan tablolarda create ... if not exists satırları bir şey yapmaz.
-- ============================================================================================

-- Sıralama Defteri'nin tüm tabloları ve fonksiyonları kendi şemasında durur; aynı Supabase projesindeki
-- diğer uygulamalarla karışmaz. İstemci bu şemaya bağlanır (src/lib/sema.ts); şemanın Dashboard'da
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
  emoji          text,                              -- kullanılmıyor (README → kabul edilmiş sınırlar)
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
  -- Kategori silinince öğe silinmesin, kategorisiz kalsın.
  category_id  uuid references do_siralama_defteri.categories on delete set null,
  ad           text not null,
  alt_ad       text,
  fotograf_url text,
  -- sira'ya unique konmadı: sürükle-bırak satırları tek tek UPDATE ettiği için
  -- ara durumlarda geçici çakışma oluşur.
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

create index if not exists items_list_sira_idx      on do_siralama_defteri.items (list_id, sira);
create index if not exists categories_list_sira_idx on do_siralama_defteri.categories (list_id, sira);

-- ── RLS: lists doğrudan user_id ile, diğer ikisi liste üzerinden ───────────────────────────────

alter table do_siralama_defteri.lists      enable row level security;
alter table do_siralama_defteri.categories enable row level security;
alter table do_siralama_defteri.items      enable row level security;

drop policy if exists "kendi listeleri" on do_siralama_defteri.lists;
create policy "kendi listeleri" on do_siralama_defteri.lists
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kendi kategorileri" on do_siralama_defteri.categories;
create policy "kendi kategorileri" on do_siralama_defteri.categories
  for all to authenticated
  using (exists (
    select 1 from do_siralama_defteri.lists l where l.id = categories.list_id and l.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from do_siralama_defteri.lists l where l.id = categories.list_id and l.user_id = auth.uid()
  ));

drop policy if exists "kendi ogeleri" on do_siralama_defteri.items;
create policy "kendi ogeleri" on do_siralama_defteri.items
  for all to authenticated
  using (exists (
    select 1 from do_siralama_defteri.lists l where l.id = items.list_id and l.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from do_siralama_defteri.lists l where l.id = items.list_id and l.user_id = auth.uid()
  ));

-- Tablolar yalnızca giriş yapmış kullanıcıya açık; satırları RLS süzüyor. Anonim ziyaretçi (paylaşım
-- sayfası) tablolara hiç erişemiyor, yalnızca paylasilan_liste fonksiyonunu çağırabiliyor.
revoke all on do_siralama_defteri.lists, do_siralama_defteri.categories, do_siralama_defteri.items
  from public, anon, authenticated;
grant select, insert, update, delete
  on do_siralama_defteri.lists, do_siralama_defteri.categories, do_siralama_defteri.items
  to authenticated;

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

-- ── Sunucu tarafı ───────────────────────────────────────────────────────────────────────────

-- service_role RLS'ye takılmaz ama tablo yetkisine yine de ihtiyaç duyar (Dashboard, betikler).
grant all on all tables in schema do_siralama_defteri to service_role;
grant all on all sequences in schema do_siralama_defteri to service_role;
grant execute on all functions in schema do_siralama_defteri to service_role;


-- ============================================================================================

commit;

notify pgrst, 'reload schema';

-- Doğrulama (ayrıca çalıştırın):
--
-- select 'lists' as kontrol, count(*) from do_siralama_defteri.lists
-- union all select 'categories', count(*) from do_siralama_defteri.categories
-- union all select 'items', count(*) from do_siralama_defteri.items
-- union all select 'tablo', count(*) from information_schema.tables where table_schema = 'do_siralama_defteri'
-- union all select 'fonksiyon', count(*) from pg_proc where pronamespace = 'do_siralama_defteri'::regnamespace
-- union all select 'si_ adlı kısıt/indeks', count(*) from pg_class
--   where relnamespace = 'do_siralama_defteri'::regnamespace and relname like 'si\_%'
-- union all select 'public kalan', count(*) from information_schema.tables
--   where table_schema = 'public' and table_name in ('si_lists', 'si_categories', 'si_items')
-- union all select 'public fonksiyon kalan', count(*) from pg_proc
--   where pronamespace = 'public'::regnamespace and proname in ('si_liste_ozetleri', 'si_paylasilan_liste');
--
-- Beklenen: lists 13, categories 13, items 175, tablo 3, fonksiyon 2, geri kalanlar 0.
