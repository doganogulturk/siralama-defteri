-- ay_ayranlar -> si_lists / si_categories / si_items tek seferlik taşıma.
-- ÖN KOŞUL: Google girişi kurulmuş ve en az bir kez giriş yapılmış olmalı,
-- yoksa auth.users boş olur ve script hata verir.
-- Taşınmayan kolon: sira_eksi (kodda kullanılmıyor, kullanımdan kalkmış).

do $$
declare
  v_user_id uuid;
  v_list_id uuid;
  v_kategorisiz int;
  v_adet int;
begin
  select id into v_user_id
  from auth.users
  where email = 'doganogulturk@gmail.com';

  if v_user_id is null then
    raise exception 'auth.users içinde bu e-posta yok. Önce Google ile bir kez giriş yap.';
  end if;

  -- 1) Ayran listesi
  insert into si_lists (user_id, ad, slug, emoji, sira)
  values (v_user_id, 'Ayran', 'ayran', '🥛', 0)
  returning id into v_list_id;

  -- 2) Eski text enum'u -> kategori satırları (renkler FilterPanel'deki KAT_COLOR ile aynı)
  insert into si_categories (list_id, ad, renk, sira) values
    (v_list_id, 'Yaygın',         '#3f6cd4', 0),
    (v_list_id, 'Market Markası', '#c9812a', 1),
    (v_list_id, 'Yöresel',        '#2f8f6b', 2);

  -- 3) Kayıtlar
  insert into si_items (
    list_id, category_id, ad, alt_ad, fotograf_url,
    sira, denendi, notlar, ozellikler, created_at
  )
  select
    v_list_id,
    c.id,
    a.marka,
    a.urun_adi,
    a.fotograf_url,
    coalesce(a.sira, 0),
    a.denendi,
    a.notlar,
    -- eksi_mi NOT NULL olduğu için hep kalır; market_adi/yore yalnızca doluysa yazılır.
    jsonb_strip_nulls(jsonb_build_object(
      'eksi',       a.eksi_mi,
      'market_adi', a.market_adi,
      'yore',       a.yore
    )),
    a.created_at
  from ay_ayranlar a
  left join si_categories c
    on  c.list_id = v_list_id
    and c.ad = case a.kategori
                 when 'yaygin_market'  then 'Yaygın'
                 when 'market_markasi' then 'Market Markası'
                 when 'yoresel'        then 'Yöresel'
               end;

  select count(*) into v_adet from si_items where list_id = v_list_id;
  select count(*) into v_kategorisiz
  from si_items where list_id = v_list_id and category_id is null;

  raise notice 'Taşınan kayıt: %, kategorisi eşleşmeyen: %', v_adet, v_kategorisiz;
end $$;
