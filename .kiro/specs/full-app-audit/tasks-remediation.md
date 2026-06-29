# Plan de tâches de remédiation — full-app-audit

> Plan dérivé de `audit-report.md` (153 Findings). Les tâches sont **regroupées par axe** dans l'ordre `SEC > BDD > INF > LOG > MOB > UX > UI > PRF` ; au sein de chaque axe, elles sont triées par **sévérité maximale décroissante** (High avant Medium) puis par **identifiant de Finding croissant** (Property 5). Chaque tâche référence **au moins un Finding** ; les Findings à cause commune sont fusionnés en une tâche unique (Property 6, Requirement 5.5).
>
> **Convention d'axe (Property 6)** : chaque tâche est rattachée à un **axe principal** (sa section, = cause racine / sévérité maximale) ; les tâches de chaque section forment un bloc contigu. Les tâches **transverses** référencent aussi des Findings d'axes secondaires, signalés explicitement par « (transverse : …) ».
>
> **Couverture bijective** : chaque Finding des 8 sections du rapport est référencé par exactement une tâche. Les 153 Findings sont couverts (vérification en fin de document).
>
> **Aucune tâche n'effectue d'action destructive.** Ce sont des consignes pour un workflow d'exécution ultérieur ; les opérations Postgres/migrations devront respecter le protocole anti-destruction de `CLAUDE.md` (sauvegarde + confirmation explicite).

## Axe SEC

- [ ] 1. Helper d'autorisation centralisé : auth NextAuth + ownership sur toutes les routes API
  - Findings : F-SEC-001, F-SEC-002, F-SEC-003, F-SEC-004, F-SEC-005, F-SEC-006
  - Sévérité maximale : High
  - Action : Créer un helper d'autorisation unique (sur le modèle de `checkWorkspaceAccess`/`checkBudgetAccess`) vérifiant (i) l'authentification, (ii) la membership `workspaceMember`, (iii) la remontée `ressource.id → workspaceId/userId` avant tout accès Prisma (lecture comme écriture). L'appliquer en première instruction de chaque route signalée : Finance, Goals, `tasks`/`lists` GET et `tasks/reorder`, sous-ressources `tasks/[taskId]/*` (via `assertTaskAccess`), Time Tracking (filtre par défaut `userId`, `workspaceId` obligatoire sur `report`), Templates. Retourner 403/404 sur échec. Priorité absolue (fuites/corruptions inter-workspace).

- [ ] 2. Sécuriser le token d'authentification mobile (stockage, durée, CSP)
  - Findings : F-MOB-004, F-SEC-009, F-SEC-011 (transverse : MOB)
  - Sévérité maximale : High
  - Action : Migrer le `mobile_auth_token` de Capacitor Preferences vers Android Keystore/EncryptedSharedPreferences ; poser `android:allowBackup="false"` ou exclure `CapacitorStorage.xml` via `dataExtractionRules`/`backup_rules` ; raccourcir la durée du JWT mobile et ajouter une révocation (refresh token ou `tokenVersion`) ; durcir la CSP (nonces, retrait de `'unsafe-inline'`/`'unsafe-eval'`) pour limiter le vol par XSS ; faire relire la base par `GET /api/mobile-me`.

- [ ] 3. Durcir le sous-système Push / cycle de vie du token FCM
  - Findings : F-SEC-007, F-MOB-008, F-MOB-009, F-MOB-010 (transverse : MOB)
  - Sévérité maximale : Medium
  - Action : Scoper toute opération token/endpoint par utilisateur authentifié (ne réassigner un `fcmToken` qu'avec preuve de possession, ou clé d'unicité `(userId, fcmToken)`) ; exiger `getCurrentUser` sur `unsubscribe` ; ajouter `checkRateLimit` sur `register-fcm` ; exposer une route de désenregistrement appelée au logout (+ `PushNotifications.unregister()`) ; corriger la purge des tokens périmés (`err.code` au lieu de `err.message`) et ajouter `updatedAt`/purge périodique.

