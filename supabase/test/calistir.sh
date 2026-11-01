#!/usr/bin/env bash
# Erişim kurallarını boş bir Postgres'te (15+) dener: Supabase taklidi, gerçek şema dosyaları, testler.
# Test veritabanı (siralama_defteri_test) her çalıştırmada silinip sıfırdan kuruluyor; üretim
# veritabanına bağlama.
#
#   DATABASE_URL=postgres://postgres@localhost:5432/postgres npm run test:db
set -euo pipefail
cd "$(dirname "$0")/../.."

: "${DATABASE_URL:?DATABASE_URL gerekli (Postgres 15+, test veritabanı açabilen bir kullanıcı)}"
DB=siralama_defteri_test
URL="$(echo "$DATABASE_URL" | sed -E "s#/[^/?]*(\?|$)#/$DB\1#")"

export PGOPTIONS='-c client_min_messages=warning'
psql "$DATABASE_URL" -qX -v ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB"

# Kurulum sessiz; testlerde her denetim bir "tamam:" satırı yazıyor.
for dosya in supabase/test/supabase-taklidi.sql supabase/schema.sql supabase/storage.sql; do
  psql "$URL" -qX -v ON_ERROR_STOP=1 -o /dev/null -f "$dosya"
done
PGOPTIONS='-c client_min_messages=notice' \
  psql "$URL" -qX -v ON_ERROR_STOP=1 -o /dev/null -f supabase/test/rls.sql 2>&1 \
  | sed -E 's/^psql:[^ ]+ (NOTICE|ERROR): +//'
