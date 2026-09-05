#!/usr/bin/env bash
# Lance un PostgreSQL local jetable, applique le shim Supabase + les migrations,
# puis exécute tous les tests SQL de supabase/tests/. Aucune donnée n'est conservée.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(dirname "$(command -v pg_ctl || echo /usr/lib/postgresql/16/bin/pg_ctl)")}"
if [ ! -x "$PGBIN/pg_ctl" ]; then
  for d in /usr/lib/postgresql/*/bin /opt/homebrew/opt/postgresql@*/bin /usr/local/opt/postgresql@*/bin; do
    [ -x "$d/pg_ctl" ] && PGBIN="$d" && break
  done
fi
if [ ! -x "$PGBIN/pg_ctl" ]; then
  echo "PostgreSQL introuvable. Installez PostgreSQL 15+ ou lancez 'npx supabase start' puis 'npm run db:reset'." >&2
  exit 1
fi

WORK="${TMPDIR:-/tmp}/le-cocon-pgtest-$$"
PORT="${PGTEST_PORT:-54399}"
mkdir -p "$WORK"

# PostgreSQL refuse de démarrer en root : on délègue alors à l'utilisateur postgres.
RUN=""
if [ "$(id -u)" = "0" ] && id postgres >/dev/null 2>&1; then
  chown postgres "$WORK"
  RUN="runuser -u postgres --"
fi

cleanup() {
  $RUN "$PGBIN/pg_ctl" -D "$WORK/data" stop -m immediate >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

$RUN "$PGBIN/initdb" -D "$WORK/data" -U postgres --auth=trust --no-locale --encoding=UTF8 >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/pg.log" start >/dev/null
export PGHOST="$WORK" PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres

psql -q -v ON_ERROR_STOP=1 -c "create database cocon_test" >/dev/null
export PGDATABASE=cocon_test

echo "▶ Shim Supabase local"
psql -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/tests/_shim.sql"

echo "▶ Migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "  - $(basename "$f")"
  psql -q -v ON_ERROR_STOP=1 -f "$f"
done

echo "▶ Tests RLS"
status=0
for f in "$ROOT"/supabase/tests/[0-9]*.sql; do
  echo "  ■ $(basename "$f")"
  if psql -q -o /dev/null -v ON_ERROR_STOP=1 -f "$f" 2>&1 | sed -e 's/^psql:.*NOTICE:  /    /' -e 's/^NOTICE:  /    /' | grep -v '^$'; then
    :
  fi
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then status=1; echo "  ✗ ÉCHEC dans $(basename "$f")"; fi
done

if [ $status -eq 0 ]; then echo "✔ Tous les tests RLS passent."; else echo "✗ Des tests RLS échouent." >&2; fi
exit $status
