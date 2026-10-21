#!/usr/bin/env bash
# Environnement de test isolé : Postgres local + schéma + seed + app sur :3100.
# N'utilise JAMAIS la base de production (verifiez DATABASE_URL avant tout `prisma db push`).
set -euo pipefail

PGDATA="${PGDATA:-$HOME/clickup-clone-testdata}"
PGPORT="${PGPORT:-55432}"
APPPORT="${APPPORT:-3100}"
TEST_DB_URL="postgresql://test@127.0.0.1:${PGPORT}/done_test"

export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8

if ! pg_isready -h 127.0.0.1 -p "$PGPORT" -q; then
  if [ ! -d "$PGDATA" ]; then
    initdb -D "$PGDATA" --auth=trust --encoding=UTF8
  fi
  pg_ctl -D "$PGDATA" -o "-p $PGPORT -k /tmp" -l "$PGDATA/server.log" start
  for _ in $(seq 1 30); do
    pg_isready -h 127.0.0.1 -p "$PGPORT" -q && break
    sleep 1
  done
fi

if ! psql -h 127.0.0.1 -p "$PGPORT" -U test -lqt | cut -d\| -f1 | grep -qw done_test; then
  createdb -h 127.0.0.1 -p "$PGPORT" -U test done_test
fi

export DATABASE_URL="$TEST_DB_URL"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-test-secret-please-ignore}"
export NEXTAUTH_URL="http://localhost:${APPPORT}"
export PGPORT

echo "→ schéma Prisma sur $TEST_DB_URL"
npx prisma db push --skip-generate
npx prisma generate
echo "→ seed (utilisateur demo@clickup.com / password123)"
SEED_ALLOW_REMOTE= npx tsx prisma/seed.ts

echo "→ app sur http://localhost:${APPPORT} (log: /tmp/done-dev-${APPPORT}.log)"
npx next dev --webpack -p "$APPPORT" > "/tmp/done-dev-${APPPORT}.log" 2>&1 &
DEV_PID=$!
trap 'kill $DEV_PID 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  curl -sf "http://localhost:${APPPORT}/login" > /dev/null && break
  sleep 2
done

npx playwright test "$@"
