#!/bin/bash
# Compile l'APK Android et le copie dans le dossier apk/
# Usage : ./scripts/build-apk.sh

set -e

echo "📱 Compilation de l'APK Done"
echo ""

# Vérifie Java
if ! command -v java &> /dev/null; then
  echo "❌ Java n'est pas installé. Installe-le d'abord :"
  echo "   brew install openjdk@17"
  echo "   echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc"
  echo "   source ~/.zshrc"
  exit 1
fi

echo "✅ Java détecté : $(java -version 2>&1 | head -n1)"

# Vérifie Android Studio / SDK
if [ -z "$ANDROID_HOME" ]; then
  # Essaye de trouver le SDK Android
  if [ -d "$HOME/Library/Android/sdk" ]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
  else
    echo "⚠️  ANDROID_HOME non défini. Si la compilation échoue, installe Android Studio :"
    echo "   brew install --cask android-studio"
  fi
fi

# Détecte l'IP locale pour que l'APK se connecte au serveur Next.js
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  IP=$(ipconfig getifaddr en1)
fi

if [ -n "$IP" ]; then
  echo ""
  echo "🌐 IP locale détectée : $IP"
  echo "   L'APK se connectera à http://${IP}:3000"
  echo "   (ton Mac doit être allumé et sur le même WiFi)"
  SERVER_URL="http://${IP}:3000"
else
  echo ""
  echo "⚠️  Impossible de détecter l'IP locale."
  echo "   Si tu veux une URL personnalisée, relance avec :"
  echo "   CAPACITOR_SERVER_URL=http://TON_IP:3000 ./scripts/build-apk.sh"
  SERVER_URL=""
fi

# Sync Capacitor avec le serveur
echo ""
echo "🔄 Sync des assets avec Capacitor..."
if [ -n "$SERVER_URL" ]; then
  CAPACITOR_SERVER_URL="$SERVER_URL" npx cap sync android
else
  npx cap sync android
fi

# Compile l'APK
echo ""
echo "🔨 Compilation Gradle (peut prendre quelques minutes la première fois)..."
cd android
./gradlew assembleDebug
cd ..

# Crée le dossier apk/ et copie le fichier
mkdir -p apk
SOURCE_APK="android/app/build/outputs/apk/debug/app-debug.apk"
TARGET_APK="apk/Done.apk"

if [ -f "$SOURCE_APK" ]; then
  cp "$SOURCE_APK" "$TARGET_APK"
  echo ""
  echo "✅ APK créé avec succès !"
  echo ""
  echo "📁 Fichier APK : $(pwd)/$TARGET_APK"
  echo ""
  echo "📲 IMPORTANT — Pour utiliser l'app :"
  if [ -n "$SERVER_URL" ]; then
    echo "   1. Garde ton Mac allumé avec 'npm run dev' qui tourne"
    echo "   2. Connecte ton téléphone au MÊME WiFi que ton Mac"
    echo "   3. Installe l'APK sur ton téléphone et ouvre Done"
    echo ""
    echo "   L'APK se connecte à : $SERVER_URL"
    echo "   Si tu changes de réseau WiFi, recompile l'APK."
  else
    echo "   1. Transfère le fichier $(pwd)/apk/Done.apk sur ton téléphone"
    echo "   2. Ouvre-le depuis Fichiers → Downloads"
    echo "   3. Autorise l'installation si demandé"
  fi
  echo ""
  echo "   Ou branche ton téléphone en USB et exécute : npm run android:install"
else
  echo ""
  echo "❌ Le fichier APK n'a pas été généré. Vérifie les erreurs ci-dessus."
  echo "   Il se peut qu'Android Studio soit nécessaire pour télécharger les SDK."
  exit 1
fi
