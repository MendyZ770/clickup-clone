# Axe SEC — Findings

Cette note recense les Findings de l'axe **SEC (Sécurité)** produits pendant la phase 3 de l'audit `full-app-audit` (tâche 11, sous-tâches 11.1 à 11.7). Elle est destinée à être incorporée dans la section dédiée à l'axe SEC de l'`audit-report.md` (cf. `design.md` > Components and Interfaces > Structure de `audit-report.md` > 3. Sections par axe). Le format suit strictement le schéma normalisé du design (8 champs : `id`, `title`, `axis`, `severity`, `description`, `evidence`, `impact`, `recommendation`).

Mode **strictement lecture seule** : aucune modification du code applicatif, du schéma Prisma, des migrations ou de la base. Les seules écritures sont confinées à `.kiro/specs/full-app-audit/notes/`. Aucune valeur de secret n'est recopiée dans cette note (variables citées par nom uniquement, cf. CLAUDE_Rules § 2.4).

## Sources et méthode

Périmètre inspecté, croisé avec les inventaires des phases 2 (`notes/annexe-C-routes-api.md`, `notes/inv-env.md`, `notes/inv-crons.md`) :

- **Configuration NextAuth** : `src/lib/auth.ts`, `src/lib/auth-helpers.ts`, `src/app/api/auth/[...nextauth]/route.ts` (tâche 11.1).
- **Ownership par route** : lecture intégrale des 96 routes `src/app/api/**/route.ts`, en priorité les 30+ routes signalées `⚠️` dans l'annexe C (tâche 11.2).
- **Rate limiting** : `src/lib/rate-limit.ts` et recherche exhaustive des usages de `checkRateLimit` (tâche 11.3).
- **Secrets côté client** : recherche `NEXT_PUBLIC_*` dans `src/` et les fichiers `.env*` (tâche 11.4).
- **En-têtes de sécurité** : `next.config.mjs`, `vercel.json` (tâche 11.5).
- **Cookies de session** : `src/lib/auth.ts`, `src/app/api/mobile-login/route.ts`, `src/app/api/mobile-logout/route.ts`, stockage client (`src/app/layout.tsx`, `src/lib/storage.ts`, `src/lib/mobile-auth.tsx`) (tâche 11.6).
- **CORS** : recherche `Access-Control-Allow-*` sur tout le dépôt (tâche 11.7).

Commandes shell exécutées consignées dans `notes/annexe-A-commandes.md` (tâche 11). Les recherches statiques restantes ont été réalisées via les outils de lecture internes du workspace.

## Synthèse de l'axe SEC

- **High** : 6 Findings (F-SEC-001 à F-SEC-006) — tous des fuites/modifications de données entre utilisateurs ou workspaces distincts (Property 7).
- **Medium** : 7 Findings (F-SEC-007 à F-SEC-013).
- **Total** : 13 Findings.

Les sous-tâches 11.4 (secrets `NEXT_PUBLIC_*`) et 11.7 (CORS) **n'ont produit aucun Finding** ; un constat explicite avec note de confiance figure en fin de note.

---

# Findings Severity_High

### F-SEC-001 — Module Finance : lecture, écriture et suppression inter-workspace/inter-utilisateur sans contrôle d'appartenance

