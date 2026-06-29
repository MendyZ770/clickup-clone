# Inventaire — Variables d'environnement (tâche 3.5)

## Objet et périmètre

Cet inventaire recense toutes les **variables d'environnement référencées dans le code applicatif** (sous `src/` et `prisma/`) et les confronte au fichier d'exemple `.env.example` afin d'identifier les écarts. Il alimente la revue de l'axe **INF (Vercel/Infra)** menée en tâche 9.3 (cf. `design.md` > Méthode de revue par axe > Vercel/Infra ; `requirements.md` clause 8.3).

Conventions et précautions :

- **Lecture seule.** Aucune écriture hors `.kiro/specs/full-app-audit/notes/`.
- **Aucun secret n'est divulgué dans cette note.** Les variables sont référencées **par nom uniquement**. Les fichiers `.env`, `.env.local`, `.env.production` n'ont **pas** été lus ; seul `.env.example` a été consulté (tel que prévu par les CLAUDE_Rules consignées en tâche 1.2).
- **Sources scannées** : `src/**/*.{ts,tsx,js,jsx}` et `prisma/**/*.{ts,prisma}`. Le périmètre exclut `android/`, `vercel.json`, `next.config.*`, qui font l'objet d'autres inventaires/axes (3.6, 9.4, 10).
- **Patterns recherchés** : `process.env.X` (notation pointée) et `process.env["X"]` / `process.env['X']` (notation crochet). En complément, le seul fichier non-TS/JS pertinent (`prisma/schema.prisma`) a été inspecté pour la fonction Prisma `env("X")`.
- Les commandes `grep` exécutées sont consignées en annexe A (`notes/annexe-A-commandes.md`).

## i. Variables référencées dans le code

Liste exhaustive des variables d'environnement effectivement utilisées dans `src/` et `prisma/`. Pour chaque variable, au moins une occurrence `path:line` est citée à titre de preuve ; la colonne « Toutes occurrences » liste l'ensemble des points d'usage observés.

