# Annexe E — Inventaire Prisma : modèles, index, relations et migrations

## Objet

Cette note constitue **l'annexe E** du futur `audit-report.md` (cf. `design.md` > Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > E). Elle est produite en tâche 3.3 (Phase 2 — Inventaires) du plan d'audit `full-app-audit` et satisfait les clauses `requirements.md` 2.2, 7.1 et 7.3.

Mode strictement **lecture seule** : aucune commande `prisma generate`, `prisma migrate dev/deploy`, `prisma db push` n'est exécutée. Les seules sources sont :

- `prisma/schema.prisma` (lecture intégrale, 30 596 octets, dernière modification disque le 29 mai 2025).
- L'arborescence du dossier `prisma/` confirmée par `ls -la prisma/`, `git ls-files prisma` et `git log --all -- 'prisma/migrations/*'` (cf. annexe A, lignes 2 à 5).

Conventions :

- Les attributs Prisma sont notés tels quels (`@id`, `@unique`, `@default(...)`, `@db.Text`, `@updatedAt`, `@relation(...)`).
- Pour chaque relation, la colonne `onDelete` / `onUpdate` reproduit le comportement déclaré ; `—` signifie « non spécifié » → comportement Prisma par défaut (`SetNull` côté optionnel, `Restrict` côté requis ; voir Prisma Referential Actions).
- Les listes de relations inverses (côté « 1-N » sans `@relation(fields:…)`) sont rappelées en fin de chaque modèle pour permettre l'analyse croisée à la phase 3 (axe BDD).

## 1. Inventaire modèle par modèle

### 1.1 `User`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String?` | — |
| `email` | `String` | `@unique` |
| `emailVerified` | `DateTime?` | — |
| `hashedPassword` | `String?` | — |
| `image` | `String?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Index/contraintes : `@id` sur `id` ; `@unique` sur `email`. Aucun `@@index` ni `@@unique`.

Relations sortantes (champs `@relation(fields:…)`) : aucune. Relations inverses (1-N déclarées sur les modèles cibles) :

| Relation inverse | Cible | Cardinalité |
| --- | --- | --- |
| `accounts` | `Account[]` | 1-N |
| `sessions` | `Session[]` | 1-N |
| `workspaceMembers` | `WorkspaceMember[]` | 1-N |
| `assignedTasks` | `Task[]` (`@relation("TaskAssignee")`) | 1-N |
| `createdTasks` | `Task[]` (`@relation("TaskCreator")`) | 1-N |
| `comments` | `Comment[]` | 1-N |
| `activities` | `Activity[]` | 1-N |
| `notifications` | `Notification[]` | 1-N |
| `calendarToken` | `CalendarToken?` | 1-1 |
| `googleCalendarSync` | `GoogleCalendarSync?` | 1-1 |
| `timeEntries` | `TimeEntry[]` | 1-N |
| `taskAssignees` | `TaskAssignee[]` (`@relation("TaskAssignees")`) | 1-N |
| `favorites` | `Favorite[]` | 1-N |
| `reminders` | `Reminder[]` | 1-N |
| `attachments` | `Attachment[]` | 1-N |
| `goals` | `Goal[]` | 1-N |
| `taskTemplates` | `TaskTemplate[]` | 1-N |
| `notes` | `Note[]` | 1-N |
| `pushSubscriptions` | `PushSubscription[]` | 1-N |
| `notificationPreferences` | `NotificationPreferences?` | 1-1 |
| `budgets` | `Budget[]` | 1-N |
| `budgetTransactions` | `BudgetTransaction[]` | 1-N |
| `budgetTemplates` | `BudgetTemplate[]` | 1-N |
| `budgetAlerts` | `BudgetAlert[]` | 1-N |
| `financeAccounts` | `FinanceAccount[]` | 1-N |
| `financeTransactions` | `FinanceTransaction[]` | 1-N |
| `financeGoals` | `FinanceGoal[]` | 1-N |
| `financeGoalContributions` | `FinanceGoalContribution[]` | 1-N |

### 1.2 `Account`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String` | — |
| `type` | `String` | — |
| `provider` | `String` | — |
| `providerAccountId` | `String` | — |
| `refresh_token` | `String?` | `@db.Text` |
| `access_token` | `String?` | `@db.Text` |
| `expires_at` | `Int?` | — |
| `token_type` | `String?` | — |
| `scope` | `String?` | — |
| `id_token` | `String?` | `@db.Text` |
| `session_state` | `String?` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([provider, providerAccountId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.3 `Session`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `sessionToken` | `String` | `@unique` |
| `userId` | `String` | — |
| `expires` | `DateTime` | — |

Index/contraintes : `@id` sur `id` ; `@unique` sur `sessionToken`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.4 `VerificationToken`

| Champ | Type | Attributs |
| --- | --- | --- |
| `identifier` | `String` | — |
| `token` | `String` | `@unique` |
| `expires` | `DateTime` | — |

Index/contraintes : `@unique` sur `token` ; `@@unique([identifier, token])`. **Aucun champ `@id`** déclaré, la clé primaire effective est la contrainte composite `@@unique([identifier, token])` (modèle conforme au standard NextAuth).

Relations : aucune.

### 1.5 `Workspace`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `description` | `String?` | `@db.Text` |
| `color` | `String` | `@default("#7C3AED")` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations sortantes : aucune (Workspace est racine de l'arborescence métier). Relations inverses :

| Relation inverse | Cible |
| --- | --- |
| `members` | `WorkspaceMember[]` |
| `spaces` | `Space[]` |
| `tags` | `Tag[]` |
| `customFields` | `CustomField[]` |
| `reminders` | `Reminder[]` |
| `goals` | `Goal[]` |
| `taskTemplates` | `TaskTemplate[]` |
| `invites` | `WorkspaceInvite[]` |
| `teams` | `Team[]` |
| `notes` | `Note[]` |
| `budgets` | `Budget[]` |
| `budgetCategories` | `BudgetCategory[]` |
| `budgetTemplates` | `BudgetTemplate[]` |
| `financeAccounts` | `FinanceAccount[]` |
| `financeCategories` | `FinanceCategory[]` |
| `financeGoals` | `FinanceGoal[]` |

### 1.6 `WorkspaceMember`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `role` | `String` | `@default("member")` (commentaire schéma : `"owner" \| "admin" \| "member"`) |
| `joinedAt` | `DateTime` | `@default(now())` |
| `workspaceId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([workspaceId, userId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

Relation inverse : `teamMembers TeamMember[]`.

### 1.7 `WorkspaceInvite`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `workspaceId` | `String` | — |
| `email` | `String` | — |
| `role` | `String` | `@default("member")` |
| `token` | `String` | `@unique @default(cuid())` |
| `invitedById` | `String` | — |
| `expiresAt` | `DateTime` | — |
| `acceptedAt` | `DateTime?` | — |
| `createdAt` | `DateTime` | `@default(now())` |

Index/contraintes : `@id` sur `id` ; `@unique` sur `token` ; `@@unique([workspaceId, email])` ; `@@index([token])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

Note : `invitedById` n'est **pas** matérialisé par une relation Prisma vers `User` — c'est une simple FK logique non contrainte dans le schéma (à recouper en phase 3, axe BDD).

### 1.8 `Team`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `description` | `String?` | — |
| `color` | `String` | `@default("#3B82F6")` |
| `workspaceId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Index/contraintes : `@id` sur `id` ; `@@unique([workspaceId, name])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

Relation inverse : `members TeamMember[]`.

### 1.9 `TeamMember`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `teamId` | `String` | — |
| `workspaceMemberId` | `String` | — |
| `joinedAt` | `DateTime` | `@default(now())` |

Index/contraintes : `@id` sur `id` ; `@@unique([teamId, workspaceMemberId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `team` | `Team` | `fields: [teamId], references: [id]` | `Cascade` | — |
| `workspaceMember` | `WorkspaceMember` | `fields: [workspaceMemberId], references: [id]` | `Cascade` | — |

### 1.10 `Space`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `description` | `String?` | `@db.Text` |
| `color` | `String` | `@default("#3B82F6")` |
| `icon` | `String` | `@default("folder")` |
| `order` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `workspaceId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

Relations inverses : `folders Folder[]`, `lists List[]`.

### 1.11 `Folder`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `color` | `String?` | — |
| `order` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `spaceId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `space` | `Space` | `fields: [spaceId], references: [id]` | `Cascade` | — |

Relation inverse : `lists List[]`.

### 1.12 `List`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `color` | `String?` | — |
| `order` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `spaceId` | `String` | — |
| `folderId` | `String?` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `space` | `Space` | `fields: [spaceId], references: [id]` | `Cascade` | — |
| `folder` | `Folder?` | `fields: [folderId], references: [id]` | `Cascade` | — |

Relations inverses : `statuses Status[]`, `tasks Task[]`, `goalTargets GoalTarget[]`.

### 1.13 `Status`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `color` | `String` | `@default("#6B7280")` |
| `type` | `String` | `@default("custom")` |
| `order` | `Int` | `@default(0)` |
| `listId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([listId, name])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `list` | `List` | `fields: [listId], references: [id]` | `Cascade` | — |

Relation inverse : `tasks Task[]`.

### 1.14 `Task`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | — |
| `description` | `String?` | `@db.Text` |
| `priority` | `String` | `@default("normal")` |
| `dueDate` | `DateTime?` | — |
| `startDate` | `DateTime?` | — |
| `timeEstimate` | `Int?` | — |
| `position` | `Float` | `@default(65536)` |
| `locked` | `Boolean` | `@default(false)` |
| `lockedPin` | `String?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `listId` | `String` | — |
| `statusId` | `String` | — |
| `assigneeId` | `String?` | — |
| `creatorId` | `String` | — |
| `parentId` | `String?` | — |

Index/contraintes : `@id` sur `id`. **Aucun `@@index`** sur les champs FK (`listId`, `statusId`, `assigneeId`, `creatorId`, `parentId`) ni sur `dueDate` / `startDate` / `position`. À recouper en phase 3 (axe BDD/PRF, tâches 8.2 et 12.4).

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `list` | `List` | `fields: [listId], references: [id]` | `Cascade` | — |
| `status` | `Status` | `fields: [statusId], references: [id]` | `Cascade` | — |
| `assignee` | `User?` (`@relation("TaskAssignee")`) | `fields: [assigneeId], references: [id]` | `SetNull` | — |
| `creator` | `User` (`@relation("TaskCreator")`) | `fields: [creatorId], references: [id]` | `Cascade` | — |
| `parent` | `Task?` (`@relation("TaskSubtasks")`) | `fields: [parentId], references: [id]` | `Cascade` | — |

Relations inverses : `subtasks Task[] @relation("TaskSubtasks")`, `checklists Checklist[]`, `taskTags TaskTag[]`, `comments Comment[]`, `activities Activity[]`, `timeEntries TimeEntry[]`, `customFieldValues CustomFieldValue[]`, `dependencies TaskDependency[] @relation("DependentTask")`, `dependents TaskDependency[] @relation("DependencyTask")`, `recurrence TaskRecurrence?`, `assignees TaskAssignee[]`, `reminders Reminder[]`, `attachments Attachment[]`.

### 1.15 `Checklist`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | — |
| `order` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `taskId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |

Relation inverse : `items ChecklistItem[]`.

### 1.16 `ChecklistItem`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `text` | `String` | — |
| `completed` | `Boolean` | `@default(false)` |
| `order` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `checklistId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `checklist` | `Checklist` | `fields: [checklistId], references: [id]` | `Cascade` | — |

### 1.17 `Tag`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `color` | `String` | — |
| `workspaceId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([workspaceId, name])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

Relation inverse : `taskTags TaskTag[]`.

### 1.18 `TaskTag`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `taskId` | `String` | — |
| `tagId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([taskId, tagId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |
| `tag` | `Tag` | `fields: [tagId], references: [id]` | `Cascade` | — |

### 1.19 `Comment`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `content` | `String` | `@db.Text` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `taskId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.20 `Activity`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `action` | `String` | — |
| `field` | `String?` | — |
| `oldValue` | `String?` | — |
| `newValue` | `String?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `taskId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.21 `Notification`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `type` | `String` | — |
| `message` | `String` | `@db.Text` |
| `read` | `Boolean` | `@default(false)` |
| `link` | `String?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.22 `CalendarToken`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `token` | `String` | `@unique @default(cuid())` |
| `userId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |

Index/contraintes : `@id` sur `id` ; `@unique` sur `token` ; `@@unique([userId])` (force la cardinalité 1-1 par utilisateur).

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.23 `GoogleCalendarSync`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String` | `@unique` |
| `accessToken` | `String` | `@db.Text` |
| `refreshToken` | `String` | `@db.Text` |
| `tokenExpiry` | `DateTime` | — |
| `calendarId` | `String` | `@default("primary")` |
| `syncEnabled` | `Boolean` | `@default(true)` |
| `lastSyncAt` | `DateTime?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Index/contraintes : `@id` sur `id` ; `@unique` sur `userId`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.24 `TimeEntry`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `description` | `String?` | `@db.Text` |
| `startTime` | `DateTime` | — |
| `endTime` | `DateTime?` | — |
| `duration` | `Int?` | — (commentaire : durée en secondes) |
| `billable` | `Boolean` | `@default(false)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `taskId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.25 `CustomField`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `type` | `String` | — (commentaire schéma : `text \| number \| dropdown \| checkbox \| date \| url \| email \| phone \| currency \| rating`) |
| `required` | `Boolean` | `@default(false)` |
| `options` | `String?` | `@db.Text` (JSON sérialisé) |
| `defaultValue` | `String?` | — |
| `order` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `workspaceId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

Relation inverse : `values CustomFieldValue[]`.

### 1.26 `CustomFieldValue`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `value` | `String` | `@db.Text` |
| `fieldId` | `String` | — |
| `taskId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([fieldId, taskId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `field` | `CustomField` | `fields: [fieldId], references: [id]` | `Cascade` | — |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |

### 1.27 `TaskDependency`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `type` | `String` | — (commentaire : `blocking \| waiting_on \| linked_to`) |
| `createdAt` | `DateTime` | `@default(now())` |
| `dependentTaskId` | `String` | — |
| `dependencyTaskId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([dependentTaskId, dependencyTaskId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `dependentTask` | `Task` (`@relation("DependentTask")`) | `fields: [dependentTaskId], references: [id]` | `Cascade` | — |
| `dependencyTask` | `Task` (`@relation("DependencyTask")`) | `fields: [dependencyTaskId], references: [id]` | `Cascade` | — |

### 1.28 `TaskRecurrence`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `pattern` | `String` | — (commentaire : `daily \| weekly \| biweekly \| monthly \| yearly \| custom`) |
| `interval` | `Int` | `@default(1)` |
| `daysOfWeek` | `String?` | — (JSON sérialisé) |
| `dayOfMonth` | `Int?` | — |
| `endDate` | `DateTime?` | — |
| `nextDueDate` | `DateTime?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `taskId` | `String` | `@unique` |

Index/contraintes : `@id` sur `id` ; `@unique` sur `taskId` (1-1 avec `Task`).

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |

### 1.29 `TaskAssignee`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `taskId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([taskId, userId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |
| `user` | `User` (`@relation("TaskAssignees")`) | `fields: [userId], references: [id]` | `Cascade` | — |

Note : ce modèle ouvre la voie aux multi-assignations en parallèle de la FK simple `Task.assigneeId` (cf. modèle `Task`). Cohabitation à recouper en phase 3 (axe BDD/LOG).

### 1.30 `Favorite`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `type` | `String` | — (commentaire : `task \| list \| space \| folder`) |
| `targetId` | `String` | — |
| `order` | `Int` | `@default(0)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([userId, type, targetId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

Note : `targetId` est une FK polymorphe non contrainte (le type cible dépend de `type`). À recouper en phase 3 (axe BDD).

### 1.31 `Attachment`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `url` | `String` | — |
| `type` | `String` | `@default("link")` (commentaire : `link \| file`) |
| `mimeType` | `String?` | — |
| `size` | `Int?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `taskId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task` | `fields: [taskId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.32 `Goal`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `description` | `String?` | `@db.Text` |
| `color` | `String` | `@default("#7C3AED")` |
| `dueDate` | `DateTime?` | — |
| `locked` | `Boolean` | `@default(false)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `workspaceId` | `String` | — |
| `creatorId` | `String` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |
| `creator` | `User` | `fields: [creatorId], references: [id]` | **non spécifié** (défaut Prisma : `Restrict`) | — |

Relation inverse : `targets GoalTarget[]`.

### 1.33 `GoalTarget`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `type` | `String` | `@default("number")` (commentaire : `number \| currency \| boolean \| task_completion`) |
| `currentValue` | `Float` | `@default(0)` |
| `targetValue` | `Float` | `@default(100)` |
| `unit` | `String?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `goalId` | `String` | — |
| `listId` | `String?` | — |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `goal` | `Goal` | `fields: [goalId], references: [id]` | `Cascade` | — |
| `list` | `List?` | `fields: [listId], references: [id]` | `SetNull` | — |

### 1.34 `Reminder`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | — |
| `description` | `String?` | — |
| `remindAt` | `DateTime` | — |
| `completed` | `Boolean` | `@default(false)` |
| `taskId` | `String?` | — |
| `userId` | `String` | — |
| `workspaceId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `task` | `Task?` | `fields: [taskId], references: [id]` | `SetNull` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

### 1.35 `TaskTemplate`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `description` | `String?` | — |
| `priority` | `String` | `@default("normal")` |
| `checklists` | `Json?` | — |
| `tags` | `Json?` | — |
| `creatorId` | `String` | — |
| `workspaceId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Index/contraintes : `@id` sur `id`. Aucun `@@index` ni `@@unique`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `creator` | `User` | `fields: [creatorId], references: [id]` | `Cascade` | — |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

### 1.36 `Note`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `title` | `String` | `@default("Sans titre")` |
| `content` | `String` | `@db.Text @default("")` |
| `color` | `String` | `@default("#ffffff")` |
| `pinned` | `Boolean` | `@default(false)` |
| `userId` | `String` | — |
| `workspaceId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Index/contraintes : `@id` sur `id` ; `@@index([userId, workspaceId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

### 1.37 `PushSubscription`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `endpoint` | `String?` | `@unique` |
| `p256dh` | `String?` | — |
| `auth` | `String?` | — |
| `fcmToken` | `String?` | `@unique` |
| `provider` | `String` | `@default("web")` (commentaire : `web \| fcm`) |
| `userId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |

Index/contraintes : `@id` sur `id` ; `@unique` sur `endpoint` ; `@unique` sur `fcmToken` ; `@@index([userId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.38 `NotificationPreferences`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `userId` | `String` | `@unique` |
| `taskAssigned` | `Boolean` | `@default(true)` |
| `taskComment` | `Boolean` | `@default(true)` |
| `taskStatusChanged` | `Boolean` | `@default(true)` |
| `taskDueSoon` | `Boolean` | `@default(true)` |
| `dailySummary` | `Boolean` | `@default(true)` |
| `reminders` | `Boolean` | `@default(true)` |
| `teamActivity` | `Boolean` | `@default(true)` |
| `budgetAlert` | `Boolean` | `@default(true)` |
| `pushEnabled` | `Boolean` | `@default(true)` |

Index/contraintes : `@id` sur `id` ; `@unique` sur `userId`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.39 `Budget`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `description` | `String?` | `@db.Text` |
| `amount` | `Float` | — |
| `currency` | `String` | `@default("EUR")` |
| `color` | `String` | `@default("#10B981")` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `workspaceId` | `String` | — |
| `creatorId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@index([workspaceId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |
| `creator` | `User` | `fields: [creatorId], references: [id]` | **non spécifié** (défaut : `Restrict`) | — |

Relations inverses : `transactions BudgetTransaction[]`, `alerts BudgetAlert[]`.

### 1.40 `BudgetTransaction`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `amount` | `Float` | — |
| `type` | `String` | — (commentaire : `income \| expense`) |
| `subType` | `String?` | — |
| `description` | `String?` | — |
| `date` | `DateTime` | `@default(now())` |
| `createdAt` | `DateTime` | `@default(now())` |
| `isRecurring` | `Boolean` | `@default(false)` |
| `recurrenceRule` | `String?` | — |
| `recurrenceEnd` | `DateTime?` | — |
| `isTransfer` | `Boolean` | `@default(false)` |
| `sourceBudgetId` | `String?` | — |
| `targetBudgetId` | `String?` | — |
| `budgetId` | `String` | — |
| `creatorId` | `String` | — |
| `categoryId` | `String?` | — |

Index/contraintes : `@id` sur `id` ; `@@index([budgetId])`, `@@index([categoryId])`, `@@index([date])`, `@@index([type])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `budget` | `Budget` | `fields: [budgetId], references: [id]` | `Cascade` | — |
| `creator` | `User` | `fields: [creatorId], references: [id]` | **non spécifié** (défaut : `Restrict`) | — |
| `category` | `BudgetCategory?` | `fields: [categoryId], references: [id]` | `SetNull` | — |

Relation inverse : `tags BudgetTransactionTag[]`. Les champs `sourceBudgetId` / `targetBudgetId` sont des FK logiques **non matérialisées** par une `@relation` Prisma (à recouper en phase 3, axe BDD).

### 1.41 `BudgetCategory`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `color` | `String` | `@default("#6B7280")` |
| `icon` | `String` | `@default("tag")` |
| `type` | `String` | `@default("both")` (commentaire : `income \| expense \| both`) |
| `workspaceId` | `String` | — |
| `parentId` | `String?` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([workspaceId, name])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |
| `parent` | `BudgetCategory?` (`@relation("CategoryChildren")`) | `fields: [parentId], references: [id]` | `SetNull` | — |

Relations inverses : `children BudgetCategory[] @relation("CategoryChildren")`, `transactions BudgetTransaction[]`.

### 1.42 `BudgetTransactionTag`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `transactionId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([transactionId, name])` ; `@@index([transactionId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `transaction` | `BudgetTransaction` | `fields: [transactionId], references: [id]` | `Cascade` | — |

### 1.43 `BudgetTemplate`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `amount` | `Float` | — |
| `type` | `String` | — (commentaire : `income \| expense`) |
| `subType` | `String?` | — |
| `description` | `String?` | — |
| `categoryId` | `String?` | — |
| `workspaceId` | `String` | — |
| `creatorId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |

Index/contraintes : `@id` sur `id` ; `@@index([workspaceId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |
| `creator` | `User` | `fields: [creatorId], references: [id]` | **non spécifié** (défaut : `Restrict`) | — |

Note : `categoryId` est un champ scalaire **sans relation `@relation`** vers `BudgetCategory` (FK logique non contrainte).

### 1.44 `BudgetAlert`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `type` | `String` | — (commentaire : `threshold \| recurring_missing \| overspend`) |
| `threshold` | `Float?` | — |
| `isActive` | `Boolean` | `@default(true)` |
| `budgetId` | `String` | — |
| `userId` | `String` | — |
| `createdAt` | `DateTime` | `@default(now())` |

Index/contraintes : `@id` sur `id` ; `@@index([budgetId])`, `@@index([userId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `budget` | `Budget` | `fields: [budgetId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

### 1.45 `FinanceAccount`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `type` | `String` | — (commentaire : `bank \| cash \| crypto \| savings \| investment \| other`) |
| `bankName` | `String?` | — |
| `currency` | `String` | `@default("EUR")` |
| `balance` | `Float` | `@default(0)` |
| `color` | `String` | `@default("#3B82F6")` |
| `isDefault` | `Boolean` | `@default(false)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `workspaceId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@index([workspaceId])`, `@@index([userId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

Relations inverses : `transactions FinanceTransaction[]`, `goals FinanceGoal[]`.

### 1.46 `FinanceCategory`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `type` | `String` | — (commentaire : `income \| expense`) |
| `color` | `String` | `@default("#6B7280")` |
| `icon` | `String` | `@default("tag")` |
| `isDefault` | `Boolean` | `@default(false)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `workspaceId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@unique([workspaceId, name, type])` ; `@@index([workspaceId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |

Relation inverse : `transactions FinanceTransaction[]`.

### 1.47 `FinanceTransaction`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `amount` | `Float` | — |
| `type` | `String` | — (commentaire : `income \| expense \| transfer`) |
| `description` | `String?` | — |
| `date` | `DateTime` | `@default(now())` |
| `createdAt` | `DateTime` | `@default(now())` |
| `isTransfer` | `Boolean` | `@default(false)` |
| `targetAccountId` | `String?` | — |
| `isRecurring` | `Boolean` | `@default(false)` |
| `recurringFrequency` | `String?` | — (commentaire : `weekly \| monthly \| yearly`) |
| `accountId` | `String` | — |
| `userId` | `String` | — |
| `categoryId` | `String?` | — |

Index/contraintes : `@id` sur `id` ; `@@index([accountId])`, `@@index([userId])`, `@@index([categoryId])`, `@@index([date])`, `@@index([type])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `account` | `FinanceAccount` | `fields: [accountId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |
| `category` | `FinanceCategory?` | `fields: [categoryId], references: [id]` | `SetNull` | — |

Note : `targetAccountId` est une FK logique **non matérialisée** par une `@relation` Prisma (transferts inter-comptes non contraints au niveau base).

### 1.48 `FinanceGoal`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `name` | `String` | — |
| `description` | `String?` | — |
| `targetAmount` | `Float` | — |
| `currentAmount` | `Float` | `@default(0)` |
| `currency` | `String` | `@default("EUR")` |
| `color` | `String` | `@default("#10B981")` |
| `deadline` | `DateTime?` | — |
| `isCompleted` | `Boolean` | `@default(false)` |
| `createdAt` | `DateTime` | `@default(now())` |
| `updatedAt` | `DateTime` | `@updatedAt` |
| `workspaceId` | `String` | — |
| `userId` | `String` | — |
| `accountId` | `String?` | — |

Index/contraintes : `@id` sur `id` ; `@@index([workspaceId])`, `@@index([userId])`, `@@index([accountId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `workspace` | `Workspace` | `fields: [workspaceId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |
| `account` | `FinanceAccount?` | `fields: [accountId], references: [id]` | `SetNull` | — |

Relation inverse : `contributions FinanceGoalContribution[]`.

### 1.49 `FinanceGoalContribution`

| Champ | Type | Attributs |
| --- | --- | --- |
| `id` | `String` | `@id @default(cuid())` |
| `amount` | `Float` | — |
| `date` | `DateTime` | `@default(now())` |
| `note` | `String?` | — |
| `createdAt` | `DateTime` | `@default(now())` |
| `goalId` | `String` | — |
| `userId` | `String` | — |

Index/contraintes : `@id` sur `id` ; `@@index([goalId])`, `@@index([userId])`.

Relations :

| Relation | Cible | Champs / Référence | onDelete | onUpdate |
| --- | --- | --- | --- | --- |
| `goal` | `FinanceGoal` | `fields: [goalId], references: [id]` | `Cascade` | — |
| `user` | `User` | `fields: [userId], references: [id]` | `Cascade` | — |

## 2. Synthèse transverse (générateur, datasource, paramètres globaux)

| Élément | Valeur (telle qu'elle apparaît dans `schema.prisma`) |
| --- | --- |
| Generator | `prisma-client-js` ; `output = "../node_modules/.prisma/client"` ; `previewFeatures = ["driverAdapters"]` |
| Datasource | `provider = "postgresql"` ; `url = env("DATABASE_URL")` |
| Nombre total de modèles | **49** (Auth : 4 ; Workspace/Team : 5 ; Hiérarchie : 4 ; Tâches & dépendances : 11 ; Calendrier & temps : 3 ; Custom fields : 2 ; Notifications/Push : 3 ; Notes/Goals/Reminders/Templates : 5 ; Finances : 12) |
| Nombre total de `@@index` | 22 (cf. récapitulatif ci-dessous) |
| Nombre total de `@@unique` | 16 |
| Nombre total de `@unique` champ-niveau | 11 (`User.email`, `Session.sessionToken`, `VerificationToken.token`, `WorkspaceInvite.token`, `CalendarToken.token`, `GoogleCalendarSync.userId`, `TaskRecurrence.taskId`, `PushSubscription.endpoint`, `PushSubscription.fcmToken`, `NotificationPreferences.userId`) |

### 2.1 Récapitulatif des `@@index`

| Modèle | Index composite ou simple |
| --- | --- |
| `WorkspaceInvite` | `@@index([token])` |
| `Note` | `@@index([userId, workspaceId])` |
| `PushSubscription` | `@@index([userId])` |
| `Budget` | `@@index([workspaceId])` |
| `BudgetTransaction` | `@@index([budgetId])`, `@@index([categoryId])`, `@@index([date])`, `@@index([type])` |
| `BudgetTransactionTag` | `@@index([transactionId])` |
| `BudgetTemplate` | `@@index([workspaceId])` |
| `BudgetAlert` | `@@index([budgetId])`, `@@index([userId])` |
| `FinanceAccount` | `@@index([workspaceId])`, `@@index([userId])` |
| `FinanceCategory` | `@@index([workspaceId])` |
| `FinanceTransaction` | `@@index([accountId])`, `@@index([userId])`, `@@index([categoryId])`, `@@index([date])`, `@@index([type])` |
| `FinanceGoal` | `@@index([workspaceId])`, `@@index([userId])`, `@@index([accountId])` |
| `FinanceGoalContribution` | `@@index([goalId])`, `@@index([userId])` |

### 2.2 Récapitulatif des `@@unique`

`Account([provider, providerAccountId])`, `VerificationToken([identifier, token])`, `WorkspaceMember([workspaceId, userId])`, `WorkspaceInvite([workspaceId, email])`, `Team([workspaceId, name])`, `TeamMember([teamId, workspaceMemberId])`, `Status([listId, name])`, `Tag([workspaceId, name])`, `TaskTag([taskId, tagId])`, `CustomFieldValue([fieldId, taskId])`, `TaskDependency([dependentTaskId, dependencyTaskId])`, `TaskAssignee([taskId, userId])`, `Favorite([userId, type, targetId])`, `CalendarToken([userId])`, `BudgetCategory([workspaceId, name])`, `BudgetTransactionTag([transactionId, name])`, `FinanceCategory([workspaceId, name, type])`.

### 2.3 Récapitulatif des `onDelete` / `onUpdate`

| Comportement déclaré | Occurrences |
| --- | --- |
| `onDelete: Cascade` | 50+ relations (la grande majorité, conforme à un modèle multi-tenant rattaché aux racines `Workspace` / `User`). |
| `onDelete: SetNull` | 7 relations : `Task.assignee` (User), `List.folder`, `GoalTarget.list`, `Reminder.task`, `BudgetTransaction.category`, `BudgetCategory.parent`, `FinanceTransaction.category`, `FinanceGoal.account`. |
| `onDelete` non spécifié (défaut Prisma : `Restrict` côté requis) | 3 relations : `Goal.creator`, `Budget.creator`, `BudgetTransaction.creator`, `BudgetTemplate.creator` (toutes vers `User`). À recouper en phase 3 (axe BDD, tâche 8.3) — la suppression d'un utilisateur sera bloquée tant qu'il reste des `Goal`/`Budget`/`BudgetTransaction`/`BudgetTemplate` créés par lui. |
| `onUpdate` explicite | **Aucune** relation ne le précise — le comportement par défaut Prisma s'applique partout (`Cascade` pour PostgreSQL côté FK). |

## 3. Migrations présentes sous `prisma/migrations/`

Vérifications effectuées (cf. annexe A, lignes 2 à 5) :

- `ls -la prisma/` retourne uniquement `schema.prisma` et `seed.ts` ; **le sous-dossier `prisma/migrations/` n'existe pas sur disque**.
- `git ls-files prisma` retourne uniquement `prisma/schema.prisma` et `prisma/seed.ts` ; aucune migration n'est suivie par git dans la branche courante.
- `git log --all -- 'prisma/migrations/*'` ne renvoie **aucun commit** dans aucune branche locale ; aucune migration n'a jamais été versionnée et supprimée.
- `.gitignore` n'exclut pas `prisma/migrations/` (les seules entrées Prisma concernent `prisma/dev.db` et `prisma/dev.db-journal`, étiquetées « legacy »).
- `package.json` n'expose **aucun script `prisma migrate dev/deploy`** ni `prisma db push` ; la section `"prisma"` ne contient que la configuration du seed.

Conclusion factuelle : **0 migration** présente dans le dépôt à la date de l'audit. La liste chronologique attendue est donc vide.

| # | Nom de la migration | Date / horodatage | Résumé |
| --- | --- | --- | --- |
| — | — | — | Aucune migration. |

## 4. Dérives détectées

Cette section recense les écarts apparents entre le schéma Prisma et l'historique des migrations. Elle ne classe pas de Findings (la classification SEC/BDD/INF intervient en phase 3) ; elle prépare les tâches 8.1, 8.3 et 8.4 du plan d'audit.

### 4.1 Absence totale de dossier `prisma/migrations/`

- **Constat** : le schéma `prisma/schema.prisma` déclare 49 modèles avec contraintes, index et relations cascadées, mais **aucune migration** n'existe dans le dépôt (ni sur disque, ni dans l'historique git, ni hors index).
- **Implication** : la base PostgreSQL de production a nécessairement été synchronisée par un canal **non versionné** — typiquement `prisma db push` ou une création manuelle. Cela signifie que :
  - L'état réel du schéma SQL en production n'est pas reproductible à partir du dépôt.
  - Il n'existe aucun « shadow » historique permettant à un nouveau membre de l'équipe de provisionner un environnement avec `prisma migrate deploy`.
  - Toute évolution future appliquée via `prisma db push` (cf. CLAUDE_Rules § 3, qui interdit `prisma db push` sans confirmation) ne laisse pas de trace dans le code.
- **À confirmer en phase 3** (axe BDD, tâche 8.4) puis remontée en Finding `F-BDD-NNN`. Sévérité minimale attendue : Severity_Medium (clause 7.3 de `requirements.md` : cohérence migrations ↔ schéma) ; classement potentiel en Severity_High si la base réelle diverge du schéma versionné.

### 4.2 Dérives directes schéma → migration

- **Constat** : par définition, **chaque modèle** (`User`, `Workspace`, …, `FinanceGoalContribution`) et **chaque champ** déclaré dans `schema.prisma` se retrouve « sans migration correspondante ». Lister exhaustivement les 49 modèles ici reviendrait à dupliquer la section 1 ; la dérive est globale.
- **À recouper en phase 3** : l'écart se traduit en pratique par un Finding unique « absence d'historique de migrations » plutôt qu'en 49 Findings individuels (consolidation 14.1/14.2).

### 4.3 Dérives inverses migration → schéma

- **Constat** : aucune migration existant et faisant référence à un modèle ou champ absent du schéma actuel n'a été détectée — puisque, comme noté en 4.1, **aucune migration n'existe**.

### 4.4 Observations adjacentes (à recouper en phase 3, hors périmètre stricte de la dérive migrations)

Ces points relèvent du croisement schéma ↔ usage code (tâches 8.1 à 8.5) plutôt que de la cohérence migrations ↔ schéma, mais sont consignés ici pour ne pas être perdus :

- **FK logiques non contraintes** : `WorkspaceInvite.invitedById`, `Favorite.targetId` (polymorphe), `BudgetTransaction.sourceBudgetId` / `targetBudgetId`, `BudgetTemplate.categoryId`, `FinanceTransaction.targetAccountId`. Ces champs sont des FK conceptuelles non matérialisées par une `@relation` Prisma, donc non contraintes au niveau base et non couvertes par les cascades.
- **`onDelete` implicite vers `User` côté création** : `Goal.creator`, `Budget.creator`, `BudgetTransaction.creator`, `BudgetTemplate.creator` ne précisent pas `onDelete`. La suppression d'un utilisateur est donc bloquée tant qu'il reste des entités qu'il a créées (`Restrict` par défaut Prisma sur côté requis), ce qui peut entrer en conflit avec le `Cascade` déclaré sur `WorkspaceMember.user`, `Comment.user`, `Activity.user`, `Notification.user`, etc. (les autres relations supprimeraient les entités liées tandis que `Goal`/`Budget`/`BudgetTransaction`/`BudgetTemplate` empêcheraient la suppression).
- **Champs FK sans `@@index`** sur des relations potentiellement chaudes : `Task.listId`, `Task.statusId`, `Task.assigneeId`, `Task.creatorId`, `Task.parentId` ; `Comment.taskId` / `Comment.userId` ; `Activity.taskId` / `Activity.userId` ; `Notification.userId` ; `TimeEntry.taskId` / `TimeEntry.userId` ; `Attachment.taskId` / `Attachment.userId` ; `Reminder.taskId` / `Reminder.userId` / `Reminder.workspaceId` ; `TaskAssignee.taskId` / `TaskAssignee.userId` (couverts par `@@unique([taskId, userId])` mais pas par un index simple sur `userId`) ; `Favorite.userId` (couvert partiellement par `@@unique([userId, type, targetId])`) ; `Goal.workspaceId` / `Goal.creatorId` ; `GoalTarget.goalId` / `GoalTarget.listId`. À recouper en tâche 8.2 (axe BDD) — Property 7 impose Severity_Medium minimum si l'usage est avéré.
- **Cohabitation `Task.assigneeId` (FK simple) ↔ `TaskAssignee` (table d'association)** : deux mécanismes d'assignation coexistent dans le schéma. Source potentielle de double vérité (à recouper en tâche 8.1).

## 5. Références

- Source primaire : `prisma/schema.prisma` (lecture intégrale).
- Vérifications externes : `ls -la prisma/`, `grep .gitignore`, `git ls-files prisma`, `git log --all -- 'prisma/migrations/*'` (annexe A, lignes 2 à 5).
- Conventions : `design.md` § Components and Interfaces > Annexes > E ; `requirements.md` clauses 2.2, 7.1, 7.3.
- Hors périmètre de cette annexe : analyse des usages effectifs Prisma dans le code applicatif (tâche 8.1), audit des index manquants par rapport aux requêtes (tâche 8.2), audit des `onDelete` (tâche 8.3), audit migrations ↔ schéma (tâche 8.4), audit N+1 / scans complets (tâche 8.5), SQL brut (tâche 8.6).
