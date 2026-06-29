# Annexe B — Log du Build_Check (Phase 1)

## Objet

Cette note constitue l'**annexe B** de l'`audit-report.md` (cf. `design.md` > Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > B). Elle consigne intégralement la sortie du `Build_Check` non destructif exécuté en tâche 2.1 conformément à `requirements.md` (clause 2.6).

Conventions :

- **Non destructif** : la commande `npm run build` (= `next build`) n'écrit que dans `.next/` (gitignoré). Aucune modification du code applicatif, du schéma Prisma, des migrations ou de la base de données. Conforme aux CLAUDE_Rules et au mode lecture seule de l'audit (`requirements.md` clauses 1.1, 1.4).
- **Sortie complète** : la totalité de la stdout produite par `next build` est reproduite ci-dessous, sans troncature. Si une troncature avait été nécessaire, elle aurait été marquée explicitement `[tronqué]`.
- **Référence croisée** : une ligne correspondante a été ajoutée au journal des commandes (annexe A, `notes/annexe-A-commandes.md`).

## Métadonnées d'exécution

| Champ | Valeur |
| --- | --- |
| Commande | `npm run build` |
| Script résolu | `next build` (cf. `package.json` > `scripts.build`) |
| Répertoire de travail | `/Users/zerbib/clickup-clone` |
| Début (UTC) | `2026-05-29T03:01:44Z` |
| Fin (UTC) | `2026-05-29T03:02:03Z` |
| Durée | `19 s` |
| Exit code | `0` (succès) |
| stdout (octets) | `4711` |
| stderr (octets) | `0` |
| Baseline git | `HEAD = 8b920995eda6a2d274009d1b967b59c88d098e3d`, worktree non propre (cf. `notes/00-baseline.md`) |
| Effets disque | Écriture dans `.next/` uniquement (gitignoré). `git status --short` après build ne montre aucune nouvelle entrée par rapport au baseline tâche 1.1. |

## Résultat synthétique

- ✅ **Build réussi** — exit code `0`, aucune sortie stderr.
- ✅ **Compilation TypeScript** — terminée en `8.9 s` (« Finished TypeScript in 8.9s »).
- ✅ **Compilation Turbopack** — « Compiled successfully in 7.6s ».
- ✅ **Static page generation** — `77/77` pages générées en `292 ms` avec 15 workers.
- ⚠️ **Avertissements bloquants** : aucun.
- ⚠️ **Avertissements non bloquants détectés dans la sortie** : aucun warning explicite (mots-clés `warn`, `warning`, `error`, `failed` absents de la stdout). La seule mention « use with caution » concerne la déclaration des `experiments` Next.js (`optimizePackageImports`, `scrollRestoration`) ; il s'agit d'un message normal de Next, à noter pour les axes PRF/LOG mais pas bloquant.
- ℹ️ **Environnements chargés** : `.env.local`, `.env`. À recouper avec l'inventaire env (tâche 3.5) et l'axe SEC (variables exposées au client).

## Observations utiles pour les phases suivantes

| Observation | Implication | Axe(s) à recouper |
| --- | --- | --- |
| Next.js 16.2.6 utilise Turbopack pour le build (« Next.js 16.2.6 (Turbopack) »). | Comportement de bundling potentiellement distinct de Webpack — à confirmer pour les recommandations PRF (taille de bundle, tree-shaking). | PRF (12.1, 12.2), LOG |
| Les expérimentaux `optimizePackageImports` et `scrollRestoration` sont déclarés actifs. | À recouper avec `next.config.mjs` (déjà inventorié en tâche 1.3). | PRF (12.1), LOG |
| 77 routes générées au total, dont **94 routes API** sous `src/app/api/**` (préfixées `/api/`) listées dans la sortie ci-dessous, classées toutes en `ƒ` (server-rendered on demand). | Cet inventaire issu du build est **à croiser** avec l'inventaire formel des routes API à produire en tâche 3.1 (annexe C) et avec l'audit ownership/auth de la tâche 11.2. | LOG, SEC, INF |
| 4 routes cron détectées dans la sortie : `/api/cron/budget-alerts`, `/api/cron/daily-tasks`, `/api/cron/reminders`, `/api/cron/upcoming-deadlines`. | À croiser avec `vercel.json` (tâche 3.6, annexe D crons) et avec l'audit `CRON_SECRET` (tâche 9.2 / 11.x). | INF, SEC |
| Pages statiques effectives : `/_not-found`, `/login`, `/privacy`, `/register`, `/terms` (marquées `○` Static). Le reste est dynamique. | À recouper avec l'audit PRF (12.1) si l'on souhaite identifier des pages prerenderables additionnelles. | PRF, UX |
| Aucun warning TypeScript ni ESLint bloquant n'est remonté dans la stdout. | Pas de Finding `F-LOG-NNN` Severity_High lié au Build_Check au sens de `design.md` > Error Handling > Échec du Build_Check. | LOG |

