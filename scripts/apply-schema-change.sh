#!/bin/bash
# Applique un fichier SQL préparé (scripts/migrations/*.sql) sur une base explicitement désignée.
# Sauvegarde d'abord, puis exécute le SQL avec ON_ERROR_STOP.
#
# Usage : ./scripts/apply-schema-change.sh <fichier.sql> [DATABASE_URL]
#   sans DATABASE_URL : utilise DATABASE_URL de l'environnement, sinon celui du .env projet.
set -euo pipefail

SQL="${1:?Usage: apply-schema-change.sh <fichier.sql> [DATABASE_URL]}"
URL="${2:-${DATABASE_URL:-}}"

if [ -z "$URL" ]; then
  URL=$(grep -E '^DATABASE_URL=' .env | head -1 | sed 's/^DATABASE_URL=//' | tr -d '"')
fi
[ -n "$URL" ] || { echo "Aucune DATABASE_URL cible."; exit 1; }
[ -f "$SQL" ] || { echo "Fichier introuvable : $SQL"; exit 1; }

HOSTPART=$(printf '%s' "$URL" | sed -E 's#.*@([^/?]+).*#\1#')
echo "Cible : $HOSTPART"
echo "Fichier : $SQL"
./scripts/backup-db.sh "avant-$(basename "$SQL" .sql)"

psql "$URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "OK : $SQL appliqué."
