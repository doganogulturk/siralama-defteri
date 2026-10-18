# Mimari

Veri, kimlik ve sınırlar: Supabase şeması, RLS, giriş akışı ve kötüye kullanıma karşı kapılar.

## Veri

Supabase projesi başka uygulamalarla paylaşıldığı için her şey uygulamanın kendi şemasında: `do_siralama_defteri`. Şemada `lists` / `categories` / `items` tabloları (RLS ile), ana ekranın özetlerini hazırlayan `liste_ozetleri` ve paylaşılan listeyi okuyan `paylasilan_liste` fonksiyonları var. Tanımın tamamı `supabase/schema.sql`; fotoğraf kovasının ayarları ve politikaları `supabase/storage.sql` (ondan sonra çalıştırılır).

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
lists       id, user_id, ad, slug, emoji, sira, created_at, alanlar(jsonb), renk, paylasim_kodu, kaynak_kod
            └ emoji, renk ve sira kullanılmıyor (bkz. kararlar.md)
categories  id, list_id, ad, renk, sira, created_at
items       id, list_id, category_id, ad, alt_ad, fotograf_url,
            sira, denendi, notlar, ozellikler(jsonb), created_at, asla
```

Kritik ayrıntılar:

- **`lists.kaynak_kod`** — "Ben de sıralayayım" ile kopyalanan listede kaynağın paylaşım kodu; karşılaştırma iki listeyi bununla eşliyor. Kaynak bağlantısını yenilerse ya da kapatırsa bağ kopuyor, eşleşme liste adına düşüyor.
- **`lists.alanlar`** — listeye özel ek alan tanımları. Biçim:
  `[{anahtar, tip: 'bool'|'metin', etiket, kisa?, ipucu?, filtre?, kategori_id?}]`
  Örneğin bir içecek listesinde "Ekşi mi?" (Evet/Hayır) ya da "Satılan market" (Metin). Filtre şeridi, form ve detay paneli bu tanımdan üretiliyor.
- **`items.asla`** — denenmiş ama sıralamada değil: "Bir daha asla" bölümünde. Sıralama ve bölüm `sira`'yı kendi içlerinde ayrı ayrı numaralıyor; ayrımı bu kolon yapıyor.
- **`items.ozellikler`** — yukarıdaki alanların değerleri (`{"eksi": true, "market": "Migros"}`).
- **`category_id` nullable, `on delete set null`** — kategori silinince kayıtlar kategorisiz kalır.
- **RLS** — üç tabloda da açık; `lists` doğrudan `user_id` ile, diğer ikisi liste üzerinden.

### Şema dosyası

`supabase/schema.sql` şemanın tek ve kalıcı tanımı: boş bir veritabanında her şeyi sıfırdan kurar, kurulu olanda tekrar çalıştırılabilir (idempotent). Değişiklikler bu dosyaya yazılıp Supabase SQL Editor'da çalıştırılıyor.

Kurulumda iki şey dosyanın dışında:

- **Exposed schemas** — Project Settings → Data API → Exposed schemas listesinde `do_siralama_defteri` olmalı (Save'e basmayı unutma). Yoksa istemcinin her isteği `PGRST106 Invalid schema` hatası verir. "Extra search path" alanı bu iş için değil.
- **Yetkiler açıkça veriliyor** — Supabase `public` dışındaki şemalarda `anon` / `authenticated`'a otomatik yetki vermiyor. Tablolar yalnızca `authenticated`'a açık (satırları RLS süzüyor); `anon` tablolara hiç erişemiyor, yalnızca `paylasilan_liste`'yi çağırabiliyor.

Fotoğraflar `storage` şemasındaki kovada; şema dosyası ona dokunmuyor.


## Kimlik doğrulama

Google girişi, Supabase Auth üzerinden. Uygulama tamamen istemci tarafında çalıştığı için `@supabase/ssr` ve proxy (Next 16'da `middleware` bu ada taşındı) kullanılmıyor: oturum tarayıcıda tutuluyor, asıl koruma RLS'te.

Kurulum notları:
- Google Cloud'da OAuth client → Authorized redirect URI: `https://<proje-ref>.supabase.co/auth/v1/callback`
- Authorized domain olarak `supabase.co` kabul edilmiyor, **proje kodlu tam hâli** girilmeli
- Supabase → Authentication → URL Configuration → Redirect URLs'e hem `http://localhost:3000/**` hem üretim adresi eklenmiş olmalı
- Site URL örtük olarak izinli yönlendirme sayılıyor: Redirect URLs'te olmayan bir adres yalnızca Site URL olduğu için çalışıyor olabilir — alan adı değiştirirken bu sıralamayı bozmamak gerek
