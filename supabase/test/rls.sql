-- Erişim kurallarının testleri: iki kullanıcı (A, B) ve anonim ziyaretçi. Güvenliğin tamamı RLS'te ve
-- veritabanı fonksiyonlarında olduğu için asıl korunan yer burası. supabase/test/calistir.sh, boş bir
-- veritabanına önce supabase-taklidi.sql'i, sonra schema.sql ve storage.sql'i, en son bunu çalıştırıyor.
-- İlk başarısız denetim hatayla duruyor (psql ON_ERROR_STOP).

\set ON_ERROR_STOP on
\set QUIET on

create schema test;
grant usage on schema test to anon, authenticated;

create function test.esit(gercek anyelement, beklenen anyelement, ne text) returns void
language plpgsql as $$
begin
  if gercek is distinct from beklenen then
    raise exception 'BAŞARISIZ: % — beklenen %, gelen %', ne, beklenen, gercek;
  end if;
  raise notice 'tamam: %', ne;
end $$;

/** Komut hata vermeli; `kod` verilirse SQLSTATE de tutmalı. Çağıranın rolüyle çalışıyor. */
create function test.hata(komut text, ne text, kod text default null) returns void
language plpgsql as $$
begin
  execute komut;
  raise exception 'BAŞARISIZ: % — hata bekleniyordu, komut geçti', ne;
exception
  when others then
    if sqlerrm like 'BAŞARISIZ:%' then raise; end if;
    if kod is not null and sqlstate <> kod then
      raise exception 'BAŞARISIZ: % — beklenen hata %, gelen % (%)', ne, kod, sqlstate, sqlerrm;
    end if;
    raise notice 'tamam: %', ne;
end $$;

grant execute on all functions in schema test to anon, authenticated;

/** Oturumdaki kullanıcı: auth.uid() bunu okuyor. */
create function test.olarak(kim uuid) returns void
language sql as $$ select set_config('request.jwt.claim.sub', coalesce(kim::text, ''), false) $$;
grant execute on function test.olarak(uuid) to anon, authenticated;

\set A '''aaaaaaaa-0000-0000-0000-000000000001'''
\set B '''bbbbbbbb-0000-0000-0000-000000000002'''

insert into auth.users (id, raw_user_meta_data) values
  (:A, '{"full_name": "Ayşe Deneme", "email": "ayse@ornek.com"}'),
  (:B, '{"full_name": "Bora Deneme"}');

-- ── A kendi verisini kuruyor ──────────────────────────────────────────────────
select test.olarak(:A);
set role authenticated;

insert into do_siralama_defteri.lists (id, user_id, ad, slug, paylasim_kodu) values
  ('11111111-0000-0000-0000-000000000001', :A, 'Döner', 'doner', 'PaylasimKoduAAAA0001'),
  ('11111111-0000-0000-0000-000000000002', :A, 'Kola', 'kola', null);
insert into do_siralama_defteri.categories (id, list_id, ad) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Yaprak'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Şekersiz');
insert into do_siralama_defteri.items (id, list_id, category_id, ad, sira, denendi, asla, notlar) values
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000001', 'Birinci', 0, true, false, 'gizli not'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', null, 'İkinci', 1, true, false, null),
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', null, 'Asla', 0, true, true, null),
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', null, 'Bekleyen', 0, false, false, null);

select test.esit((select count(*) from do_siralama_defteri.items)::int, 4, 'A kendi kayıtlarını görüyor');
select test.esit(
  (select toplam from do_siralama_defteri.liste_ozetleri() where list_id = '11111111-0000-0000-0000-000000000001'),
  4, 'liste_ozetleri: A''nın Döner listesinde 4 kayıt');
select test.esit(
  (select bekleyen from do_siralama_defteri.liste_ozetleri() where list_id = '11111111-0000-0000-0000-000000000001'),
  1, 'liste_ozetleri: 1 bekleyen');
