-- "Bir daha asla": denenmiş ama sıralamaya değil, sıralamanın altında kırmızı
-- çizgiyle ayrılan bölüme giden kayıtlar.
--
-- Sıralama ve bu bölüm aynı `sira` kolonunu kendi içlerinde ayrı ayrı 0'dan
-- numaralıyor; iki bölümü birbirinden ayıran bu kolon. Yalnızca denenmiş
-- (`denendi = true`) kayıtlarda anlamlı.
alter table si_items add column asla boolean not null default false;
