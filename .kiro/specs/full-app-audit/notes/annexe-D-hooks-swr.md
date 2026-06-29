# Annexe D — Inventaire des hooks SWR et fetchers SWR

## Objet

Cette note constitue l'**inventaire exhaustif des fetchers SWR** consommés par l'application Done. Elle est destinée à être incorporée telle quelle en **annexe D** de `audit-report.md` (cf. `design.md` > Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > D) et alimente la revue de l'axe LOG (`F-LOG-NNN`, tâche 7.3) ainsi que la revue de l'axe PRF (`F-PRF-NNN`, tâche 12.5). Elle satisfait l'exigence `requirements.md` 2.4 — vérification du contrôle `res.ok` dans chaque fetcher SWR — conformément aux CLAUDE_Rules consignées dans `notes/00-claude-rules.md`.

Mode strictement **lecture seule** : aucun fichier hors `.kiro/specs/full-app-audit/notes/` n'a été modifié pendant la production de cette annexe.

## Périmètre et méthode

- **Périmètre scanné** : `/Users/zerbib/clickup-clone/src/**` (hooks, providers, composants, pages App Router).
- **Symboles recherchés** : `useSWR`, `useSWRConfig`, `useSWRInfinite`, `useSWRMutation` (export par défaut et nommés depuis `swr`).
- **Outils utilisés** : recherches `grep_search` internes et la commande `grep -rn -E "useSWR\b|useSWRConfig|useSWRInfinite|useSWRMutation" /Users/zerbib/clickup-clone/src` (consignée en annexe A — tâche 3.2).
- **Hors périmètre** : `node_modules/`, `.next/`, `prisma/`, `android/`. Le hook `src/hooks/use-workspace.ts` ne fait que ré-exporter `useWorkspace` depuis `src/providers/workspace-provider.tsx` ; le fetcher SWR sous-jacent est inventorié à la ligne dédiée du provider.

### Légende des colonnes