select test.esit(
  (select ilk_uc -> 0 ->> 'ad' from do_siralama_defteri.liste_ozetleri()
    where list_id = '11111111-0000-0000-0000-000000000001'),
  'Birinci', 'liste_ozetleri: şampiyon sıralamanın ilki');

-- Kategori kaydın kendi listesinden olmalı (bileşik yabancı anahtar).
select test.hata($$
  insert into do_siralama_defteri.items (list_id, category_id, ad)
  values ('11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'Yanlış kategori')
$$, 'başka listenin kategorisi reddediliyor', '23503');

-- Kademeler: siralamayi_yaz kademeyi yazıyor, null'a çekebiliyor; verilmezse dokunmuyor.
update do_siralama_defteri.lists set kademeler = '[{"anahtar":"s","etiket":"S"},{"anahtar":"a","etiket":"A"}]'
  where id = '11111111-0000-0000-0000-000000000001';
select do_siralama_defteri.siralamayi_yaz(
  '[{"id": "33333333-0000-0000-0000-000000000001", "sira": 0, "kademe": "s"},
    {"id": "33333333-0000-0000-0000-000000000002", "sira": 1, "kademe": "a"}]'::jsonb);
select test.esit((select kademe from do_siralama_defteri.items where id = '33333333-0000-0000-0000-000000000002'),
  'a', 'siralamayi_yaz kademeyi yazıyor');
select do_siralama_defteri.siralamayi_yaz('[{"id": "33333333-0000-0000-0000-000000000001", "sira": 0}]'::jsonb);
select test.esit((select kademe from do_siralama_defteri.items where id = '33333333-0000-0000-0000-000000000001'),
  's', 'kademe verilmezse olduğu gibi kalıyor');
select do_siralama_defteri.siralamayi_yaz('[{"id": "33333333-0000-0000-0000-000000000002", "sira": 1, "kademe": null}]'::jsonb);
select test.esit((select kademe from do_siralama_defteri.items where id = '33333333-0000-0000-0000-000000000002'),
  null::text, 'kademe null yazılabiliyor (kademesiz)');
select test.hata($$
  update do_siralama_defteri.lists set kademeler = '[]' where slug = 'doner'
$$, 'boş kademe dizisi reddediliyor (kapalıysa null)', '23514');
select test.hata($$
  update do_siralama_defteri.lists set kademeler = '{"s": "S"}' where slug = 'doner'
$$, 'dizi olmayan kademeler reddediliyor', '23514');

-- Uzunluk sınırları.
select test.hata($$
  insert into do_siralama_defteri.items (list_id, ad) values ('11111111-0000-0000-0000-000000000001', repeat('x', 121))
$$, '121 harflik kayıt adı reddediliyor', '23514');
select test.hata($$
  update do_siralama_defteri.lists set paylasim_kodu = 'kisa' where slug = 'kola'
$$, 'kısa paylaşım kodu reddediliyor', '23514');

reset role;

-- ── B, A'nın verisine dokunamıyor ─────────────────────────────────────────────
select test.olarak(:B);
set role authenticated;

select test.esit((select count(*) from do_siralama_defteri.lists)::int, 0, 'B A''nın listelerini görmüyor');
select test.esit((select count(*) from do_siralama_defteri.categories)::int, 0, 'B A''nın kategorilerini görmüyor');
select test.esit((select count(*) from do_siralama_defteri.items)::int, 0, 'B A''nın kayıtlarını görmüyor');
select test.esit((select count(*) from do_siralama_defteri.liste_ozetleri())::int, 0, 'B''nin özetlerinde A yok');

update do_siralama_defteri.items set ad = 'ele geçirildi';
delete from do_siralama_defteri.items;
delete from do_siralama_defteri.lists;
select do_siralama_defteri.siralamayi_yaz(
  '[{"id": "33333333-0000-0000-0000-000000000001", "sira": 99, "asla": true}]'::jsonb);

select test.hata($$
  insert into do_siralama_defteri.items (list_id, ad) values ('11111111-0000-0000-0000-000000000001', 'sızma')
$$, 'B A''nın listesine kayıt ekleyemiyor', '42501');
select test.hata($$
  insert into do_siralama_defteri.categories (list_id, ad) values ('11111111-0000-0000-0000-000000000001', 'sızma')
$$, 'B A''nın listesine kategori ekleyemiyor', '42501');
select test.hata($$
  insert into do_siralama_defteri.lists (user_id, ad, slug)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'sızma', 'sizma')
$$, 'B A adına liste açamıyor', '42501');

