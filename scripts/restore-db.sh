#!/bin/bash
# Restaure une sauvegarde .dump vers la BDD cible (par défaut DATABASE_URL).
#
# ⚠️  ATTENTION : cette commande ÉCRASE toutes les tables existantes.
# ⚠️  À utiliser uniquement en cas de perte de données.
#
# Usage :
#   ./scripts/restore-db.sh                          # liste les backups
#   ./scripts/restore-db.sh <fichier.dump>           # restaure vers DATABASE_URL
#   ./scripts/restore-db.sh <fichier.dump> <URL>     # restaure vers URL alternative

set -euo pipefail

for CANDIDATE in \
  /opt/homebrew/opt/postgresql@17/bin/pg_restore \
  /opt/homebrew/opt/postgresql@16/bin/pg_restore \
  "$(command -v pg_restore || true)"; do
  if [ -n "$CANDIDATE" ] && [ -x "$CANDIDATE" ]; then
    PG_RESTORE="$CANDIDATE"
    break
  fi
done
if [ -z "${PG_RESTORE:-}" ]; then
  echo "❌ pg_restore introuvable" >&2
  exit 1
fi

BACKUP_DIR="$HOME/backups/clickup-clone"

# Sans argument → liste les sauvegardes disponibles
if [ $# -eq 0 ]; then
  echo "📋 Sauvegardes disponibles dans $BACKUP_DIR :"
  echo ""
  ls -lht "$BACKUP_DIR"/devflow-*.dump 2>/dev/null | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}' || echo "  (aucune)"
  echo ""
  echo "Usage : $0 <fichier.dump> [URL-BDD-cible]"
  exit 0
fi

DUMP_FILE="$1"
# Accepte un nom simple ou un chemin absolu
if [ ! -f "$DUMP_FILE" ]; then
  if [ -f "$BACKUP_DIR/$DUMP_FILE" ]; then
    DUMP_FILE="$BACKUP_DIR/$DUMP_FILE"
  else
    echo "❌ Fichier introuvable : $1" >&2
    exit 1
  fi
fi

# URL cible : argument 2 ou DATABASE_URL du .env
if [ $# -ge 2 ]; then
  TARGET_URL="$2"
else
  PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  TARGET_URL="$(grep -E '^DATABASE_URL=' "$PROJECT_ROOT/.env" | head -1 | cut -d'=' -f2- | sed -E 's/^"//; s/"$//')"
fi

# Confirmation interactive (détecte sur le host)
HOST="$(echo "$TARGET_URL" | sed -E 's|postgresql://[^@]*@([^/:?]+).*|\1|')"
DB="$(echo "$TARGET_URL" | sed -E 's|.*/([^?]+)(\?.*)?|\1|')"

echo "⚠️  RESTAURATION DE BASE DE DONNÉES"
echo ""
echo "   Source : $DUMP_FILE"
echo "   Cible  : $DB sur $HOST"
echo ""
echo "   Cette opération va ÉCRASER les données existantes."
echo ""
read -p "   Tape RESTORE en majuscules pour confirmer : " CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Annulé."
  exit 0
fi

echo ""
echo "🔄 Restauration en cours..."

"$PG_RESTORE" \
  --dbname="$TARGET_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose \
  "$DUMP_FILE" 2>&1 | tail -20

echo ""
echo "✅ Restauration terminée."
