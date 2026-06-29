# Consolidation des Findings — Phase 4 (Tâche 14)

> Note de consolidation produite en **Phase 4** de l'audit `full-app-audit`. Elle agrège les huit notes par axe de la Phase 3 (`axe-ui.md`, `axe-ux.md`, `axe-log.md`, `axe-bdd.md`, `axe-inf.md`, `axe-mob.md`, `axe-sec.md`, `axe-prf.md`) et les inventaires (`annexe-C`, `annexe-D`, `annexe-E`, `inv-*`).
>
> **Mode strictement lecture seule** : aucune écriture hors `.kiro/specs/full-app-audit/`. Aucune modification du code applicatif, du schéma Prisma, des migrations ni de la base.
>
> **Périmètre** : cette note couvre les sous-tâches 14.1 (déduplication intra-axe), 14.2 (fusion cross-axe à cause commune, alimente la tâche 15.6) et 14.3 (sévérité finale et liste consolidée). Le tableau de synthèse sévérité × axe (14.4) est consigné dans `notes/synthese.md`.
>
> **Important — traçabilité préservée** : aucune fusion n'est appliquée *destructivement* dans les notes par axe (les huit champs et preuves de chaque Finding restent intacts pour la Property 1). Les décisions de fusion ci-dessous sont des **consignes de consolidation** que la Phase 5 appliquera lors de la rédaction de `audit-report.md` (regroupement en sections) et de `tasks-remediation.md` (regroupement en tâches uniques, Property 6).

---

## 0. Inventaire de référence (153 Findings)

Décompte par axe issu de l'extraction des en-têtes `### F-XXX-NNN` et des lignes `- **Sévérité**` de chaque note (commandes consignées en annexe A, tâche 14) :

| Axe | Identifiants | Total | High | Medium |
| --- | --- | --- | --- | --- |
| UI  | F-UI-001 → F-UI-029   | 29 | 8  | 21 |
| UX  | F-UX-001 → F-UX-017   | 17 | 4  | 13 |
| LOG | F-LOG-001 → F-LOG-030 | 30 | 1  | 29 |
| BDD | F-BDD-001 → F-BDD-031 | 31 | 11 | 20 |
| INF | F-INF-001 → F-INF-013 | 13 | 2  | 11 |
| MOB | F-MOB-001 → F-MOB-012 | 12 | 1  | 11 |
| SEC | F-SEC-001 → F-SEC-013 | 13 | 6  | 7  |
| PRF | F-PRF-001 → F-PRF-008 | 8  | 0  | 8  |
| **Total** | — | **153** | **33** | **120** |

Aucun trou ni doublon d'identifiant détecté : chaque axe numérote séquentiellement à partir de `001` (conforme au format `F-{AXIS}-{NNN}` du design). Aucun identifiant n'est réutilisé entre deux axes.

---

## 14.1 — Déduplication intra-axe

**Méthode** : pour chaque axe, comparaison deux à deux des Findings (titre, champ `Description`, champ `Preuve`) pour repérer (a) les doublons *exacts* (même constat, même preuve), (b) les doublons *quasi-exacts* (un Finding est un sous-ensemble strict d'un autre), (c) les **grappes à cause commune intra-axe** (constats distincts mais relevant d'une seule remédiation).

**Constat général** : les notes de Phase 3 ont été rédigées avec une discipline anti-doublon explicite (chaque sous-tâche déclare son périmètre et exclut les constats déjà rendus). En conséquence, **aucun doublon exact n'a été trouvé** : chaque Finding porte une preuve `path:line`/`commande:` distincte et une recommandation propre. Aucune fusion destructive n'est donc appliquée. En revanche, plusieurs **grappes à cause commune intra-axe** sont identifiées : elles ne sont pas fusionnées en tant que Findings (preuves distinctes à conserver pour Property 1 et Property 3), mais sont **regroupées en une tâche de remédiation unique** en Phase 5 (Property 6).

### UI — décisions

- **Doublons exacts** : aucun.
- **Quasi-doublon examiné** : `F-UI-026` (« erreurs SWR silencieusement ignorées sur 40 fetchers ») recoupe fortement `F-LOG-010` mais relève d'un **autre axe** → traité en 14.2 (groupe X2), pas en 14.1.
- **Grappe « design tokens / styling en dur »** : `F-UI-020`, `F-UI-021`, `F-UI-022`, `F-UI-023`, `F-UI-024`, `F-UI-025`. Cause commune : absence de discipline de tokens centralisés (couleurs/échelles en littéraux). **Décision** : conserver les 6 Findings (preuves et fichiers distincts), regrouper en **une tâche de remédiation UI « design system / tokens »**.
- **Grappe « états asynchrones (loading/error/empty) »** : `F-UI-026`, `F-UI-027`, `F-UI-028`, `F-UI-029`. Cause commune : gestion incomplète des trois états sur les composants SWR. **Décision** : conserver distincts ; regrouper en remédiation, et **rattacher au groupe cross-axe X2** (SWR error surfacing) car `F-UI-026` en est le pivot.
- **Grappe « modales / nom accessible »** : `F-UI-001`, `F-UI-002`, `F-UI-003` (Radix sans `Title`) + `F-UI-010` (modales finance « DIY » sans rôle dialog). Cause commune : nommage/structure accessible des dialogues. **Décision** : conserver distincts ; regrouper en une tâche a11y « dialogues accessibles ».