| # | Variable | Exemple `path:line` | Toutes occurrences (`path:line`) | Notes |
| --- | --- | --- | --- | --- |
| 1 | `DATABASE_URL` | `src/lib/prisma.ts:10` | `src/lib/prisma.ts:10` ; `prisma/seed.ts:5` ; `prisma/schema.prisma:12` (via `env("DATABASE_URL")`) | Connexion Postgres/Neon. Lue en runtime côté serveur et au seed. Référencée également par le datasource Prisma. |
| 2 | `NEXTAUTH_SECRET` | `src/lib/auth-helpers.ts:11` | `src/lib/auth-helpers.ts:11` ; `src/app/api/mobile-me/route.ts:5` ; `src/app/api/mobile-login/route.ts:9` | Secret de signature des JWT NextAuth ; utilisé pour signer/vérifier les tokens mobiles. |
| 3 | `NEXTAUTH_URL` | `src/lib/calendar-helpers.ts:83` | `src/lib/calendar-helpers.ts:83` ; `src/lib/calendar-helpers.ts:131` ; `src/app/api/workspaces/[workspaceId]/invites/route.ts:109` ; `src/app/api/calendar/google/auth/route.ts:14` ; `src/app/api/calendar/google/callback/route.ts:11` ; `src/app/api/calendar/google/callback/route.ts:89` ; `src/app/api/calendar/google/clear/route.ts:23` ; `src/app/api/calendar/google/sync/route.ts:37` | URL canonique de l'application ; utilisée pour générer URLs d'invitation et redirect_uri OAuth Google Calendar. Toutes les références ont un fallback `"http://localhost:3000"`. |
| 4 | `NODE_ENV` | `src/lib/prisma.ts:18` | `src/lib/prisma.ts:18` ; `src/app/api/mobile-login/route.ts:88` ; `src/app/api/mobile-logout/route.ts:8` | Variable runtime gérée par Node.js/Next.js elle-même ; pilote `secure: true` sur les cookies mobiles et la mise en cache du client Prisma. **Non requise dans `.env.example`** (convention Node.js). |
| 5 | `UPSTASH_REDIS_REST_URL` | `src/lib/rate-limit.ts:5` | `src/lib/rate-limit.ts:5` ; `src/lib/rate-limit.ts:7` | Endpoint REST Upstash pour le rate limiting (optionnel — désactivé si absent, cf. branche conditionnelle). |
| 6 | `UPSTASH_REDIS_REST_TOKEN` | `src/lib/rate-limit.ts:5` | `src/lib/rate-limit.ts:5` ; `src/lib/rate-limit.ts:8` | Token Upstash associé à `UPSTASH_REDIS_REST_URL`. Idem : optionnel. |
| 7 | `FIREBASE_SERVICE_ACCOUNT` | `src/lib/firebase-admin.ts:8` | `src/lib/firebase-admin.ts:8` | Compte de service Firebase JSON (string) pour FCM admin. Lance une erreur explicite si absent au moment de l'init. |
| 8 | `RESEND_API_KEY` | `src/lib/email.ts:3` | `src/lib/email.ts:3` (deux occurrences sur la même ligne — vérification + utilisation) | Clé API Resend ; client `Resend` instancié uniquement si la clé est présente. |
| 9 | `FROM_EMAIL` | `src/lib/email.ts:5` | `src/lib/email.ts:5` | Adresse `from:` des e-mails Resend ; fallback `"onboarding@resend.dev"`. |
| 10 | `NEXT_PUBLIC_APP_URL` | `src/lib/email.ts:6` | `src/lib/email.ts:6` | URL publique de l'application utilisée dans les e-mails ; fallback `"https://clickup-clone-three.vercel.app"`. **Préfixe `NEXT_PUBLIC_*`** → exposée côté client. À recouper avec l'axe SEC (tâche 11.4). |
| 11 | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `src/lib/push.ts:3` | `src/lib/push.ts:3` ; `src/app/api/push/vapid-public-key/route.ts:4` | Clé publique VAPID Web Push. **Préfixe `NEXT_PUBLIC_*`** → légitimement exposée côté client (clé publique), à confirmer en 11.4. |
| 12 | `VAPID_PRIVATE_KEY` | `src/lib/push.ts:4` | `src/lib/push.ts:4` | Clé privée VAPID Web Push (secret serveur). |
| 13 | `VAPID_CONTACT_EMAIL` | `src/lib/push.ts:5` | `src/lib/push.ts:5` | Adresse de contact VAPID ; fallback `"contact@done.app"`. |
| 14 | `CRON_SECRET` | `src/app/api/cron/budget-alerts/route.ts:6` | `src/app/api/cron/budget-alerts/route.ts:6` ; `src/app/api/cron/daily-tasks/route.ts:6` ; `src/app/api/cron/reminders/route.ts:7` ; `src/app/api/cron/upcoming-deadlines/route.ts:6` | Secret partagé Vercel Cron ↔ handlers. À recouper avec l'inventaire 3.6 (vercel.json) et la tâche 9.2 (Property 7). |
| 15 | `GOOGLE_CLIENT_ID` | `src/app/api/calendar/google/auth/route.ts:12` | `src/app/api/calendar/google/auth/route.ts:12` ; `src/app/api/calendar/google/callback/route.ts:26` ; `src/app/api/calendar/google/clear/route.ts:21` ; `src/app/api/calendar/google/sync/route.ts:35` | Identifiant client OAuth Google Calendar (serveur). |
| 16 | `GOOGLE_CLIENT_SECRET` | `src/app/api/calendar/google/auth/route.ts:13` | `src/app/api/calendar/google/auth/route.ts:13` ; `src/app/api/calendar/google/callback/route.ts:27` ; `src/app/api/calendar/google/clear/route.ts:22` ; `src/app/api/calendar/google/sync/route.ts:36` | Secret OAuth Google Calendar (serveur). |

Total : **16 variables** distinctes effectivement référencées dans `src/` et `prisma/`.

Aucune occurrence du pattern `process.env["X"]` / `process.env['X']` n'a été détectée (deux recherches dédiées renvoyées vides).

## ii. Variables présentes dans `.env.example`

Liste exhaustive des variables déclarées dans `/Users/zerbib/clickup-clone/.env.example` (par nom uniquement, sans valeur) :

| # | Variable | Section / commentaire dans `.env.example` |
| --- | --- | --- |
| 1 | `DATABASE_URL` | (en-tête, sans section) |
| 2 | `NEXTAUTH_SECRET` | (en-tête, sans section) |
| 3 | `NEXTAUTH_URL` | (en-tête, sans section) |
| 4 | `RELEASE_STORE_FILE` | « Android Release Signing (définies dans `~/.gradle/gradle.properties` ou env CI) » |
| 5 | `RELEASE_STORE_PASSWORD` | idem |
| 6 | `RELEASE_KEY_ALIAS` | idem |
| 7 | `RELEASE_KEY_PASSWORD` | idem |
| 8 | `UPSTASH_REDIS_REST_URL` | « Upstash Redis (rate limiting) — optionnel, désactivé si absent » |
| 9 | `UPSTASH_REDIS_REST_TOKEN` | idem |

Total : **9 variables** déclarées.

## iii. Tableau des écarts

### iii.a Variables référencées dans le code mais **absentes** de `.env.example`

