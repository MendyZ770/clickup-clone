#!/bin/bash
# Dump complet de la BDD Neon (DevFlow/clickup-clone) vers ~/backups/clickup-clone/
# Crée deux fichiers : un .dump (format custom, restaurable via pg_restore)
# et un .sql (format texte, lisible/inspectable).
#
# Usage : ./scripts/backup-db.sh [label-optionnel]
# Exemple : ./scripts/backup-db.sh avant-migration-tags

set -euo pipefail

# Localise pg_dump — Neon tourne sur PG17, donc PG17 client requis
for CANDIDATE in \
  /opt/homebrew/opt/postgresql@17/bin/pg_dump \
  /opt/homebrew/opt/postgresql@16/bin/pg_dump \
  "$(command -v pg_dump || true)"; do
  if [ -n "$CANDIDATE" ] && [ -x "$CANDIDATE" ]; then
    PG_DUMP="$CANDIDATE"
    break
  fi
done
if [ -z "${PG_DUMP:-}" ]; then
  echo "❌ pg_dump introuvable. Installe avec : brew install postgresql@17" >&2
  exit 1
fi

# Localise le .env du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE introuvable" >&2
  exit 1
fi

# Extrait DATABASE_URL (sans la sourcer — on n'exécute rien d'autre)
DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d'=' -f2- | sed -E 's/^"//; s/"$//')"
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL non défini dans $ENV_FILE" >&2
  exit 1
fi

# Dossier de sortie
BACKUP_DIR="$HOME/backups/clickup-clone"
mkdir -p "$BACKUP_DIR"

# Nom du fichier avec timestamp + label optionnel
TS="$(date +%Y%m%d-%H%M%S)"
LABEL="${1:+-$1}"
BASENAME="devflow-${TS}${LABEL}"

DUMP_FILE="$BACKUP_DIR/${BASENAME}.dump"
SQL_FILE="$BACKUP_DIR/${BASENAME}.sql"

echo "🔒 Sauvegarde de la BDD DevFlow en cours..."
echo "   Destination : $BACKUP_DIR/"

# Format custom (binaire, compressé, restaurable avec pg_restore)
"$PG_DUMP" \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$DUMP_FILE"

# Format SQL texte (lisible, restaurable avec psql)
"$PG_DUMP" \
  --dbname="$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --file="$SQL_FILE"

SIZE_DUMP="$(du -h "$DUMP_FILE" | cut -f1)"
SIZE_SQL="$(du -h "$SQL_FILE" | cut -f1)"

echo "✅ Sauvegarde terminée"
echo "   ${BASENAME}.dump ($SIZE_DUMP) → restaurable via pg_restore"
echo "   ${BASENAME}.sql  ($SIZE_SQL) → lisible et restaurable via psql"

# Rotation : garde les 30 plus récents, supprime les autres
KEEP=30
cd "$BACKUP_DIR"
ls -t devflow-*.dump 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -I {} rm -f {} || true
ls -t devflow-*.sql 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -I {} rm -f {} || true

TOTAL="$(ls devflow-*.dump 2>/dev/null | wc -l | tr -d ' ')"
echo "   $TOTAL backup(s) conservé(s) (rotation à $KEEP max)"