### UX — décisions

- **Doublons exacts** : aucun.
- **Grappe « confirmation des actions destructives »** : `F-UX-001` (suppression tâche sans confirmation), `F-UX-004` (`window.confirm` sur 5 sites finance/calendrier), `F-UX-006` (7 sous-entités supprimées sans confirmation/feedback). **Décision** : conserver distincts (scopes et fichiers différents) ; regrouper en remédiation, et **rattacher au groupe cross-axe X8** (perte de données destructive).
- **Grappe « feedback d'erreur absent »** : `F-UX-005` (mutations finance avalent les erreurs), `F-UX-007` (autosave notes avale les échecs), `F-UX-008` (aucun fallback global SWR). **Décision** : conserver distincts ; rattacher au groupe cross-axe X2.
- **Grappe « frontières d'erreur / 404 »** : `F-UX-009` (pas de `global-error.tsx`), `F-UX-010` (granularité `not-found.tsx` / `(auth)/error.tsx`), `F-UX-012` (fuite de `error.message` brut). **Décision** : conserver distincts ; regrouper en une tâche « error boundaries & pages d'erreur ». `F-UX-012` recoupe l'axe LOG (gestion d'erreur) mais reste un défaut UX (exposition utilisateur).
- **Grappe « navigation »** : `F-UX-014` (sidebar vs mobile-nav divergents), `F-UX-015` (breadcrumbs vides), `F-UX-017` (`router.push` au lieu de `<Link>`). **Décision** : conserver distincts ; regrouper en une tâche « cohérence de navigation ». `F-UX-013` (lien cassé `/tasks/${id}`) reste isolé (bug ponctuel à corriger seul, mais peut rejoindre la même tâche).
- **Grappe « Capacitor Android »** : `F-UX-011` (pas de fallback réseau), `F-UX-016` (pas de handler BackButton). **Décision** : conserver distincts ; regrouper en une tâche « robustesse mobile Capacitor ».

### LOG — décisions

- **Doublons exacts** : aucun.
- **Quasi-doublon (sous-ensemble)** : `F-LOG-016` (module finance sans Zod), `F-LOG-017` (énumérés sans whitelist), `F-LOG-018` (query strings non validées), `F-LOG-019` (schémas non mutualisés côté client) sont tous des **spécialisations** de l'ombrelle `F-LOG-015` (couverture Zod minoritaire ~26 %). **Décision** : ne pas fusionner (chacun cible un module/angle distinct avec preuves propres) ; regrouper les cinq en **une tâche de remédiation LOG « validation Zod de bout en bout »**.
- **Grappe « gestion d'erreur API / codes HTTP »** : `F-LOG-020` (routes sans try/catch), `F-LOG-021` (P2002 → 400 vs 409), `F-LOG-022` (401 détourné pour PIN), `F-LOG-023` (3 variantes de message 500), `F-LOG-024` (pattern try/catch+500 répété 170×). **Décision** : conserver distincts ; regrouper en une tâche « normalisation de la gestion d'erreur API ».
- **Grappe « useEffect »** : `F-LOG-025` à `F-LOG-030`. **Décision** : conserver distincts ; regrouper en une tâche « assainissement des `useEffect` ».
- **Grappe « SWR » (corrélée PRF)** : `F-LOG-010` (erreurs silencieuses), `F-LOG-011` à `F-LOG-014` (polling, clés, revalidation) → traitées en 14.2 (groupes X2 et X4).
- **Cas isolé** : `F-LOG-001` (arbre git non propre au démarrage) reste un Finding autonome (méta-constat de méthode, déjà documenté en baseline). Pas de fusion.

### BDD — décisions