| # | Variable | Source(s) `path:line` | Type | Criticité métier (à confirmer en 9.3 / 11.4) |
| --- | --- | --- | --- | --- |
| 1 | `FIREBASE_SERVICE_ACCOUNT` | `src/lib/firebase-admin.ts:8` | Secret serveur (JSON Firebase) | Élevée — sans elle, pas d'envoi FCM. |
| 2 | `RESEND_API_KEY` | `src/lib/email.ts:3` | Secret serveur (clé Resend) | Élevée — sans elle, pas d'e-mails transactionnels (invitations, etc.). |
| 3 | `FROM_EMAIL` | `src/lib/email.ts:5` | Configuration | Faible — fallback `onboarding@resend.dev`. |
| 4 | `NEXT_PUBLIC_APP_URL` | `src/lib/email.ts:6` | Configuration **exposée client** (`NEXT_PUBLIC_*`) | Moyenne — fallback Vercel-prod ; à valider qu'aucun secret n'a été baptisé `NEXT_PUBLIC_*` (Property axe SEC). |
| 5 | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `src/lib/push.ts:3` ; `src/app/api/push/vapid-public-key/route.ts:4` | Clé publique VAPID **exposée client** | Élevée — sans elle, pas de Web Push. |
| 6 | `VAPID_PRIVATE_KEY` | `src/lib/push.ts:4` | Secret serveur (Web Push) | Élevée — sans elle, pas de Web Push. |
| 7 | `VAPID_CONTACT_EMAIL` | `src/lib/push.ts:5` | Configuration | Faible — fallback `contact@done.app`. |
| 8 | `CRON_SECRET` | 4 routes cron sous `src/app/api/cron/**/route.ts` | Secret serveur (auth Vercel Cron) | Élevée — sans secret, l'authentification des crons tombe en mode permissif (cf. logique de chaque handler) ; à recouper en 9.2 (Property 7). |
| 9 | `GOOGLE_CLIENT_ID` | 4 routes sous `src/app/api/calendar/google/**` | Configuration serveur | Élevée pour la sync Google Calendar. |
| 10 | `GOOGLE_CLIENT_SECRET` | 4 routes sous `src/app/api/calendar/google/**` | Secret serveur | Élevée pour la sync Google Calendar. |

`NODE_ENV` n'est **pas** comptabilisé comme un écart : c'est une variable de runtime gérée par Node.js / Next.js et qui n'a pas vocation à figurer dans un `.env.example` applicatif.

→ **10 variables** référencées dans le code et absentes du fichier d'exemple. Cet écart sera consolidé en Finding(s) `F-INF-NNN` lors de la tâche 9.3, en distinguant éventuellement les secrets (Severity_High recommandée si l'absence empêche le déploiement reproductible) des simples valeurs de configuration (Severity_Medium).

### iii.b Variables présentes dans `.env.example` mais **non référencées** dans `src/` ou `prisma/`

| # | Variable | Justification de l'absence dans `src/` / `prisma/` (à confirmer en 9.3) |
| --- | --- | --- |
| 1 | `RELEASE_STORE_FILE` | Variable de signature Android Gradle ; consommée hors périmètre TypeScript (par `android/app/build.gradle` et/ou `~/.gradle/gradle.properties`). Le commentaire de `.env.example` confirme cet usage. À recouper avec l'axe MOB (tâche 10.5). |
| 2 | `RELEASE_STORE_PASSWORD` | idem (signature Android Gradle). |
| 3 | `RELEASE_KEY_ALIAS` | idem (signature Android Gradle). |
| 4 | `RELEASE_KEY_PASSWORD` | idem (signature Android Gradle). |

→ **4 variables** déclarées dans `.env.example` et non utilisées dans `src/` ou `prisma/`. **Toutes les quatre sont des variables de signature Android Gradle**, pour lesquelles le `.env.example` indique explicitement qu'elles sont définies « dans `~/.gradle/gradle.properties` ou env CI ». L'absence de référence sous `src/` / `prisma/` est donc **attendue** ; la véracité de leur consommation par Gradle sera vérifiée en tâche 10.5 (axe MOB), hors périmètre du présent inventaire.

## iv. Synthèse pour l'axe INF (à instruire en 9.3)

- **Écart principal** à instruire : 10 variables d'environnement consommées par le code mais non documentées dans `.env.example`, dont au moins **6 secrets serveur** (`FIREBASE_SERVICE_ACCOUNT`, `RESEND_API_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, `GOOGLE_CLIENT_SECRET`) et **1 secret optionnel** (`UPSTASH_REDIS_REST_TOKEN` est, lui, déjà documenté).
- **Écart attendu et bénin** : 4 variables Gradle Android documentées sans référence côté `src/` / `prisma/`, conformes au commentaire du fichier d'exemple. Pas de Finding attendu de ce côté.
- **Préfixe `NEXT_PUBLIC_*`** : `NEXT_PUBLIC_APP_URL` et `NEXT_PUBLIC_VAPID_PUBLIC_KEY` sont exposées au client. La nature publique de la clé VAPID est légitime ; `NEXT_PUBLIC_APP_URL` est une URL non sensible. À ré-examiner formellement en 11.4 (axe SEC) pour vérifier qu'aucun secret métier ne porte par erreur le préfixe `NEXT_PUBLIC_*`.

Aucun secret n'est divulgué dans cette note ; seules les **noms** des variables sont consignés.
