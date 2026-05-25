# Installer Done sur ton téléphone Android

## Méthode 1 : Le plus simple (Android Studio)

### 1. Installe Android Studio
```bash
brew install --cask android-studio
```

### 2. Active le débogage USB sur ton téléphone
1. **Paramètres** → **À propos du téléphone** → clique 7x sur **Numéro de build**
2. Retour → **Options pour les développeurs** → **Débogage USB** : activé
3. Branche ton téléphone en USB au Mac
4. Sur le téléphone, accepte la popup **"Autoriser le débogage USB"**

### 3. Ouvre le projet Android
```bash
npm run cap:open
```

### 4. Dans Android Studio
- Attends que Gradle sync finisse (barre de progression en bas)
- Clique sur le bouton vert ▶️ **Run** (ou appuie sur `Shift+F10`)
- L'APK se compile et s'installe automatiquement sur ton téléphone

---

## Méthode 2 : En ligne de commande (une fois Android Studio installé)

```bash
# Compile + installe automatiquement
npm run android:install
```

---

## Méthode 3 : Transférer l'APK manuellement

Si tu préfères ne pas utiliser Android Studio :

### 1. Compile l'APK
```bash
npm run android:build
```

### 2. Récupère le fichier APK
Le fichier se trouve ici :
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Transfère-le sur ton téléphone
- **AirDrop** vers ton téléphone (si tu as un iPhone aussi, utilise Google Drive / Dropbox)
- **Google Drive** → upload sur Mac → télécharge sur Android
- **Cable USB** → copie dans le dossier Downloads du téléphone

### 4. Installe l'APK
1. Sur ton téléphone, ouvre **Fichiers** → **Downloads**
2. Tape sur `app-debug.apk`
3. Autorise l'installation des sources inconnues si demandé
4. L'app **Done** s'installe et apparaît dans tes apps

---

## Mode Dev (live reload)

Pour tester sans recompiler à chaque modification :

```bash
# Terminal 1 : lance le serveur
npm run dev

# Terminal 2 : installe l'APK en mode live reload
npm run android:dev
```

L'APK sur ton téléphone pointera vers ton Mac. Dès que tu modifies le code React, l'app se met à jour automatiquement sur le téléphone.

**Important** : ton téléphone et ton Mac doivent être sur le **même Wi-Fi**.