- **Axe** : SEC
- **Sévérité** : High
- **Description** : Les routes du module Finance authentifient l'appelant via `getCurrentUser` mais ne vérifient pas que le `workspaceId`, l'`accountId`, le `categoryId` ou le `goalId` manipulés appartiennent à un workspace dont l'utilisateur est membre. Concrètement : (i) `GET/POST /api/finance/categories` lit et crée des catégories pour n'importe quel `workspaceId` reçu sans vérifier l'appartenance ; (ii) `PATCH/DELETE /api/finance/categories/[categoryId]` modifie/supprime une catégorie par son seul `id` ; (iii) `POST /api/finance/goals/[goalId]/contribute` crée une contribution et incrémente `currentAmount` d'un `goalId` arbitraire (modification des données d'un autre utilisateur) ; (iv) `POST /api/finance/transactions` crée une transaction sur un `accountId` arbitraire et **incrémente/décrémente le `balance` de ce compte** sans vérifier qu'il appartient à l'appelant ; (v) `POST /api/finance/accounts` et `POST /api/finance/goals` acceptent un `workspaceId` arbitraire. Les lectures de `GET /api/finance/accounts`, `GET /api/finance/goals` et `GET /api/finance/stats` sont, elles, filtrées par `userId: user.id` et ne fuient donc pas — mais leur contrat `workspaceId` reste non vérifié.
- **Preuve** : `src/app/api/finance/categories/route.ts:19-25` (GET : `where = { workspaceId }` sans check membership) et `:46-54` (POST : `create` avec `workspaceId` brut) ; `src/app/api/finance/categories/[categoryId]/route.ts:15-18` (PATCH `update where { id }`) et `:35-37` (DELETE `delete where { id }`) ; `src/app/api/finance/goals/[goalId]/contribute/route.ts:22-37` (transaction : `financeGoalContribution.create` + `financeGoal.update where { id: goalId }` sans vérif owner) ; `src/app/api/finance/transactions/route.ts:62-92` (POST : `create` sur `accountId` brut puis `financeAccount.update where { id: accountId }`) ; `src/app/api/finance/accounts/route.ts:47-57` (POST : `workspaceId` brut) ; `src/app/api/finance/goals/route.ts:44-56` (POST : `workspaceId` brut).
- **Impact** : Un utilisateur authentifié, connaissant ou devinant un identifiant (les `cuid` sont énumérables par fuite via d'autres routes), peut : lire les catégories financières d'un workspace tiers, modifier/supprimer les catégories d'autrui, gonfler artificiellement la progression d'un objectif financier d'un autre utilisateur, et surtout **créer des transactions falsifiant le solde du compte bancaire d'un autre utilisateur**. Il s'agit d'une fuite et d'une corruption de données financières entre utilisateurs/workspaces distincts — critère Severity_High du design (« fuite de données entre utilisateurs/workspaces »).
- **Recommandation** : Introduire un helper d'autorisation unique (sur le modèle de `checkWorkspaceAccess`/`checkBudgetAccess` déjà présents dans le module Budget) appliqué systématiquement avant tout accès Prisma : (1) vérifier la membership `workspaceMember` pour tout `workspaceId` reçu ; (2) pour les ressources à `id` (catégorie, compte, objectif, transaction), remonter à leur `workspaceId`/`userId` et confirmer l'appartenance avant `update`/`delete`/`increment` ; (3) retourner `403`/`404` en cas d'échec. Traiter en priorité `transactions` (corruption de solde) et `contribute`.

### F-SEC-002 — Objectifs (Goals) : lecture, écriture et suppression inter-workspace sans contrôle d'appartenance

- **Axe** : SEC
- **Sévérité** : High
- **Description** : Les routes des objectifs (hors finance) authentifient via `getCurrentUser` mais ne vérifient jamais que le `workspaceId` ou le `goalId` visé appartient à un workspace dont l'utilisateur est membre. `GET /api/goals?workspaceId=…` liste tous les objectifs d'un workspace arbitraire ; `POST /api/goals` crée un objectif dans n'importe quel `workspaceId` ; `GET/PATCH/DELETE /api/goals/[goalId]` lit, modifie et supprime un objectif par son seul `id` (le seul garde-fou présent est `assertGoalUnlocked` qui contrôle le champ `locked`, pas l'appartenance) ; `POST/PATCH/DELETE /api/goals/[goalId]/targets` partagent le même défaut.
- **Preuve** : `src/app/api/goals/route.ts:9-19` (GET : `findMany where { workspaceId }` sans check membership) et `:34-47` (POST : `create` avec `workspaceId` brut) ; `src/app/api/goals/[goalId]/route.ts:11-19` (GET `findUnique where { id: goalId }`), `:30-60` (PATCH : seul `locked` est contrôlé, pas l'owner), `:71-86` (DELETE) ; `src/app/api/goals/[goalId]/targets/route.ts` (mêmes constats, cf. annexe C).
- **Impact** : Tout utilisateur authentifié peut lire, modifier et supprimer les objectifs d'équipe d'un workspace dont il n'est pas membre, dès lors qu'il en connaît l'identifiant. Fuite et altération de données entre workspaces distincts — Severity_High (Property 7).
- **Recommandation** : Appliquer un contrôle de membership workspace sur `GET`/`POST /api/goals` (vérifier `workspaceMember` pour le `workspaceId` reçu) et, pour les routes `[goalId]`, remonter `goal.workspaceId` puis confirmer la membership avant toute opération. Mutualiser ce contrôle avec celui recommandé en F-SEC-001.

### F-SEC-003 — Tâches et listes : `GET /api/tasks`, `GET /api/lists` et `PATCH /api/tasks/reorder` sans contrôle d'appartenance

- **Axe** : SEC
- **Sévérité** : High
- **Description** : Trois routes structurantes du cœur métier authentifient l'appelant mais filtrent uniquement sur un identifiant fourni par le client, sans vérifier l'appartenance au workspace : (i) `GET /api/tasks?listId=…` retourne toutes les tâches (avec assignés, tags, compteurs) de n'importe quelle liste connue ; (ii) `GET /api/lists?spaceId=…|folderId=…` retourne toutes les listes d'un space/folder arbitraire ; (iii) `PATCH /api/tasks/reorder` exécute une transaction de `task.update` (position **et** `statusId`) sur les `id` de tâches reçus, sans aucun contrôle workspace — permettant de réordonner ou de changer le statut de n'importe quelles tâches de l'application. Les méthodes `POST` correspondantes vérifient bien l'appartenance (`list.space.workspace.members`), ce qui rend l'écart d'autant plus visible.
- **Preuve** : `src/app/api/tasks/route.ts:24-30` (GET : `listId` requis sans check) et `:36-76` (`findMany where { listId, parentId: null }`) ; `src/app/api/lists/route.ts:14-38` (GET : `where` construit sur `spaceId`/`folderId` bruts, aucun check membership) ; `src/app/api/tasks/reorder/route.ts:38-50` (transaction de `prisma.task.update` sur `t.id` reçus, sans vérification d'appartenance).
- **Impact** : Un utilisateur authentifié peut lire l'intégralité des tâches et des listes de workspaces tiers (fuite de données entre workspaces) et, via `reorder`, **modifier le statut de tâches d'autres workspaces** (corruption de données). Severity_High (Property 7 — fuite et modification inter-workspace).
- **Recommandation** : Sur `GET /api/tasks` et `GET /api/lists`, remonter du `listId`/`spaceId`/`folderId` jusqu'au workspace et vérifier `workspaceMember` avant le `findMany` (404 sinon). Sur `PATCH /api/tasks/reorder`, charger les tâches ciblées, vérifier que toutes appartiennent à un workspace dont l'appelant est membre (et idéalement à une même liste) avant d'appliquer la transaction.

### F-SEC-004 — Sous-ressources de tâche : absence de contrôle `task → workspace` en lecture et en écriture

- **Axe** : SEC
- **Sévérité** : High
- **Description** : De nombreuses sous-ressources de tâche authentifient via `getCurrentUser` mais opèrent directement sur le `taskId` du path (ou sur un `id` de sous-ressource) sans remonter à `task.list.space.workspace.members` pour vérifier l'appartenance. En **lecture** : `GET /api/tasks/[taskId]/activity`, `GET .../comments`, `GET .../checklists`, `GET .../subtasks`, `GET .../assignees`, `GET .../attachments`, `GET .../tags`, `GET .../recurrence` exposent le contenu d'une tâche tierce. En **écriture** : `POST/DELETE .../assignees`, `PUT/DELETE .../recurrence`, `POST/DELETE .../tags`, `POST .../attachments`, `POST/PATCH/DELETE .../checklists/[checklistId]/items`, `DELETE .../dependencies`, et `POST .../duplicate` (paramètre `targetListId`/`listId` non vérifié) modifient des données de tâches tierces. Les `POST` de `comments`, `checklists`, `subtasks` vérifient bien l'appartenance ; le défaut est donc inégalement réparti au sein des mêmes fichiers.
- **Preuve** : `src/app/api/tasks/[taskId]/activity/route.ts:18-26` (`activity.findMany where { taskId }` sans check) ; `src/app/api/tasks/[taskId]/comments/route.ts:19-27` (GET sans check ; POST vérifie en `:52-68`) ; `src/app/api/tasks/[taskId]/checklists/route.ts:22-30` (GET sans check ; POST vérifie en `:50-68`) ; `src/app/api/tasks/[taskId]/subtasks/route.ts:22-31` (GET sans check) ; `src/app/api/tasks/[taskId]/assignees/route.ts:10-14` (GET), `:28-32` (POST `taskAssignee.create`), `:48-50` (DELETE `deleteMany`) ; `src/app/api/tasks/[taskId]/recurrence/route.ts:11-14` (GET), `:26-31` (PUT upsert), `:42-45` (DELETE) ; `src/app/api/tasks/[taskId]/tags/route.ts:24-30` (GET), `:60-78` (POST : ne vérifie que l'existence du tag), `:113-140` (DELETE) ; `src/app/api/tasks/[taskId]/attachments/route.ts:13-18` (GET), `:30-34` (POST) ; `src/app/api/tasks/[taskId]/duplicate/route.ts:46-47` (`targetListId = body.listId` non vérifié) ; sous-ressources `checklists/[checklistId]/items` et `dependencies` DELETE (cf. annexe C).
- **Impact** : Un utilisateur authentifié peut lire le journal d'activité, les commentaires, les checklists, sous-tâches, assignés, pièces jointes et tags de n'importe quelle tâche dont il connaît l'`id` (fuite de données inter-workspace), et altérer ces mêmes sous-ressources (ajout/retrait d'assignés ou de tags, modification de récurrence, duplication vers une liste tierce). Severity_High (Property 7 — fuite et modification inter-workspace).
- **Recommandation** : Extraire un helper `assertTaskAccess(taskId, userId)` qui charge `task.list.space.workspace.members.where({ userId })` et retourne 404 si vide, puis l'appeler en **première instruction** de chaque handler (GET inclus) de toutes les sous-ressources de `tasks/[taskId]`. Pour `duplicate`, vérifier en plus l'appartenance de `targetListId`. Pour `dependencies` DELETE, vérifier que la dépendance relève d'une tâche accessible.

### F-SEC-005 — Suivi du temps (Time Tracking) : fuite globale et inter-utilisateur des entrées de temps

- **Axe** : SEC
- **Sévérité** : High
- **Description** : Les routes de suivi du temps authentifient via `getCurrentUser` mais ne filtrent pas systématiquement par utilisateur ni par workspace. Le cas le plus grave : `GET /api/time-entries/report` construit son `where` à partir de `{ duration: { not: null } }` et n'ajoute le filtre workspace **que si** `workspaceId` est fourni — sans `workspaceId`, la route retourne et agrège **toutes les entrées de temps de l'application, tous utilisateurs confondus** (avec nom et e-mail des utilisateurs via `include user`). De même, `GET /api/time-entries` part d'un `where` vide et n'applique `taskId`/`userId` que s'ils sont fournis : sans filtre, elle renvoie toutes les entrées. `GET /api/time-entries/[entryId]` retourne n'importe quelle entrée par son `id` sans vérifier l'owner. `POST /api/time-entries` et `POST /api/time-entries/timer` (`action: "start"`) créent une entrée sur n'importe quel `taskId` connu sans vérifier l'appartenance.
- **Preuve** : `src/app/api/time-entries/report/route.ts:21-44` (`where = { duration: { not: null } }` ; filtre `task.list.space.workspaceId` conditionné à la présence de `workspaceId`) et `:46-56` (`findMany` + `include user { name, email }`) ; `src/app/api/time-entries/route.ts:21-31` (GET : `where` vide par défaut) ; `src/app/api/time-entries/[entryId]/route.ts:17-25` (GET `findUnique where { id }` sans check owner ; PATCH/DELETE vérifient `existing.userId === user.id` en `:70-72` et `:140-142`) ; `src/app/api/time-entries/route.ts:74-80` (POST : `task.findUnique` sans check workspace) ; `src/app/api/time-entries/timer/route.ts:80-86` (start : `task.findUnique` sans check workspace).
- **Impact** : Fuite massive de données inter-utilisateurs : un appel à `GET /api/time-entries/report` (ou `GET /api/time-entries`) sans `workspaceId` expose l'intégralité de l'activité chronométrée de tous les utilisateurs de la plateforme, y compris noms et e-mails. `GET /api/time-entries/[entryId]` permet une lecture ciblée d'une entrée tierce. Severity_High (Property 7 — fuite de données entre utilisateurs/workspaces).
- **Recommandation** : Imposer un filtre par défaut `userId: user.id` (et/ou membership workspace) sur **toutes** les lectures de `TimeEntry` : rendre `workspaceId` obligatoire et vérifier la membership sur `report` et `GET /api/time-entries` ; vérifier `entry.userId === user.id` (ou l'appartenance de la tâche au workspace) sur `GET /api/time-entries/[entryId]` ; vérifier l'appartenance de `taskId` au workspace de l'appelant avant `create` dans `POST /api/time-entries` et `timer` start.

### F-SEC-006 — Templates de tâche : lecture, création et suppression inter-workspace sans contrôle d'appartenance

- **Axe** : SEC
- **Sévérité** : High
- **Description** : Les trois méthodes de `/api/templates` authentifient via `getCurrentUser` sans jamais vérifier la membership du workspace concerné. `GET /api/templates?workspaceId=…` liste tous les templates d'un workspace arbitraire ; `POST` crée un template dans n'importe quel `workspaceId` ; `DELETE /api/templates?id=…` supprime un template par son seul `id`, sans contrôle d'appartenance.
- **Preuve** : `src/app/api/templates/route.ts:14-25` (GET : `findMany where { workspaceId }` sans check membership) ; `:46-57` (POST : `create` avec `workspaceId` brut) ; `:78-84` (DELETE : `taskTemplate.delete where { id }` sans check).
- **Impact** : Un utilisateur authentifié peut lire les templates de tâche d'un workspace tiers (fuite inter-workspace), en créer dans un workspace dont il n'est pas membre, et supprimer ceux d'autrui (corruption). Severity_High (Property 7).
- **Recommandation** : Vérifier la membership `workspaceMember` pour le `workspaceId` reçu sur `GET`/`POST` ; sur `DELETE`, remonter `template.workspaceId` et confirmer la membership avant suppression. Mutualiser avec le helper recommandé en F-SEC-001/F-SEC-002.

---

# Findings Severity_Medium

### F-SEC-007 — Notifications push : vol de token FCM et désinscription d'un device tiers

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : Trois routes push présentent des défauts d'intégrité sur la propriété des souscriptions. (i) `POST /api/push/register-fcm` fait un `upsert` sur la clé unique `fcmToken` avec `update: { userId: user.id }` : un utilisateur authentifié qui soumet le `fcmToken` d'un autre appareil **réassigne** la souscription à son propre compte (vol de token et détournement du canal de notification). (ii) `POST /api/push/subscribe` exécute `deleteMany({ where: { endpoint } })` avant de recréer : un utilisateur peut supprimer la souscription Web Push d'un autre utilisateur en fournissant son `endpoint`. (iii) `POST /api/push/unsubscribe` n'a **aucune authentification** et fait `deleteMany({ where: { endpoint } })` : tout appelant connaissant un `endpoint` peut désinscrire le device d'autrui. Le `endpoint` n'est pas un secret (il transite côté client et peut être observé).
- **Preuve** : `src/app/api/push/register-fcm/route.ts:16-23` (`upsert where { fcmToken } update { userId: user.id }`) ; `src/app/api/push/subscribe/route.ts:21` (`deleteMany where { endpoint }` sans vérif owner) ; `src/app/api/push/unsubscribe/route.ts:5-12` (aucun `getCurrentUser`, `deleteMany where { endpoint }`).
- **Impact** : Un utilisateur malveillant peut (a) intercepter les notifications push destinées à un autre appareil en réenregistrant son token sous son compte, ou (b) provoquer un déni de service ciblé sur les notifications d'un autre utilisateur en supprimant ses souscriptions. Pas de fuite de données métier directe (d'où Medium et non High), mais atteinte à l'intégrité et à la disponibilité d'un canal utilisateur ; `unsubscribe` viole en outre la Property 8 (route sans auth).
- **Recommandation** : Sur `register-fcm` et `subscribe`, n'autoriser le rattachement/suppression d'un `fcmToken`/`endpoint` que s'il n'appartient à personne ou déjà à l'appelant (vérifier `userId` existant avant `update`/`delete`). Sur `unsubscribe`, exiger `getCurrentUser` et restreindre le `deleteMany` à `{ endpoint, userId: user.id }`. À défaut, ces souscriptions doivent au minimum être scoppées par utilisateur.

### F-SEC-008 — Absence de rate limiting sur les routes sensibles autres que `/api/mobile-login`

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : Le seul point d'usage de `checkRateLimit` (Upstash) dans tout le code est `POST /api/mobile-login`. Aucune autre route sensible n'est limitée en débit : `POST /api/auth/register` (création de compte — spam d'inscriptions, énumération d'e-mails via le 409 « already exists »), l'authentification NextAuth Credentials `POST /api/auth/[...nextauth]` (bruteforce de mot de passe par `signIn`), `PATCH /api/user/password` (bruteforce du mot de passe actuel via `bcrypt.compare`), l'envoi d'e-mails `POST /api/workspaces/[workspaceId]/invites` (abus du quota Resend / spam de boîtes tierces), et les routes push (`POST /api/push/test`, `subscribe`, `register-fcm`). De plus, le rate limiter est **désactivé silencieusement** si `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` ne sont pas définis (`checkRateLimit` retourne alors `success: true`), ce qui doit être confirmé côté console Vercel (External_Console).
- **Preuve** : `src/lib/rate-limit.ts:12-19` (instanciation conditionnelle) et `:32-35` (`if (!ratelimit) return { success: true … }`) ; unique appelant : `src/app/api/mobile-login/route.ts:18` (`await checkRateLimit(identifier)`) ; absence d'appel dans `src/app/api/auth/register/route.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/user/password/route.ts:8-12`, `src/app/api/workspaces/[workspaceId]/invites/route.ts:113-121` (envoi e-mail non limité) ; `commande: grep -rn 'checkRateLimit' src/` → 2 occurrences (définition + mobile-login uniquement).
- **Impact** : Surface exposée au bruteforce d'identifiants (login web NextAuth et changement de mot de passe), au spam d'inscriptions, à l'énumération de comptes, et à l'abus du quota d'envoi d'e-mails Resend (coût + risque de blacklistage du domaine expéditeur). Severity_Medium (« défaut de robustesse » / « dette technique significative ») ; non classé High en l'absence de fuite de données directe.
- **Recommandation** : Étendre `checkRateLimit` (ou un limiteur dédié par type d'action) à `register`, au flux de connexion par identifiants, à `PATCH /api/user/password`, à l'envoi d'invitations (`invites` POST) et aux routes push. Envisager un limiteur par identifiant composite (IP + e-mail). Vérifier en console Vercel (External_Console) que les variables Upstash sont effectivement définies en production, sans quoi le rate limiting de `mobile-login` lui-même est inactif.

### F-SEC-009 — CSP permissive : `script-src` autorise `'unsafe-inline'` et `'unsafe-eval'`

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : La `Content-Security-Policy` déclarée dans `next.config.mjs` applique `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. La combinaison `'unsafe-inline'` + `'unsafe-eval'` sur `script-src` neutralise une grande partie de la protection anti-XSS qu'apporte une CSP : tout script inline injecté (XSS stocké/réfléchi) s'exécute, et `eval()`/`new Function()` restent autorisés. À noter que l'application **injecte effectivement des scripts inline** via `dangerouslySetInnerHTML` dans `src/app/layout.tsx` (fetch interceptor, enregistrement du service worker), ce qui explique le recours à `'unsafe-inline'` mais en montre aussi le coût. Les autres en-têtes sont correctement positionnés (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` en production, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`).
- **Preuve** : `next.config.mjs:38-43` (header `Content-Security-Policy`, valeur `… script-src 'self' 'unsafe-inline' 'unsafe-eval'; …`) ; scripts inline consommateurs : `src/app/layout.tsx:60-77` (fetch interceptor via template string injecté) et `:79-100` (enregistrement SW).
- **Impact** : En cas de faille XSS applicative, la CSP n'offre pas de défense en profondeur sur l'exécution de scripts (l'attaquant peut exécuter du code inline et utiliser `eval`). La valeur protège néanmoins contre le clickjacking (`frame-ancestors 'none'`) et le sniffing MIME. Severity_Medium (« défaut de robustesse »).
- **Recommandation** : Migrer vers une CSP basée sur des nonces (Next.js supporte les nonces via middleware) pour retirer `'unsafe-inline'` de `script-src`, et supprimer `'unsafe-eval'` si aucune dépendance runtime ne l'exige (à vérifier après build). Externaliser les scripts inline de `layout.tsx` ou leur attribuer un nonce. Resserrer également `style-src` à terme. Mesure non bloquante mais recommandée avant exposition publique élargie.

### F-SEC-010 — Session JWT NextAuth sans durée explicite ni rotation ; pas de cookie `__Host-`/`sameSite` durci

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : La configuration NextAuth utilise `session: { strategy: "jwt" }` sans déclarer `session.maxAge` ni `jwt.maxAge` : la durée de vie repose donc sur la valeur par défaut de NextAuth (30 jours) sans rotation explicite (`updateAge`) ni configuration de cookie durcie (`cookies` non déclaré, donc valeurs par défaut). Aucune stratégie de révocation côté serveur n'est possible avec une session JWT pure (le `PrismaAdapter` est branché mais la stratégie `jwt` ne persiste pas les sessions en base, ce qui empêche une invalidation serveur). Le callback `jwt` ne stocke que `token.id`, sans `iat`/contrôle de fraîcheur applicatif.
- **Preuve** : `src/lib/auth.ts:9-11` (`session: { strategy: "jwt" }` sans `maxAge`/`updateAge`) ; `:55-66` (callbacks `jwt`/`session` minimalistes) ; absence de bloc `cookies` et `jwt` dans `authOptions` ; `src/lib/auth.ts:8` (`adapter: PrismaAdapter(prisma)` inopérant pour la persistance de session en mode `jwt`).
- **Impact** : Une session compromise (token volé) reste exploitable jusqu'à 30 jours sans possibilité de révocation côté serveur. L'absence de configuration explicite rend la durée implicite et non documentée. Severity_Medium (« dette technique » / « défaut de robustesse ») ; non High car aucune fuite de données directe et le secret de signature (`NEXTAUTH_SECRET`) est requis.
- **Recommandation** : Déclarer explicitement `session: { strategy: "jwt", maxAge, updateAge }` avec une durée alignée sur le besoin métier (par ex. 7 à 30 jours) et une rotation (`updateAge`). Déclarer un bloc `cookies` durci (préfixe `__Host-` en production, `sameSite: "lax"`, `secure: true`, `httpOnly: true`). Pour permettre une révocation serveur, envisager `strategy: "database"` (cohérent avec le `PrismaAdapter` déjà présent) ou une liste de révocation. À confirmer : durée par défaut effective de la version de `next-auth` utilisée.

### F-SEC-011 — JWT mobile longue durée (30 j) sans révocation ; `/api/mobile-me` ne relit pas la base

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : Le canal d'authentification mobile émet un JWT HS256 signé avec `NEXTAUTH_SECRET`, d'une durée de **30 jours** (`setExpirationTime("30d")`), déposé à la fois dans la réponse JSON (stocké en `localStorage` côté client) et dans un cookie `mobile_session`. Ce token n'a aucun mécanisme de révocation : un token volé reste valide 30 jours. De plus, `GET /api/mobile-me` renvoie directement les claims du token (`id`, `email`, `name`, `image`) **sans relire la base** : un compte supprimé ou dont les données ont changé reste exploitable jusqu'à expiration. Le stockage du token en `localStorage` (cf. fetch interceptor) l'expose au vol par XSS (à recouper avec F-SEC-009 sur la CSP permissive).
- **Preuve** : `src/app/api/mobile-login/route.ts:66-74` (`new SignJWT(...).setExpirationTime("30d")`) et `:86-92` (cookie `mobile_session`, `maxAge: 60*60*24*30`) ; `src/app/api/mobile-me/route.ts:19-30` (retourne `payload.*` sans `prisma.user.findUnique`) ; stockage client : `src/app/layout.tsx:66` (`localStorage.getItem('mobile_auth_token')`), `src/components/auth/login-form.tsx:109` (`storageSet("mobile_auth_token", …)`). Note : `getCurrentUser` (`src/lib/auth-helpers.ts:22-26`), lui, relit bien la base — seul `mobile-me` court-circuite cette lecture.
- **Impact** : Fenêtre d'exploitation de 30 jours pour un token mobile volé, sans révocation possible ; `mobile-me` peut renvoyer les informations d'un compte qui n'existe plus. Le stockage `localStorage` accroît l'exposition au vol via XSS. Severity_Medium (« défaut de robustesse »).
- **Recommandation** : Réduire la durée du JWT mobile (par ex. token d'accès court + refresh token révocable), ou ajouter une liste de révocation (table `RevokedToken` ou champ `tokenVersion` sur `User` vérifié à chaque requête). Faire relire la base par `GET /api/mobile-me` (comme `getCurrentUser`) pour refléter l'état réel du compte. Privilégier le cookie `httpOnly` au stockage `localStorage` quand le contexte le permet (le cookie `mobile_session` est déjà `httpOnly`).

### F-SEC-012 — OAuth Google Calendar : paramètre `state` non signé (CSRF / fixation de compte)

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : Le flux OAuth Google Calendar utilise `state = user.id` (non signé, non aléatoire) à l'aller, et `GET /api/calendar/google/callback` consomme ce `state` **sans authentifier l'appelant ni vérifier l'intégrité du `state`** : il fait directement un `googleCalendarSync.upsert({ where: { userId: state } })`. Le `state` OAuth a normalement deux rôles : protéger contre le CSRF (valeur aléatoire imprévisible liée à la session) et corréler la réponse à la requête. Ici il est prévisible (c'est un `user.id`) et la route callback est ouverte.
- **Preuve** : `src/app/api/calendar/google/auth/route.ts` (génère l'URL OAuth avec `state: user.id`, cf. annexe C et `notes/inv-env.md`) ; `src/app/api/calendar/google/callback/route.ts:8` (`const state = searchParams.get("state"); // userId`), `:60-76` (`googleCalendarSync.upsert({ where: { userId: state } })` sans auth ni vérification de signature du `state`).
- **Impact** : Un attaquant peut forger une requête de callback (ou induire une victime à compléter un flux OAuth) pour rattacher **son propre** compte Google Calendar au `userId` d'une victime, ou inversement, en devinant/forçant le `state`. Cela peut conduire à une synchronisation croisée de calendriers entre comptes. Severity_Medium (le flux requiert un `code` OAuth valide délivré par Google, ce qui limite l'exploitabilité, d'où Medium et non High) ; à confirmer via External_Console (configuration OAuth Google).
- **Recommandation** : Générer un `state` aléatoire opaque, le stocker côté serveur (lié à la session de l'utilisateur initiateur, par ex. cookie signé ou table temporaire avec TTL), et le vérifier au callback avant tout `upsert`. Déduire le `userId` de la session vérifiée et non du `state` transmis. Conserver le contrôle d'expiration du `state`.

### F-SEC-013 — Fuite passive du token de feed calendrier via l'URL et le cache CDN ; route de test push laissée en place

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : Deux constats mineurs mais notables. (i) `GET /api/calendar/feed/[token]` utilise le token de feed présent **dans le chemin de l'URL** comme unique facteur d'authentification, et renvoie la réponse avec `Cache-Control: public, max-age=3600`. Un token en path transite dans les logs HTTP serveur/CDN, l'historique de navigation et l'en-tête `Referer` ; le cache `public` autorise sa mise en cache par des intermédiaires partagés. (ii) `POST /api/push/test` est une route de test explicitement annotée « à supprimer en prod » qui déclenche un envoi push réel ; elle est authentifiée et scoppée à `user.id` (pas de fuite), mais ne devrait pas subsister en production.
- **Preuve** : `src/app/api/calendar/feed/[token]/route.ts:13-20` (token de path = auth, `findUnique where { token }`) et `:75-81` (`Cache-Control: "public, max-age=3600"`) ; `src/app/api/push/test/route.ts:5` (commentaire « Route de test — à supprimer en prod ») et `:21-33` (envoi push réel).
- **Impact** : (i) Le token de feed peut fuiter passivement (logs, referer, cache partagé), permettant à un tiers de lire les tâches à échéance d'un utilisateur (le feed est volontairement « public via token », mais la mise en cache `public` élargit la surface). (ii) La route de test augmente inutilement la surface d'attaque et peut servir à du déclenchement de notifications non désiré. Severity_Medium.
- **Recommandation** : (i) Remplacer le `Cache-Control: public` par `private, no-store` (ou `max-age` court avec `private`) pour le feed, et documenter le caractère sensible du token ; idéalement prévoir une rotation/révocation du token (déjà partiellement supportée par `POST /api/calendar/token`). (ii) Retirer `POST /api/push/test` du périmètre de production (ou la conditionner à `NODE_ENV !== "production"`).

---

# Sous-tâches sans Finding (constat explicite)

## Tâche 11.4 — Secrets côté client (`NEXT_PUBLIC_*`) : aucun Finding

Recherche exhaustive de `NEXT_PUBLIC_*` sur `src/` et les fichiers `.env*` (noms uniquement, aucune valeur lue). Seules **deux** variables portent le préfixe `NEXT_PUBLIC_*` :

- `NEXT_PUBLIC_APP_URL` (`src/lib/email.ts:6`) — URL canonique publique de l'application, non sensible.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (`src/lib/push.ts:3`, `src/app/api/push/vapid-public-key/route.ts:4`) — **clé publique** VAPID, destinée par conception à être exposée au client.

Aucun secret métier (clé Resend, `FIREBASE_SERVICE_ACCOUNT`, `VAPID_PRIVATE_KEY`, `GOOGLE_CLIENT_SECRET`, `CRON_SECRET`, jeton Vercel, `DATABASE_URL`, `NEXTAUTH_SECRET`) ne porte le préfixe `NEXT_PUBLIC_*` ; tous sont consommés exclusivement côté serveur (cf. `notes/inv-env.md`). **Aucun Finding.**

**Note de confiance** : élevée pour le code source (`src/`). La vérification que la **console Vercel** ne définit pas, en production, une variable `NEXT_PUBLIC_*` supplémentaire contenant un secret reste **à confirmer via External_Console** (lecture seule).

## Tâche 11.7 — Configuration CORS : aucun Finding

Recherche `Access-Control-Allow-Origin` / `Access-Control-Allow-*` sur l'ensemble du dépôt : **aucune occurrence** dans le code applicatif (`src/`), `next.config.mjs` ni `vercel.json`. L'application ne déclare donc **aucun en-tête CORS permissif** ; en l'absence de header `Access-Control-Allow-Origin`, les navigateurs appliquent la same-origin policy par défaut, et aucune route authentifiée n'expose `Access-Control-Allow-Origin: *`. **Aucun Finding** au sens du critère de la tâche (« absence de `Access-Control-Allow-Origin: *` sur routes authentifiées »).

**Note de confiance** : élevée. Le seul élément « cors » trouvé est une mention dans `notes/axe-ux.md` relative à un `fetchInterceptor` côté client (injection du Bearer token), sans rapport avec une politique CORS serveur. À confirmer via External_Console : absence de réécriture/headers CORS configurés au niveau de la plateforme Vercel (projet) hors `vercel.json`.

---

# Référence croisée Property 8 (couverture des routes API)

Toutes les routes signalées `⚠️` dans `notes/annexe-C-routes-api.md` (auth présente mais ownership absent/partiel) sont désormais référencées par l'`evidence` d'un Finding SEC ci-dessus :

- Finance → **F-SEC-001** ; Goals (hors finance) → **F-SEC-002** ; `tasks` GET / `lists` GET / `tasks/reorder` → **F-SEC-003** ; sous-ressources `tasks/[taskId]/*` (activity, comments, checklists, subtasks, assignees, attachments, tags, recurrence, dependencies, duplicate) → **F-SEC-004** ; time-entries → **F-SEC-005** ; templates → **F-SEC-006** ; push (register-fcm, subscribe, unsubscribe) → **F-SEC-007** ; calendar feed token + push/test → **F-SEC-013** ; google callback `state` → **F-SEC-012**.

Les routes ouvertes par conception et jugées acceptables (non-Finding) : `/api/auth/[...nextauth]` (handler NextAuth), `/api/auth/register` (création de compte, mais cf. F-SEC-008 rate-limit), `/api/mobile-login` (rate-limité), `/api/mobile-logout` (efface un cookie), `/api/push/vapid-public-key` (clé publique), `/api/invites/[token]` GET (lecture d'invitation par token, par conception). Les 4 routes cron sont traitées par l'axe INF (F-INF-003/004) — `Property 7 (cron sans secret)` non violée (un `CRON_SECRET` est présent). `/api/mobile-me` → cf. F-SEC-011.
