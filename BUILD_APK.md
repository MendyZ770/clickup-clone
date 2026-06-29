# Guide : Compiler l'APK Android

## Prérequis

1. **Java JDK 17+** (requis par Gradle/Android Studio)
2. **Android Studio** (pour compiler et signer l'APK)

### Installation sur Mac

```bash
# Installer Android Studio
brew install --cask android-studio

# Installer Java 17
brew install openjdk@17

# Ajouter Java au PATH (ajoute ces lignes dans ~/.zshrc)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

## Mode 1 : Dev live reload (test rapide)

L'APK pointe vers ton serveur Next.js local. Parfait pour tester sans rebuild à chaque fois.

### 1. Lancer le serveur Next.js
```bash
npm run dev
```

### 2. Configurer l'IP locale dans Capacitor
```bash
# Récupère ton IP locale
IP=$(ipconfig getifaddr en0)

# Ouvre le fichier capacitor.config.ts et remplace :
# url: process.env.CAPACITOR_SERVER_URL
# par :
# url: "http://192.168.1.XX:3000"
```

### 3. Sync et ouvrir Android Studio
```bash
npm run cap:sync
npm run cap:open
```

### 4. Dans Android Studio
- Connecte ton téléphone en USB (avec **Débogage USB** activé)
- Clique sur le bouton ▶️ **Run** (ou Shift+F10)
- L'APK s'installe et se lance automatiquement

## Mode 2 : APK standalone (production)

L'APK embarque l'app. Nécessite un backend accessible (déployé).

### 1. Déployer le backend
L'app doit être accessible sur un domaine HTTPS. Déploie sur Vercel ou ton hébergeur.

### 2. Builder le projet Next.js en statique
```bash
# Ajoute dans next.config.mjs :
# output: "export",
# distDir: "out",
# PUIS :
npm run build
```

### 3. Retirer l'URL dev de Capacitor
Dans `capacitor.config.ts`, commente ou supprime la ligne `url:` sous `server:`.

### 4. Sync et compiler
```bash
npm run cap:sync
npm run cap:open
```

### 5. Dans Android Studio
- **Build > Build Bundle(s) / APK(s) > Build APK(s)**
- Ou en ligne de commande :
```bash
./gradlew assembleDebug   # APK debug (non signé)
./gradlew assembleRelease # APK release (nécessite une clé de signature)
```

L'APK se trouve dans :
- Debug : `android/app/build/outputs/apk/debug/app-debug.apk`
- Release : `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Signer l'APK Release (pour distribution)

> **Ne jamais commiter le keystore ni ses mots de passe dans Git.**

### 1. Keystore canonique (déjà généré)

Le keystore de production est situé à :
```
android/app/done.keystore
```
- Alias : `done`
- Algorithme : RSA 2048 bits, validité 10 000 jours
- **Sauvegarde obligatoire** hors du repo (1Password, Bitwarden, clé USB chiffrée).
  Sans ce fichier + son mot de passe, impossible de publier des mises à jour sur Play Store.

Si tu dois le recréer (perte du fichier) :
```bash
keytool -genkey -v \
  -keystore android/app/done.keystore \
  -alias done \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Done App, OU=Development, O=Done, L=Paris, ST=France, C=FR"
```

### 2. Stocker les secrets de signing

Dans `~/.gradle/gradle.properties` (hors du repo) :

```properties
RELEASE_STORE_FILE=/Users/zerbib/clickup-clone/android/app/done.keystore
RELEASE_STORE_PASSWORD=<ton-mot-de-passe>
RELEASE_KEY_ALIAS=done
RELEASE_KEY_PASSWORD=<ton-mot-de-passe>
```

Alternative en variables d'environnement (terminal / CI) :

```bash
export RELEASE_STORE_FILE=/Users/zerbib/clickup-clone/android/app/done.keystore
export RELEASE_STORE_PASSWORD=<ton-mot-de-passe>
export RELEASE_KEY_ALIAS=done
export RELEASE_KEY_PASSWORD=<ton-mot-de-passe>
```

### 3. Compiler et signer en release

```bash
cd android
./gradlew assembleRelease
```

L'APK signé se trouve dans :
`android/app/build/outputs/apk/release/app-release.apk`

### 4. Signer manuellement (si besoin)

```bash
cd android/app
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore done-release.keystore app-release-unsigned.apk done

zipalign -v 4 app-release-unsigned.apk Done.apk
```

## Transférer l'APK sur ton téléphone

```bash
# Via ADB (téléphone connecté en USB)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Ou simplement partage le fichier via AirDrop, Google Drive, etc.
```

## Scripts npm disponibles

| Script | Description |
|--------|-------------|
| `npm run cap:sync` | Sync les web assets vers Android |
| `npm run cap:open` | Ouvre Android Studio |
| `npm run android:dev` | Lance l'APK en mode dev live reload |
| `npm run android:build` | Compile l'APK debug en CLI |
| `npm run android:release` | Compile l'APK release en CLI |