- [ ] 4. Étendre le rate limiting Upstash aux routes sensibles
  - Findings : F-SEC-008
  - Sévérité maximale : Medium
  - Action : Câbler `checkRateLimit` sur `auth/register`, le login NextAuth credentials, `PATCH /api/user/password`, l'envoi d'invitations (Resend) et les routes push ; limiteur par identifiant composite (IP + e-mail) ; confirmer en console Vercel que les variables Upstash sont définies en production.

- [ ] 5. Durcir la session NextAuth (durée, rotation, cookies)
  - Findings : F-SEC-010
  - Sévérité maximale : Medium
  - Action : Déclarer explicitement `session: { strategy, maxAge, updateAge }` et un bloc `cookies` durci (préfixe `__Host-`, `sameSite`, `secure`, `httpOnly`) ; envisager `strategy: "database"` (cohérent avec le `PrismaAdapter`) pour permettre une révocation serveur.

- [ ] 6. Sécuriser le flux OAuth Google Calendar (`state` signé)
  - Findings : F-SEC-012
  - Sévérité maximale : Medium
  - Action : Générer un `state` aléatoire opaque, le stocker côté serveur (cookie signé / table à TTL) lié à la session initiatrice, et le vérifier au callback avant tout `upsert` ; déduire le `userId` de la session vérifiée, non du `state`.

- [ ] 7. Protéger le token de feed calendrier et retirer la route de test push
  - Findings : F-SEC-013
  - Sévérité maximale : Medium
  - Action : Remplacer `Cache-Control: public` par `private, no-store` sur le feed iCal et prévoir une rotation/révocation du token ; retirer `POST /api/push/test` du build de production (ou la conditionner à `NODE_ENV !== "production"`).

## Axe BDD

- [ ] 8. Matérialiser et contraindre les FK logiques non contraintes
  - Findings : F-BDD-004, F-BDD-005, F-BDD-006
  - Sévérité maximale : High
  - Action : Matérialiser `@relation` Prisma pour `FinanceTransaction.targetAccountId` (`onDelete: SetNull`, contrainte `CHECK account_id <> target_account_id`) et `Favorite.targetId` (4 FK exclusives `taskId`/`listId`/`spaceId`/`folderId` + `CHECK num_nonnulls = 1`, `onDelete: Cascade`, ou 4 tables séparées) ; finaliser ou supprimer `BudgetTransaction.source/targetBudgetId`. Vérifier l'ownership avant INSERT.

- [ ] 9. Unifier le mécanisme d'assignation des tâches (source de vérité unique)
  - Findings : F-BDD-007, F-BDD-021
  - Sévérité maximale : High
  - Action : Choisir une source unique (recommandé : migrer tout vers `TaskAssignee`, retirer `Task.assigneeId`) ; script de migration des valeurs existantes ; adapter routes de création/édition/duplication, filtres `where.assigneeId → assignees.some`, types et UI ; aligner les comportements `onDelete` des deux côtés.

- [ ] 10. Revoir les cascades `onDelete` (intégrité, RGPD, archivage financier)
  - Findings : F-BDD-016, F-BDD-017, F-BDD-018, F-BDD-019, F-BDD-020
  - Sévérité maximale : High
  - Action : Expliciter `onDelete` sur les 4 relations `creator` (recommandé `SetNull`, `creatorId` nullable) pour débloquer la suppression de compte (RGPD) et le re-seed ; passer `Task.status` en `Restrict` (garde au niveau base) ; pour Finance/Budget, passer en `Restrict` + archivage (`isArchived`) ou conserver `Cascade` avec `_count` + confirmation `?confirm=true` (harmoniser avec `FinanceGoal`) ; check récursif des sous-tâches verrouillées avant suppression du parent. (Lien : confirmations destructives côté UX, tâche 35.)