-- B kendi listesinde A'nın kategorisini gösteremiyor.
insert into do_siralama_defteri.lists (id, user_id, ad, slug)
  values ('11111111-0000-0000-0000-00000000000b', :B, 'B listesi', 'b');
select test.hata($$
  insert into do_siralama_defteri.items (list_id, category_id, ad)
  values ('11111111-0000-0000-0000-00000000000b', '22222222-0000-0000-0000-000000000001', 'sızma')
$$, 'B kendi kaydına A''nın kategorisini bağlayamıyor', '23503');
-- B kendi listesini A'ya devredemiyor (with check).
select test.hata($$
  update do_siralama_defteri.lists set user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  where id = '11111111-0000-0000-0000-00000000000b'
$$, 'B listesini A''ya devredemiyor', '42501');

reset role;

select test.esit(
  (select string_agg(ad || ':' || sira || ':' || asla, ',' order by ad) from do_siralama_defteri.items),
  'Asla:0:true,Bekleyen:0:false,Birinci:0:false,İkinci:1:false',
  'B''nin güncelleme, silme ve siralamayi_yaz denemeleri A''nın verisini değiştirmedi');

-- ── Anonim ziyaretçi: tablolar kapalı, yalnızca paylaşım fonksiyonu ───────────
select test.olarak(null);
set role anon;

select test.hata('select * from do_siralama_defteri.lists', 'anon listeleri okuyamıyor', '42501');
select test.hata('select * from do_siralama_defteri.items', 'anon kayıtları okuyamıyor', '42501');
select test.hata('select do_siralama_defteri.liste_ozetleri()', 'anon liste_ozetleri çağıramıyor', '42501');
select test.hata('select do_siralama_defteri.hesabimi_sil()', 'anon hesabimi_sil çağıramıyor', '42501');

select test.esit(do_siralama_defteri.paylasilan_liste('YanlisKodYanlisKod00'), null::jsonb, 'yanlış kod: null');
select test.esit(do_siralama_defteri.paylasilan_liste('PaylasimKoduAAAA0001') ->> 'ad', 'Döner', 'paylaşılan liste okunuyor');
select test.esit(do_siralama_defteri.paylasilan_liste('PaylasimKoduAAAA0001') ->> 'sahip', 'Ayşe Deneme', 'sahibin adı dönüyor');
select test.esit(
  (select string_agg(k ->> 'ad', ',') from jsonb_array_elements(
     do_siralama_defteri.paylasilan_liste('PaylasimKoduAAAA0001') -> 'kayitlar') k),
  'Birinci,İkinci,Asla', 'paylaşımda önce sıralama, sonra "Bir daha asla"; bekleyen yok');
select test.esit(
  do_siralama_defteri.paylasilan_liste('PaylasimKoduAAAA0001') -> 'kademeler' -> 0 ->> 'etiket', 'S',
  'paylaşımda kademeler dönüyor');
select test.esit(
  do_siralama_defteri.paylasilan_liste('PaylasimKoduAAAA0001') -> 'kayitlar' -> 0 ->> 'kademe', 's',
  'paylaşımda kaydın kademesi dönüyor');
select test.esit(
  do_siralama_defteri.paylasilan_liste('PaylasimKoduAAAA0001')::text ~ '(gizli not|notlar|ayse@ornek|aaaaaaaa-0000)',
  false, 'paylaşımda not, e-posta ve kullanıcı kimliği yok');

reset role;

