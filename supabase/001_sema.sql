-- Sıralama uygulaması — temel şema
-- Tablolar tek Supabase projesinde paylaşıldığı için si_ öneki kullanılıyor.

-- 1) Listeler: her satır bir sıralama (Ayran, Kola, Döner ...)
create table si_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  ad          text not null,
  slug        text not null,
  emoji       text,
  sira        int  not null default 0,          -- listelerin kendi arasındaki sırası
  -- Listeye özel ek alan tanımları; ayrıntı için 003_liste_alanlari.sql
  alanlar     jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);

-- 2) Kategoriler: bir listenin alt kırılımları (Şekerli/Şekersiz, Yaprak/Kıyma ...)
create table si_categories (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references si_lists on delete cascade,
  ad          text not null,
  renk        text not null default '#3f6cd4',
  sira        int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (list_id, ad)
);

-- 3) Öğeler: sıralanan ürünler
create table si_items (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references si_lists on delete cascade,
  -- Kategori silinince öğe silinmesin, kategorisiz kalsın.
  category_id  uuid references si_categories on delete set null,
  ad           text not null,
  alt_ad       text,
  fotograf_url text,
  -- sira'ya unique konmadı: sürükle-bırak satırları tek tek UPDATE ettiği için
  -- ara durumlarda geçici çakışma oluşur.
  sira         int  not null default 0,
  denendi      boolean not null default true,
  notlar       text,
  -- Listeye özel serbest alanlar (eski eksi_mi / market_adi / yore burada).
  ozellikler   jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index si_items_list_sira_idx      on si_items (list_id, sira);
create index si_categories_list_sira_idx on si_categories (list_id, sira);

-- RLS: si_lists doğrudan user_id ile, diğer ikisi liste üzerinden.
alter table si_lists      enable row level security;
alter table si_categories enable row level security;
alter table si_items      enable row level security;

create policy "kendi listeleri" on si_lists
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "kendi kategorileri" on si_categories
  for all
  using (exists (
    select 1 from si_lists l where l.id = si_categories.list_id and l.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from si_lists l where l.id = si_categories.list_id and l.user_id = auth.uid()
  ));

create policy "kendi ogeleri" on si_items
  for all
  using (exists (
    select 1 from si_lists l where l.id = si_items.list_id and l.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from si_lists l where l.id = si_items.list_id and l.user_id = auth.uid()
  ));