- [ ] 11. Instaurer un historique de migrations Prisma versionnées
  - Findings : F-BDD-022, F-BDD-023
  - Sévérité maximale : High
  - Action : Baseline `prisma migrate diff --from-empty --to-schema-datamodel` → `prisma/migrations/0_init/` versionné + `migrate resolve --applied` ; ajouter `prisma migrate deploy` au `buildCommand` Vercel ; configurer `DATABASE_URL` par environnement (Neon Branches pour les previews) ; documenter la politique `migrate dev` dans `CLAUDE.md` ; test CI de dérive schéma↔migrations. Respecter le protocole anti-destruction (sauvegarde Neon préalable).

- [ ] 12. Optimiser les requêtes BDD lourdes (N+1, scans, over-fetch, recherche)
  - Findings : F-BDD-024, F-BDD-028, F-BDD-029, F-BDD-030, F-BDD-031, F-PRF-006, F-PRF-007 (transverse : PRF)
  - Sévérité maximale : High
  - Action : Batcher les favoris polymorphes (`findMany WHERE id IN`) ; remplacer les `include` profonds par des `select` ciblés (`/api/spaces`, calendrier) ; remplacer `include: { transactions }` par `_count` + `groupBy({ _sum })` (`/api/budget`, `/api/budget/stats`, `/api/finance/stats` paralléllisé) ; pagination systématique (`take` + cursor) sur les 18 listings ; index GIN trigramme (`pg_trgm`) pour la recherche `contains`.

- [ ] 13. Standardiser et fiabiliser les handlers cron (auth, robustesse, requêtes)
  - Findings : F-BDD-025, F-BDD-026, F-BDD-027, F-INF-001, F-INF-003, F-INF-004, F-INF-011 (transverse : INF)
  - Sévérité maximale : High
  - Action : Vérifier le header standard `Authorization: Bearer <CRON_SECRET>` et retirer le secret en query string ; déclarer `maxDuration`/`memory` ; isoler chaque itération par un `try/catch` interne (log contextuel + `continue`) ; remplacer les `findFirst` de déduplication par un `findMany` batch unique (`WHERE IN`) indexé par `Set` côté code ; borner les `findMany` par `take:`. Confirmer le statut HTTP réel des crons en console Vercel.

- [ ] 14. Nettoyer ou activer les modèles Budget non utilisés
  - Findings : F-BDD-001, F-BDD-002, F-BDD-003
  - Sévérité maximale : Medium
  - Action : Trancher pour `BudgetAlert`, `BudgetTemplate` et `BudgetTransactionTag` : soit activer (CRUD + lecture dans le cron + UI), soit supprimer (modèle + types + migration de drop). Compléter le CRUD des tags (édition/filtrage) ou les remplacer par un champ scalaire `String[]`.

- [ ] 15. Ajouter les index manquants sur le schéma Prisma
  - Findings : F-BDD-008, F-BDD-009, F-BDD-010, F-BDD-011, F-BDD-012, F-BDD-013, F-BDD-014, F-BDD-015
  - Sévérité maximale : Medium
  - Action : Ajouter les `@@index` recommandés (`Task` : `[listId, parentId]`, `[assigneeId, dueDate]`, `[dueDate]`, `[statusId]`, `[parentId]`, `[listId, statusId, position]` ; enfants de `Task` : `[taskId]`/`[checklistId]` ; `Notification` : `[userId, createdAt]`, `[userId, read]`, `[userId, type, createdAt]` ; `Reminder`, `TimeEntry`, `Space/Folder/List/Goal/TaskTemplate/CustomField`, `WorkspaceMember [userId]`, `TaskDependency [dependencyTaskId]`). Valider par `EXPLAIN ANALYZE`. Dépend de la tâche 11 (migrations).

## Axe INF

- [ ] 16. Aligner la région Vercel sur l'instance Neon
  - Findings : F-INF-002
  - Sévérité maximale : Medium
  - Action : Récupérer la région Neon (console, lecture seule) et déclarer `regions: ["<region>"]` alignée dans `vercel.json` ; documenter le choix.

