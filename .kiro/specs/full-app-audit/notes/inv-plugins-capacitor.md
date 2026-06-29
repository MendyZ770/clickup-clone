# Inventaire — Plugins Capacitor déclarés et utilisés (Tâche 3.4)

## Objet

Cette note documente l'inventaire exhaustif des plugins **Capacitor** au sens large (paquets `@capacitor/*` et plugins tiers Capacitor) déclarés et/ou utilisés dans le dépôt `clickup-clone`. Elle satisfait les exigences `requirements.md` 2.5 et 8.5, et est référencée par la revue d'axe Mobile/Capacitor (`design.md` > Méthode de revue par axe > Mobile/Capacitor) ainsi que par la sous-tâche 10.3 (audit `plugins déclarés vs plugins utilisés`).

L'inventaire est construit à partir de **trois sources** :

1. `package.json` — dépendances JavaScript du projet (preuve de l'installation).
2. `android/app/src/main/assets/capacitor.plugins.json` — fichier généré par `npx cap sync` qui liste les plugins natifs effectivement enregistrés côté Android.
3. Le code source (répertoire `src/` et `capacitor.config.ts`) — preuves d'importation effective.

Mode strictement lecture seule. Aucune commande shell n'a été exécutée pour produire cette note (recherches faites via outils internes de lecture/grep). Le journal `notes/annexe-A-commandes.md` est mis à jour en conséquence (entrée tâche 3.4 : aucune commande).

---

## (i) Plugins déclarés dans `package.json`

Source : `/Users/zerbib/clickup-clone/package.json`, sections `dependencies` et `devDependencies`. Aucun paquet tiers de l'écosystème Capacitor (par exemple `@capgo/*`, `capacitor-firebase-messaging`, `capacitor-community-*`, `capacitor-plugin-*`, plugins Cordova) n'a été trouvé. Tous les paquets ci-dessous proviennent du scope officiel `@capacitor/*`.

| Paquet | Version (semver) | Section | Nature | Commentaire |
| --- | --- | --- | --- | --- |
| `@capacitor/android` | `^8.3.4` | `dependencies` | Runtime natif (plate-forme Android) | Référencé dans `android/capacitor.settings.gradle` : `project(':capacitor-android').projectDir = new File('../node_modules/@capacitor/android/capacitor')`. Pas un plugin métier ; c'est l'hôte natif qui charge les plugins. N'apparaît donc pas dans `capacitor.plugins.json` (normal). |
| `@capacitor/cli` | `^8.3.4` | `dependencies` | Outil ligne de commande / définitions de types | Utilisé pour `npx cap sync`, `npx cap open` et fournit le type `CapacitorConfig`. N'est pas un plugin natif ; n'apparaît donc pas dans `capacitor.plugins.json` (normal). |
| `@capacitor/core` | `^8.3.4` | `dependencies` | Runtime JavaScript de Capacitor | Cœur du pont JS↔natif. N'est pas un plugin ; n'apparaît pas dans `capacitor.plugins.json` (normal). Pas d'import statique direct dans `src/` ; la détection native se fait via la globale `window.Capacitor` (cf. `src/lib/storage.ts:11` et `src/hooks/use-capacitor-push.ts:9`). |
| `@capacitor/preferences` | `^8.0.1` | `dependencies` | **Plugin natif** (stockage clé/valeur, `SharedPreferences` Android) | Plugin métier. Déclaré aussi dans `capacitor.plugins.json` et importé dans le code (cf. ci-dessous). |
| `@capacitor/push-notifications` | `^8.1.1` | `dependencies` | **Plugin natif** (notifications FCM côté Android) | Plugin métier. Déclaré aussi dans `capacitor.plugins.json` et importé dans le code (cf. ci-dessous). |

Aucune autre dépendance dont le nom contiendrait `capacitor`, `cordova`, `capgo` ou un préfixe de plugin Capacitor tiers n'a été trouvée dans `package.json` (recherche regex `@capgo|capacitor-firebase|capacitor-community|capacitor-plugin|cordova-` sur `package.json` — aucun résultat).

---

## (ii) Plugins déclarés dans `capacitor.plugins.json`

Source : `/Users/zerbib/clickup-clone/android/app/src/main/assets/capacitor.plugins.json`. Ce fichier est régénéré par `npx cap sync` ; il représente la vue Android du graphe des plugins natifs effectivement enregistrés au démarrage de l'application.

| Paquet | Classe Java enregistrée |
| --- | --- |
| `@capacitor/preferences` | `com.capacitorjs.plugins.preferences.PreferencesPlugin` |
| `@capacitor/push-notifications` | `com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin` |

Confirmation côté Gradle (lecture, non destructive) : `android/app/capacitor.build.gradle` déclare bien `implementation project(':capacitor-preferences')` et `implementation project(':capacitor-push-notifications')` ; `android/capacitor.settings.gradle` mappe ces deux noms vers `../node_modules/@capacitor/preferences/android` et `../node_modules/@capacitor/push-notifications/android`. Il n'y a donc pas de divergence interne Android entre `capacitor.plugins.json`, `capacitor.settings.gradle` et `capacitor.build.gradle`.

Aucun plugin Cordova n'est enregistré : le module `capacitor-cordova-android-plugins` existe en tant que projet Gradle (cf. `android/settings.gradle`) mais ne contient aucune dépendance Cordova active (squelette généré).

---

## (iii) Plugins importés dans le code source

Sources : `/Users/zerbib/clickup-clone/src/**` et `/Users/zerbib/clickup-clone/capacitor.config.ts`. Recherches effectuées (outils `grep_search`) : motifs `from ['"]@capacitor`, `@capacitor` (substring), `[Cc]apacitor`, `@capgo|capacitor-firebase|capacitor-community|cordova-`.

| Paquet | Type d'import | Fichier:ligne | Usage |
| --- | --- | --- | --- |
| `@capacitor/cli` | `import type` (statique, types uniquement) | `capacitor.config.ts:1` | Importation du type `CapacitorConfig` pour typer la configuration. Aucun runtime tiré de ce paquet. |
| `@capacitor/preferences` | Dynamique (`await import(...)`) | `src/lib/storage.ts:17`, `src/lib/storage.ts:26`, `src/lib/storage.ts:36` | Wrapper cross-platform `storageSet` / `storageGet` / `storageRemove`. Branche native (Capacitor) → `Preferences.set / get / remove` ; branche web → `localStorage`. La détection natif/web se fait via la globale `window.Capacitor.isNativePlatform()` (cf. helper `isCapacitor()` ligne 9). |
| `@capacitor/push-notifications` | Dynamique (`await import(...)`) | `src/hooks/use-capacitor-push.ts:23` | Hook `useCapacitorPush()` (montage côté client uniquement) qui demande la permission, enregistre l'app auprès de FCM, écoute `registration`, `registrationError`, `pushNotificationReceived`, `pushNotificationActionPerformed`. Monté dans `src/components/capacitor-push-init.tsx` puis dans `src/app/(platform)/layout.tsx` via `<CapacitorPushInit />`. |

Imports indirects / globale Capacitor (sans `import` JS) — pour mémoire :

- `src/lib/storage.ts:11` — accès à `window.Capacitor?.isNativePlatform?.()` pour aiguiller le stockage.
- `src/hooks/use-capacitor-push.ts:9` — même test pour conditionner le hook.
- `src/components/auth/login-form.tsx:21` — même test pour aiguiller vers la route `/api/mobile-login` en mode natif.
- `src/app/layout.tsx:62, 83` — scripts inline qui désactivent l'intercepteur `fetch` mobile-auth et le Service Worker PWA quand `window.Capacitor.isNativePlatform()` est vrai.

Ces accès à `window.Capacitor` exploitent l'objet global injecté par `@capacitor/core` côté natif. Ils ne constituent pas l'utilisation d'un plugin distinct : seul le runtime `@capacitor/core` (déjà déclaré dans `package.json`) est sollicité. Aucun import dynamique ou statique d'un autre plugin `@capacitor/*` (par exemple `@capacitor/app`, `@capacitor/network`, `@capacitor/device`, `@capacitor/share`, `@capacitor/clipboard`, `@capacitor/filesystem`, `@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/local-notifications`, `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/toast`, `@capacitor/browser`, `@capacitor/dialog`, `@capacitor/screen-orientation`) n'a été trouvé dans `src/`.

Note annexe : `capacitor.config.ts` configure un bloc `plugins.SplashScreen` (`launchShowDuration: 2000`, `backgroundColor: "#a855f7"`). Or **aucun paquet `@capacitor/splash-screen` n'est installé ni déclaré** (cf. tableau (i) et (ii)). Cette configuration est donc **inopérante** : Capacitor ne charge pas le plugin SplashScreen et ces options sont ignorées. À traiter en revue MOB (sous-tâche 10.1 / 10.3) le moment venu.

---

## Écarts

### Plugins importés mais non déclarés (dans `package.json` ou `capacitor.plugins.json`)

**Aucun.** Tous les paquets `@capacitor/*` importés dans le code source (statiquement ou dynamiquement) sont déclarés dans `package.json`. Les deux plugins métier (`@capacitor/preferences`, `@capacitor/push-notifications`) sont en outre déclarés dans `capacitor.plugins.json`. `@capacitor/cli` (importé en `import type` uniquement dans `capacitor.config.ts`) n'a pas vocation à apparaître dans `capacitor.plugins.json` (outil CLI, pas plugin natif) — comportement attendu.

### Plugins déclarés mais non importés/utilisés

**Stricto sensu : aucun plugin natif déclaré dans `capacitor.plugins.json` n'est inutilisé.** Les deux entrées de `capacitor.plugins.json` (`@capacitor/preferences`, `@capacitor/push-notifications`) sont effectivement importées dynamiquement par le code applicatif sous condition `isCapacitor()`.

Observations annexes (ni écart strict ni plugin oisif, à valider en revue MOB) :

- `@capacitor/android`, `@capacitor/cli` et `@capacitor/core` sont déclarés dans `package.json` mais ne sont pas listés dans `capacitor.plugins.json` : c'est le comportement attendu (ce ne sont pas des plugins métier mais respectivement la plate-forme Android, l'outil CLI et le runtime JS de Capacitor).
- Le bloc `plugins.SplashScreen` dans `capacitor.config.ts` configure un plugin (`@capacitor/splash-screen`) qui n'est **ni installé** (`package.json`) **ni enregistré** (`capacitor.plugins.json`). Cette configuration est silencieusement ignorée par Capacitor au runtime. Point à matérialiser en Finding `F-MOB-NNN` lors de la sous-tâche 10.1 / 10.3 (impact UX mobile : pas de splash screen natif sous Capacitor ; le splash réel observé en production provient soit du système Android, soit d'une autre source).

### Cohérence interne Android

Aucun écart entre `capacitor.plugins.json`, `android/capacitor.settings.gradle` et `android/app/capacitor.build.gradle` : les trois fichiers listent exactement `:capacitor-preferences` et `:capacitor-push-notifications`, en plus de `:capacitor-android` (runtime).

---

## Synthèse

- **2 plugins natifs Capacitor** sont en usage effectif dans le projet : `@capacitor/preferences` (stockage) et `@capacitor/push-notifications` (FCM).
- **Aucun plugin Capacitor tiers** (paquet hors scope `@capacitor/*`) n'est installé.
- **Aucun écart « importé non déclaré »** ni « déclaré non importé » au sens strict.
- **Une configuration orpheline** : le bloc `plugins.SplashScreen` dans `capacitor.config.ts` cible un plugin non installé. À tracer comme observation pour la revue MOB (10.1 / 10.3).
- **Le bloc `capacitor-cordova-android-plugins`** est un squelette Gradle vide ; aucun plugin Cordova actif. Comportement attendu pour un projet Capacitor 8 sans dépendance Cordova.