- **Doublons exacts** : aucun.
- **Grappe « modèles Budget morts »** : `F-BDD-001` (`BudgetAlert`), `F-BDD-002` (`BudgetTemplate`), `F-BDD-003` (`BudgetTransactionTag` partiel). La note `axe-bdd.md` recommande elle-même la fusion (« À cause commune avec F-BDD-001 — fusionnable »). **Décision** : conserver les 3 Findings (modèles et preuves distincts) ; regrouper en **une tâche « nettoyer/activer les modèles Budget non utilisés »**.
- **Grappe « FK logiques non contraintes »** : `F-BDD-004` (`sourceBudgetId`/`targetBudgetId`), `F-BDD-005` (`FinanceTransaction.targetAccountId`), `F-BDD-006` (`Favorite.targetId` polymorphe). La note recommande explicitement la fusion. **Décision** : conserver distincts ; regrouper en une tâche « matérialiser les FK logiques + contraintes d'intégrité ». (`F-BDD-004` est rattaché ici plutôt qu'à la grappe « Budget morts ».)
- **Grappe « index manquants »** : `F-BDD-008` à `F-BDD-015`. **Décision** : conserver distincts (un modèle/jeu de champs par Finding) ; regrouper en **une tâche « ajout des index manquants »**. Lien cross-axe avec `F-PRF-006` (index trigramme) — voir X6.
- **Grappe « cascades / `onDelete` »** : `F-BDD-016` à `F-BDD-021`. **Décision** : conserver distincts ; regrouper en une tâche « revue des cascades et archivage ». `F-BDD-019` (perte d'historique comptable) est rattaché aussi au groupe destructif X8.
- **Grappe « migrations »** : `F-BDD-022` (aucune migration versionnée), `F-BDD-023` (`buildCommand` sans `migrate deploy`). **Décision** : conserver distincts (cause commune évidente) ; regrouper en **une tâche « instaurer un historique de migrations Prisma »**.
- **Grappe « N+1 / scans / sur-fetch »** : `F-BDD-024` à `F-BDD-031` → traitées en 14.2 (groupes X5 crons et X6 requêtes).

### INF — décisions

- **Doublons exacts** : aucun.
- **Quasi-doublon (sous-ensemble)** : `F-INF-006` (variables non secrètes absentes de `.env.example`) est un sous-ensemble thématique de `F-INF-005` (variables requises absentes de `.env.example`). **Décision** : conserver les deux (la distinction secret/non-secret porte une recommandation différente) ; regrouper en **une tâche « compléter `.env.example` »**.
- **Grappe « configuration des fonctions »** : `F-INF-001` (pas de `maxDuration`/`memory`), `F-INF-002` (pas de `regions`). **Décision** : conserver distincts ; regrouper en une tâche « configuration `vercel.json functions/regions » (avec confirmation console).
- **Grappe « crons »** : `F-INF-003` (header `Authorization` non vérifié), `F-INF-004` (secret en query string), `F-INF-011` (try/catch global abandonne le batch) → traitées en 14.2 (groupe X5).
- **Grappe « `next.config.mjs` »** : `F-INF-007` (`output: standalone`), `F-INF-008` (`images.unoptimized` + `remotePatterns **`), `F-INF-009` (`experimental` sans pin de version). **Décision** : conserver distincts ; regrouper en une tâche « assainir `next.config.mjs` ». `F-INF-008` recoupe `F-PRF-005` (avatars non optimisés) — voir X6/annexe.
- **Grappe « observabilité / erreurs »** : `F-INF-010` (pas d'observabilité tierce), `F-INF-012` (catch silencieux avatar/Google Calendar), `F-INF-013` (erreurs FCM/Web Push avalées). **Décision** : conserver distincts ; regrouper en une tâche « observabilité & journalisation ». `F-INF-011` rejoint le groupe crons X5.

### MOB — décisions

- **Doublons exacts** : aucun.
- **Grappe « config Capacitor dev/prod »** : `F-MOB-001` (`*.ngrok-free.app` en prod), `F-MOB-002` (`server.url` codé en dur, divergence `BUILD_APK.md`), `F-MOB-003` (`webDir: public` incohérent). **Décision** : conserver distincts ; regrouper en **une tâche « durcir la config Capacitor dev/prod »**.
- **Grappe « cycle de vie du token FCM »** : `F-MOB-008` (pas de désenregistrement à la déconnexion), `F-MOB-009` (register-fcm sans rate limit + réassignation), `F-MOB-010` (purge tokens périmés inopérante) → traitées en 14.2 (groupe X1, avec `F-SEC-007`).
- **Grappe « signing / keystore »** : `F-MOB-007` (`google-services.json` non versionné/non ignoré), `F-MOB-011` (divergence secrets de signing `BUILD_APK.md`/`build.gradle`), `F-MOB-012` (keystores dans l'arbre du dépôt). **Décision** : conserver distincts ; regrouper en une tâche « hygiène des secrets de build Android ».
- **Cas isolés** : `F-MOB-004` (allowBackup → fuite token) rejoint X7 ; `F-MOB-005` (FileProvider orphelin `path="."`) reste autonome.

### SEC — décisions

- **Doublons exacts** : aucun.
- **Grappe majeure « ownership / membership manquant »** : `F-SEC-001` (Finance), `F-SEC-002` (Goals), `F-SEC-003` (Tasks/Lists/reorder), `F-SEC-004` (sous-ressources de tâche), `F-SEC-005` (Time Tracking), `F-SEC-006` (Templates). Cause commune unique : **absence d'un helper d'autorisation centralisé** appliqué avant accès Prisma (la note SEC recommande un helper `assertTaskAccess` / `checkWorkspaceAccess` mutualisé). **Décision** : conserver les 6 Findings (routes et preuves distinctes, indispensables pour Property 8) ; regrouper en **une tâche de remédiation SEC prioritaire « helper d'autorisation + application sur toutes les routes »**. C'est la grappe à plus fort enjeu de tout l'audit.
- **Cas autonomes** : `F-SEC-008` (rate limiting), `F-SEC-010` (session JWT NextAuth), `F-SEC-012` (OAuth `state`), `F-SEC-013` (token feed calendrier) restent des tâches distinctes.
- **Liens cross-axe** : `F-SEC-007` (push) → X1 ; `F-SEC-009` (CSP) + `F-SEC-011` (JWT mobile) → X7.

### PRF — décisions

- **Doublons exacts** : aucun.
- **Grappe « imports lourds statiques »** : `F-PRF-001` (`framer-motion`), `F-PRF-002` (`recharts`). **Décision** : conserver distincts ; regrouper en une tâche « code-splitting des libs lourdes ».
- **Grappe « frontière client / bundle »** : `F-PRF-003` (primitives UI `"use client"`), `F-PRF-004` (22/24 pages client) → traitées en 14.2 (groupe X3, avec `F-LOG-007/008/009`).
- **Grappe « requêtes BDD »** : `F-PRF-006` (recherche non-sargable), `F-PRF-007` (waterfall finance/stats) → traitées en 14.2 (groupe X6, avec les `F-BDD-024..031`).
- **Cas autonome** : `F-PRF-005` (avatars non optimisés) — lié à `F-INF-008` (même `images.unoptimized`) ; rattaché en annexe X.
- **Grappe « caching SWR »** : `F-PRF-008` → X4.

**Synthèse 14.1** : 0 doublon exact, 0 fusion destructive. 16 grappes à cause commune **intra-axe** identifiées et marquées pour regroupement en tâches uniques de remédiation (Phase 5).

---

## 14.2 — Fusion des Findings à cause commune (cross-axe)

**Méthode** : repérage des Findings de **deux axes différents ou plus** qui pointent une **même cause racine** (même sous-système, même fichier, même défaut structurel). Ces groupes sont marqués pour fusion en **une tâche de remédiation unique** listant tous les identifiants concernés (alimente la tâche 15.6 ; Property 6). Les Findings restent distincts dans le rapport par axe (Property 5) ; seule la tâche de remédiation les agrège.

> **Note** : la sévérité maximale d'un groupe = la plus haute sévérité de ses membres. Elle déterminera la priorité de la tâche fusionnée en Phase 5 (Property 5 du `tasks-remediation.md`).

### X1 — Sous-système Push / token FCM (SEC + MOB) — sévérité max : Medium

- Membres : `F-SEC-007`, `F-MOB-008`, `F-MOB-009`, `F-MOB-010`.
- Cause racine : gestion de la propriété et du cycle de vie des souscriptions push (`/api/push/*`, `src/lib/notifications.ts`, `src/lib/firebase-admin.ts`). `F-SEC-007` et `F-MOB-009` décrivent **le même défaut** (réassignation inconditionnelle du `fcmToken` dans `register-fcm` + `unsubscribe` sans auth) depuis deux axes.
- Remédiation unique : scoper toute opération token/endpoint par utilisateur authentifié, ajouter le rate limiting, désenregistrer à la déconnexion, corriger la purge des tokens périmés (`err.code` au lieu de `err.message`).

### X2 — Surfaçage des erreurs et états asynchrones SWR (LOG + UI + UX) — sévérité max : High

- Membres : `F-LOG-010`, `F-UI-026`, `F-UI-027`, `F-UI-028`, `F-UI-029`, `F-UX-005`, `F-UX-007`, `F-UX-008`.
- Cause racine : aucune stratégie commune de gestion des erreurs/états de chargement SWR (40 fetchers sur 59 sans gestion d'erreur). `F-LOG-010` et `F-UI-026` sont **le même constat** (40 fetchers) sous l'angle logique vs UI.
- Sévérité max High portée par `F-UI-026` (High). Remédiation unique : composant/hook partagé `<SWRErrorFallback onRetry={mutate} />`, fallback global (`onError` du `SWRConfig`), distinction explicite loading/empty, toasts sur mutations (finance, autosave notes).

### X3 — Frontière Server/Client & poids du bundle (LOG + PRF) — sévérité max : Medium

- Membres : `F-LOG-007`, `F-LOG-008`, `F-LOG-009`, `F-PRF-003`, `F-PRF-004`.
- Cause racine : `"use client"` remonté trop haut (primitives pures, pages de vue pour `useParams`, dashboard, 22/24 pages). `F-PRF-003/004` sont l'angle « performance » des constats LOG `007/008/009`.
- Remédiation unique : pattern « Server Component orchestrateur + îlots client », retrait des `"use client"` injustifiés sur primitives et pages.

### X4 — Discipline de cache / polling SWR (LOG + PRF) — sévérité max : Medium

- Membres : `F-LOG-011`, `F-LOG-012`, `F-LOG-013`, `F-LOG-014`, `F-PRF-008`.
- Cause racine : configuration SWR uniforme inadaptée (polling permanent 5 s, clés instables/non gardées/non canoniques, `revalidateOnFocus` non désactivé, données de référence revalidées comme volatiles).
- Remédiation unique : gabarits de configuration SWR par classe de donnée (volatile vs référence), gardes `null` sur clés, conditionnement du polling.

### X5 — Handlers cron : authentification, robustesse, requêtes (INF + BDD) — sévérité max : High

- Membres : `F-INF-001`, `F-INF-003`, `F-INF-004`, `F-INF-011`, `F-BDD-025`, `F-BDD-026`, `F-BDD-027`.
- Cause racine : les quatre handlers `src/app/api/cron/**` partagent le même squelette (auth non standard, secret en query string, try/catch global, `findMany` sans `take` + `findFirst` anti-doublon en boucle N+1).
- Sévérité max High portée par `F-INF-003` (panne en prod potentielle). Remédiation unique : standardiser l'auth `Authorization: Bearer <CRON_SECRET>`, déclarer `maxDuration`, idempotence par lot, batcher les requêtes anti-doublon.

### X6 — Requêtes BDD lourdes (N+1, scans, absence de `take`, sur-fetch, recherche non-sargable) (BDD + PRF) — sévérité max : High

- Membres : `F-BDD-024`, `F-BDD-028`, `F-BDD-029`, `F-BDD-030`, `F-BDD-031`, `F-PRF-006`, `F-PRF-007`.
- Cause racine : patrons d'accès Prisma non optimisés (favoris polymorphes N+1, `include` profonds sans `select`, `findMany` sans `take`/pagination, recherche `contains` sans index trigramme, waterfall séquentiel `finance/stats`). Les Findings PRF référencent explicitement les Findings BDD.
- Sévérité max High portée par `F-BDD-024`/`F-BDD-029`. Remédiation unique : pagination systématique (`take`), `select` ciblé, batch des lookups, index trigramme/GIN (`pg_trgm`), parallélisation + agrégation SQL. Lien avec la grappe index `F-BDD-008..015`.

### X7 — Sécurité du token d'authentification mobile (MOB + SEC) — sévérité max : High

- Membres : `F-MOB-004`, `F-SEC-009`, `F-SEC-011`.
- Cause racine : le `mobile_auth_token` (JWT 30 j) est exposé sur plusieurs surfaces : sauvegarde Android Auto Backup (`F-MOB-004`, High), stockage `localStorage` + absence de révocation (`F-SEC-011`), et CSP permissive facilitant son vol par XSS (`F-SEC-009`).
- Sévérité max High portée par `F-MOB-004`. Remédiation unique : stockage chiffré (Keystore/EncryptedSharedPreferences), exclusion de la sauvegarde, durée courte + révocation, durcissement CSP.

### X8 — Actions destructives : confirmation utilisateur + perte de données (UX + BDD + UI) — sévérité max : High

- Membres : `F-UX-001`, `F-UX-004`, `F-UX-006`, `F-UI-010`, `F-BDD-019`.
- Cause racine : suppressions sans garde-fou côté UX combinées à des cascades destructrices côté BDD (perte d'historique comptable). `F-UI-010` (modales finance DIY) est le support UI des `window.confirm` de `F-UX-004`.
- Sévérité max High portée par `F-UX-001` (perte de données). Remédiation : `<AlertDialog>` systématique sur les suppressions, description des cascades, archivage/soft-delete pour les données financières (`F-BDD-019`).

> **Findings sans groupe cross-axe** (traités intra-axe ou autonomes) : F-LOG-001 ; F-SEC-001..006 (grappe intra-axe SEC ownership) ; F-SEC-008, F-SEC-010, F-SEC-012, F-SEC-013 ; les grappes intra-axe UI tokens, BDD index/cascades/migrations/FK/budget morts, LOG Zod/erreurs/useEffect, INF env/next.config/observabilité, MOB capacitor/signing, UX navigation/error-boundaries/Capacitor ; F-MOB-005 ; F-PRF-001/002/005. Ces ensembles donneront chacun une tâche de remédiation propre en Phase 5.

**Synthèse 14.2** : 8 groupes cross-axe à cause commune identifiés (X1–X8), couvrant 41 Findings issus de 2 axes ou plus. Ces groupes seront fusionnés en 8 tâches de remédiation uniques (Property 6) en tâche 15.6, en plus des tâches issues des grappes intra-axe.

---

## 14.3 — Sévérité finale et liste consolidée

**Méthode** : application des **Définitions de sévérité** du design (`design.md` > Data Models > Définitions de sévérité) et **enforcement de la Property 7** :

- (a) toute fuite/altération de données entre utilisateurs ou workspaces distincts → **High** ;
- (b) tout endpoint cron sans secret ni authentification → **High** ;
- (c) toute requête N+1 ou balayage complet de table → **Medium au minimum**.

### Vérification Property 7

- **(a) Fuites cross-utilisateur/cross-workspace** : `F-SEC-001`, `F-SEC-002`, `F-SEC-003`, `F-SEC-004`, `F-SEC-005`, `F-SEC-006` sont **toutes High** ✓. L'exposition du token mobile `F-MOB-004` (secret côté client) est **High** ✓.
- **(b) Cron sans secret** : les quatre crons disposent d'un contrôle de secret (`?secret=` / header `x-vercel-cron-secret`) — **Property 7(b) non déclenchée au sens strict** (aucun cron *totalement non authentifié*). `F-INF-003` reste **High** au titre de « panne en production » (risque de 401 systématique), `F-INF-004` reste **Medium** (exposition passive du secret). Conforme.
- **(c) N+1 / balayage complet** : `F-BDD-024` (High), `F-BDD-025` (High), `F-BDD-026` (High), `F-BDD-027` (Medium), `F-BDD-028` (Medium), `F-BDD-029` (High), `F-BDD-030` (Medium), `F-BDD-031` (Medium), `F-PRF-006` (Medium), `F-PRF-007` (Medium) — **toutes ≥ Medium** ✓.

**Résultat** : toutes les sévérités attribuées en Phase 3 respectent les définitions du design et les minima de la Property 7. **Aucune réévaluation de sévérité n'est nécessaire.** Les sévérités de la liste consolidée ci-dessous sont identiques à celles des notes par axe.

### Cas-limites examinés (sévérité conservée, documentés pour revue)

Trois Findings ont été examinés au regard de la Property 7(a) et **maintenus en Medium** avec justification :

- `F-SEC-007` / `F-MOB-009` (réassignation du `fcmToken`) : permet d'intercepter les notifications d'un autre appareil, mais exige la connaissance du `fcmToken` (spécifique à l'appareil, non trivialement énumérable) ; l'impact primaire est l'intégrité/disponibilité du canal de notification, non la lecture directe d'enregistrements métier. Conservé **Medium** (cohérent avec l'analyse SEC).
- `F-SEC-012` (OAuth `state` non signé) : fixation de compte possible, mais nécessite un `code` OAuth valide délivré par Google → exploitabilité réduite. Conservé **Medium**.
- `F-SEC-013` (token feed calendrier en URL) : fuite passive d'un token de lecture seule de calendrier ; conservé **Medium**.

> Conformément à la consigne de la checkpoint 13 (« consulter l'utilisateur en cas de doute sur une sévérité »), ces trois cas-limites pourront être confirmés avec l'utilisateur en Phase 5/6 si besoin, sans bloquer la consolidation.

### Liste consolidée des Findings (sévérité finale)

153 Findings, triés par axe puis par identifiant. Sévérité finale = sévérité Phase 3 (inchangée).

#### Axe UI (29 — 8 High / 21 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-UI-001 | High | `CommandDialog` (Cmd+K) sans `DialogTitle` |
| F-UI-002 | High | `TaskDetailModal` sans `DialogTitle` |
| F-UI-003 | High | `MobileSidebar` `SheetContent` sans `SheetTitle` |
| F-UI-004 | High | Boutons icônes sans `aria-label`/`sr-only` (≥ 35) |
| F-UI-005 | Medium | `DialogContent` bloque clic-extérieur/Escape globalement |
| F-UI-006 | Medium | Variant `link` mort ; tailles `h-/w-` contredisent `size="icon"` |
| F-UI-007 | High | Zoom désactivé (`maximumScale:1`, `userScalable:false`) |
| F-UI-008 | High | 6 pages plateforme sans `<h1>` |
| F-UI-009 | Medium | `AvatarImage` sans `alt` (39 sites) |
| F-UI-010 | High | Modales finance « DIY » sans rôle dialog/focus-trap |
| F-UI-011 | Medium | Inputs sans `<Label>` associé (49 % non liés) |
| F-UI-012 | Medium | Contrastes texte/fond sous 4.5:1 |
| F-UI-013 | Medium | Sauts de niveau dans la hiérarchie des titres |
| F-UI-014 | Medium | Absence de skip-link et nommage des landmarks |
| F-UI-015 | Medium | Top-bar mobile saturée `< 375px` |
| F-UI-016 | Medium | `TaskDetailModal` mobile : débordements horizontaux |
| F-UI-017 | Medium | `MobileSidebar` `w-[320px]` masque l'overlay ≤ 360 px |
| F-UI-018 | Medium | Barres de vues sans `flex-wrap` → débordement 320-360 px |
| F-UI-019 | Medium | Sidebar largeur inline `style` au lieu de Tailwind |
| F-UI-020 | Medium | Tokens `priority.*`/`status.*` déclarés mais inutilisés |
| F-UI-021 | Medium | Couleurs de marque en hex dans `email.ts` |
| F-UI-022 | Medium | Landing : 12 couleurs hex en dur hors tokens |
| F-UI-023 | Medium | Palette Tailwind brute au lieu de tokens sémantiques (≈250) |
| F-UI-024 | Medium | Couleurs de charts hex en dur (6 composants) |
| F-UI-025 | Medium | Échelles arbitraires Tailwind systémiques |
| F-UI-026 | High | Erreurs SWR ignorées sur 40 fetchers (68 %) |
| F-UI-027 | Medium | `data ?? []` confond loading et empty (13 sites) |
| F-UI-028 | Medium | Composants critiques sans skeleton/spinner (11+) |
| F-UI-029 | Medium | États empty/loading indistinguables (10 sites) |

#### Axe UX (17 — 4 High / 13 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-UX-001 | High | Suppression de tâche sans confirmation |
| F-UX-002 | High | Switch workspace laisse l'URL sur l'ancien |
| F-UX-003 | High | `callbackUrl` ignoré (login/register) |
| F-UX-004 | Medium | `window.confirm()` destructif (5 sites) |
| F-UX-005 | Medium | Mutations finance avalent les erreurs (7) |
| F-UX-006 | Medium | 7 suppressions de sous-entités sans confirmation/feedback |
| F-UX-007 | Medium | Autosave notes avale les échecs réseau |
| F-UX-008 | Medium | Aucun fallback global sur erreurs SWR |
| F-UX-009 | Medium | Absence de `global-error.tsx` racine |
| F-UX-010 | Medium | Granularité `not-found.tsx` / `(auth)/error.tsx` |
| F-UX-011 | Medium | Aucun fallback réseau Capacitor (SW désactivé) |
| F-UX-012 | Medium | `error.message` brut exposé à l'utilisateur |
| F-UX-013 | High | Lien cassé `/tasks/${id}` dans la recherche → 404 |
| F-UX-014 | Medium | Sidebar (10) vs MobileNav (5) divergents |
| F-UX-015 | Medium | Breadcrumbs vides sur 9/10 modules |
| F-UX-016 | Medium | Pas de handler BackButton Capacitor |
| F-UX-017 | Medium | Navigation par `router.push()` au lieu de `<Link>` |

#### Axe LOG (30 — 1 High / 29 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-LOG-001 | High | Arbre de travail non propre au démarrage de l'audit |
| F-LOG-002 | Medium | Composant client co-localisé dans un dossier de route |
| F-LOG-003 | Medium | Page `invite` client-side avec fetch dans `useEffect` |
| F-LOG-004 | Medium | `terms`/`privacy` hors route group, thème en dur |
| F-LOG-005 | Medium | Pas de `not-found.tsx` dans `(platform)` |
| F-LOG-006 | Medium | Aucun `loading.tsx` dans l'App Router |
| F-LOG-007 | Medium | `"use client"` injustifié (4 composants) |
| F-LOG-008 | Medium | Pages de vue `"use client"` pour `useParams` |
| F-LOG-009 | Medium | `dashboard/page.tsx` entièrement client |
| F-LOG-010 | Medium | Gestion d'erreur silencieuse (40/59 hooks SWR) |
| F-LOG-011 | Medium | Polling `useRunningTimer` 5 s permanent |
| F-LOG-012 | Medium | Clé SWR sans garde `null` (`useCustomFieldsSidebar`) |
| F-LOG-013 | Medium | Clé SWR non canonique (`useTimeEntries`) |
| F-LOG-014 | Medium | `revalidateOnFocus` non désactivé sur hooks à polling |
| F-LOG-015 | Medium | Couverture Zod minoritaire (~26 %) |
| F-LOG-016 | Medium | Module `finance/*` sans validation Zod (8 routes) |
| F-LOG-017 | Medium | Énumérés sans whitelist Zod |
| F-LOG-018 | Medium | Query strings non validées par Zod |
| F-LOG-019 | Medium | Schémas Zod non mutualisés côté client |
| F-LOG-020 | Medium | Deux routes sans `try/catch` |
| F-LOG-021 | Medium | P2002 : 400 vs 409 selon les modules |
| F-LOG-022 | Medium | 401 détourné pour PIN incorrect |
| F-LOG-023 | Medium | 3 variantes de message 500 |
| F-LOG-024 | Medium | Pattern try/catch+500 répété 170× |
| F-LOG-025 | Medium | `setWorkspaceId` synchronisé via `useEffect` |
| F-LOG-026 | Medium | État dérivé via `useEffect` (state from props) |
| F-LOG-027 | Medium | `useEffect` avec `exhaustive-deps` désactivé (Notes) |
| F-LOG-028 | Medium | `useEffect` qui devrait être SC/SWR (settings) |
| F-LOG-029 | Medium | `useEffect` écrit une clé `localStorage` jamais relue |
| F-LOG-030 | Medium | Dépendances `useEffect` instables |

#### Axe BDD (31 — 11 High / 20 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-BDD-001 | Medium | Modèle `BudgetAlert` mort |
| F-BDD-002 | Medium | Modèle `BudgetTemplate` mort |
| F-BDD-003 | Medium | `BudgetTransactionTag` peuplé mais non éditable/filtrable |
| F-BDD-004 | Medium | `source/targetBudgetId` FK mortes (transfert budget) |
| F-BDD-005 | High | `FinanceTransaction.targetAccountId` FK non contrainte |
| F-BDD-006 | High | `Favorite.targetId` polymorphe non contraint |
| F-BDD-007 | High | `Task.assigneeId` vs `TaskAssignee` (double vérité) |
| F-BDD-008 | Medium | `Task` : 7 champs filtrés/triés sans `@@index` |
| F-BDD-009 | Medium | Enfants de `Task` sans index sur FK parente |
| F-BDD-010 | Medium | `Notification` sans index (`userId`, `read`, …) |
| F-BDD-011 | Medium | `Reminder` sans index (cron + UI) |
| F-BDD-012 | Medium | `TimeEntry` sans index (timer en cours, rapports) |
| F-BDD-013 | Medium | `Space/Folder/List/Goal/...` : FK + `workspaceId` non indexés |
| F-BDD-014 | Medium | `WorkspaceMember` : ordre des colonnes `@@unique` non optimal |
| F-BDD-015 | Medium | `TaskDependency` : `dependencyTaskId` non couvert |
| F-BDD-016 | High | 4 relations `creator` sans `onDelete` (Restrict bloquant) |
| F-BDD-017 | Medium | Cascade `Status.tasks` risque de destruction |
| F-BDD-018 | Medium | Cascade `Folder → List` sans confirmation côté API |
| F-BDD-019 | High | Cascade Finance/Budget détruit l'historique comptable |
| F-BDD-020 | Medium | Cascade subtasks asymétrique avec `Activity` |
| F-BDD-021 | Medium | Asymétrie `assignee → SetNull` vs `TaskAssignee → Cascade` |
| F-BDD-022 | High | Aucune migration versionnée (schéma non reproductible) |
| F-BDD-023 | High | `buildCommand` sans `prisma migrate deploy` |
| F-BDD-024 | High | N+1 polymorphe sur `Favorite` |
| F-BDD-025 | High | Cron `budget-alerts` : `findMany` sans `take` + boucle |
| F-BDD-026 | High | Crons `daily-tasks`/`upcoming-deadlines` : scan + N+1 |
| F-BDD-027 | Medium | Cron `reminders` : `findFirst` notification en boucle |
| F-BDD-028 | Medium | `GET /api/spaces` : `include` profond cascadé |
| F-BDD-029 | High | `GET /api/budget` charge toutes les transactions |
| F-BDD-030 | Medium | Routes calendrier : `findMany` Task + `include` profond |
| F-BDD-031 | Medium | 18 endpoints à listing sans `take`/pagination |

#### Axe INF (13 — 2 High / 11 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-INF-001 | Medium | Crons sans `maxDuration`/`memory` |
| F-INF-002 | Medium | Aucune `regions` (désalignement Neon) |
| F-INF-003 | High | Crons ne vérifient pas `Authorization: Bearer` Vercel |
| F-INF-004 | Medium | Crons acceptent le secret en query string |
| F-INF-005 | Medium | Variables serveur requises absentes de `.env.example` |
| F-INF-006 | Medium | Variables de config non secrètes absentes de `.env.example` |
| F-INF-007 | Medium | `output: "standalone"` incohérent avec Vercel |
| F-INF-008 | Medium | `images.unoptimized` + `remotePatterns **` |
| F-INF-009 | Medium | `experimental` activé sans pin de version Next |
| F-INF-010 | Medium | Aucune observabilité tierce (`console.error` seul) |
| F-INF-011 | High | Cron `try/catch` global abandonne tout le batch |
| F-INF-012 | Medium | `catch` silencieux (avatar, Google Calendar) |
| F-INF-013 | Medium | Erreurs FCM/Web Push non-410 avalées |

#### Axe MOB (12 — 1 High / 11 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-MOB-001 | Medium | `*.ngrok-free.app` dans `allowNavigation` en prod |
| F-MOB-002 | Medium | `server.url` en dur, divergence `BUILD_APK.md` |
| F-MOB-003 | Medium | `webDir: "public"` incohérent avec Next.js |
| F-MOB-004 | High | `allowBackup="true"` expose le token mobile |
| F-MOB-005 | Medium | `FileProvider` orphelin, scope `path="."` |
| F-MOB-006 | Medium | `plugins.SplashScreen` sans plugin installé |
| F-MOB-007 | Medium | `google-services.json` non versionné/non ignoré |
| F-MOB-008 | Medium | Pas de désenregistrement FCM à la déconnexion |
| F-MOB-009 | Medium | `register-fcm` sans rate limit + réassignation token |
| F-MOB-010 | Medium | Purge tokens FCM périmés inopérante (`err.message`) |
| F-MOB-011 | Medium | Divergence secrets de signing `BUILD_APK.md`/`build.gradle` |
| F-MOB-012 | Medium | Keystores stockés dans l'arbre du dépôt |

#### Axe SEC (13 — 6 High / 7 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-SEC-001 | High | Finance : accès inter-workspace sans ownership |
| F-SEC-002 | High | Goals : accès inter-workspace sans ownership |
| F-SEC-003 | High | Tasks/Lists/reorder sans ownership |
| F-SEC-004 | High | Sous-ressources de tâche sans contrôle task→workspace |
| F-SEC-005 | High | Time Tracking : fuite globale inter-utilisateur |
| F-SEC-006 | High | Templates : accès inter-workspace sans ownership |
| F-SEC-007 | Medium | Push : vol de token FCM / désinscription tierce |
| F-SEC-008 | Medium | Rate limiting absent hors `/api/mobile-login` |
| F-SEC-009 | Medium | CSP `script-src` `'unsafe-inline'`/`'unsafe-eval'` |
| F-SEC-010 | Medium | Session JWT NextAuth sans durée/rotation/cookie durci |
| F-SEC-011 | Medium | JWT mobile 30 j sans révocation ; `mobile-me` sans relecture |
| F-SEC-012 | Medium | OAuth Google Calendar : `state` non signé |
| F-SEC-013 | Medium | Token feed calendrier en URL ; route test push |

#### Axe PRF (8 — 0 High / 8 Medium)

| ID | Sévérité finale | Titre (résumé) |
| --- | --- | --- |
| F-PRF-001 | Medium | `framer-motion` importé statiquement (32 modules) |
| F-PRF-002 | Medium | `recharts` importé statiquement (finance/budget) |
| F-PRF-003 | Medium | Primitives `Card`/`Badge`/`Skeleton` `"use client"` |
| F-PRF-004 | Medium | Frontière client au niveau page (22/24) |
| F-PRF-005 | Medium | Avatars servis sans optimisation ni conversion |
| F-PRF-006 | Medium | Recherche non-sargable `contains` (pas d'index trigramme) |
| F-PRF-007 | Medium | `finance/stats` waterfall + agrégation JS |
| F-PRF-008 | Medium | Cache SWR uniforme pour données de référence |

---

## Récapitulatif Phase 4

- **14.1** — 0 doublon exact, 0 fusion destructive ; 16 grappes à cause commune intra-axe marquées pour regroupement en tâches de remédiation.
- **14.2** — 8 groupes cross-axe (X1–X8) marqués pour fusion en tâches uniques (alimente 15.6, Property 6) ; 41 Findings concernés.
- **14.3** — 153 Findings consolidés ; sévérités Phase 3 confirmées ; Property 7 vérifiée (toutes les fuites cross-utilisateur/workspace sont High ; tous les N+1/scans sont ≥ Medium ; aucun cron totalement non authentifié). 3 cas-limites Medium documentés pour revue éventuelle.
- **14.4** — Tableau de synthèse sévérité × axe consigné dans `notes/synthese.md` ; somme vérifiée = 153 (Property 4).
