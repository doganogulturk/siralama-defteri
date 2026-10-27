# Sıralama Defteri

Kişisel sıralama uygulaması: denediğin şeyleri kendi listelerinde sürükleyerek sırala, kendi kategorilerini kur, henüz denemediklerini ayrı bir sekmede tut. Çok listeli ve kullanıcı bazlı; her liste kendi kategorilerini ve ek alanlarını taşıyor.

Canlı: <https://siralama-defteri.vercel.app>

## Neler var

- **Sıralama** — sürükle-bırak, kart ve satır görünümü, sıralamanın altında "Bir daha asla" bölümü, ayrı "Denenmemiş" sekmesi.
- **Listeye özel yapı** — kategoriler ve ek alanlar (Evet/Hayır, Metin) veriden üretiliyor; kodda listeye özel alan adı yok.
- **Toplu ekleme ve toplu işlemler** — satır satır yazarak kayıt ve kategori açma; seçim modunda kategori atama, taşıma, silme.
- **Paylaşım** — giriş istemeyen salt okunur bağlantı (`/p/[kod]`), WhatsApp önizleme görseli, Instagram story görseli.
- **Ben de sıralayayım ve karşılaştırma** — paylaşılan listeyi kendi sıranla kopyala, uyum yüzdesini gör (Kendall).
- **Kör Sıralama** — girişsiz oyun: on kayıt birer birer gelir, yeri bir daha değişmez (`/kor`).
- **Hazır şablonlar, PWA, açık/koyu tema, yasal sayfalar ve veri silme.**

Ayrıntılar ve gerekçeler `docs/` altında:

| Belge | İçerik |
|---|---|
| [Özellikler](docs/ozellikler.md) | Her özelliğin nasıl çalıştığı ve neden öyle |
| [Mimari](docs/mimari.md) | Veri modeli, RLS, şema dosyası, kimlik, sınırlar |
| [Tasarım — Vitrin](docs/tasarim.md) | Tokenlar, kurallar, ekranlar |
| [Yol haritası](docs/yol-haritasi.md) | Yayına çıkış, mobil uygulama, sıradaki özellikler |
| [Kabul edilmiş sınırlar](docs/kararlar.md) | Bilinçli kararlar — değiştirmeden önce oku |

## Çalıştırma

```bash
npm install
npm run dev
```

`.env.local` gerekli:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Denetimler — her push ve PR'da GitHub Actions'ta da çalışıyor (`.github/workflows/denetim.yml`):

```bash
npm run typecheck
npm run lint
npm test
```

Testler (Vitest) `src/lib`'teki saf mantığı kapsıyor: toplu giriş ayrıştırma, karşılaştırma (Kendall), Kör Sıralama sonucu, slug, filtre, paylaşım yardımcıları ve sıralama yazımı.

`npm run build` yazı tiplerini (`next/font/google`) derleme anında indiriyor; ağ erişimi olmayan ortamda derleme bu adımda durur. Çalışan uygulama Google'a istek atmıyor.

## Kurulum

**Veritabanı** — Her şey `do_siralama_defteri` şemasında (proje Ekim 2026'ya kadar başka uygulamalarla paylaşılıyordu). Supabase SQL Editor'da sırayla `supabase/schema.sql` ve `supabase/storage.sql` çalıştırılır (ikisi de idempotent). Ardından Project Settings → Data API → **Exposed schemas** listesine `do_siralama_defteri` eklenir; yoksa her istek `PGRST106 Invalid schema` verir.

**Google girişi** — Supabase Auth üzerinden:
- Google Cloud'da OAuth client → Authorized redirect URI: `https://<proje-ref>.supabase.co/auth/v1/callback`
- Authorized domain olarak `supabase.co` kabul edilmiyor, proje kodlu tam hâli girilmeli.
- Supabase → Authentication → URL Configuration → Redirect URLs'e hem `http://localhost:3000/**` hem üretim adresi eklenmeli. Site URL örtük olarak izinli sayılıyor: alan adı değiştirirken buna dikkat.

**Dağıtım** — Vercel, `main` dalından otomatik; push üretimi günceller. Vercel'de iki ortam değişkeni tanımlı olmalı. Üretim alan adı Redirect URLs'te yoksa build geçer ama Google girişi canlıda **sessizce** başarısız olur (giriş `redirectTo` olarak `window.location.origin` kullanıyor).

## Proje yapısı

```
src/app/(uygulama)/   giriş isteyen ekranlar (AuthGate arkasında): liste indeksi, /l/[slug], /kiyasla/[kod]
src/app/p/[kod]/      paylaşım sayfası, önizleme ve story görselleri (sunucuda çizilir)
src/app/kor/          Kör Sıralama ve görselleri
src/app/…             yasal sayfalar, ikonlar, manifest, globals.css (tüm stiller)
src/components/       arayüz bileşenleri; liste/ sıralama ekranının parçaları
src/hooks/            oturum, liste verisi, liste indeksi, seçim modu, görünüm tercihi
src/lib/              Supabase erişimi (items.ts), saf mantık (sort, toplu, kiyas, filtre…), sunucu görsel yardımcıları
supabase/             şema ve kova politikaları
```

Güvenlik RLS'te: uygulama istemci tarafında çalışıyor, `AuthGate` yalnızca bir kapı.

## Teknolojiler

Next.js 16 · React 19 · TypeScript 6 · Supabase (Postgres + Auth + Storage) · dnd-kit · Vercel · Geist ve Instrument Serif
