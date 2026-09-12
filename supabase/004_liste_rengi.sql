-- Liste başına vurgu rengi. Öne çıkan kartta, zirve kartında ve eylem
-- düğmelerinde kullanılıyor; arayüzde --accent değişkenine bağlanıyor.
alter table si_lists add column renk text not null default '#e03c10';