- [ ] 17. Compléter `.env.example`
  - Findings : F-INF-005, F-INF-006
  - Sévérité maximale : Medium
  - Action : Ajouter les 7 variables serveur requises et les 3 variables de config non secrètes (noms + commentaires, sans valeurs), regroupées par section ; aligner avec la config Vercel réelle ; `console.warn` au démarrage en production si une variable critique est absente.

- [ ] 18. Assainir `next.config.mjs`
  - Findings : F-INF-007, F-INF-008, F-INF-009
  - Sévérité maximale : Medium
  - Action : Retirer `output: "standalone"` si Vercel est l'unique cible ; supprimer `remotePatterns` si `unoptimized: true` reste, ou retirer `unoptimized` et restreindre `remotePatterns` aux hôtes réels ; documenter/justifier les drapeaux `experimental` et vérifier la sortie de build aux upgrades.

- [ ] 19. Mettre en place l'observabilité et la journalisation
  - Findings : F-INF-010, F-INF-012, F-INF-013
  - Sévérité maximale : Medium
  - Action : Installer un APM (Sentry via `instrumentation.ts`) ou un drain de logs ; ajouter un `global-error.tsx` ; remplacer les `catch { }` silencieux (avatar, Google Calendar) par un log contextuel (code structuré `googleapis`) ; logger systématiquement les erreurs FCM/Web Push avant de filtrer le cas GONE et protéger le `delete` imbriqué.

## Axe LOG

- [ ] 20. Figer la baseline d'audit (arbre de travail propre)
  - Findings : F-LOG-001
  - Sévérité maximale : High
  - Action : Demander à l'utilisateur de commiter/stasher les 57 fichiers modifiés ou de désigner explicitement la baseline auditée ; consigner cette baseline ; relancer la vérification de propreté avant toute exécution de remédiation. (Tâche méthodologique, préalable.)

- [ ] 21. Surfaçage unifié des erreurs et états asynchrones SWR
  - Findings : F-LOG-010, F-UI-026, F-UI-027, F-UI-028, F-UI-029, F-UX-005, F-UX-007, F-UX-008 (transverse : UI, UX)
  - Sévérité maximale : High
  - Action : Créer un composant/hook partagé `<SWRErrorFallback error={error} onRetry={mutate} />` et un `onError` global dans `SWRConfig` ; destructurer `error` sur les 40 fetchers ; distinguer explicitement loading/empty/error (skeletons, EmptyState) ; brancher des toasts d'erreur sur les mutations finance et l'autosave des notes.

- [ ] 22. Assainir la structure App Router (route groups, `not-found`, `loading`)
  - Findings : F-LOG-002, F-LOG-003, F-LOG-004, F-LOG-005, F-LOG-006
  - Sévérité maximale : Medium
  - Action : Déplacer les composants client hors des dossiers de route ; convertir la page `invite` en Server Component ; créer un route group `(static)` pour `terms`/`privacy` ; ajouter `not-found.tsx` dans `(platform)` et des `loading.tsx`.

- [ ] 23. Rééquilibrer la frontière Server/Client Components
  - Findings : F-LOG-007, F-LOG-008, F-LOG-009, F-PRF-003, F-PRF-004 (transverse : PRF)
  - Sévérité maximale : Medium
  - Action : Retirer `"use client"` des composants/primitives purs (`category-badge`, `budget-alert`, `budget-skeleton`, `list-view-custom-fields`, et `card`/`badge`/`skeleton`) ; convertir les pages de vue et le dashboard en Server Components orchestrateurs recevant `params` + îlots client ; mesurer le bundle avant/après.

