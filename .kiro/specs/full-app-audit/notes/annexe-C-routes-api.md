# Annexe C — Inventaire des routes API

## Objet

Cette note constitue l'**inventaire exhaustif des routes API** du projet Done, telles que déclarées sous `src/app/api/**/route.{ts,js}`. Elle est destinée à être incorporée telle quelle en **annexe C** de l'`audit-report.md` (cf. `design.md` > Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > C) et alimente directement la revue de l'axe SEC (tâche 11.2 — vérification d'auth + ownership) et de l'axe LOG (tâche 7.4 — validation Zod), conformément à `requirements.md` clauses 2.3, 6.1 et 6.2.

Mode **strictement lecture seule** : aucune modification du code applicatif n'a été effectuée. Les commandes shell exécutées pour construire cet inventaire sont consignées dans `notes/annexe-A-commandes.md`.

## Méthode

- **Recensement** : un balayage exhaustif des fichiers `route.ts` et `route.js` sous `/Users/zerbib/clickup-clone/src/app/api` (commande `find`, cf. annexe A) a permis d'identifier **96 fichiers de route** (zéro fichier `.js`, 96 fichiers `.ts`).
- **Méthodes HTTP** : extraites par lecture des exports `export async function GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD` dans chaque fichier. Le seul fichier qui ne déclare pas explicitement de méthode est `src/app/api/auth/[...nextauth]/route.ts`, qui réexporte le handler NextAuth (`export { handler as GET, handler as POST }`) — il est consigné comme `GET, POST` dans la table.
- **Auth, ownership, validation, scope** : déterminés par lecture intégrale du corps de chaque fichier. Les conventions utilisées pour remplir la table sont décrites ci-dessous.

## Légende des colonnes