> Note : ces observations sont consignées ici à titre de pointeurs croisés. Les Findings formels seront produits dans les notes par axe en phase 3.

## Stdout complète (intégrale, non tronquée)

```text

> clickup-clone@0.1.0 build
> next build

▲ Next.js 16.2.6 (Turbopack)
- Environments: .env.local, .env
- Experiments (use with caution):
  · optimizePackageImports
  ✓ scrollRestoration

  Creating an optimized production build ...
✓ Compiled successfully in 7.6s
  Running TypeScript ...
  Finished TypeScript in 8.9s ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers (0/77) ...
  Generating static pages using 15 workers (19/77) 
  Generating static pages using 15 workers (38/77) 
  Generating static pages using 15 workers (57/77) 
✓ Generating static pages using 15 workers (77/77) in 292ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/auth/register
├ ƒ /api/budget
├ ƒ /api/budget/[budgetId]
├ ƒ /api/budget/[budgetId]/transactions
├ ƒ /api/budget/categories
├ ƒ /api/budget/stats
├ ƒ /api/calendar/export
├ ƒ /api/calendar/feed/[token]
├ ƒ /api/calendar/google/auth
├ ƒ /api/calendar/google/callback
├ ƒ /api/calendar/google/clear
├ ƒ /api/calendar/google/disconnect
├ ƒ /api/calendar/google/sync
├ ƒ /api/calendar/token
├ ƒ /api/cron/budget-alerts
├ ƒ /api/cron/daily-tasks
├ ƒ /api/cron/reminders
├ ƒ /api/cron/upcoming-deadlines
├ ƒ /api/custom-fields
├ ƒ /api/custom-fields/[fieldId]
├ ƒ /api/dashboard/stats
├ ƒ /api/favorites
├ ƒ /api/finance/accounts
├ ƒ /api/finance/accounts/[accountId]
├ ƒ /api/finance/categories
├ ƒ /api/finance/categories/[categoryId]
├ ƒ /api/finance/goals
├ ƒ /api/finance/goals/[goalId]
├ ƒ /api/finance/goals/[goalId]/contribute
├ ƒ /api/finance/stats
├ ƒ /api/finance/transactions
├ ƒ /api/finance/transactions/[transactionId]
├ ƒ /api/folders
├ ƒ /api/folders/[folderId]
├ ƒ /api/goals
├ ƒ /api/goals/[goalId]
├ ƒ /api/goals/[goalId]/targets
├ ƒ /api/invites/[token]
├ ƒ /api/lists
├ ƒ /api/lists/[listId]
├ ƒ /api/lists/[listId]/statuses
├ ƒ /api/me
├ ƒ /api/me/notification-preferences
├ ƒ /api/mobile-login
├ ƒ /api/mobile-logout
├ ƒ /api/mobile-me
├ ƒ /api/my-tasks
├ ƒ /api/notes
├ ƒ /api/notes/[noteId]
├ ƒ /api/notifications
├ ƒ /api/notifications/mark-read
├ ƒ /api/push/register-fcm
├ ƒ /api/push/subscribe
├ ƒ /api/push/test
├ ƒ /api/push/unsubscribe
├ ƒ /api/push/vapid-public-key
├ ƒ /api/reminders
├ ƒ /api/search
├ ƒ /api/spaces
├ ƒ /api/spaces/[spaceId]
├ ƒ /api/tags
├ ƒ /api/tasks
├ ƒ /api/tasks/[taskId]
├ ƒ /api/tasks/[taskId]/activity
├ ƒ /api/tasks/[taskId]/assignees
├ ƒ /api/tasks/[taskId]/attachments
├ ƒ /api/tasks/[taskId]/checklists
├ ƒ /api/tasks/[taskId]/checklists/[checklistId]/items
├ ƒ /api/tasks/[taskId]/comments
├ ƒ /api/tasks/[taskId]/custom-fields
├ ƒ /api/tasks/[taskId]/dependencies
├ ƒ /api/tasks/[taskId]/duplicate
├ ƒ /api/tasks/[taskId]/recurrence
├ ƒ /api/tasks/[taskId]/subtasks
├ ƒ /api/tasks/[taskId]/tags
├ ƒ /api/tasks/[taskId]/verify-pin
├ ƒ /api/tasks/calendar
├ ƒ /api/tasks/reorder
├ ƒ /api/templates
├ ƒ /api/time-entries
├ ƒ /api/time-entries/[entryId]
├ ƒ /api/time-entries/report
├ ƒ /api/time-entries/timer
├ ƒ /api/user/avatar
├ ƒ /api/user/password
├ ƒ /api/user/profile
├ ƒ /api/workspaces
├ ƒ /api/workspaces/[workspaceId]
├ ƒ /api/workspaces/[workspaceId]/invites
├ ƒ /api/workspaces/[workspaceId]/invites/[inviteId]
├ ƒ /api/workspaces/[workspaceId]/lists
├ ƒ /api/workspaces/[workspaceId]/members
├ ƒ /api/workspaces/[workspaceId]/teams
├ ƒ /api/workspaces/[workspaceId]/teams/[teamId]
├ ƒ /api/workspaces/[workspaceId]/teams/[teamId]/members
├ ƒ /budget
├ ƒ /budget/[budgetId]
├ ƒ /calendar
├ ƒ /dashboard
├ ƒ /dashboard/calendar-settings
├ ƒ /finance
├ ƒ /goals
├ ƒ /invite/[token]
├ ○ /login
├ ƒ /my-tasks
├ ƒ /notes
├ ƒ /notifications
├ ○ /privacy
├ ○ /register
├ ƒ /reminders
├ ƒ /search
├ ƒ /settings
├ ƒ /task/[taskId]
├ ○ /terms
├ ƒ /time-tracking
├ ƒ /workspace
├ ƒ /workspace/[workspaceId]
├ ƒ /workspace/[workspaceId]/settings
├ ƒ /workspace/[workspaceId]/space/[spaceId]
├ ƒ /workspace/[workspaceId]/space/[spaceId]/list/[listId]
├ ƒ /workspace/[workspaceId]/space/[spaceId]/list/[listId]/board
├ ƒ /workspace/[workspaceId]/space/[spaceId]/list/[listId]/calendar
├ ƒ /workspace/[workspaceId]/space/[spaceId]/list/[listId]/gantt
└ ƒ /workspace/[workspaceId]/space/[spaceId]/list/[listId]/list-view


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand


```

## Stderr complète (intégrale)

```text
(vide)
```

## Vérification de non-régression vis-à-vis du mode lecture seule

- `git status --short` exécuté après le build retourne exactement les mêmes entrées que celles consignées au baseline (cf. `notes/annexe-A-commandes-1.1.md` et `notes/00-baseline.md`). Aucune nouvelle modification, suppression ou création de fichier sous `src/`, `prisma/` ou `android/` n'est apparue à la suite du build.
- L'unique répertoire écrit par `next build` est `.next/`, déjà gitignoré, conformément à la note de tâche 1.3 (`notes/00-stack.md` > §2).
- Aucune commande `prisma migrate`, `prisma db push`, `prisma generate` n'a été exécutée.
- Conclusion : la phase 1 est conforme aux clauses 1.1, 1.2, 1.4 de `requirements.md` et aux CLAUDE_Rules anti-destruction.

