#!/bin/bash
# Script utilitaire pour lancer l'APK Android en mode dev (live reload)
# Usage : ./scripts/android-dev.sh

set -e

# Récupère l'IP locale du Mac sur Wi-Fi
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  # Fallback sur Ethernet
  IP=$(ipconfig getifaddr en1)
fi

if [ -z "$IP" ]; then
  echo "❌ Impossible de détecter l'IP locale. Définis-la manuellement :"
  echo "   export CAPACITOR_SERVER_URL=http://TON_IP:3000"
  exit 1
fi

URL="http://${IP}:3000"

echo "🚀 Lancement mode dev Android"
echo "   Serveur Next.js : $URL"
echo ""

# Vérifie que le serveur Next.js tourne
curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200\|307" || {
  echo "⚠️  Le serveur Next.js ne semble pas tourner sur $URL"
  echo "   Lance d'abord : npm run dev"
  exit 1
}

# Sync Capacitor avec l'URL
CAPACITOR_SERVER_URL=$URL npx cap sync android

# Lance l'APK sur le device connecté
echo "📱 Installation sur le téléphone..."
npx cap run android

echo "✅ Fait !"