-- ── Fotoğraf kovası ─────────────────────────────────────────────────────────────
select test.olarak(:A);
set role authenticated;

insert into storage.objects (bucket_id, name, owner_id)
  values ('fotograflar', 'aaaaaaaa-0000-0000-0000-000000000001/a.jpg', 'aaaaaaaa-0000-0000-0000-000000000001');
select test.esit((select count(*) from storage.objects)::int, 1, 'A kendi klasörüne yükleyip görüyor');
select test.hata($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('fotograflar', 'bbbbbbbb-0000-0000-0000-000000000002/a.jpg', 'aaaaaaaa-0000-0000-0000-000000000001')
$$, 'A başkasının klasörüne yükleyemiyor', '42501');
select test.hata($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('fotograflar', 'kok.jpg', 'aaaaaaaa-0000-0000-0000-000000000001')
$$, 'kovanın köküne yükleme kapalı', '42501');
reset role;

-- Klasör kuralından önce köke yüklenmiş eski bir dosya: sahibi hâlâ görüp silebiliyor.
insert into storage.objects (bucket_id, name, owner_id)
  values ('fotograflar', 'eski.jpg', 'aaaaaaaa-0000-0000-0000-000000000001');

select test.olarak(:B);
set role authenticated;
select test.esit((select count(*) from storage.objects)::int, 0, 'B A''nın dosyalarını listeleyemiyor');
delete from storage.objects;
reset role;
select test.esit((select count(*) from storage.objects)::int, 2, 'B A''nın dosyalarını silemedi');

select test.olarak(:A);
set role authenticated;
select test.esit((select count(*) from storage.objects where name = 'eski.jpg')::int, 1, 'A kökteki eski dosyasını görüyor');
delete from storage.objects where name = 'eski.jpg';
reset role;
select test.esit((select count(*) from storage.objects)::int, 1, 'A kökteki eski dosyasını silebildi');

-- ── Adet sınırı ─────────────────────────────────────────────────────────────────
select test.olarak(:B);
set role authenticated;
insert into do_siralama_defteri.lists (user_id, ad, slug)
  select :B, 'L' || n, 'l' || n from generate_series(2, 50) n;
select test.hata($$
  insert into do_siralama_defteri.lists (user_id, ad, slug) values ('bbbbbbbb-0000-0000-0000-000000000002', 'fazla', 'fazla')
$$, '51. liste reddediliyor', 'SDLIM');
insert into do_siralama_defteri.items (list_id, ad)
  select '11111111-0000-0000-0000-00000000000b', 'k' || n from generate_series(1, 200) n;
select test.hata($$
  insert into do_siralama_defteri.items (list_id, ad) values ('11111111-0000-0000-0000-00000000000b', 'fazla')
$$, '201. kayıt reddediliyor', 'SDLIM');
update do_siralama_defteri.items set ad = ad || '!' where list_id = '11111111-0000-0000-0000-00000000000b';
select test.esit((select count(*) from do_siralama_defteri.items where ad like '%!')::int, 200,
  'dolu listede düzenleme sınıra takılmıyor');

-- ── Apple jetonu ────────────────────────────────────────────────────────────────
-- (oturum: B)
select do_siralama_defteri.apple_jetonu_kaydet('jeton-B-1');
select do_siralama_defteri.apple_jetonu_kaydet('jeton-B-2');
select test.hata('select * from do_siralama_defteri.apple_jetonlari', 'kullanıcı Apple jetonlarını okuyamıyor', '42501');
select test.esit((select yenileme_jetonu from do_siralama_defteri.apple_jetonu_al()), 'jeton-B-2', 'kullanıcı kendi jetonunu fonksiyonla alıyor');
select test.hata($$select do_siralama_defteri.apple_jetonu_kaydet('x', 'baska.istemci')$$, 'bilinmeyen Apple istemcisi reddediliyor');
reset role;
select test.olarak(:A);
set role authenticated;
select test.esit((select count(*) from do_siralama_defteri.apple_jetonu_al())::int, 0, 'A, B''nin Apple jetonunu göremiyor');
reset role;
select test.olarak(:B);
set role authenticated;
reset role;
select test.esit((select string_agg(yenileme_jetonu, ',') from do_siralama_defteri.apple_jetonlari where user_id = :B),
  'jeton-B-2', 'jeton güncelleniyor, kullanıcı başına tek satır');