- [ ] 24. Discipliner le cache et le polling SWR
  - Findings : F-LOG-011, F-LOG-012, F-LOG-013, F-LOG-014, F-PRF-008 (transverse : PRF)
  - Sévérité maximale : Medium
  - Action : Conditionner le polling `useRunningTimer` à un timer actif ; ajouter des gardes `null` sur les clés ; canoniser la clé `useTimeEntries` ; `revalidateOnFocus: false` sur les hooks à `refreshInterval` ; gabarits SWR par classe de donnée (volatile vs référence).

- [ ] 25. Généraliser la validation Zod (entrées API et formulaires)
  - Findings : F-LOG-015, F-LOG-016, F-LOG-017, F-LOG-018, F-LOG-019
  - Sévérité maximale : Medium
  - Action : Standard projet `src/lib/validations/<module>.ts` + `safeParse` avant Prisma (priorité finance/goals/templates/time-entries/push) ; whitelists `z.enum` exportées ; helper `parseSearchParams` avec `z.coerce` ; adopter `react-hook-form` + `zodResolver` pour réutiliser les schémas côté client.

- [ ] 26. Normaliser la gestion d'erreur des routes API
  - Findings : F-LOG-020, F-LOG-021, F-LOG-022, F-LOG-023, F-LOG-024
  - Sévérité maximale : Medium
  - Action : Extraire un wrapper `withApiHandler` (try/catch + log préfixé + 500 JSON + `code` machine-readable) ; ajouter le try/catch manquant aux 2 routes ; mapper P2002→409/P2025→404/P2003→400 ; `403` au lieu de `401` pour le PIN ; reclasser `"Missing config"` en 503 ; libellé 500 unifié.

- [ ] 27. Assainir les `useEffect`
  - Findings : F-LOG-025, F-LOG-026, F-LOG-027, F-LOG-028, F-LOG-029, F-LOG-030
  - Sévérité maximale : Medium
  - Action : Centraliser la synchro `setWorkspaceId` ; remplacer les patterns « state from props » par `key`/calcul direct/`useMemo` ; supprimer l'`eslint-disable` Notes via un sous-composant `key` ; remplacer les `fetch` dans `useEffect` par SWR/Server Components ; supprimer l'écriture `localStorage["runningTimer"]` morte ; stabiliser les dépendances (`searchParams`, refresh protégé).

## Axe MOB

- [ ] 28. Durcir la configuration Capacitor dev/prod
  - Findings : F-MOB-001, F-MOB-002, F-MOB-003
  - Sévérité maximale : Medium
  - Action : Retirer `*.ngrok-free.app` du build prod ; câbler `process.env.CAPACITOR_SERVER_URL` ; trancher la stratégie `webDir` (export statique `out` ou wrapper WebView assumé) ; hook pre-commit interdisant `localhost`/`ngrok` ; aligner `BUILD_APK.md`.

- [ ] 29. Supprimer ou restreindre le `FileProvider` orphelin
  - Findings : F-MOB-005
  - Sévérité maximale : Medium
  - Action : Supprimer le `<provider>` et `file_paths.xml` si aucun partage de fichier n'est planifié, sinon restreindre le scope à un sous-dossier dédié (au lieu de `path="."`).

- [ ] 30. Résoudre le bloc `SplashScreen` orphelin
  - Findings : F-MOB-006
  - Sévérité maximale : Medium
  - Action : Installer `@capacitor/splash-screen` + `cap sync` si un splash Capacitor est voulu, sinon supprimer le bloc `plugins.SplashScreen` et documenter le splash natif Android ; test CI d'alignement plugins déclarés/enregistrés/configurés.

- [ ] 31. Clarifier la gestion de `google-services.json`
  - Findings : F-MOB-007
  - Sévérité maximale : Medium
  - Action : Trancher : versionner le fichier (clé restreinte) pour un build reproductible, ou l'ignorer activement + fournir un `.example` et une procédure documentée ; vérification pré-build avec message clair si absent.

