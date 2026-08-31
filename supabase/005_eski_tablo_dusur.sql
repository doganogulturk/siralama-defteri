-- ay_ayranlar tablosunu düşürür. 002_veri_tasima.sql çalıştıktan ve taşımanın
-- doğruluğu teyit edildikten sonra çalıştırılır. GERİ ALINAMAZ.
--
-- Önce aşağıdaki denetimi TEK BAŞINA çalıştır; sayılar tutmuyorsa DROP'u çalıştırma:
--
--   select
--     (select count(*) from ay_ayranlar)                              as eski_toplam,
--     (select count(*) from si_items i
--        join si_lists l on l.id = i.list_id
--       where l.slug = 'ayran')                                       as yeni_toplam,
--     (select count(*) from ay_ayranlar where denendi)                as eski_denenen,
--     (select count(*) from si_items i
--        join si_lists l on l.id = i.list_id
--       where l.slug = 'ayran' and i.denendi)                         as yeni_denenen;
--
-- Beklenen: eski_toplam = yeni_toplam = 42, eski_denenen = yeni_denenen = 38.

do $$
declare
  v_eski int;
  v_yeni int;
begin
  if to_regclass('public.ay_ayranlar') is null then
    raise notice 'ay_ayranlar zaten yok — yapılacak bir şey kalmadı.';
    return;
  end if;

  select count(*) into v_eski from ay_ayranlar;

  select count(*) into v_yeni
  from si_items i
  join si_lists l on l.id = i.list_id
  where l.slug = 'ayran';

  if v_yeni < v_eski then
    raise exception
      'Taşıma eksik görünüyor: ay_ayranlar %, si_items(ayran) %. DROP iptal edildi.',
      v_eski, v_yeni;
  end if;

  raise notice 'ay_ayranlar (% kayıt) düşürülüyor; si_items(ayran) = %.', v_eski, v_yeni;
end $$;

drop table if exists ay_ayranlar;