| Colonne | Description |
| --- | --- |
| **#** | Numéro séquentiel de l'occurrence dans cette annexe. |
| **Localisation** | Chemin relatif depuis la racine du dépôt suivi du numéro de ligne du `useSWR(` (traçabilité Property 1). |
| **Hook / consommateur** | Nom du hook React custom OU, à défaut, nom du composant/page contenant l'appel et nom de la variable destructurée (`data: …`). |
| **Clé SWR** | Valeur ou pattern de la clé passée à `useSWR`. `null` indique une clé conditionnelle qui désactive l'appel. |
| **Fetcher** | `local` = fonction définie dans le fichier ; `provider` = fetcher global injecté via `SWRConfig` (cf. `src/lib/swr-config.tsx`). Précise le contrôle `res.ok` interne au fetcher. |
| **`res.ok` ?** | « oui » si une vérification `if (!res.ok) throw …` est présente sur le chemin du fetcher utilisé (local ou provider). « non » sinon. |
| **Gestion erreur explicite** | « oui » si `error` (ou équivalent) est destructuré et exposé/utilisé par le consommateur (UI d'erreur, `isError`, log). « non » si l'erreur est ignorée silencieusement (uniquement `data` consommée). |
| **Options non par défaut** | Options passées en 3ᵉ argument de `useSWR` qui surchargent les valeurs globales du `SWRProvider`. `—` si aucune. |

### Configuration globale du `SWRProvider`

Définie dans `src/lib/swr-config.tsx:34-44` et appliquée à tous les fetchers du périmètre :

| Option | Valeur globale |
| --- | --- |
| `fetcher` | Fonction module-level (`src/lib/swr-config.tsx:18-24`) qui ajoute un header `Authorization: Bearer <token>` si `cachedToken` est défini, puis vérifie `if (!res.ok) throw new Error("Failed to fetch")` avant de renvoyer `res.json()`. |
| `dedupingInterval` | `2000` (ms) |
| `refreshInterval` | `0` (pas de polling par défaut) |
| `revalidateOnFocus` | `true` |
| `revalidateOnReconnect` | `true` |
| `errorRetryCount` | `2` |

> Toute ligne du tableau dont la colonne **Fetcher** vaut « provider » hérite directement du contrôle `res.ok` du fetcher global ; le hook lui-même n'effectue donc pas de vérification locale.

## D.1 Inventaire des `useSWR` sous `src/hooks/`

| # | Localisation | Hook / consommateur | Clé SWR | Fetcher | `res.ok` ? | Gestion erreur explicite | Options non par défaut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `src/hooks/use-budget-categories.ts:14` | `useBudgetCategories` (`data` → `categories`) | `workspaceId ? "/api/budget/categories?workspaceId=${workspaceId}" : null` | local (vérifie `r.ok`, sinon `throw new Error("Failed to fetch")`) | oui | oui — `error` exposé via `isError: !!error` | — |
| 2 | `src/hooks/use-budget-stats.ts:13` | `useBudgetStats` (`data` → `stats`) | `budgetId ? "/api/budget/stats?budgetId=${budgetId}" : null` | local (`!r.ok` → throw) | oui | oui — `isError: !!error` | — |
| 3 | `src/hooks/use-budgets.ts:14` | `useBudgets` (`data` → `budgets`) | `workspaceId ? "/api/budget?workspaceId=${workspaceId}" : null` | local (`!r.ok` → throw) | oui | oui — `isError: !!error` | — |
| 4 | `src/hooks/use-budgets.ts:28` | `useBudget` (`data` → `budget`) | `budgetId ? "/api/budget/${budgetId}" : null` | local (`!r.ok` → throw) | oui | oui — `isError: !!error` | — |
| 5 | `src/hooks/use-custom-fields.ts:32` | `useCustomFieldsSidebar` (`data: fields`) | `` `/api/custom-fields?workspaceId=${workspaceId}` `` (toujours active, pas de garde) | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 6 | `src/hooks/use-custom-fields.ts:37` | `useCustomFieldsSidebar` (`data: values`) | `` `/api/tasks/${taskId}/custom-fields` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré ; échec d'écriture loggé via `console.error` au sein du `handleChange` | — |
| 7 | `src/hooks/use-dependencies.ts:17` | `useDependencyCount` (`data`) | `taskId ? "/api/tasks/${taskId}/dependencies" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 8 | `src/hooks/use-favorites.ts:27` | `useFavorites` (`data` → `favorites`) | `workspaceId ? "/api/favorites?workspaceId=${workspaceId}" : null` | local (`!res.ok` → throw) | oui | oui — `isError: !!error` | — |
| 9 | `src/hooks/use-finance.ts:32` | `useFinanceAccounts` (`data` → `accounts`) | `workspaceId ? "/api/finance/accounts?workspaceId=${workspaceId}" : null` | local module-level (`!r.ok` → parse JSON erreur puis `throw new Error(err.error \|\| HTTP <status>)`) | oui | oui — `error` propagé | — |
| 10 | `src/hooks/use-finance.ts:43` | `useFinanceCategories` (`data` → `categories`) | `workspaceId ? "/api/finance/categories?workspaceId=${workspaceId}${type ? '&type=...' : ''}" : null` | local module-level (idem #9) | oui | oui — `error` propagé | — |
| 11 | `src/hooks/use-finance.ts:52` | `useFinanceTransactions` (`data` → `transactions`) | `workspaceId ? "/api/finance/transactions?${params.toString()}" : null` (params = `workspaceId` + filtres dynamiques) | local module-level (idem #9) | oui | oui — `error` propagé | — |
| 12 | `src/hooks/use-finance.ts:57` | `useFinanceGoals` (`data` → `goals`) | `workspaceId ? "/api/finance/goals?workspaceId=${workspaceId}" : null` | local module-level (idem #9) | oui | oui — `error` propagé | — |
| 13 | `src/hooks/use-finance.ts:82` | `useFinanceStats` (`data` → `stats`) | `workspaceId ? "/api/finance/stats?workspaceId=${workspaceId}" : null` | local module-level (idem #9) | oui | oui — `error` propagé | — |
| 14 | `src/hooks/use-lists.ts:16` | `useLists` (`data` → `lists`) | `folderId ? "/api/lists?folderId=${folderId}" : (spaceId ? "/api/lists?spaceId=${spaceId}" : null)` | provider (aucun fetcher local passé en 2ᵉ argument ; héritage de `SWRProvider`) | oui (provider) | oui — `isError: !!error` | — |
| 15 | `src/hooks/use-notifications.ts:24` | `useNotifications` (`data` → `notifications`) | `"/api/notifications"` (chaîne fixe ; toujours active) | local (`!res.ok` → throw) | oui | oui — `isError: !!error` | `refreshInterval: 30000` (polling 30 s) |
| 16 | `src/hooks/use-reminders.ts:33` | `useReminders` (`data` → `reminders`) | `workspaceId ? "/api/reminders?${params.toString()}" : null` (params = `workspaceId` ± `upcoming=true`) | local (`!res.ok` → throw) | oui | oui — `isError: !!error` | `refreshInterval: 60000` (polling 60 s) |
| 17 | `src/hooks/use-spaces.ts:13` | `useSpaces` (`data` → `spaces`) | `workspaceId ? "/api/spaces?workspaceId=${workspaceId}" : null` | local (`!res.ok` → throw) | oui | oui — `isError: !!error` | — |
| 18 | `src/hooks/use-tasks.ts:26` | `useTasks` (`data` → `tasks`) | `listId ? "/api/tasks?${params.toString()}" : null` (params = `listId` + filtres dynamiques `statusId`, `priority`, `assigneeId`, `search`, `sortBy`, `sortOrder`) | provider (aucun fetcher local passé) | oui (provider) | oui — `isError: !!error` | — |
| 19 | `src/hooks/use-tasks.ts:39` | `useTask` (`data` → `task`) | `taskId ? "/api/tasks/${taskId}" : null` | provider (aucun fetcher local passé) | oui (provider) | oui — `isError: !!error` | — |
| 20 | `src/hooks/use-templates.ts:25` | `useTemplates` (`data` → `templates`) | `workspaceId ? "/api/templates?workspaceId=${workspaceId}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 21 | `src/hooks/use-time-entries.ts:17` | `useTimeEntries` (`data` → `entries`) | `` `/api/time-entries?${params.toString()}` `` (toujours active ; `params` peut être vide) | local (`!res.ok` → throw) | oui | oui — `isError: !!error` | — |
| 22 | `src/hooks/use-time-entries.ts:31` | `useRunningTimer` (`data` → `runningTimer`) | `"/api/time-entries/timer"` (chaîne fixe) | local (`!res.ok` → throw) | oui | oui — `isError: !!error` | `refreshInterval: 5000` (polling 5 s) |
| 23 | `src/hooks/use-time-entries.ts:159` | `useTimeReport` (`data` → `report`) | `` `/api/time-entries/report?${searchParams.toString()}` `` (toujours active ; params = `workspaceId`, `startDate`, `endDate`, `groupBy`) | local (`!res.ok` → throw) | oui | oui — `isError: !!error` | — |

## D.2 Inventaire des `useSWR` sous `src/providers/`

| # | Localisation | Hook / consommateur | Clé SWR | Fetcher | `res.ok` ? | Gestion erreur explicite | Options non par défaut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 24 | `src/providers/workspace-provider.tsx:53` | `WorkspaceProvider` (`data` → `workspaces`) | `status === "authenticated" ? "/api/workspaces" : null` | local (`!res.ok` → throw) | oui | non — `error` non destructuré ; seul `isLoading` est utilisé | — |

## D.3 Inventaire des `useSWR` sous `src/components/`

| # | Localisation | Hook / consommateur | Clé SWR | Fetcher | `res.ok` ? | Gestion erreur explicite | Options non par défaut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | `src/components/views/board-view.tsx:37` | `BoardView` (`data: statuses`) | `` `/api/lists/${listId}/statuses` `` | provider (aucun fetcher local) | oui (provider) | non — `error` non destructuré | — |
| 26 | `src/components/views/list-view.tsx:38` | `ListView` (`data: statuses`) | `` `/api/lists/${listId}/statuses` `` | provider (aucun fetcher local) | oui (provider) | non — `error` non destructuré | — |
| 27 | `src/components/task/task-row.tsx:40` | `TaskRowComponent` (`data: statuses`) | `` `/api/lists/${task.listId}/statuses` `` | provider (aucun fetcher local) | oui (provider) | non — `error` non destructuré | — |
| 28 | `src/components/task/task-dependencies.tsx:106` | `TaskDependencies` (`data`) | `` `/api/tasks/${taskId}/dependencies` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 29 | `src/components/task/task-dependencies.tsx:112` | `TaskDependencies` (`data: searchResults`) | `searchQuery.length >= 2 ? "/api/tasks?search=${encodeURIComponent(searchQuery)}&workspaceId=${workspaceId}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 30 | `src/components/task/status-badge.tsx:33` | `StatusBadge` (`data: statuses`) | `listId && onChange && open ? "/api/lists/${listId}/statuses" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 31 | `src/components/task/multi-assignee-selector.tsx:39` | `MultiAssigneeSelector` (`data: assignees`) | `` `/api/tasks/${taskId}/assignees` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 32 | `src/components/task/multi-assignee-selector.tsx:44` | `MultiAssigneeSelector` (`data: members`) | `workspaceId ? "/api/workspaces/${workspaceId}/members" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 33 | `src/components/task/subtask-list.tsx:46` | `SubtaskList` (`data: subtasks`) | `` `/api/tasks/${taskId}/subtasks` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | `fallbackData: initialSubtasks` (préchauffage avec props serveur) |
| 34 | `src/components/task/task-attachments.tsx:36` | `TaskAttachments` (`data: attachments`) | `` `/api/tasks/${taskId}/attachments` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 35 | `src/components/task/tag-selector.tsx:52` | `TagSelector` (`data: allTags`) | `open ? "/api/tags?workspaceId=${workspaceId}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 36 | `src/components/task/task-action-menu.tsx:82` | `TaskActionMenu` (`data: lists`) | `currentWorkspace ? "/api/workspaces/${currentWorkspace.id}/lists" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 37 | `src/components/task/task-recurrence.tsx:36` | `TaskRecurrence` (`data`) | `` `/api/tasks/${taskId}/recurrence` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 38 | `src/components/task/activity-feed.tsx:55` | `ActivityFeed` (`data: activities`) | `` `/api/tasks/${taskId}/activity` `` | local (`!r.ok` → throw) | oui | non — seul `isLoading` est destructuré ; `error` ignoré | — |
| 39 | `src/components/task/comment-list.tsx:21` | `CommentList` (`data: comments`) | `` `/api/tasks/${taskId}/comments` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 40 | `src/components/task/assignee-selector.tsx:41` | `AssigneeSelector` (`data: members`) | `open ? "/api/workspaces/${workspaceId}/members" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 41 | `src/components/list/status-manager.tsx:80` | `StatusManager` (`data: statuses`) | `open ? "/api/lists/${listId}/statuses" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré ; seul `isLoading` est utilisé | — |
| 42 | `src/components/workspace/team-list.tsx:89` | `TeamList` (`data: teams`) | `` `/api/workspaces/${workspaceId}/teams` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 43 | `src/components/workspace/team-list.tsx:94` | `TeamList` (`data: workspaceMembers`) | `` `/api/workspaces/${workspaceId}/members` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 44 | `src/components/workspace/invite-list.tsx:49` | `InviteList` (`data: invites`) | `` `/api/workspaces/${workspaceId}/invites` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 45 | `src/components/filters/assignee-filter.tsx:37` | `AssigneeFilter` (`data: members`) | `open ? "/api/workspaces/${workspaceId}/members" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 46 | `src/components/filters/status-filter.tsx:33` | `StatusFilter` (`data: statuses`) | `open ? "/api/lists/${listId}/statuses" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 47 | `src/components/custom-fields/custom-field-manager.tsx:66` | `CustomFieldManager` (`data: fields`) | `open ? "/api/custom-fields?workspaceId=${workspaceId}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 48 | `src/components/custom-fields/custom-fields-section.tsx:48` | `CustomFieldsSection` (`data: fields`) | `` `/api/custom-fields?workspaceId=${workspaceId}` `` (toujours active) | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 49 | `src/components/custom-fields/custom-fields-section.tsx:54` | `CustomFieldsSection` (`data: values`) | `` `/api/tasks/${taskId}/custom-fields` `` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |

## D.4 Inventaire des `useSWR` sous `src/app/`

| # | Localisation | Hook / consommateur | Clé SWR | Fetcher | `res.ok` ? | Gestion erreur explicite | Options non par défaut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 50 | `src/app/(platform)/dashboard/page.tsx:74` | `DashboardPage` (`data`) | `currentWorkspace ? "/api/dashboard/stats?workspaceId=${currentWorkspace.id}" : null` | local (`!r.ok` → throw) | oui | non — seul `isLoading` est destructuré ; `error` ignoré | `refreshInterval: 300000` (5 min), `dedupingInterval: 10000` (surcharge le 2 s global), `keepPreviousData: true` |
| 51 | `src/app/(platform)/my-tasks/page.tsx:54` | `MyTasksPage` (`data: tasks`) | `currentWorkspace ? "/api/my-tasks?workspaceId=${currentWorkspace.id}" : null` | local (`!r.ok` → throw) | oui | non — seul `isLoading` est destructuré ; `error` ignoré | `refreshInterval: 30000` (polling 30 s) |
| 52 | `src/app/(platform)/calendar/page.tsx:127` | `GlobalCalendarPage` (`data: tasks`) | `currentWorkspace ? "/api/tasks/calendar?workspaceId=${currentWorkspace.id}&start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 53 | `src/app/(platform)/calendar/page.tsx:134` | `GlobalCalendarPage` (`data: lists`) | `currentWorkspace ? "/api/workspaces/${currentWorkspace.id}/lists" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 54 | `src/app/(platform)/goals/page.tsx:53` | `GoalsPage` (`data: goals`) | `currentWorkspace ? "/api/goals?workspaceId=${currentWorkspace.id}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 55 | `src/app/(platform)/notes/page.tsx:56` | `NotesPage` (`data: notes`) | `currentWorkspace ? "/api/notes?workspaceId=${currentWorkspace.id}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré | — |
| 56 | `src/app/(platform)/workspace/page.tsx:40` | `WorkspaceListPage` (`data: workspaces`) | `"/api/workspaces"` (chaîne fixe ; toujours active) | local (`!r.ok` → throw) | oui | non — seul `isLoading` est destructuré | — |
| 57 | `src/app/(platform)/workspace/[workspaceId]/page.tsx:27` | `WorkspacePage` (`data: workspace`) | `` `/api/workspaces/${workspaceId}` `` (toujours active, pas de garde si `params.workspaceId` absent) | local (`!r.ok` → throw) | oui | non — seul `isLoading` est destructuré | — |
| 58 | `src/app/(platform)/workspace/[workspaceId]/space/[spaceId]/page.tsx:26` | `SpacePage` (`data: space`) | `` `/api/spaces/${spaceId}` `` (toujours active) | local (`!r.ok` → throw) | oui | non — seul `isLoading` est destructuré | — |
| 59 | `src/app/(platform)/workspace/[workspaceId]/settings/page.tsx:54` | `WorkspaceSettingsPage` (`data: workspace`) | `params.workspaceId ? "/api/workspaces/${params.workspaceId}" : null` | local (`!r.ok` → throw) | oui | non — `error` non destructuré ; seul `isLoading` est utilisé | — |

## D.5 Utilitaires `useSWRConfig` (mutations globales — non fetchers)

`useSWRConfig` n'effectue pas de récupération de données ; il est listé séparément pour traçabilité car il dérive du même module `swr` et participe à la stratégie de cache.

| # | Localisation | Consommateur | Usage |
| --- | --- | --- | --- |
| C1 | `src/providers/modal-provider.tsx:56` | `ModalProvider` | `mutate` global — invalidation après création/édition de tâche depuis le modal. |
| C2 | `src/components/budget/quick-add-transaction.tsx:70` | `QuickAddTransaction` | `mutate` global — invalidation des clés `/api/budget*` après ajout rapide. |
| C3 | `src/app/(platform)/budget/[budgetId]/page.tsx:29` | `BudgetDetailPage` | `mutate` global — invalidation ciblée de `/api/budget/${budgetId}` et `/api/budget/stats?budgetId=${budgetId}` après création de transaction. |
| C4 | `src/app/(platform)/dashboard/page.tsx:70` | `DashboardPage` | `mutate` global — invalidation de `/api/dashboard/stats?workspaceId=${currentWorkspace.id}` après création de tâche. |
| C5 | `src/app/(platform)/my-tasks/page.tsx:52` | `MyTasksPage` | `mutate` global — invalidation de `/api/my-tasks?workspaceId=${currentWorkspace.id}` après création de tâche. |

## Résumé de comptage

| Indicateur | Valeur | Détail |
| --- | --- | --- |
| Fichiers contenant au moins un `useSWR` | **45** | 14 dans `src/hooks/`, 1 dans `src/providers/`, 21 dans `src/components/`, 9 dans `src/app/` (cf. D.1–D.4). |
| **Total des appels `useSWR` (fetchers)** | **59** | D.1 = 23, D.2 = 1, D.3 = 25, D.4 = 10. Aucune occurrence de `useSWRInfinite` ni `useSWRMutation` dans le périmètre scanné. |
| Fetchers utilisant `res.ok` (oui) | **59 / 59** | 100 %. 53 appels via fetcher local et 6 via fetcher provider — le contrôle est présent dans les deux chemins (cf. configuration globale). |
| Fetchers sans `res.ok` (non) | **0 / 59** | Aucun fetcher SWR ne court-circuite la vérification ; conforme aux CLAUDE_Rules. |
| Fetchers exposant `error` au consommateur (gestion explicite) | **19 / 59** | D.1 #1, #2, #3, #4, #8, #9, #10, #11, #12, #13, #14, #15, #16, #17, #18, #19, #21, #22, #23. Aucun en D.2, D.3 ni D.4 (cf. ligne suivante). |
| Fetchers ignorant `error` (gestion implicite) | **40 / 59** | D.1 #5, #6, #7, #20 (4) ; D.2 #24 (1) ; D.3 #25–#49 (25) ; D.4 #50–#59 (10). Décompte vérifié : `4 + 1 + 25 + 10 = 40`, et `19 + 40 = 59` ✓. |
| Fetchers avec `refreshInterval` > 0 (polling) | **5** | #15 `useNotifications` (30 s) ; #16 `useReminders` (60 s) ; #22 `useRunningTimer` (5 s) ; #50 `DashboardPage` (300 s) ; #51 `MyTasksPage` (30 s). |
| Fetchers avec `dedupingInterval` non par défaut | **1** | #50 `DashboardPage` (10 s, surcharge le 2 s global). |
| Fetchers avec `keepPreviousData: true` | **1** | #50 `DashboardPage`. |
| Fetchers avec `fallbackData` | **1** | #33 `SubtaskList` (préchauffage avec les sous-tâches passées en props). |
| Utilitaires `useSWRConfig` (mutations) | **5** | C1–C5, non comptés dans les 59 fetchers. |
| Hooks utilisant le fetcher provider (sans fetcher local) | **6** | #14 `useLists`, #18 `useTasks`, #19 `useTask`, #25 `BoardView`, #26 `ListView`, #27 `TaskRowComponent`. |

> **Note sur la gestion d'erreur** : « gestion explicite » signifie que `error` est destructuré et exposé au consommateur sous une forme exploitable (`isError`, `error`, log conditionnel). Lorsque seul `isLoading` est destructuré (ou seules `data` et `mutate`), l'erreur côté UI est silencieusement traitée comme « pas de données » (`data === undefined`).

## Observations brutes pour la phase 3 (à instruire en tâches 7.3 et 12.5)

Ces observations sont consignées ici comme matériau d'enquête ; elles ne constituent pas encore des Findings au format normalisé. La conversion en `F-LOG-NNN` / `F-PRF-NNN` interviendra lors de la revue par axe (tâches 7.3 et 12.5).

- **Gestion d'erreur silencieuse majoritaire** : 40 fetchers sur 59 (≈ 68 %) ne destructurent pas `error`. Aucun feedback utilisateur n'est rendu en cas d'échec ; l'UI affiche au mieux un état de chargement infini ou un état vide trompeur. Concerne particulièrement les composants de la page de tâche (D.3 #28–#41, #44–#49) et les pages App Router (D.4 #52–#59).
- **Polling agressif sur `useRunningTimer`** : `src/hooks/use-time-entries.ts:31` rafraîchit `/api/time-entries/timer` toutes les 5 s tant que le composant est monté, même sans timer actif (la clé est constante `"/api/time-entries/timer"` sans condition). À recouper avec l'axe PRF (tâche 12.5) pour confirmation de l'opportunité.
- **Absence de `dedupingInterval` ajusté pour clés à fort taux de réutilisation** : la clé `/api/lists/${listId}/statuses` est consommée par #25, #26, #27, #30, #41, #46 (six emplacements distincts) avec le `dedupingInterval` global de 2 000 ms ; à instruire en tâche 12.5.
- **Clés SWR à signature dynamique potentiellement instable** : #18 `useTasks` construit `params.toString()` à partir d'un objet `filters` non normalisé (ordre des champs non fixé). Si l'ordre des entrées de `URLSearchParams` change entre rendus, la clé peut se fragmenter. À recouper en tâche 7.3.
- **Hooks à clé toujours active sans garde** : #5, #6 (`useCustomFieldsSidebar` requiert `workspaceId`/`taskId` non vides mais ne les vérifie pas) ; #21 `useTimeEntries` (clé toujours active même sans `taskId` → expose toutes les entrées de l'utilisateur courant). Impacts BDD/SEC à investiguer en tâches 7.3, 8.5, 11.2.
- **Surcharge `dedupingInterval` discrètement appliquée** : #50 `DashboardPage` passe `dedupingInterval: 10000` localement, ce qui contourne le 2 s global ; cohérent avec la nature « stats lourdes » mais à documenter.
- **Aucun hook ne désactive `revalidateOnFocus` ou `revalidateOnReconnect`** : tous les fetchers héritent du `true` global, ce qui maximise la fraîcheur mais peut provoquer des rafales sur reconnexion sur connexions mobiles instables — à recouper en tâche 12.5.

## Croisement avec Property 3 (couverture exhaustive)

L'inventaire ci-dessus liste **59 fetchers SWR** consommant **27 préfixes d'URL distincts** (déduits des clés ci-dessus). Pour la vérification finale (tâche 16.3), chaque préfixe d'URL devra apparaître soit comme conforme aux règles d'axe (cf. tâches 7.3 et 12.5), soit comme `evidence` d'un Finding. La liste consolidée des préfixes est :

`/api/budget`, `/api/budget/categories`, `/api/budget/stats`, `/api/budget/{id}`, `/api/custom-fields`, `/api/dashboard/stats`, `/api/favorites`, `/api/finance/accounts`, `/api/finance/categories`, `/api/finance/transactions`, `/api/finance/goals`, `/api/finance/stats`, `/api/goals`, `/api/lists`, `/api/lists/{listId}/statuses`, `/api/my-tasks`, `/api/notes`, `/api/notifications`, `/api/reminders`, `/api/spaces`, `/api/spaces/{id}`, `/api/tags`, `/api/tasks`, `/api/tasks/calendar`, `/api/tasks/{id}` (et sous-routes : `/assignees`, `/attachments`, `/activity`, `/comments`, `/custom-fields`, `/dependencies`, `/recurrence`, `/subtasks`), `/api/templates`, `/api/time-entries` (et `/timer`, `/report`), `/api/workspaces`, `/api/workspaces/{id}` (et sous-routes : `/invites`, `/lists`, `/members`, `/teams`).

Cette liste est à recouper avec l'inventaire des routes API (annexe C, tâche 3.1) pour valider la traçabilité bijective requise par Property 3.
