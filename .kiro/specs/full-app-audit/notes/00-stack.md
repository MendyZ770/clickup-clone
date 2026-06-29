# 00 — Stack et commandes disponibles

> Note de cadrage produite en tâche 1.3 (Phase 0). Lecture seule, hors dépôt applicatif.
> Sources lues :
> - `package.json`
> - `next.config.mjs`
> - `tsconfig.json`

## 1. Scripts npm disponibles (`package.json` > `scripts`)

| Script              | Commande sous-jacente                  | Usage prévu pendant l'audit                         |
| ------------------- | -------------------------------------- | --------------------------------------------------- |
| `dev`               | `next dev`                             | Hors périmètre (mode lecture seule, pas d'exécution applicative). |
| `build`             | `next build`                           | **Build_Check de la phase 1** (tâche 2.1).          |
| `start`             | `next start`                           | Hors périmètre.                                     |
| `lint`              | `next lint`                            | Optionnel, peut servir d'appoint à la revue LOG/UI. |
| `cap:sync`          | `npx cap sync`                         | Hors périmètre (modifierait `android/`).            |
| `cap:open`          | `npx cap open android`                 | Hors périmètre.                                     |
| `android:dev`       | `./scripts/android-dev.sh`             | Hors périmètre.                                     |
| `android:build`     | `cd android && ./gradlew assembleDebug`| Hors périmètre (build APK destructif vis-à-vis de `android/build/`). |
| `android:release`   | `cd android && ./gradlew assembleRelease` | Hors périmètre.                                  |
| `android:install`   | `./scripts/install-apk.sh`             | Hors périmètre.                                     |
| `build:apk`         | `./scripts/build-apk.sh`               | Hors périmètre.                                     |
| `build:release`     | `./scripts/build-release.sh`           | Hors périmètre.                                     |

> Aucun script `prisma` dédié n'est exposé dans `scripts`. La section `"prisma": { "seed": "npx tsx prisma/seed.ts" }` configure uniquement le seed Prisma. Les commandes `prisma generate` / `prisma migrate` / `prisma db push` ne sont pas exposées comme scripts npm et ne seront pas exécutées pendant l'audit (mode lecture seule).

## 2. Commande de build à utiliser en phase 1

- Commande retenue : **`npm run build`** (équivalent direct de `next build`).
- Justification : le script `build` du `package.json` est `next build` sans pré/post-script, ni génération Prisma implicite. C'est donc la commande non destructive standard pour la vérification de compilation Next.js.
- Capture attendue : stdout + stderr, exit code, durée. Sortie consignée dans `notes/annexe-B-build-log.md` (tâche 2.1) et tracée dans le journal des commandes (annexe A, tâche 1.4).

> Note de prudence : `next.config.mjs` définit `output: "standalone"`. Le build produit donc un dossier `.next/standalone/`. Cette écriture reste confinée à `.next/` (déjà présent dans le dépôt local) et ne touche ni `src/`, ni `prisma/`, ni la base de données. Compatible avec le mode lecture seule applicatif.

## 3. Versions clés

> Versions extraites des champs `dependencies` / `devDependencies` du `package.json`. Les ranges sémantiques (`^`) indiquent la version minimale déclarée ; la version effectivement installée dépend du `package-lock.json` / `node_modules`, non lue dans cette tâche.

### 3.1 Framework et runtime

| Composant       | Package                  | Version déclarée |
| --------------- | ------------------------ | ---------------- |
| Next.js         | `next`                   | `^16.2.6`        |
| React           | `react`                  | `^18`            |
| React DOM       | `react-dom`              | `^18`            |
| TypeScript      | `typescript`             | `^5`             |
| ESLint          | `eslint`                 | `^9.39.4`        |
| ESLint config Next | `eslint-config-next`  | `^16.2.6`        |
| Bundle analyzer | `@next/bundle-analyzer`  | `^16.2.6`        |

### 3.2 Authentification

| Composant            | Package                  | Version déclarée |
| -------------------- | ------------------------ | ---------------- |
| NextAuth             | `next-auth`              | `^4.24.14`       |
| Adaptateur Prisma    | `@auth/prisma-adapter`   | `^2.11.2`        |
| JOSE (JWT)           | `jose`                   | `^6.2.3`         |
| Hachage mots de passe| `bcryptjs`               | `^3.0.3`         |

### 3.3 Base de données

| Composant         | Package                | Version déclarée |
| ----------------- | ---------------------- | ---------------- |
| Prisma CLI        | `prisma` (devDep)      | `^5.14.0`        |
| Prisma Client     | `@prisma/client` (devDep) | `^5.14.0`     |
| Adaptateur PG     | `@prisma/adapter-pg`   | `^5.14.0`        |
| Driver Postgres   | `pg`                   | `^8.20.0`        |

### 3.4 Données client / API

| Composant   | Package | Version déclarée |
| ----------- | ------- | ---------------- |
| SWR         | `swr`   | `^2.4.1`         |
| Validation  | `zod`   | `^4.3.6`         |

### 3.5 Mobile (Capacitor) et notifications push

| Composant                  | Package                          | Version déclarée |
| -------------------------- | -------------------------------- | ---------------- |
| Capacitor Core             | `@capacitor/core`                | `^8.3.4`         |
| Capacitor CLI              | `@capacitor/cli`                 | `^8.3.4`         |
| Capacitor Android          | `@capacitor/android`             | `^8.3.4`         |
| Capacitor Preferences      | `@capacitor/preferences`         | `^8.0.1`         |
| Capacitor Push Notifications | `@capacitor/push-notifications`| `^8.1.1`         |
| Firebase Admin (FCM serveur) | `firebase-admin`              | `13.10.0`        |
| Web Push (VAPID)           | `web-push`                       | `^3.6.7`         |

### 3.6 Infra et services tiers

| Composant         | Package             | Version déclarée |
| ----------------- | ------------------- | ---------------- |
| Upstash Ratelimit | `@upstash/ratelimit`| `^2.0.8`         |
| Upstash Redis     | `@upstash/redis`    | `^1.38.0`        |
| Resend (e-mail)   | `resend`            | `^6.12.3`        |
| Google APIs       | `googleapis`        | `^171.4.0`       |
| iCal generator    | `ical-generator`    | `^10.2.0`        |

### 3.7 UI

| Composant                | Package(s)                     | Version déclarée |
| ------------------------ | ------------------------------ | ---------------- |
| Tailwind CSS             | `tailwindcss` (devDep)         | `^3.4.1`         |
| Tailwind animate         | `tailwindcss-animate`          | `^1.0.7`         |
| Tailwind merge           | `tailwind-merge`               | `^3.5.0`         |
| Variantes (cva)          | `class-variance-authority`     | `^0.7.1`         |
| Radix UI (primitives)    | `@radix-ui/react-*`            | divers `^1.x` / `^2.x` (cf. `package.json`) |
| Icônes                   | `lucide-react`                 | `^1.11.0`        |
| Animations               | `framer-motion`                | `^12.39.0`       |
| Drag & drop              | `@hello-pangea/dnd`            | `^18.0.1`        |
| Date picker              | `react-day-picker`             | `^8.10.1`        |
| Charts                   | `recharts`                     | `^3.8.1`         |
| Command menu             | `cmdk`                         | `^1.1.1`         |
| Date utils               | `date-fns`                     | `^3.6.0`         |

## 4. Configuration TypeScript (`tsconfig.json`) — points saillants

- `strict: true` — mode strict activé (à recouper avec axe LOG).
- `noEmit: true` — TS ne produit pas de sortie ; transpilation déléguée à Next.
- `moduleResolution: "bundler"` — résolution alignée sur l'écosystème Next/SWC.
- `jsx: "react-jsx"` — runtime JSX moderne, pas d'import explicite de React requis.
- `paths: { "@/*": ["./src/*"] }` — alias `@/` pointant vers `src/`. Tout import `@/...` devra exister sous `src/`.
- `target: "ES2017"` — cible relativement ancienne ; à noter pour audit PRF (transformations potentielles).
- `include`: `next-env.d.ts`, `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`, `.next/dev/types/**/*.ts`.
- `exclude`: `node_modules`, `prisma`. Le dossier `prisma/` est explicitement hors du périmètre TypeScript ; les fichiers TS sous `prisma/` (ex. `prisma/seed.ts`) ne sont pas type-checkés par le projet principal — observation à recouper en axe BDD (tâche 8.x).

## 5. Configuration Next (`next.config.mjs`) — points saillants utiles à l'audit

- `output: "standalone"` — build autonome (impact PRF/INF, à recouper avec `vercel.json`).
- `compress: true` — compression activée.
- `images.unoptimized: true` + `remotePatterns: [{ protocol: "https", hostname: "**" }]` — désactivation de l'optimiseur d'images Next et autorisation d'images depuis n'importe quel hôte HTTPS. À recouper en axes PRF et SEC.
- `experimental.optimizePackageImports`: `lucide-react`, `@radix-ui/react-icons`, `date-fns` — tree-shaking ciblé, à recouper en PRF.
- `experimental.scrollRestoration: true`.
- `productionBrowserSourceMaps: false`.
- `headers()` — déclare `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security` (production uniquement) et une `Content-Security-Policy`. À recouper en axe SEC (tâche 11.5).
- Bundle analyzer activé conditionnellement via `process.env.ANALYZE === "true"`.

## 6. Synthèse pour la suite de l'audit

- **Commande de build phase 1** : `npm run build` (= `next build`).
- **Pré-requis attendus** : `node_modules` déjà installé (sinon prévoir `npm install`, à confirmer avec l'utilisateur si nécessaire avant la tâche 2.1, car cela écrirait dans `node_modules/` et `package-lock.json` — toléré en lecture seule applicative mais à signaler).
- **Variables d'environnement** : la commande `next build` peut nécessiter certaines variables (DATABASE_URL, NEXTAUTH_SECRET, etc.). À recouper avec l'inventaire env (tâche 3.5) avant exécution.
- **Versions structurantes pour la revue** :
  - Next.js 16 (App Router moderne, à confirmer dans la revue LOG).
  - Prisma 5.14 (devDep) avec adaptateur `@prisma/adapter-pg` (driver Postgres natif via `pg`) — pertinent pour Neon (cf. `.agents/skills/neon-postgres/SKILL.md`).
  - NextAuth 4.24 (et non v5 / Auth.js) — la revue SEC vérifiera la cohérence config.
  - SWR 2.4 — la revue LOG vérifiera systématiquement le contrôle `res.ok` (CLAUDE_Rule).
  - Capacitor 8 (Android) — la revue MOB vérifiera `capacitor.config`, plugins déclarés vs utilisés, et le manifest.
  - Zod 4 — version majeure récente, à garder en tête lors de la revue de validation (tâche 7.4).