- [ ] 32. Hygiène des secrets de signing Android
  - Findings : F-MOB-011, F-MOB-012
  - Sévérité maximale : Medium
  - Action : Faire lire à `build.gradle` les propriétés Gradle puis l'environnement (`findProperty ?: getenv`) ; `throw GradleException` si signing incomplet en release ; déplacer les keystores hors du dépôt + règle `.gitignore` dédiée par chemin ; clarifier la clé canonique et son nom ; aligner `BUILD_APK.md`/`.env.example`.

## Axe UX

- [ ] 33. Confirmation systématique des actions destructives
  - Findings : F-UX-001, F-UX-004, F-UX-006
  - Sévérité maximale : High
  - Action : Envelopper toutes les suppressions (tâche, sous-entités, finance) dans un `<AlertDialog>` décrivant l'irréversibilité et les cascades (réutiliser le pattern `budget-card.tsx`) ; remplacer les `window.confirm()` ; ajouter toasts succès/erreur et `await mutate()` ; envisager soft-delete + undo. (Lien : cascades BDD, tâche 10 ; modales DIY finance, tâche 40.)

- [ ] 34. Réparer les parcours critiques d'authentification et de navigation
  - Findings : F-UX-002, F-UX-003, F-UX-013
  - Sévérité maximale : High
  - Action : Naviguer (ou dériver `currentWorkspace` de l'URL) au changement de workspace ; lire et valider `callbackUrl` dans login/register et le propager depuis `requireAuth` ; corriger le lien de recherche `/tasks/${id}` → `/task/${id}` (helper d'URL centralisé).

- [ ] 35. Compléter les frontières d'erreur et pages d'erreur
  - Findings : F-UX-009, F-UX-010, F-UX-012
  - Sévérité maximale : Medium
  - Action : Ajouter `global-error.tsx` racine et `not-found.tsx`/frontière d'erreur dans `(platform)`/`(auth)` ; mapper les erreurs vers des messages FR maîtrisés (ne pas exposer `error.message` brut).

- [ ] 36. Robustesse mobile Capacitor (fallback réseau, bouton retour)
  - Findings : F-UX-011, F-UX-016
  - Sévérité maximale : Medium
  - Action : Fournir une page de fallback réseau (ou SW minimal) avec bouton « Réessayer » ; enregistrer un handler `App.addListener('backButton')` gérant l'historique et la fermeture des modales avant de quitter.

- [ ] 37. Cohérence de navigation
  - Findings : F-UX-014, F-UX-015, F-UX-017
  - Sévérité maximale : Medium
  - Action : Unifier le modèle de navigation desktop/mobile (items + menu « Plus ») ; alimenter les breadcrumbs sur tous les modules ou les retirer des écrans non concernés ; remplacer les navigations par clic par `<Link>`.

## Axe UI

- [ ] 38. Accessibilité des dialogues (titres Radix + modales DIY)
  - Findings : F-UI-001, F-UI-002, F-UI-003, F-UI-010
  - Sévérité maximale : High
  - Action : Ajouter un `DialogTitle`/`SheetTitle` (masquable via `VisuallyHidden`) à `CommandDialog`, `TaskDetailModal`, `MobileSidebar` ; refondre les 3 modales DIY de finance avec le wrapper Radix `Dialog` (rôle, focus-trap, `Escape`, restauration du focus).

- [ ] 39. Accessibilité globale (zoom, labels, titres, landmarks)
  - Findings : F-UI-004, F-UI-007, F-UI-008, F-UI-009, F-UI-011, F-UI-013, F-UI-014
  - Sévérité maximale : High
  - Action : Réactiver le zoom (retirer `maximumScale`/`userScalable`) ; `aria-label`/`sr-only` sur les ≥ 35 boutons icônes ; `<h1>` sur les 6 pages sans titre ; `alt` sur les 39 `<AvatarImage>` ; associer `<Label>`/`htmlFor`/`id` ; corriger la hiérarchie des titres ; skip-link + `aria-label` sur les landmarks + `aria-current`. Ajouter les règles ESLint `jsx-a11y`.

