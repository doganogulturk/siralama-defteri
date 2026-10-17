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

notify pgrst, 'reload schema';