-- ── Bildir ve engelle ───────────────────────────────────────────────────────────
select test.olarak(null);
set role anon;
select test.hata($$select do_siralama_defteri.apple_jetonu_kaydet('x')$$, 'anon Apple jetonu kaydedemiyor', '42501');
select do_siralama_defteri.paylasimi_bildir('PaylasimKoduAAAA0001', 'spam', 'deneme');
select test.hata($$select do_siralama_defteri.paylasimi_bildir('PaylasimKoduAAAA0001', 'yok')$$, 'geçersiz neden reddediliyor', '23514');
select test.hata($$select do_siralama_defteri.paylasimi_bildir('YanlisKodYanlisKod00', 'spam')$$, 'olmayan paylaşım bildirilemiyor');
select test.hata('select * from do_siralama_defteri.bildirimler', 'anon bildirimleri okuyamıyor', '42501');
select test.hata($$select do_siralama_defteri.paylasani_engelle('PaylasimKoduAAAA0001')$$, 'anon engelleyemiyor', '42501');
reset role;
select test.esit((select sahip_id from do_siralama_defteri.bildirimler where neden = 'spam'), :A::uuid,
  'bildirim paylaşımın sahibini buluyor');

select test.olarak(:A);
set role authenticated;
select test.hata($$select do_siralama_defteri.paylasani_engelle('PaylasimKoduAAAA0001')$$, 'kendini engelleyemiyor');
select test.hata('select * from do_siralama_defteri.bildirimler', 'sahip bildirimleri okuyamıyor', '42501');
reset role;

select test.olarak(:B);
set role authenticated;
select test.esit(do_siralama_defteri.paylasan_engelli_mi('PaylasimKoduAAAA0001'), false, 'başta engel yok');
select do_siralama_defteri.paylasani_engelle('PaylasimKoduAAAA0001');
select do_siralama_defteri.paylasani_engelle('PaylasimKoduAAAA0001');
select test.esit(do_siralama_defteri.paylasan_engelli_mi('PaylasimKoduAAAA0001'), true, 'B paylaşanı engelledi (iki kez de olur)');
select do_siralama_defteri.paylasanin_engelini_kaldir('PaylasimKoduAAAA0001');
select test.esit(do_siralama_defteri.paylasan_engelli_mi('PaylasimKoduAAAA0001'), false, 'engel kalktı');
select do_siralama_defteri.paylasani_engelle('PaylasimKoduAAAA0001');
select test.hata('select * from do_siralama_defteri.engellenenler', 'engel tablosu doğrudan okunamıyor', '42501');

-- ── Hesap silme ─────────────────────────────────────────────────────────────────
select do_siralama_defteri.hesabimi_sil();
reset role;

select test.esit((select count(*) from auth.users where id = :B)::int, 0, 'B''nin giriş kaydı silindi');
select test.esit((select count(*) from do_siralama_defteri.lists where user_id = :B)::int, 0, 'B''nin listeleri cascade ile gitti');
select test.esit((select count(*) from do_siralama_defteri.items)::int, 4, 'A''nın kayıtları yerinde');
select test.esit((select count(*) from do_siralama_defteri.apple_jetonlari where user_id = :B)::int, 0, 'B''nin Apple jetonu cascade ile gitti');
select test.esit((select count(*) from do_siralama_defteri.engellenenler)::int, 0, 'B''nin engelleri cascade ile gitti');
select test.esit((select count(*) from do_siralama_defteri.bildirimler)::int, 1, 'bildirim kalıyor (bildiren silinince boşalıyor)');

\echo 'Bütün RLS testleri geçti.'
