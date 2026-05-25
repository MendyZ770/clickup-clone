#!/bin/bash
# Compile l'APK Release signé pour le Play Store
# Usage : ./scripts/build-release.sh

set -e

echo "🚀 Compilation Release de Done pour le Play Store"
echo ""

# Vérifie Java
if ! command -v java &> /dev/null; then
  echo "❌ Java n'est pas installé."
  exit 1
fi

echo "✅ Java détecté : $(java -version 2>&1 | head -n1)"

# Vérifie Android SDK
if [ -z "$ANDROID_HOME" ]; then
  if [ -d "$HOME/Library/Android/sdk" ]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
  fi
fi

# Sync Capacitor
echo ""
echo "🔄 Sync des assets avec Capacitor..."
npx cap sync android

# Compile APK Release
echo ""
echo "🔨 Compilation Gradle Release..."
cd android
./gradlew assembleRelease
cd ..

# Crée le dossier apk/ et copie le fichier
mkdir -p apk
SOURCE_APK="android/app/build/outputs/apk/release/app-release.apk"
TARGET_APK="apk/Done-Release.apk"

if [ -f "$SOURCE_APK" ]; then
  cp "$SOURCE_APK" "$TARGET_APK"
  echo ""
  echo "✅ APK Release créé avec succès !"
  echo ""
  echo "📁 Fichier APK : $(pwd)/$TARGET_APK"
else
  echo ""
  echo "❌ Le fichier APK n'a pas été généré."
  exit 1
fi