- [ ] 40. Comportement des Dialog et système de variants Button
  - Findings : F-UI-005, F-UI-006
  - Sévérité maximale : Medium
  - Action : Ajouter une prop `dismissable` (ou documenter) pour la fermeture clic-extérieur des `Dialog` ; ajouter des tailles `icon-sm`/`icon-xs` (cibles ≥ 44 px) et migrer les surcharges `h-/w-` ; supprimer ou justifier le variant `link`.

- [ ] 41. Contraste et design tokens
  - Findings : F-UI-012, F-UI-020, F-UI-021, F-UI-022, F-UI-023, F-UI-024, F-UI-025
  - Sévérité maximale : Medium
  - Action : Définir un token sémantique `--text-tertiary` (≥ 4.5:1) et remplacer les opacités/couleurs brutes ; migrer vers les tokens sémantiques shadcn/ui ; centraliser les couleurs de marque/charts ; aligner sur l'échelle Tailwind ; activer/supprimer les tokens `priority.*`/`status.*`.

- [ ] 42. Responsive (top-bar, modale tâche, sidebar, barres de vues)
  - Findings : F-UI-015, F-UI-016, F-UI-017, F-UI-018, F-UI-019
  - Sévérité maximale : Medium
  - Action : Masquer/compresser les actions de top-bar `< sm` + `flex-wrap`/`overflow-x-hidden` ; corriger `!w-screen`/`overflow`/padding de `TaskDetailModal` ; `w-[min(320px,85vw)]` pour `MobileSidebar` ; `flex-wrap` sur les barres calendrier ; largeur de sidebar en Tailwind. Tester sur 320/360/375 px.

## Axe PRF

- [ ] 43. Code-splitting des librairies lourdes
  - Findings : F-PRF-001, F-PRF-002
  - Sévérité maximale : Medium
  - Action : Adopter `LazyMotion`/`m` (et/ou `next/dynamic`) pour `framer-motion` ; charger les graphiques `recharts` via `next/dynamic` (`ssr: false` + skeleton) ; mesurer avec `@next/bundle-analyzer`.

- [ ] 44. Optimisation des images (avatars)
  - Findings : F-PRF-005
  - Sévérité maximale : Medium
  - Action : Redimensionner/compresser les avatars à l'upload (`sharp` → WebP ~128 px) et/ou activer `next/image` (`unoptimized: false`) avec dimensions explicites.

---

## Vérification de la traçabilité (Property 6)

- **44 tâches**, chacune référençant au moins un Finding.
- **153 Findings** référencés, chacun par exactement une tâche (partition complète) :
  - SEC (13) : tâches 1, 2, 3, 4, 5, 6, 7.
  - BDD (31) : tâches 8, 9, 10, 11, 12, 13, 14, 15.
  - INF (13) : tâches 13 (001/003/004/011), 16, 17, 18, 19.
  - LOG (30) : tâches 20, 21, 22, 23, 24, 25, 26, 27.
  - MOB (12) : tâches 2 (004), 3 (008/009/010), 28, 29, 30, 31, 32.
  - UX (17) : tâches 21 (005/007/008), 33, 34, 35, 36, 37.
  - UI (29) : tâches 21 (026/027/028/029), 38, 39, 40, 41, 42.
  - PRF (8) : tâches 12 (006/007), 23 (003/004), 24 (008), 43, 44.
- **Tâches transverses** (référençant plusieurs axes) : 2 (MOB+SEC), 3 (SEC+MOB), 12 (BDD+PRF), 13 (BDD+INF), 21 (LOG+UI+UX), 23 (LOG+PRF), 24 (LOG+PRF). Chaque tâche est rattachée à un axe principal (sa section) ; les tâches d'une même section forment un bloc contigu.
- **Tri (Property 5)** : dans chaque section, High avant Medium, puis identifiant de Finding croissant.
- **Aucune tâche destructive** : toutes sont des consignes de remédiation pour un workflow ultérieur respectant le protocole anti-destruction de `CLAUDE.md`.
