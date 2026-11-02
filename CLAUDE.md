@AGENTS.md

# Sıralama Defteri — çalışma notları

Claude Code bu dosyayı her oturumun başında okuyor. Projenin bilgi birikimi `docs/` altında; burası oraya giden kısa yol ve çalışma alışkanlıkları. (`next dev` yalnızca `AGENTS.md`'deki işaretli bloğu yeniliyor; bu dosyaya dokunmuyor.)

## Yeni bir işe başlamadan

1. `docs/yol-haritasi.md` → **Durum** (son yapılanlar) ve **Sıradaki adım** (bekleyenler, sırasıyla). Ne yapıldığı ve neyin beklediği orada; konuşmalarda verilen kararlar da oraya işleniyor.
2. Dokunacağın özelliğin bölümü: `docs/ozellikler.md` (nasıl çalışıyor, neden öyle).
3. `docs/kararlar.md` — bilinçli kararlar ve kabul edilmiş sınırlar; birini değiştirmeden önce gerekçesini oku.
4. Veri modeli ve şema: `docs/mimari.md`; görünüm kuralları: `docs/tasarim.md`.

## Son eklenen büyük özellikler (Kasım 2026)

- **Kameralı Kör Sıralama** — `components/KorKamera.tsx`, `lib/kamera.ts`. Ön kamera, başın üstünde kart, tek tuvalden sesli 9:16 video; video cihazdan çıkmıyor. iPhone'da denendi ve beğenildi; Android ve paylaşım hedefleri denenmedi.
- **Kademeler (tier list)** — `lib/kademe.ts`, `components/kademe/`, şemada `lists.kademeler` ve `items.kademe`. Kural: `sira` her zaman kademe sırasıyla tutarlı; özetler, paylaşım, karşılaştırma ve Kör Sıralama bu yüzden kademeyi bilmeden doğru sırayı okuyor. Uygulamada vurgunun tonları, paylaşım görselinde klasik tier renkleri.
- **Doğru Sıra** — `lib/dogru-sira.ts`, `lib/dogru-sira-listeler.ts`, `/oyna/dogru-sira/[liste]`. Doğru cevabı olan sıralamalar; veriler kaynaklı, yıllık bakım istiyor (TÜİK il nüfusları her Şubat).
- **Oyna** — oyunlar `/oyna` altında (`components/oyna/`); ana ekranda "Bugün" ve "Oyunlar"; giriş yapmamış ziyaretçi ana sayfada oyunları görüyor. Eski `/kor` adresleri `next.config.ts`'te yönlendiriliyor.
- **Katalog ve modlar** — `lib/katalog.ts`: mod (Kör Sıralama, Tier, Kör Tier, Doğru Sıra) ile liste ayrı; her liste her modda (Doğru Sıra yalnızca doğru cevabı olanlarla). Tier ve Kör Tier `components/TierOyun.tsx`, `lib/tier-oyun.ts`; Kör Tier'in kameralı hâli KorKamera'nın gruplu tahtasıyla. Sonuç ekranlarında "başka modda oyna" (`components/oyna/ModGecisi.tsx`).
- **Liste ekranı** — "1→n / Tier" seçicisi (n sıralamadaki kayıt sayısı; kademeleri kapalı listede "Tier" onları açıyor), arama kapalıyken büyüteç düğmesi, masaüstünde tam genişlik.
- **Defter görünümü** — ekranın tamamı kareli kâğıt (sabit), en üstte sarmal teller kendi şeridinde (`--tel`; tam ekran yükseklikler bunu düşüyor), yapışkan başlık düz zemin (bulanık cam yok); selamlamada yalnızca ad italik; marka iki satır.
- **Ertelendi:** Oyunlar planı 3 (katalog veritabanına, liste önerme, yönetici onayı) — sahibinin kararıyla beklemede; önerilen kararlar yol haritasında.

## Alışkanlıklar

- **Dil:** kod adları, yorumlar, belgeler ve commit mesajları Türkçe. Arayüz iki dilli: metinler `lib/i18n/tr.ts` ve `en.ts`'te, ikisi aynı yapıda olmak zorunda (derleme denetliyor).
- **Belgeler işin parçası:** her özellik değişikliğinde `docs/ozellikler.md`, `docs/yol-haritasi.md` (Durum ve Sıradaki adım) ve gerekirse kararlar, mimari, tasarım güncelleniyor; README'deki "Neler var" listesi de.
- **Saf mantık `src/lib`'te, Vitest testiyle.** React bileşeni hesap yapmıyor; hesap test edilen bir fonksiyonda.
- **Şema:** `supabase/schema.sql` tek dosya, idempotent. Canlıya kodla gitmiyor: sahibi Supabase SQL Editor'da elle çalıştırıyor. Bu yüzden yeni kod eski şemayla da bozulmadan çalışmalı ve gereken sıra yol haritasına yazılmalı. Şema değişikliğine `supabase/test/rls.sql`'de denetim ekleniyor.
- **Denetimler:** `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db` (boş bir Postgres ister; CI'da her push'ta çalışıyor).
- **Görseller (next/og):** emoji kullanılmıyor (motor emojiyi çalışma anında bir CDN'den indiriyor); fotoğraflar yalnızca kendi kovadan (`lib/gorsel-sunucu.ts`).
- **Yayın:** `main` Vercel'de canlıya çıkıyor; birleştirilen dallar GitHub'da kendiliğinden siliniyor.
