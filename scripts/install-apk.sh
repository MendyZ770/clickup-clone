#!/bin/bash
# Compile l'APK debug et l'installe sur le téléphone Android connecté
# Prérequis : Android Studio installé + téléphone en mode debug USB

set -e

echo "📱 Installation de Done sur ton téléphone"
echo ""

# Vérifie adb
if ! command -v adb &> /dev/null; then
  echo "❌ adb non trouvé. Ajoute le Android SDK à ton PATH :"
  echo "   export ANDROID_HOME=~/Library/Android/sdk"
  echo "   export PATH=\$ANDROID_HOME/platform-tools:\$PATH"
  exit 1
fi

# Vérifie qu'un device est connecté
DEVICE=$(adb devices | grep -v "List of devices" | grep "device$" | awk '{print $1}')
if [ -z "$DEVICE" ]; then
  echo "❌ Aucun téléphone Android détecté."
  echo ""
  echo "   Pour activer le débogage USB :"
  echo "   1. Paramètres → À propos du téléphone → Numéro de build (clique 7x)"
  echo "   2. Retour → Options pour les développeurs → Débogage USB : ON"
  echo "   3. Branche le téléphone en USB à ton Mac"
  echo "   4. Sur le téléphone, accepte la popup 'Autoriser le débogage USB'"
  exit 1
fi

echo "✅ Téléphone détecté : $DEVICE"
echo ""

# Sync les assets web
echo "🔄 Sync des assets..."
npx cap sync android > /dev/null 2>&1

# Compile l'APK
echo "🔨 Compilation de l'APK..."
cd android

# Trouve le Gradle wrapper ou utilise celui d'Android Studio
if [ -f "./gradlew" ]; then
  ./gradlew assembleDebug --quiet
else
  echo "❌ Gradlew non trouvé. Ouvre Android Studio et importe le dossier 'android/'"
  exit 1
fi

cd ..

# Installe l'APK
echo "📲 Installation sur le téléphone..."
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

echo ""
echo "✅ Done installé !"
echo "   Ouvre l'app sur ton téléphone."
