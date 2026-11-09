# Mimari

Veri, kimlik ve sınırlar: Supabase şeması, RLS, giriş akışı ve kötüye kullanıma karşı kapılar.

## Veri

Her şey uygulamanın kendi şemasında: `do_siralama_defteri` (Supabase projesi Ekim 2026'ya kadar başka uygulamalarla paylaşılıyordu; ad oradan kaldı). Şemada `lists` / `categories` / `items` tabloları (RLS ile), ana ekranın özetlerini hazırlayan `liste_ozetleri`, sıralama değişikliklerini tek transaction'da yazan `siralamayi_yaz` ve paylaşılan listeyi okuyan `paylasilan_liste` fonksiyonları var. Tanımın tamamı `supabase/schema.sql`; fotoğraf kovasının ayarları ve politikaları `supabase/storage.sql` (ondan sonra çalıştırılır).

## Kimlik

Google girişi Supabase Auth üzerinden; uygulama sayfaları (`app/(uygulama)/`) `AuthGate` arkasında, asıl koruma RLS'te. Paylaşım sayfaları bu grubun dışında: oturum istemiyor.


## Sınırlar

Kötüye kullanıma ve farkında olmadan şişen veriye karşı; Supabase ücretsiz planda kalmak için. Değerler `lib/sinirlar.ts`'te, asıl kapı veritabanında (anonim anahtar tarayıcıda herkese açık, istemci kontrolü atlanabilir):

| Ne | Sınır | Nerede uygulanıyor |
|---|---|---|
| Liste başına kayıt (bekleyenler dahil) | 200 | tetikleyici `sinir_denetle` |
| Kullanıcı başına liste | 50 | aynı tetikleyici |
| Liste başına kategori | 50 | aynı tetikleyici |
| Kayıt adı / çeşit / not | 120 / 120 / 2000 harf | check constraint |
| Liste adı / kategori adı | 80 / 60 harf | check constraint |
| Fotoğraf dosyası | 300 KB, yalnızca JPEG | kova ayarı (`storage.sql`) |
| Kullanıcı başına fotoğraf | 1000 | kova yükleme politikası (`foto_sayisi`) |

Fotoğraflar yüklenmeden önce tarayıcıda küçültülüyor (`lib/foto.ts`): uzun kenar 1000 px, JPEG; telefon fotoğrafı tipik olarak 3–8 MB'tan ~50–200 KB'a iniyor. WebP değil, çünkü önizleme görselinin motoru (satori) WebP okuyamıyor. Sığmazsa önce kalite, sonra ölçü düşüyor. Yeniden kodlama EXIF'i (konum dahil) atıyor ve yönü piksellere işliyor. Çözülemeyen biçim (Chrome'da HEIC gibi) yüklemeden önce anlaşılır bir hatayla duruyor. Dosyalar bir yıl önbellekli sunuluyor (adları benzersiz). Liste silinince fotoğrafları da kovadan siliniyor. Arayüz sınıra çarpmadan önce söylüyor: girişlerde `maxLength`, toplu eklemede önizlemenin üstünde uyarı ve kilitli düğme (`lib/toplu.ts` → `topluSorun`). Veritabanından dönen sınır hataları (`SDLIM`, `23514`, kova hataları) `lib/hata.ts`'te Türkçeye çevriliyor.


## Veri modeli

Üç tablo — liste sayısı ne olursa olsun tablo sayısı sabit. Her sıralama `lists` içinde **bir satır**. Hepsi `do_siralama_defteri` şemasında.

```
lists       id, user_id, ad, slug, emoji, sira, created_at, alanlar(jsonb), renk, paylasim_kodu, kaynak_kod,
            kademeler(jsonb)
            └ emoji, renk ve sira kullanılmıyor (bkz. kararlar.md)
categories  id, list_id, ad, renk, sira, created_at
items       id, list_id, category_id, ad, alt_ad, fotograf_url,
            sira, denendi, notlar, ozellikler(jsonb), created_at, asla, kademe
```

Kritik ayrıntılar:

- **`lists.kaynak_kod`** — "Ben de sıralayayım" ile kopyalanan listede kaynağın paylaşım kodu; karşılaştırma iki listeyi bununla eşliyor. Kaynak bağlantısını yenilerse ya da kapatırsa bağ kopuyor, eşleşme liste adına düşüyor.
- **`lists.alanlar`** — listeye özel ek alan tanımları. Biçim:
  `[{anahtar, tip: 'bool'|'metin', etiket, kisa?, ipucu?, filtre?, kategori_id?}]`
  Örneğin bir içecek listesinde "Ekşi mi?" (Evet/Hayır) ya da "Satılan market" (Metin). Filtre şeridi, form ve detay paneli bu tanımdan üretiliyor.