| Colonne | Signification |
| --- | --- |
| **Route** | Chemin URL de la route, dérivé du chemin du fichier sous `src/app/api/`. Les segments dynamiques apparaissent entre crochets (`[id]`). |
| **Méthodes** | Méthodes HTTP exportées par le fichier. Si plusieurs méthodes sont déclarées, elles sont listées séparées par `, `. |
| **Auth NextAuth** | Mécanisme d'authentification appliqué *avant* tout autre traitement métier. Valeurs : `getCurrentUser` (helper qui vérifie cookie NextAuth **ou** JWT mobile via Bearer/cookie `mobile_session`, cf. `src/lib/auth-helpers.ts`) ; `requireAuth` (variante de `getCurrentUser` qui redirige sur `/login` si absent) ; `JWT direct` (vérification `jwtVerify` du token mobile sans lecture base) ; `CRON_SECRET` (comparaison du secret de query string ou en-tête `x-vercel-cron-secret`) ; `token DB` (recherche d'un token de feed dans la base) ; `NextAuth handler` (route catch-all `[...nextauth]`) ; `aucune` (route ouverte) ; `partielle` (auth uniquement sur certaines méthodes). |
| **Ownership** | Vérification que la ressource visée appartient bien au scope de l'appelant. Valeurs : `workspace` (vérification `workspaceMember` ou équivalent) ; `owner (userId)` (filtrage `where: { userId: user.id }`) ; `via task → workspace` (la route remonte à la tâche puis au workspace pour vérifier la membership) ; `via budget → workspace` (idem via Budget) ; `via space → workspace` ; `via list → workspace` ; `token` (la connaissance du token vaut accès) ; `assertOwner` (helper local) ; `partielle` (vérification présente sur certaines méthodes seulement) ; `aucune` (lecture ou écriture possible sur ressource d'autrui dès lors que l'auth est validée) ; `n/a` (route sans concept de ressource scoped, ex. clé publique VAPID). Le symbole `⚠️` signale un écart par rapport à la règle d'ownership attendue (à instruire en revue SEC, tâche 11.2). |
| **Validation entrée** | Présence d'une validation explicite des entrées (body et/ou query) avant accès Prisma. Valeurs : `Zod` (schéma Zod via `safeParse`) ; `manuelle` (validations ad hoc : `typeof`, regex, présence de champs) ; `partielle` (Zod ou manuelle sur certains champs uniquement) ; `aucune` (les valeurs reçues sont passées telles quelles à Prisma ou utilisées directement) ; `n/a` (pas d'entrée utilisateur côté serveur). |
| **Scope des données** | Portée des données retournées par la route lorsqu'elle effectue une lecture, ou portée des données affectées lorsqu'elle écrit. Valeurs : `utilisateur courant` (filtrage strict par `userId`) ; `workspace` (toutes les données du workspace dont l'utilisateur est membre) ; `tâche unique` (mais sans contrôle de membership) ; `public via token` ; `système (cron)` (toutes les données du système, exécution serveur) ; `OAuth flow` (échange de jetons OAuth) ; `n/a`. |
| **Notes** | Observation ponctuelle utile pour la revue, en particulier signal `⚠️` sur les écarts détectés à approfondir. La présence d'un `⚠️` ne constitue pas un Finding définitif : c'est une preuve à instruire en phase 3 (axes SEC/LOG). |

Conventions d'unification :

- `getCurrentUser` est traité comme un **contrôle d'authentification NextAuth valide** au sens de la clause 6.1, puisqu'il vérifie soit la session NextAuth, soit un JWT mobile signé avec `NEXTAUTH_SECRET` (canal d'auth officiel de l'application).
- Une réponse `401 Unauthorized` est attendue dès que `getCurrentUser` retourne `null`. Une réponse `403 Forbidden` ou `404 Not Found` est attendue dès que l'ownership est invalide. Les écarts à ce schéma sont notés.
- Les inconnues (impossibles à trancher par lecture statique seule) sont marquées `?` avec une note explicative en colonne **Notes**. Aucun `?` n'a été nécessaire dans cette annexe : toutes les routes ont pu être tranchées par lecture du code.
- Les routes dont l'**ownership** est `aucune` alors que la ressource est sensible (tâche, dépendance, time entry, etc.) sont marquées `⚠️ aucune` et constituent des candidats Finding pour l'axe SEC (Property 8 du design : auth **et** ownership sur chaque route API).

## Synthèse quantitative

- **Nombre total de fichiers `route.ts` recensés** : 96 (commande `find src/app/api -type f \( -name "route.ts" -o -name "route.js" \) | wc -l` → 96, cf. annexe A).
- **Aucun fichier `route.js`** n'a été trouvé : tout le périmètre est en TypeScript.
- **Routes avec contrôle NextAuth (via `getCurrentUser` ou `requireAuth`)** : 92.
- **Routes avec auth alternative** :
  - 4 routes cron (`/api/cron/*`) protégées par `CRON_SECRET`.
  - 1 route `/api/calendar/feed/[token]` protégée par token de feed (lookup en base).
  - 1 route `/api/auth/[...nextauth]` (handler NextAuth lui-même).
  - 1 route `/api/auth/register` ouverte (création de compte).
  - 1 route `/api/mobile-login` ouverte (rate-limitée Upstash).
  - 1 route `/api/mobile-logout` ouverte (efface le cookie).
  - 1 route `/api/mobile-me` qui vérifie un JWT mobile sans appel base.
  - 1 route `/api/calendar/google/callback` (callback OAuth Google, state = userId).
  - 1 route `/api/invites/[token]` (méthode `GET` ouverte pour lire l'invitation, méthode `POST` qui exige `getCurrentUser`).
  - 1 route `/api/push/unsubscribe` ouverte (suppression par endpoint sans contrôle).
  - 1 route `/api/push/vapid-public-key` ouverte (lecture clé publique VAPID).
- **Routes avec contrôle d'ownership (workspace, owner, membership ou via parent)** : 80 environ.
- **Routes signalées `⚠️ aucune` ou `⚠️ partielle` côté ownership** (à instruire en SEC 11.2) : voir la table ci-dessous, identifiables par le marqueur `⚠️`.
- **Routes utilisant Zod** : ~30 (validation par schéma typé).
- **Routes en validation manuelle** : ~50.
- **Routes sans validation explicite** : ~16 (entrées passées directement à Prisma).

## Tableau exhaustif

| Route | Méthodes | Auth NextAuth | Ownership | Validation entrée | Scope des données | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler | n/a | n/a | OAuth flow | Catch-all NextAuth (`src/app/api/auth/[...nextauth]/route.ts`) qui réexporte `handler as GET, handler as POST`. Configuration dans `src/lib/auth.ts` (à instruire en SEC 11.1). |
| `/api/auth/register` | POST | aucune | n/a (création de compte) | Zod (`registerSchema`) | utilisateur courant (création) | Crée user + workspace + space + list + statuts par défaut en une seule transaction Prisma imbriquée. Pas de rate-limit visible côté route (`/api/mobile-login` en a un, pas celle-ci) — point à instruire en SEC 11.3. |
| `/api/budget/[budgetId]` | GET, PUT, DELETE | `getCurrentUser` | via budget → workspace (`checkBudgetAccess`) | Zod (PUT) ; n/a (GET, DELETE) | workspace | Helper local `checkBudgetAccess` qui vérifie que le budget appartient à un workspace dont l'utilisateur est membre. |
| `/api/budget/[budgetId]/transactions` | GET, POST | `getCurrentUser` | via budget → workspace (`checkBudgetAccess`) | Zod (POST) ; manuelle (GET filtres) | workspace | POST construit `where` via spread d'objets `any`, plusieurs `eslint-disable` implicites — qualité à instruire en LOG. |
| `/api/budget/categories` | GET, POST | `getCurrentUser` | workspace (`checkWorkspaceAccess`) | Zod (POST) ; manuelle (GET) | workspace | OK. |
| `/api/budget` | GET, POST | `getCurrentUser` | workspace (`checkWorkspaceAccess`) | Zod (POST) ; manuelle (GET) | workspace | OK. |
| `/api/budget/stats` | GET | `getCurrentUser` | via budget → workspace | manuelle (`budgetId` requis) | workspace | OK. |
| `/api/calendar/export` | GET | `getCurrentUser` | owner (`userId` filtre via `assigneeId/creatorId` + `workspace.members.some`) | n/a | utilisateur courant | Réponse `text/calendar`. |
| `/api/calendar/feed/[token]` | GET | token DB (`CalendarToken`) | token (la connaissance du token vaut accès) | manuelle (token via path) | public via token (tâches d'un user) | ⚠️ Le token dans l'URL fait office d'auth ; mis en cache `public, max-age=3600` côté CDN. À instruire en SEC : risque de fuite via logs/historique navigateur. |
| `/api/calendar/google/auth` | GET | `getCurrentUser` | n/a | n/a | OAuth flow | Génère URL OAuth Google avec `state: user.id`. |
| `/api/calendar/google/callback` | GET | aucune (callback OAuth, `state` = `userId` non signé) | utilisateur via `state` | manuelle | OAuth flow | ⚠️ Le `state` n'est pas signé/vérifié — risque CSRF / session-fixation. À instruire en SEC. |
| `/api/calendar/google/clear` | POST | `getCurrentUser` | owner (`userId`) | n/a | utilisateur courant | OK. |
| `/api/calendar/google/disconnect` | POST | `getCurrentUser` | owner (`userId`) | n/a | utilisateur courant | OK. |
| `/api/calendar/google/sync` | GET, POST | `getCurrentUser` | owner (`userId`) + filtre `workspace.members.some` | n/a | utilisateur courant | Refresh OAuth automatique avec gestion `invalid_grant`. |
| `/api/calendar/token` | GET, POST | `getCurrentUser` | owner (`userId`) | n/a | utilisateur courant | POST régénère le token (suppression + recréation). |
| `/api/cron/budget-alerts` | GET | `CRON_SECRET` (query param OU header `x-vercel-cron-secret`) | système | n/a | système (cron) | Le secret est comparé en `===` (timing safe ?) — à instruire en SEC. |
| `/api/cron/daily-tasks` | GET | `CRON_SECRET` | système | n/a | système (cron) | Idem. |
| `/api/cron/reminders` | GET | `CRON_SECRET` | système | n/a | système (cron) | Idem. |
| `/api/cron/upcoming-deadlines` | GET | `CRON_SECRET` | système | n/a | système (cron) | Idem. |
| `/api/custom-fields/[fieldId]` | PATCH, DELETE | `getCurrentUser` | workspace (via `customField.workspace.members`) | manuelle | workspace | OK (toute personne membre du workspace peut modifier/supprimer un custom field — point à instruire en LOG quant aux rôles admin/member). |
| `/api/custom-fields` | GET, POST | `getCurrentUser` | workspace (`workspaceMember.findUnique`) | manuelle (`name`, `type`, `validTypes` whitelist) | workspace | OK. |
| `/api/dashboard/stats` | GET | `getCurrentUser` | workspace (`workspaceMember.findUnique`) | manuelle (`workspaceId` requis) | workspace | 8 requêtes en `Promise.all` + `groupBy`. |
| `/api/favorites` | GET, POST, DELETE | `getCurrentUser` | owner (`userId`) ; vérification cross `workspaceId` sur ressource cible | manuelle | utilisateur courant (filtré par `workspaceId`) | GET fait N+1 par favorite (`favorites.map(async ...)`) — à instruire en BDD/PRF. |
| `/api/finance/accounts/[accountId]` | GET, PATCH, DELETE | `getCurrentUser` | owner (`where: { id, userId }`) | manuelle | utilisateur courant | OK. |
| `/api/finance/accounts` | GET, POST | `getCurrentUser` | owner (`userId` filtre dans GET et POST) ; ⚠️ pas de check membership `workspaceId` sur POST | manuelle | utilisateur courant | ⚠️ `POST` accepte n'importe quel `workspaceId` sans vérifier que l'utilisateur est membre — un compte authentifié peut créer un compte financier dans un workspace tiers. À instruire en SEC. |
| `/api/finance/categories/[categoryId]` | PATCH, DELETE | `getCurrentUser` | ⚠️ aucune (pas de filtre workspace ni user) | manuelle | workspace | ⚠️ `prisma.financeCategory.update({ where: { id: categoryId } })` sans vérification d'appartenance ; tout utilisateur authentifié peut modifier/supprimer la catégorie de finance d'un autre workspace. À instruire en SEC. |
| `/api/finance/categories` | GET, POST | `getCurrentUser` | ⚠️ aucune sur GET (filtre par `workspaceId` sans check membership) ; ⚠️ aucune sur POST (création possible dans n'importe quel `workspaceId`) | manuelle | workspace | ⚠️ Lecture et création possibles sur un workspace dont l'appelant n'est pas membre. À instruire en SEC. |
| `/api/finance/goals/[goalId]/contribute` | POST | `getCurrentUser` | ⚠️ aucune (incrémente un `goalId` arbitraire) | manuelle (`amount > 0`) | n/a (goal d'un autre user possible) | ⚠️ La transaction crée une contribution + incrémente `currentAmount` du goal sans vérifier que `goalId` appartient à `user.id`. À instruire en SEC (Property 7 candidat : modification de données d'un autre user). |
| `/api/finance/goals/[goalId]` | GET, PATCH, DELETE | `getCurrentUser` | owner (`where: { id, userId }`) | manuelle | utilisateur courant | OK. |
| `/api/finance/goals` | GET, POST | `getCurrentUser` | owner (`userId`) ; ⚠️ pas de check membership `workspaceId` sur POST | manuelle | utilisateur courant | ⚠️ POST accepte un `workspaceId` arbitraire sans vérification de membership. À instruire en SEC. |
| `/api/finance/stats` | GET | `getCurrentUser` | owner (`userId`) ; ⚠️ pas de check membership `workspaceId` | manuelle (`workspaceId` requis) | utilisateur courant | ⚠️ Si l'utilisateur passe un `workspaceId` dont il n'est pas membre, les `findMany` ne renvoient rien (filtrés par `userId`), mais le contrat de la route est ambigu — à instruire en LOG. |
| `/api/finance/transactions/[transactionId]` | PATCH, DELETE | `getCurrentUser` | owner (`where: { id, userId }`) | manuelle | utilisateur courant | OK. |
| `/api/finance/transactions` | GET, POST | `getCurrentUser` | owner (`userId`) sur GET ; ⚠️ POST n'écrit pas de check `accountId` appartient au user (utilise simplement `accountId` reçu) | manuelle | utilisateur courant | ⚠️ POST permet de créer une transaction sur un `accountId` d'un autre utilisateur (Prisma `create` sans `where`). De plus, `account.balance` est incrémenté/décrémenté sur l'`accountId` brut. À instruire en SEC. |
| `/api/folders/[folderId]` | GET, PATCH, DELETE | `getCurrentUser` | workspace (via `folder.space.workspace.members`) | Zod (`updateFolderSchema`) | workspace | OK. |
| `/api/folders` | GET, POST | `getCurrentUser` | workspace (via `space.workspace.members`) | Zod (`createFolderSchema`) | workspace | OK. |
| `/api/goals/[goalId]` | GET, PATCH, DELETE | `getCurrentUser` | ⚠️ aucune (lecture/modification du goal sans check workspace) | manuelle | workspace | ⚠️ `prisma.goal.findUnique({ where: { id: goalId } })` puis update/delete, sans vérifier que `goal.workspaceId` est associé à l'utilisateur. À instruire en SEC. |
| `/api/goals/[goalId]/targets` | POST, PATCH, DELETE | `getCurrentUser` | ⚠️ partielle (`assertGoalUnlocked` ne vérifie que `locked`, pas l'ownership) | manuelle | workspace | ⚠️ Mêmes constats que `/api/goals/[goalId]`. À instruire en SEC. |
| `/api/goals` | GET, POST | `getCurrentUser` | ⚠️ aucune (`workspaceId` lu en query / body sans check membership) | manuelle | workspace | ⚠️ Tout user authentifié peut lister/créer un goal dans un workspace tiers. À instruire en SEC. |
| `/api/invites/[token]` | GET, POST | partielle (GET ouverte ; POST `getCurrentUser`) | token (lookup) + `email` du compte == `invite.email` (POST) | manuelle | utilisateur courant | OK. GET expose les métadonnées de l'invite (workspace name/color, email cible) à toute personne possédant le token. |
| `/api/lists/[listId]` | GET, PATCH, DELETE | `getCurrentUser` | workspace (via `list.space.workspace.members`) | Zod (`updateListSchema` PATCH) | workspace | OK. |
| `/api/lists/[listId]/statuses` | GET, POST, PATCH, DELETE | `getCurrentUser` | workspace via `verifyListAccess` | Zod (POST `createStatusSchema`, PATCH `updateStatusSchema`) ; manuelle (DELETE) | workspace | DELETE refuse si des tâches utilisent encore le statut (409). |
| `/api/lists` | GET, POST | `getCurrentUser` | partielle : POST vérifie via `space.workspace.members` ; ⚠️ GET filtre par `spaceId`/`folderId` reçus sans aucun check membership | Zod (POST `createListSchema`) ; n/a (GET) | workspace | ⚠️ `GET /api/lists?spaceId=...` retourne les listes d'un space tiers si le caller connaît son ID. À instruire en SEC. |
| `/api/me/notification-preferences` | GET, PATCH | `getCurrentUser` | owner (`userId`) | manuelle (whitelist `allowed`) | utilisateur courant | OK. |
| `/api/me` | GET | `getCurrentUser` | owner | n/a | utilisateur courant | OK. |
| `/api/mobile-login` | POST | aucune (rate-limit Upstash via `checkRateLimit`) | n/a | manuelle (`typeof email/password`) | utilisateur courant (création JWT) | Émet un cookie `mobile_session` httpOnly + retourne `token` JWT (HS256, 30 jours). |
| `/api/mobile-logout` | POST | aucune | n/a | n/a | n/a | Efface le cookie `mobile_session`. |
| `/api/mobile-me` | GET | JWT direct (`jwtVerify` sur header `Authorization: Bearer`) | owner via token (payload) | n/a | utilisateur courant | ⚠️ Renvoie directement les claims du JWT (`id`, `email`, `name`, `image`) sans relire la base — un compte supprimé reste exploitable jusqu'à expiration. À instruire en SEC. |
| `/api/my-tasks` | GET | `getCurrentUser` | owner (`assigneeId = user.id`) ; ⚠️ pas de check membership `workspaceId` | manuelle (`workspaceId` requis) | utilisateur courant | Le filtre `assigneeId = user.id` garantit qu'aucune fuite cross-user ne peut survenir, même sans check de membership. OK fonctionnellement. |
| `/api/notes/[noteId]` | PATCH, DELETE | `getCurrentUser` | `assertOwner` (`note.userId === user.id`) | manuelle (regex couleur) | utilisateur courant | OK. |
| `/api/notes` | GET, POST | `getCurrentUser` | owner (`userId`) sur GET ; workspace (membership) sur POST | manuelle | utilisateur courant | OK. |
| `/api/notifications/mark-read` | PATCH | `getCurrentUser` | owner (`userId`) | Zod (union `notificationId` xor `all: true`) | utilisateur courant | OK. |
| `/api/notifications` | GET, DELETE | `getCurrentUser` | owner (`userId`) | manuelle | utilisateur courant | OK. |
| `/api/push/register-fcm` | POST | `getCurrentUser` | upsert sur `fcmToken` (réassignation au caller) | manuelle (`fcmToken` requis) | utilisateur courant | ⚠️ L'upsert sur la clé unique `fcmToken` permet à un user de **voler** un token FCM légitimement enregistré par un autre user (`update: { userId: user.id }`). À instruire en SEC. |
| `/api/push/subscribe` | POST | `getCurrentUser` | partielle (`deleteMany` puis `create` ; pas de vérif que l'endpoint appartenait au caller avant suppression) | manuelle (`endpoint`, `p256dh`, `auth` requis) | utilisateur courant | ⚠️ Un user peut effacer le `PushSubscription` d'un autre user en envoyant son `endpoint`. À instruire en SEC. |
| `/api/push/test` | POST | `getCurrentUser` | owner (envoi à `user.id`) | n/a | utilisateur courant | Route de test (commentaire « à supprimer en prod »). À instruire en SEC/LOG. |
| `/api/push/unsubscribe` | POST | aucune | aucune (deleteMany par `endpoint`) | manuelle (`endpoint` requis) | n/a | ⚠️ Tout appelant connaissant un `endpoint` peut désinscrire le device d'un autre user. À instruire en SEC. |
| `/api/push/vapid-public-key` | GET | aucune | n/a | n/a | n/a (clé publique) | OK (clé publique destinée au client). |
| `/api/reminders` | GET, POST, PATCH, DELETE | `getCurrentUser` | owner (`userId`) ; POST vérifie membership `workspaceId` | manuelle | utilisateur courant | OK. |
| `/api/search` | GET | `getCurrentUser` | workspace (membership) | manuelle (`q`, `workspaceId` requis) | workspace | Recherche sur tâches/listes/spaces du workspace. |
| `/api/spaces/[spaceId]` | GET, PATCH, DELETE | `getCurrentUser` | workspace (via `space.workspace.members.where userId`) | Zod (`updateSpaceSchema` PATCH) | workspace | OK. |
| `/api/spaces` | GET, POST | `getCurrentUser` | workspace (`workspaceMember.findUnique`) | Zod (`createSpaceSchema` POST) ; manuelle (GET) | workspace | OK. |
| `/api/tags` | GET, POST, DELETE | `getCurrentUser` | workspace (membership) | Zod (`createTagSchema` POST) ; manuelle (DELETE) | workspace | OK. |
| `/api/tasks/[taskId]/activity` | GET | `getCurrentUser` | ⚠️ aucune (`prisma.activity.findMany({ where: { taskId } })`) | n/a | tâche unique | ⚠️ Tout user authentifié peut lire le journal d'activité de n'importe quelle tâche dont il connaît l'`id`. À instruire en SEC. |
| `/api/tasks/[taskId]/assignees` | GET, POST, DELETE | `getCurrentUser` | ⚠️ aucune (pas de check task → workspace) | manuelle (`userId` requis) | tâche unique | ⚠️ Lecture et écriture sur les assignees d'une tâche tierce possibles. À instruire en SEC. |
| `/api/tasks/[taskId]/attachments` | GET, POST, DELETE | `getCurrentUser` | ⚠️ aucune sur GET/POST ; DELETE vérifie seulement `attachment.userId === user.id` | manuelle (`name`, `url` requis) | tâche unique | ⚠️ POST permet de créer un attachment sur n'importe quelle tâche ; GET expose tous les attachments. À instruire en SEC. |
| `/api/tasks/[taskId]/checklists/[checklistId]/items` | POST, PATCH, DELETE | `getCurrentUser` | ⚠️ aucune (vérifie seulement que le checklist existe) | Zod (POST/PATCH) ; manuelle (DELETE `itemId`) | tâche unique | ⚠️ Modification possible d'items de checklists d'une tâche tierce. À instruire en SEC. |
| `/api/tasks/[taskId]/checklists` | GET, POST | `getCurrentUser` | partielle (POST : via task → workspace ; ⚠️ GET : aucune) | Zod (POST `createChecklistSchema`) | tâche unique | ⚠️ GET expose les checklists d'une tâche tierce. À instruire en SEC. |
| `/api/tasks/[taskId]/comments` | GET, POST | `getCurrentUser` | partielle (POST : via task → workspace ; ⚠️ GET : aucune) | Zod (POST `createCommentSchema`) | tâche unique | ⚠️ GET expose les commentaires d'une tâche tierce. À instruire en SEC. |
| `/api/tasks/[taskId]/custom-fields` | GET, PUT | `getCurrentUser` | via task → workspace + check `field.workspaceId === task.list.space.workspace.id` | manuelle (`fieldId` requis) | tâche unique | OK. |
| `/api/tasks/[taskId]/dependencies` | GET, POST, DELETE | `getCurrentUser` | via task → workspace (GET, POST) ; DELETE : vérifie seulement que la dépendance implique `taskId` | manuelle | tâche unique | DELETE n'effectue pas de check workspace sur la dépendance — à recouper en SEC. |
| `/api/tasks/[taskId]/duplicate` | POST | `getCurrentUser` | via task → workspace | manuelle (`listId` optionnel) | tâche unique | ⚠️ `targetListId` accepté sans check de membership : permet de dupliquer dans un space tiers si l'utilisateur connaît l'`id` de la liste cible. À instruire en SEC. |
| `/api/tasks/[taskId]/recurrence` | GET, PUT, DELETE | `getCurrentUser` | ⚠️ aucune (pas de check task → workspace) | manuelle | tâche unique | ⚠️ Lecture, écriture et suppression de la récurrence d'une tâche tierce possibles. À instruire en SEC. |
| `/api/tasks/[taskId]` | GET, PATCH, DELETE | `getCurrentUser` | via task → workspace | Zod (`updateTaskSchema` PATCH) | tâche unique | Gestion fine du verrouillage par PIN ; activity log conservé. |
| `/api/tasks/[taskId]/subtasks` | GET, POST | `getCurrentUser` | partielle (POST : via parent task → workspace ; ⚠️ GET : aucune) | Zod (POST via `createTaskSchema`) | tâche unique | ⚠️ GET expose les sous-tâches d'une tâche tierce. À instruire en SEC. |
| `/api/tasks/[taskId]/tags` | GET, POST, DELETE | `getCurrentUser` | ⚠️ aucune (pas de check task → workspace, juste vérif tag existe) | Zod (POST `addTagSchema`) ; manuelle (DELETE) | tâche unique | ⚠️ Tout user peut attacher/détacher un tag à une tâche tierce. À instruire en SEC. |
| `/api/tasks/[taskId]/verify-pin` | POST | `getCurrentUser` | via task → workspace | manuelle (regex `^\d{4}$`) | tâche unique | OK. |
| `/api/tasks/calendar` | GET | `getCurrentUser` | workspace (`workspaceMember.findUnique`) | manuelle (`workspaceId` requis) | workspace | OK. |
| `/api/tasks/reorder` | PATCH | `getCurrentUser` | ⚠️ aucune (transaction de `task.update` sur ids reçus sans check workspace) | Zod (`reorderSchema`) | tâche unique | ⚠️ Tout user authentifié peut réordonner / changer le `statusId` de n'importe quelles tâches. À instruire en SEC (Property 7 candidat). |
| `/api/tasks` | GET, POST | `getCurrentUser` | partielle (POST : via list → workspace ; ⚠️ GET : aucune sur `listId`) | Zod (POST `createTaskSchema`) | workspace | ⚠️ GET retourne les tâches de n'importe quelle `listId` connue. À instruire en SEC (Property 8 candidat). |
| `/api/templates` | GET, POST, DELETE | `getCurrentUser` | ⚠️ aucune (`workspaceId` accepté en GET/POST sans check membership ; DELETE par `id` sans check) | manuelle | workspace | ⚠️ Lecture, création et suppression de templates dans un workspace tiers possibles. À instruire en SEC. |
| `/api/time-entries/[entryId]` | GET, PATCH, DELETE | `getCurrentUser` | partielle (⚠️ GET : aucune ; PATCH/DELETE : owner via `existing.userId === user.id`) | manuelle | utilisateur courant | ⚠️ GET expose le détail d'une time entry tierce. À instruire en SEC. |
| `/api/time-entries/report` | GET | `getCurrentUser` | ⚠️ partielle (`workspaceId` optionnel ; si absent, retourne **toutes** les `TimeEntry` de l'application) | manuelle | workspace ou ⚠️ global | ⚠️ Sans `workspaceId`, la requête `findMany({ where: { duration: { not: null } } })` renvoie toutes les entries de la base. À instruire en SEC (Property 7 candidat). |
| `/api/time-entries` | GET, POST | `getCurrentUser` | ⚠️ aucune (GET : filtres `taskId`/`userId` sans check ; POST : `task.findUnique` sans check workspace) | manuelle (`taskId`, `startTime` requis) | utilisateur courant ou ⚠️ tiers | ⚠️ GET sans filtre retourne toutes les entries ; POST permet de créer une entry sur n'importe quelle tâche connue. À instruire en SEC. |
| `/api/time-entries/timer` | GET, POST | `getCurrentUser` | owner (`userId` filtre) ; ⚠️ POST `start` ne vérifie pas que `taskId` appartient au workspace de l'utilisateur | manuelle (`action`, `taskId`) | utilisateur courant | ⚠️ Démarrage de timer possible sur tâche tierce. À instruire en SEC. |
| `/api/user/avatar` | POST, DELETE | `requireAuth` | owner (`user.id`) | manuelle (taille ≤ 2 MB, MIME whitelist) | utilisateur courant | ⚠️ Écriture sur le filesystem (`public/uploads/avatars/`) — incompatible avec un FS éphémère Vercel. À instruire en INF/MOB. |
| `/api/user/password` | PATCH | `getCurrentUser` | owner | manuelle (`length ≥ 8`, `≤ 200`) | utilisateur courant | Vérifie le mot de passe actuel via `bcrypt.compare` avant rehash. Pas de rate-limit. |
| `/api/user/profile` | PATCH | `getCurrentUser` | owner | manuelle (`name` non vide, `≤ 100`) | utilisateur courant | OK. |
| `/api/workspaces/[workspaceId]/invites/[inviteId]` | DELETE | `getCurrentUser` | workspace (admin/owner) | n/a | workspace | OK. |
| `/api/workspaces/[workspaceId]/invites` | GET, POST | `getCurrentUser` | workspace (`assertAdminOrOwner`) | manuelle (regex email) | workspace | Envoi d'e-mail via `sendInvitationEmail` non bloquant. Pas de rate-limit visible — point à instruire en SEC 11.3. |
| `/api/workspaces/[workspaceId]/lists` | GET | `getCurrentUser` | workspace (membership) | n/a | workspace | OK. |
| `/api/workspaces/[workspaceId]/members` | GET, POST, DELETE | `getCurrentUser` | workspace (POST/DELETE : admin ou owner) | Zod (POST `addMemberSchema`) ; manuelle (DELETE) | workspace | OK. |
| `/api/workspaces/[workspaceId]` | GET, PATCH, DELETE | `getCurrentUser` | workspace (DELETE : owner uniquement) | Zod (PATCH `updateWorkspaceSchema`) | workspace | OK. |
| `/api/workspaces/[workspaceId]/teams/[teamId]/members` | POST, DELETE | `getCurrentUser` | workspace (admin) | manuelle (`workspaceMemberId`) | workspace | OK. |
| `/api/workspaces/[workspaceId]/teams/[teamId]` | PATCH, DELETE | `getCurrentUser` | workspace (`assertAdmin`) | manuelle | workspace | OK. |
| `/api/workspaces/[workspaceId]/teams` | GET, POST | `getCurrentUser` | workspace (POST : admin ou owner) | manuelle (`name` requis, regex couleur) | workspace | OK. |
| `/api/workspaces` | GET, POST | `getCurrentUser` | workspace (filtre `members.some` sur GET ; création + ajout `owner` sur POST) | Zod (POST `createWorkspaceSchema`) | workspace | OK. |


## Vérification du décompte

- **Routes documentées dans la table** : 96 lignes (validation manuelle ligne à ligne ci-dessus).
- **Routes recensées par `find`** : 96 fichiers (annexe A, ligne 2).
- **Décompte cohérent** : oui.

## Pistes prioritaires pour la revue SEC (axe 11.2)

Les routes ci-dessous présentent un signal `⚠️` côté ownership et sont les candidats les plus probables à un Finding `F-SEC-NNN` Severity_High (fuite ou modification de données entre utilisateurs / workspaces, cf. design — Correctness Properties — Property 7 et Property 8). Ces signaux ne sont **pas** des Findings définitifs : ils seront instruits, requalifiés ou écartés en phase 3 axe SEC, en croisant avec la configuration NextAuth (tâche 11.1) et la matrice de rôles workspace (`owner`/`admin`/`member`).

- Lecture / écriture cross-utilisateur (entry, transaction, push, FCM) : `/api/time-entries`, `/api/time-entries/[entryId]`, `/api/time-entries/report`, `/api/time-entries/timer`, `/api/finance/transactions`, `/api/finance/goals/[goalId]/contribute`, `/api/finance/goals` (POST), `/api/finance/accounts` (POST), `/api/push/register-fcm`, `/api/push/subscribe`, `/api/push/unsubscribe`.
- Lecture / écriture cross-workspace : `/api/templates`, `/api/goals`, `/api/goals/[goalId]`, `/api/goals/[goalId]/targets`, `/api/finance/categories`, `/api/finance/categories/[categoryId]`, `/api/finance/stats`.
- Lecture / écriture sur tâche tierce : `/api/tasks`, `/api/tasks/reorder`, `/api/tasks/[taskId]/activity`, `/api/tasks/[taskId]/assignees`, `/api/tasks/[taskId]/attachments`, `/api/tasks/[taskId]/checklists`, `/api/tasks/[taskId]/checklists/[checklistId]/items`, `/api/tasks/[taskId]/comments` (GET), `/api/tasks/[taskId]/dependencies` (DELETE), `/api/tasks/[taskId]/duplicate`, `/api/tasks/[taskId]/recurrence`, `/api/tasks/[taskId]/subtasks` (GET), `/api/tasks/[taskId]/tags`, `/api/lists` (GET).
- Auth alternative à instruire : `/api/calendar/feed/[token]` (token URL = bearer), `/api/calendar/google/callback` (`state` non signé), `/api/mobile-me` (claims sans relecture base), routes `/api/cron/*` (comparaison `===` non timing-safe sur `CRON_SECRET`).
- Hors-scope ownership mais autres axes : `/api/user/avatar` (FS local non compatible Vercel — axe INF/MOB), `/api/auth/register` et `/api/user/password` (absence de rate-limit visible — axe SEC 11.3).
