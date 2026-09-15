-- Ana ekranın liste özetleri: her liste için kayıt sayıları ve sıralamanın ilk üçü.
--
-- Önceden istemci bütün kayıtların (list_id, denendi) çiftini çekip bellekte
-- sayıyordu; PostgREST bir yanıtta en fazla 1000 satır döndürdüğü için toplam
-- kayıt 1000'i aşınca sayılar sessizce yanlışlaşırdı. Burada sayım veritabanında
-- yapılıyor ve liste başına tek satır dönüyor.
--
-- security invoker: fonksiyon çağıranın yetkisiyle çalışır, RLS politikaları
-- geçerli kalır — kullanıcı yalnızca kendi listelerini görür.
--
-- İlk üç, uygulamadaki sıralamayla aynı kuralla seçiliyor (lib/sort.ts):
-- denenmiş, "Bir daha asla" bölümünde olmayan; `sira` artan, eşitlikte en yeni önce.

create or replace function si_liste_ozetleri()
returns table (
  list_id  uuid,
  toplam   int,
  bekleyen int,
  ilk_uc   jsonb
)
language sql
stable
security invoker
set search_path = public
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
        from si_items s
        where s.list_id = l.id and s.denendi and not s.asla
        order by s.sira, s.created_at desc
        limit 3
      ) t
    ), '[]'::jsonb)
  from si_lists l
  left join si_items i on i.list_id = l.id
  group by l.id;
$$;

revoke all on function si_liste_ozetleri() from public, anon;
grant execute on function si_liste_ozetleri() to authenticated;
