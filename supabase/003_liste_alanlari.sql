-- Listeye özel ek alanlar. Ayrandaki "ekşi mi", "satılan market", "yöre"
-- alanları kodda sabit yerine burada tanımlı; başka listeler kendi alanlarını
-- tanımlayabilsin diye veri olarak tutuluyor.
--
-- Biçim: [{ anahtar, tip: 'bool'|'metin', etiket, kisa?, ipucu?,
--           filtre?: bool alanı filtre şeridinde göster,
--           kategori_id?: yalnızca bu kategori seçiliyken görünür }]
alter table si_lists add column alanlar jsonb not null default '[]';

do $$
declare
  v_list_id  uuid;
  v_market   uuid;
  v_yoresel  uuid;
begin
  select id into v_list_id from si_lists where slug = 'ayran';
  if v_list_id is null then
    raise exception 'ayran listesi bulunamadı — önce 002_veri_tasima.sql çalıştırılmalı.';
  end if;

  select id into v_market  from si_categories where list_id = v_list_id and ad = 'Market Markası';
  select id into v_yoresel from si_categories where list_id = v_list_id and ad = 'Yöresel';

  update si_lists
  set alanlar = jsonb_build_array(
    jsonb_build_object(
      'anahtar', 'eksi',
      'tip',     'bool',
      'etiket',  'Ekşi ayran mı?',
      'kisa',    'Ekşi',
      'filtre',  true
    ),
    jsonb_build_object(
      'anahtar',     'market_adi',
      'tip',         'metin',
      'etiket',      'Satılan Market',
      'ipucu',       'Migros, BİM, A101, File…',
      'kategori_id', v_market
    ),
    jsonb_build_object(
      'anahtar',     'yore',
      'tip',         'metin',
      'etiket',      'Yöre / Şehir / Köy',
      'ipucu',       'Balıkesir Susurluk, Konya, Erzurum…',
      'kategori_id', v_yoresel
    )
  )
  where id = v_list_id;
end $$;