- **`items.asla`** — denenmiş ama sıralamada değil: "Bir daha asla" bölümünde. Sıralama ve bölüm `sira`'yı kendi içlerinde ayrı ayrı numaralıyor; ayrımı bu kolon yapıyor.
- **`lists.kademeler` ve `items.kademe`** — kademeler (tier list). Listede açıksa `[{anahtar, etiket}]`, yukarıdan aşağı; kapalıysa null (boş dizi kısıtla reddediliyor). Kayıt kademesini anahtarla taşıyor; boşsa kademesiz, kademelerin altında. **Kural:** `sira` her zaman kademe sırasıyla tutarlı (önce ilk kademenin kayıtları); istemci her yazımda bunu koruyor (`lib/kademe.ts`, `lib/siralama.ts`). Bu sayede `liste_ozetleri`, `paylasilan_liste`, karşılaştırma ve Kör Sıralama kademeyi bilmeden doğru sırayı okuyor. `siralamayi_yaz` kademeyi de yazıyor; anahtar verilmezse dokunmuyor, `null` verilirse kademesiz yapıyor.
- **`items.ozellikler`** — yukarıdaki alanların değerleri (`{"eksi": true, "market": "Migros"}`).
- **`category_id` nullable, bileşik yabancı anahtar** — `(category_id, list_id)` → `categories (id, list_id)`: kaydın kategorisi kendi listesinden olmak zorunda (RLS yalnızca `list_id`'ye bakıyor). `on delete set null (category_id)`: kategori silinince kayıt kategorisiz kalır, listesi değişmez. Kurulu veritabanında `not valid` eklendi; eski satırlar taranmadı.
- **RLS** — üç tabloda da açık; `lists` doğrudan `user_id` ile, diğer ikisi liste üzerinden. Politikalar `auth.uid()`'yi `(select auth.uid())` olarak çağırıyor: değer satır başına değil sorgu başına bir kez hesaplanıyor.

### Şema dosyası

`supabase/schema.sql` şemanın tek ve kalıcı tanımı: boş bir veritabanında her şeyi sıfırdan kurar, kurulu olanda tekrar çalıştırılabilir (idempotent). Değişiklikler bu dosyaya yazılıp Supabase SQL Editor'da çalıştırılıyor.

Kurulumda iki şey dosyanın dışında:

- **Exposed schemas** — Project Settings → Data API → Exposed schemas listesinde `do_siralama_defteri` olmalı (Save'e basmayı unutma). Yoksa istemcinin her isteği `PGRST106 Invalid schema` hatası verir. "Extra search path" alanı bu iş için değil.
- **Yetkiler açıkça veriliyor** — Supabase `public` dışındaki şemalarda `anon` / `authenticated`'a otomatik yetki vermiyor. Tablolar yalnızca `authenticated`'a açık (satırları RLS süzüyor); `anon` tablolara hiç erişemiyor, yalnızca `paylasilan_liste`'yi çağırabiliyor.

Fotoğraflar `storage` şemasındaki kovada; şema dosyası ona dokunmuyor. Her kullanıcı kendi klasörüne yüklüyor (`<kullanıcı kimliği>/<uuid>.jpg`); yükleme politikası başka klasöre izin vermiyor. Klasör kuralından önceki fotoğraflar kovanın kökünde duruyor; okuma ve silme sahibine göre olduğu için onlar da çalışıyor. Kova herkese açık okunuyor: paylaşılmamış listelerin fotoğrafını da adresi bilen açabilir, adın tahmin edilemez olması bu yüzden önemli.

### Erişim kurallarının testi

`npm run test:db` boş bir Postgres'te (15+) Supabase'in şemanın dayandığı parçalarını taklit ediyor (`supabase/test/supabase-taklidi.sql`: roller, `auth.users`, `auth.uid()`, storage tabloları), üstüne gerçek `schema.sql` ve `storage.sql`'i kuruyor, sonra `supabase/test/rls.sql`'deki denetimleri iki kullanıcı ve anonim ziyaretçiyle çalıştırıyor: başkasının verisini görememe ve değiştirememe, paylaşım fonksiyonunun döndürdükleri, sınırlar, hesap silme, kova politikaları. CI'da ayrı bir iş (`postgres:16` servisi). Şema dosyasına yeni bir tablo, politika ya da fonksiyon eklenince denetimi de buraya eklenmeli.

```bash
DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
```


## Kimlik doğrulama

Google girişi, Supabase Auth üzerinden. Uygulama tamamen istemci tarafında çalıştığı için `@supabase/ssr` ve proxy (Next 16'da `middleware` bu ada taşındı) kullanılmıyor: oturum tarayıcıda tutuluyor, asıl koruma RLS'te.

Kurulum notları:
- Google Cloud'da OAuth client → Authorized redirect URI: `https://<proje-ref>.supabase.co/auth/v1/callback`
- Authorized domain olarak `supabase.co` kabul edilmiyor, **proje kodlu tam hâli** girilmeli
- Supabase → Authentication → URL Configuration → Redirect URLs'e hem `http://localhost:3000/**` hem üretim adresi eklenmiş olmalı
- Site URL örtük olarak izinli yönlendirme sayılıyor: Redirect URLs'te olmayan bir adres yalnızca Site URL olduğu için çalışıyor olabilir — alan adı değiştirirken bu sıralamayı bozmamak gerek

## Bildirimler ve engeller (App Store 1.2)

Başkasının paylaşımı uygulamada yalnızca bağlantıyla görünüyor: `/p/[kod]`, kör sıralatma (`/p/[kod]/kor`) ve karşılaştırma (`/kiyasla/[kod]`). Üçünde de altta **Bildir** (giriş istemiyor) ve giriş yapmışsa **Bu kişiyi engelle** var (`components/PaylasimGuvenligi.tsx`); kendi paylaşımında görünmüyor. Engellenen kişinin paylaşımı bu üç yerde perdeyle görünüyor, perdede "Engeli kaldır".

- **Tablolar:** `bildirimler` (paylaşım kodu, liste, sahip, bildiren, sebep, açıklama, durum: `yeni / incelendi / kaldirildi`) ve `engellenenler` (kim, kimi). İkisine de istemciden doğrudan erişim yok; yalnızca `paylasimi_bildir`, `paylasani_engelle`, `paylasanin_engelini_kaldir`, `paylasan_engelli_mi` fonksiyonları. Sahibin kimliği istemciye hiç gitmiyor, fonksiyonlar paylaşım kodundan buluyor. Aynı paylaşıma saatte en fazla 30 bildirim.
- **İnceleme (sahibi, 24 saat içinde):** Supabase → Table Editor → `do_siralama_defteri.bildirimler`, `durum = 'yeni'`. Ya da SQL Editor'da:

  ```sql
  select b.created_at, b.neden, b.aciklama, l.ad, b.paylasim_kodu
  from do_siralama_defteri.bildirimler b
  left join do_siralama_defteri.lists l on l.id = b.list_id
  where b.durum = 'yeni' order by b.created_at;
  ```

  Paylaşımı kapatmak (bağlantı ölür, liste sahibinde kalır): `update do_siralama_defteri.lists set paylasim_kodu = null where paylasim_kodu = '<kod>';` sonra `update do_siralama_defteri.bildirimler set durum = 'kaldirildi' where paylasim_kodu = '<kod>';`. Uygunsuz değilse `durum = 'incelendi'`. Ağır durumda hesabı kapatmak: Authentication → Users → kullanıcı → Delete user (listeleri cascade ile gider; kovadaki fotoğrafları Storage'dan elle silmek gerekir).
- **Yeni bildirim haberi:** şimdilik yok; panel elle kontrol ediliyor. Mağazaya çıkınca bir veritabanı webhook'u ya da Edge Function ile e-posta düşünülmeli.

## Apple jetonunun iptali (App Store 5.1.1(v))

Apple ile girmiş hesap silinirken Apple jetonları iptal edilmeli. Supabase Apple'ın yenileme jetonunu yalnızca girişten hemen sonra istemciye veriyor (`provider_refresh_token`): `AuthGate` → `lib/auth.ts` → `appleJetonunuIzle` onu `apple_jetonu_kaydet` ile `apple_jetonlari` tablosuna yazıyor (istemci okuyamıyor; yalnızca `apple_jetonu_al` ile kendi satırı). Hesap silinirken (`items.ts` → `hesabiSil`) silmeden önce `apple-iptal` Edge Function'ı (`supabase/functions/apple-iptal/index.ts`) kullanıcının oturumuyla çağrılıyor: jetonu okuyup .p8 anahtarıyla imzalı bir istemci sırrıyla Apple'ın `/auth/revoke` ucuna gönderiyor. İptal olmazsa silme yine sürüyor (silme hakkı iptale bağlı kalmamalı). Bu düzenden önce Apple ile girmiş hesapların jetonu yok; bir sonraki girişlerinde saklanıyor.

- **Gizli değişkenler** (Supabase → Edge Functions → Secrets): `APPLE_P8` (.p8 dosyasının içeriği), `APPLE_TEAM_ID`, `APPLE_KEY_ID`.
- **Kurulum:** Supabase CLI yok; fonksiyon panelden (Edge Functions → Deploy a new function → Via Editor) `apple-iptal` adıyla, dosyanın içeriği yapıştırılarak kuruluyor. "Verify JWT" açık kalmalı.

