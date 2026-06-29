# Rapport d'audit — full-app-audit (application « Done »)

> Audit 360° **strictement en lecture seule** de l'application Done (clone ClickUp : Next.js 16 / App Router, Prisma 5 / PostgreSQL Neon, NextAuth 4, SWR 2, Capacitor 8 / Android, déploiement Vercel). Aucun fichier source applicatif, schéma Prisma, migration ni donnée n'a été modifié. Toutes les écritures sont confinées à `.kiro/specs/full-app-audit/`.
>
> **Total : 153 Findings** — 33 High, 120 Medium. Aucun constat de sévérité inférieure à Medium n'est consigné (cf. `requirements.md` 3.3).

---

## 1. Synthèse exécutive

### Risques majeurs

- **Absence généralisée de contrôle d'appartenance (ownership) sur les routes API** — 6 Findings High (axe SEC). Les modules Finance, Goals, Tâches/Listes, sous-ressources de tâche, Time Tracking et Templates authentifient l'appelant mais ne vérifient pas que la ressource visée appartient à un workspace dont il est membre. Un utilisateur authentifié peut **lire, modifier et corrompre les données d'autres utilisateurs/workspaces** (soldes financiers, statuts de tâches, entrées de temps avec noms et e-mails). C'est le risque le plus grave de l'audit.
- **Intégrité et reproductibilité de la base de données compromises** — 11 Findings High (axe BDD). Aucune migration Prisma n'est versionnée (schéma de production non reproductible, pas de rollback), le `buildCommand` Vercel n'applique pas les migrations, plusieurs cascades `onDelete` détruisent l'historique financier ou bloquent la suppression d'un utilisateur (RGPD), et des FK polymorphes/logiques ne sont pas contraintes.
- **Requêtes non bornées et N+1 sur des tables à croissance illimitée** — favoris polymorphes, crons (`budget-alerts`, `daily-tasks`, `upcoming-deadlines`), `GET /api/budget`, et 18 endpoints de listing sans `take:`/pagination. Coût compute Vercel/Neon non maîtrisé et risque de timeout/OOM en production.
- **Sécurité du token d'authentification mobile** — 1 Finding High (MOB). Le `mobile_auth_token` (JWT 30 j sans révocation) est sauvegardé en clair par Android Auto Backup (`allowBackup="true"`), stocké en `localStorage` et exposé par une CSP permissive (`'unsafe-inline'`/`'unsafe-eval'`).
- **Accessibilité bloquante de l'interface** — 8 Findings High (UI). Zoom utilisateur désactivé globalement (WCAG 1.4.4), modales/tiroirs Radix sans nom accessible, ≥ 35 boutons icônes sans `aria-label`, 6 pages sans `<h1>`, et 40 fetchers SWR (68 %) dont les erreurs sont silencieusement ignorées.
- **Infrastructure cron fragile** — 2 Findings High (INF). Les handlers cron ne vérifient pas le header standard `Authorization: Bearer <CRON_SECRET>` de Vercel (risque de 401 systématique → notifications jamais envoyées) et un `try/catch` global unique abandonne tout le lot dès la première itération en erreur.

### Tableau croisé sévérité × axe

| Axe       | High | Medium | Total |
| --------- | ---- | ------ | ----- |
| UI        | 8    | 21     | 29    |
| UX        | 4    | 13     | 17    |
| LOG       | 1    | 29     | 30    |
| BDD       | 11   | 20     | 31    |
| INF       | 2    | 11     | 13    |
| MOB       | 1    | 11     | 12    |
| SEC       | 6    | 7      | 13    |
| PRF       | 0    | 8      | 8     |
| **Total** | **33** | **120** | **153** |

Vérification (Property 4) : Σ(High) = 8+4+1+11+2+1+6+0 = **33** ; Σ(Medium) = 21+13+29+20+11+11+7+8 = **120** ; Σ(Total ligne) = 29+17+30+31+13+12+13+8 = **153**. Les trois sommes concordent avec le nombre total de Findings des sections par axe : **33 + 120 = 153**. ✓

Lecture rapide : les axes BDD (31), LOG (30) et UI (29) concentrent le plus de Findings ; SEC (46 % de High) et BDD (35 % de High) portent l'essentiel du risque de sécurité et d'intégrité ; PRF ne contient que de la dette Medium (cohérent avec une analyse statique sans profilage en production).

---

## 2. Périmètre et méthode

### Sources lues

- **Cadrage** : `CLAUDE.md` (règles anti-destruction), `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `vercel.json`, `.env.example`, `capacitor.config.ts`, `android/app/build.gradle`, `android/app/src/main/AndroidManifest.xml`, `BUILD_APK.md`, `INSTALL_MOBILE.md`.
- **Code applicatif** : intégralité de `src/app/**` (pages, layouts, 96 routes `route.ts`), `src/components/**`, `src/hooks/**`, `src/lib/**`, `src/providers/**`, `prisma/schema.prisma` (49 modèles), `prisma/seed.ts`.
- **Mobile/Android** : `capacitor.config.ts`, `android/app/src/main/assets/capacitor.{config,plugins}.json`, manifeste, `res/xml/file_paths.xml`, `build.gradle`.

### Commandes exécutées

Toutes les commandes shell exécutées (build, recherches `grep`/`find`, inspections `git` de lecture) sont consignées dans l'**Annexe A**. La seule commande de build est `npm run build` (= `next build`), non destructive (écriture confinée à `.next/`). Le log complet figure en **Annexe B** (exit code `0`, 19 s, aucun warning bloquant). Aucune commande `prisma migrate`/`db push`, `vercel deploy`, `git push`/`commit` n'a été exécutée.

### Périmètre exclu (à confirmer via External_Console)

- Configuration effective de la **console Vercel** (variables d'environnement réellement définies, plan tarifaire et rétention des Runtime Logs, région des fonctions, politique de retry des crons, `DATABASE_URL` par environnement de preview).
- Configuration effective de la **console Neon** (région de l'instance Postgres, état réel du schéma vs `schema.prisma`).
- Comportement runtime non observable en analyse statique : poids réel des bundles (`@next/bundle-analyzer` non exécuté), libellés exacts des erreurs FCM en production, contrastes mesurés au pixel.

### Conformité aux CLAUDE_Rules

L'audit a respecté l'intégralité des règles anti-destruction de `CLAUDE.md` : aucune opération Postgres/Neon (`migrate`, `db push`, `DROP`, `TRUNCATE`, `DELETE`/`UPDATE` sans `WHERE`), aucune commande git destructive (`reset --hard`, `push`, `commit`), aucune action Vercel (`deploy`, `env rm`), aucun secret recopié (variables citées par nom uniquement). La grille de lecture des axes LOG/UI/UX/SEC applique les conventions du projet (SWR `res.ok`, params API en `Promise`, UI 100 % français). Détail dans `notes/00-claude-rules.md`.

---

## 3. Findings par axe

> Pour chaque axe, les Findings sont triés par **sévérité décroissante** (High avant Medium) puis par **identifiant croissant** (Property 5). Chaque Finding respecte le schéma normalisé du design (8 champs non vides ; identifiant `F-{AXIS}-{NNN}` ; preuve de type `path:line`, `path#symbole` ou `commande:`).

### 3.1 Axe UI — Interface

Inspection des primitives `shadcn/ui` et Radix, de l'accessibilité (ARIA, hiérarchie des titres, focus, contraste, alt, labels), du responsive (breakpoints Tailwind, débordement mobile), des design tokens et des états `loading`/`error`/`empty`. 29 Findings (8 High, 21 Medium).

#### F-UI-001 — `<DialogContent>` sans `<DialogTitle>` dans le wrapper `CommandDialog` (palette Cmd+K)

- **Axe** : UI
- **Sévérité** : High
- **Description** : Le wrapper `CommandDialog` (`src/components/ui/command.tsx`) rend un `<DialogContent>` sans `<DialogTitle>` ni `<DialogDescription>`. Radix Dialog requiert un titre accessible : sans lui, le rôle `dialog` reste sans nom accessible et un avertissement console est émis en dev. L'unique consommateur (`search-command.tsx`) n'ajoute aucun titre. La palette de recherche globale est donc rendue sans nom pour les technologies d'assistance.
- **Preuve** : `src/components/ui/command.tsx:31` ; `src/components/search/search-command.tsx:114` ; `commande: for f in $(grep -rln '<DialogContent' src/); do grep -c '<DialogTitle' "$f"; done` (résultat `DialogTitle=0` pour `command.tsx`).
- **Impact** : Blocage du parcours « recherche globale » pour les lecteurs d'écran (NVDA, VoiceOver, TalkBack) : à l'ouverture, le dialogue n'annonce ni rôle ni objet. Non-conformité WCAG 4.1.2.
- **Recommandation** : Insérer un `<DialogTitle>` masqué via `VisuallyHidden` (« Recherche dans le workspace ») et une `DialogDescription` masquée, ou exposer une prop `title` obligatoire sur `CommandDialog`.

#### F-UI-002 — `<DialogContent>` sans `<DialogTitle>` dans `TaskDetailModal` (modale principale d'édition de tâche)

- **Axe** : UI
- **Sévérité** : High
- **Description** : `TaskDetailModal` ouvre un `<DialogContent>` plein écran (mobile) / large (desktop) sans aucun `<DialogTitle>` ni `<DialogDescription>`. L'en-tête ne montre qu'un `<span>` avec le préfixe d'identifiant, insuffisant comme nom accessible. C'est le point d'entrée principal d'édition de tâche dans toute l'application.
- **Preuve** : `src/components/task/task-detail-modal.tsx:22` ; `commande: grep -c '<DialogTitle' src/components/task/task-detail-modal.tsx` (sortie : `0`).
- **Impact** : Blocage du parcours métier le plus utilisé pour les technologies d'assistance ; la modale s'ouvre sans nom annoncé. Non-conformité WCAG 4.1.2 et 2.4.6 ; dégradation accrue sous TalkBack (Capacitor).
- **Recommandation** : Ajouter un `<DialogHeader>` + `<DialogTitle>` rattaché au titre de la tâche (ou un titre masqué via `VisuallyHidden`) et une `<DialogDescription>` masquée.

#### F-UI-003 — `<SheetContent>` sans `<SheetTitle>` dans `MobileSidebar` (navigation principale mobile)

- **Axe** : UI
- **Sévérité** : High
- **Description** : `MobileSidebar` rend `<SheetContent>` (implémenté sur Radix Dialog) sans `<SheetTitle>` ni `<SheetDescription>`. Ce tiroir est l'unique navigation latérale en `< md` (déclenchée par le hamburger). Radix impose un nom accessible.
- **Preuve** : `src/components/layout/mobile-sidebar.tsx:30` ; `src/components/ui/sheet.tsx:4` (import Radix Dialog) ; `commande: for f in $(grep -rln '<SheetContent' src/); do echo "$f $(grep -c '<SheetTitle' $f)"; done` (sortie : `mobile-sidebar.tsx 0`).
- **Impact** : Blocage de l'accessibilité de la navigation mobile : le panneau (espaces, listes, tâches) n'a pas de nom accessible. Non-conformité WCAG 4.1.2 et 2.4.1.
- **Recommandation** : Ajouter un `<SheetHeader>` + `<SheetTitle>Navigation</SheetTitle>` (masquable via `VisuallyHidden`).

#### F-UI-004 — Boutons icônes sans `aria-label` ni `<span class="sr-only">` (≥ 35 occurrences)

- **Axe** : UI
- **Sévérité** : High
- **Description** : 50 boutons `<Button size="icon">` existent dans `src/`, mais seulement 21 `aria-label` et 2 `sr-only` au total. Plus de 35 boutons icône (hamburger mobile, cloche de notifications, menu d'action de tâche, favori, fermeture de formulaire, navigation calendrier/gantt, suppression d'entités…) n'ont aucun nom accessible.
- **Preuve** : `commande: grep -rn 'size="icon"' src/ --include='*.tsx'` (50) ; `commande: grep -rn 'aria-label' src/ | wc -l` (21) ; `commande: grep -rn 'sr-only' src/ | wc -l` (2) ; ex. `src/components/layout/mobile-sidebar.tsx:26`, `src/components/notifications/notification-bell.tsx:28`, `src/components/task/task-action-menu.tsx:166`.
- **Impact** : Blocage majeur d'accessibilité sur tous les parcours principaux : les contrôles s'annoncent « bouton » sans verbe ni objet. Non-conformité WCAG 4.1.2 et 2.5.3 ; `title` non lu par TalkBack.
- **Recommandation** : Convention « tout `<Button size="icon">` fournit `aria-label` ou `<span class="sr-only">` » ; règle ESLint `jsx-a11y/control-has-associated-label` ; compléter les ≥ 35 occurrences (priorité aux composants partagés).

#### F-UI-007 — Zoom utilisateur désactivé sur toute l'application (`maximumScale: 1`, `userScalable: false`)

- **Axe** : UI
- **Sévérité** : High
- **Description** : Le `viewport` exporté par `src/app/layout.tsx` impose `maximumScale: 1` et `userScalable: false`, empêchant tout zoom manuel sur toutes les pages (publiques et plateforme). Violation directe de WCAG 1.4.4 (texte agrandissable à 200 %). Sur iOS Safari et WebView Android Capacitor, le pinch-to-zoom est bloqué.
- **Preuve** : `src/app/layout.tsx:20` (`maximumScale: 1`), `src/app/layout.tsx:21` (`userScalable: false`) ; `commande: grep -n 'maximumScale\|userScalable' src/app/layout.tsx`.
- **Impact** : Blocage d'accessibilité pour utilisateurs malvoyants/âgés, aggravé sur la cible mobile Capacitor. Non-conformité WCAG 1.4.4 (AA) bloquante pour RGAA/ADA/EAA.
- **Recommandation** : Retirer `maximumScale` et `userScalable` ; ne conserver que `width: device-width`, `initialScale: 1`, `viewportFit: cover`. Corriger les composants qui se déforment au zoom plutôt que désactiver globalement.

#### F-UI-008 — Pages sans aucun `<h1>` : 6 pages plateforme principales (notes, vues list/board/calendar/gantt, détail tâche en édition)

- **Axe** : UI
- **Sévérité** : High
- **Description** : Sur 29 pages, 6 ne déclarent aucun `<h1>` ni `PageHeader` : `notes/page.tsx`, les 4 sous-pages de vues de liste (`list-view`, `board`, `calendar`, `gantt`) et la racine de liste. Sur la page de détail de tâche, le `<h1>` disparaît en mode édition (remplacé par un `<input>`). Les vues de liste, où l'utilisateur passe le plus de temps, n'ont aucun titre nommant la liste consultée.
- **Preuve** : `commande: for f in $(find src/app -name page.tsx); do grep -n -E '<h[1-6]|PageHeader' "$f"; done` ; `src/app/(platform)/notes/page.tsx:217` ; `src/components/task/task-detail-content.tsx:160` vs `:179`.
- **Impact** : Blocage d'accessibilité sur les vues de liste : pages annoncées sans nom, raccourci `H` inopérant. Non-conformité WCAG 2.4.6 et 1.3.1 (niveau A).
- **Recommandation** : Ajouter un `<h1>` (ou `PageHeader`, éventuellement masqué) reprenant le nom de la liste sur chaque vue ; conserver un `<h1>` invariant sur le détail de tâche même en édition.

#### F-UI-010 — Modales finance « DIY » sans rôle dialog, focus-trap ni gestion clavier

- **Axe** : UI
- **Sévérité** : High
- **Description** : Trois composants finance (`account-list.tsx`, `goal-list.tsx`, `transaction-list.tsx`) implémentent leurs propres modales d'édition (`<div fixed inset-0 onClick>`) sans `role="dialog"`, `aria-modal`, `aria-labelledby`, gestion d'`Escape`, focus-trap, restauration du focus ni `aria-hidden` sur l'arrière-plan — alors que le wrapper Radix `Dialog` du projet fournit tout cela.
- **Preuve** : `src/components/finance/account-list.tsx:184` ; `src/components/finance/goal-list.tsx:274` ; `src/components/finance/transaction-list.tsx:188` ; `commande: grep -rnE 'aria-modal|role="dialog"' src/components/finance/` (aucune occurrence).
- **Impact** : Blocage d'accessibilité sur tout le module Finance (clavier et lecteurs d'écran) : modale non annoncée, focus non piégé, `Escape` inopérant, focus non restitué. Non-conformité WCAG 2.1.1, 4.1.2, 2.4.3.
- **Recommandation** : Refondre les trois modales avec `Dialog`/`DialogContent`/`DialogTitle` du projet (comme les `add-*-dialog.tsx` existants), ce qui fournit rôle, focus-trap et gestion clavier gratuitement.

#### F-UI-026 — Erreurs SWR silencieusement ignorées sur 40 fetchers (68 %)

- **Axe** : UI
- **Sévérité** : High
- **Description** : 40 des 59 appels `useSWR` ne destructurent pas / n'exposent pas `error`. En cas d'échec (réseau, 401, 500), l'UI affiche soit un chargement infini, soit un état vide trompeur, sans aucun signal d'erreur ni possibilité de réessayer. Concerne l'essentiel des composants de la page de tâche et des pages App Router.
- **Preuve** : `src/components/task/task-dependencies.tsx:106` ; `src/components/task/activity-feed.tsx:55` ; `src/app/(platform)/goals/page.tsx:53` ; inventaire complet en Annexe D (colonne « Gestion erreur explicite »).
- **Impact** : Sur connexion instable (mobile), de larges sections restent vides sans explication ; l'utilisateur ne distingue pas « chargement » de « échec ». Recoupe l'angle UX (F-UX-005/007/008) et logique (F-LOG-010).
- **Recommandation** : Destructurer `error` partout et afficher un composant réutilisable `<SWRErrorFallback error={error} onRetry={mutate} />` ; brancher un fallback global via `onError` du `SWRConfig`.

#### F-UI-005 — `DialogContent` intercepte systématiquement `onPointerDownOutside`/`onInteractOutside` (fermeture clic-extérieur désactivée globalement)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : La primitive `DialogContent` (`src/components/ui/dialog.tsx`) appelle `e.preventDefault()` dans les deux callbacks, désactivant la fermeture au clic extérieur et à `Escape` pour **toutes** les modales (25 sites), sans option de réactivation ni documentation. Comportement divergent de shadcn/ui et incohérent avec `Sheet` (qui ferme au clic extérieur).
- **Preuve** : `src/components/ui/dialog.tsx:36`, `:38`, `:42`, `:46` ; `commande: grep -rln '<DialogContent' src/ | wc -l` (25).
- **Impact** : UX dégradée sur desktop/tablette (convention de fermeture au clic extérieur non respectée) ; dette diffusée sur 25 sites ; incohérence de variants Dialog vs Sheet.
- **Recommandation** : Ajouter une prop `dismissable?: boolean` (défaut `false` pour éviter une régression) ou documenter explicitement le choix dans `CLAUDE.md` et l'appliquer aussi à `Sheet`.

#### F-UI-006 — Variant `link` du Button déclaré mais inutilisé ; surcharges `h-/w-` contredisant `size="icon"` (cibles tactiles < 44 px)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : `buttonVariants` déclare un variant `link` jamais utilisé, tandis que 20+ usages de `<Button size="icon">` surchargent la dimension canonique (`h-10 w-10`) par `h-5/h-6/h-7/h-8`, plaçant des cibles tactiles sous le seuil 44 × 44 px (WCAG 2.5.5) et faisant perdre au variant `icon` son rôle de standard.
- **Preuve** : `src/components/ui/button.tsx:21` (variant `link`) ; `src/components/task/task-dependencies.tsx:435` (`h-5 w-5`) ; `src/components/list/status-manager.tsx:254` ; `src/components/custom-fields/custom-field-renderer.tsx:89` (×12 `h-8 w-8`) ; `commande: grep -rn 'variant="link"' src/` (0 occurrence).
- **Impact** : Dette de design system ; cibles tactiles sous-dimensionnées sur mobile (suppression de dépendance, validation de champ) ; variant mort alourdissant le `cva`.
- **Recommandation** : Ajouter des tailles `icon-sm`/`icon-xs` explicites et migrer les sites, ou interdire la surcharge `h-/w-` ; supprimer ou justifier le variant `link`.

#### F-UI-009 — `<AvatarImage>` sans `alt` sur 39 occurrences (avatars informatifs)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Sur 40 instanciations de `<AvatarImage>` (qui rend un `<img>` réel), 39 n'ont pas d'attribut `alt`. Sur 5 sites, l'avatar est affiché sans nom adjacent visible (account-switcher, sidebar repliée, task-card, assignee-selector replié), rendant l'identité inaccessible aux technologies d'assistance.
- **Preuve** : `src/components/ui/avatar.tsx:25` ; `commande: grep -rn '<AvatarImage' src/ | wc -l` (40) ; `commande: grep -rn '<AvatarImage' src/ | grep -v ' alt=' | wc -l` (39) ; seul conforme : `src/components/dashboard/upcoming-deadlines.tsx:163`.
- **Impact** : Non-conformité partielle WCAG 1.1.1 ; pré-requis pour les outils d'audit automatisés (axe-core, Lighthouse).
- **Recommandation** : Rendre `alt` obligatoire au niveau TypeScript dans le wrapper `AvatarImage` (ou `alt=""` par défaut) ; compléter les 39 sites avec `alt={user.name ?? user.email}`.

#### F-UI-011 — Inputs sans `<Label>` associé (`htmlFor`/`id`) — 51 % des `<Label>` non liés et 9 inputs nus

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Sur 88 `<Label>`, seuls 43 portent un `htmlFor=` (51 % non associés). S'ajoutent 9 `<input>` natifs sans `id`/`aria-label` dans les modales DIY de finance. Le module Finance est le plus touché (8 paires Label/Input non associées dans `add-transaction-dialog.tsx`).
- **Preuve** : `commande: grep -rn '<Label\b' src/ | wc -l` (88) ; `commande: grep -rn '<Label\b' src/ | grep -c 'htmlFor='` (43) ; `src/components/finance/add-transaction-dialog.tsx:104-180` ; `src/components/finance/account-list.tsx:190,194,198`.
- **Impact** : Champs annoncés « edit » sans contexte par les lecteurs d'écran ; perte de la zone de touche élargie. Non-conformité WCAG 1.3.1 et 4.1.2.
- **Recommandation** : Ajouter `id`/`htmlFor` sur les ~45 contrôles ; `aria-labelledby` sur les sélecteurs couleur/icône ; règle ESLint `jsx-a11y/label-has-associated-control`.

#### F-UI-012 — Contrastes texte/fond probablement sous 4.5:1 (opacités `text-white/20`, `text-muted-foreground/40`, etc.)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Abus systémique (>30 sites) de classes Tailwind à opacité réduite pour le texte secondaire, plaçant de nombreux libellés sous le ratio 4.5:1 (WCAG 1.4.3) : footer landing en `text-white/20`, placeholders d'auth en `placeholder:text-white/20`, `text-muted-foreground/30`–`/40` dans l'app, badges priorité `text-gray-400` sur fond clair.
- **Preuve** : `commande: grep -rn 'text-muted-foreground/' src/` (>30) ; `commande: grep -rn 'text-white/[12]' src/` ; `src/app/page.tsx:298` ; `src/components/auth/login-form.tsx:190`.
- **Impact** : Texte secondaire quasi illisible pour utilisateurs malvoyants/presbytes ou en extérieur ; non-conformité WCAG 1.4.3 (AA) sur >30 sites.
- **Recommandation** : Définir un token sémantique `--text-tertiary` garanti ≥ 4.5:1 et l'utiliser à la place des opacités ; placeholders en couleur opaque calibrée.

#### F-UI-013 — Sauts de niveau dans la hiérarchie des titres (h1 → h3, h2 absent)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Hiérarchie de titres non monotone avec sauts interdits : sur le dashboard, un `<h1>` est suivi directement de widgets en `<h3>` (h2 absent) ; même schéma sur budget, détail de tâche (`<h3>`/`<h4>`), notifications, reminders. `EmptyState` impose `<h3>` par défaut.
- **Preuve** : `commande: grep -rnE '<h[1-6]' src/app/ src/components/` ; `src/components/dashboard/tasks-by-status-chart.tsx:91` ; `src/components/shared/empty-state.tsx:34`.
- **Impact** : Sommaire de lecteur d'écran incohérent ; signalé comme erreur par Lighthouse/axe-core. Non-conformité WCAG 1.3.1 et 2.4.6.
- **Recommandation** : Convention « blocs en `<h2>`, sous-sections en `<h3>` » ; migrer les widgets dashboard et sous-sections de tâche ; rendre le niveau de `EmptyState` configurable.

#### F-UI-014 — Absence de skip-link et de nom accessible sur les landmarks (`<main>`/`<nav>`/`<aside>`/`<header>`)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Aucun skip-link « Aller au contenu principal » n'existe, et les landmarks (`<main>`, `<nav>` mobile, `<aside>` sidebar, `<header>` top-bar, `<nav>`/`<footer>` landing) ne portent aucun `aria-label`. La navigation mobile n'utilise pas `aria-current="page"`.
- **Preuve** : `commande: grep -rn 'skip\|skip-link' src/` (aucun pertinent) ; `src/app/(platform)/layout.tsx:25` (`<main>` sans label) ; `src/components/layout/mobile-nav.tsx:27` ; `src/components/layout/sidebar.tsx:119`.
- **Impact** : Utilisateur clavier obligé de tabuler à travers sidebar + top-bar à chaque page ; landmarks indistinguables au rotor. Non-conformité WCAG 2.4.1 (niveau A).
- **Recommandation** : Ajouter un skip-link `sr-only focus-visible:not-sr-only` + `id="main"` ; nommer chaque landmark via `aria-label` ; `aria-current="page"` sur l'item de nav actif.

#### F-UI-015 — Top-bar mobile saturée `< 375px` (5 actions + breadcrumb sans repli, timer actif = débordement)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Le `<header>` top-bar rend 5 contrôles à droite + breadcrumb sans `flex-wrap` ni `overflow-x`, aucun conditionné par breakpoint. Avec le timer actif sur viewport ≤ 375 px, le breadcrumb est tronqué à 0 px ; sur 320-360 px, débordement horizontal réel.
- **Preuve** : `src/components/layout/top-bar.tsx:38` ; `src/components/time-tracking/timer-button.tsx:124-141` ; `commande: grep -n 'flex-wrap\|overflow-x' src/components/layout/top-bar.tsx` (aucune occurrence).
- **Impact** : Perte de repérage de page sur une grande part du parc mobile ; débordement propagé au `<body>` faute d'`overflow-x-hidden`.
- **Recommandation** : Masquer le bouton recherche `< sm`, compresser le timer actif, ajouter `flex-wrap`/`overflow-x-hidden` de sécurité et tester sur 320/360/375 px.

#### F-UI-016 — `TaskDetailModal` mobile : `!w-screen` + `overflow-hidden` + `!p-0` exposent à des débordements horizontaux

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : La modale force `!w-screen` (= `100vw`, inclut la scrollbar) en écrasant `w-[calc(100%-2rem)]`, plus `overflow-hidden` (clip de texte non cassable) et `!p-0` (contenu collé aux bords, X sous le notch). Sur WebView Android, décalage et scroll horizontal de 4-8 px à l'ouverture.
- **Preuve** : `src/components/task/task-detail-modal.tsx:22` ; `src/components/ui/dialog.tsx:48` ; `commande: grep -n '!w-screen\|100vw' src/components/task/task-detail-modal.tsx`.
- **Impact** : Débordement horizontal sur la modale d'édition la plus utilisée ; coupure silencieuse d'URLs/code ; bouton de fermeture sous l'encoche.
- **Recommandation** : Remplacer `!w-screen` par `!w-full`/`100dvw` ; `overflow-y-auto overflow-x-hidden` + `break-words` ; padding minimal et `safe-area-inset` sur mobile.

#### F-UI-017 — `MobileSidebar` `w-[320px]` masque l'overlay de fermeture sur viewports ≤ 360 px

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : `SheetContent` est codé en dur à `w-[320px]` (inconditionnel), écrasant le `w-3/4` responsive. Sur 320 px, le panneau couvre 100 % du viewport (overlay de tap-out invisible) ; sur 360 px, 89 % (bande de 40 px < seuil 44 px).
- **Preuve** : `src/components/layout/mobile-sidebar.tsx:32` ; `src/components/ui/sheet.tsx:42` ; `commande: grep -n 'w-\[320px\]\|w-3/4' src/components/layout/`.
- **Impact** : Tiroir de navigation non fermable au tap-out sur ≤ 360 px ; combiné à F-UI-003, panneau difficile à fermer et inaccessible.
- **Recommandation** : Remplacer par `w-[min(320px,85vw)]` ou revenir au `w-3/4 sm:max-w-sm` du variant standard.

#### F-UI-018 — Barres de vues (calendar, time-tracking) sans `flex-wrap` → débordement sur 320-360 px

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Les barres de navigation de `calendar-view.tsx` et `calendar/page.tsx` combinent libellé central `min-w-[140px]` + 3 boutons sur une ligne sans `flex-wrap` ni `overflow-x-auto`, provoquant un débordement de ~38 px sur 320 px. `gantt-view.tsx` (avec `flex-wrap`) et `time-tracking` (en `flex-col`) sont conformes.
- **Preuve** : `src/components/views/calendar-view.tsx:143-156` ; `src/app/(platform)/calendar/page.tsx:226-249` ; `src/components/views/gantt-view.tsx:92` (conforme).
- **Impact** : Débordement horizontal sur petits viewports pour les barres de navigation calendrier.
- **Recommandation** : Ajouter `flex-wrap` (sur le modèle de `gantt-view.tsx`) ou réduire la largeur minimale du libellé central.

#### F-UI-019 — Largeur de sidebar via `style` inline au lieu de Tailwind

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : La sidebar applique sa largeur via un attribut `style` inline plutôt que via les classes Tailwind, contournant le système de design et les breakpoints, et compliquant la cohérence responsive.
- **Preuve** : `src/components/layout/sidebar.tsx` (largeur inline `style`) ; recoupé avec l'inventaire des largeurs ad hoc (`commande: grep -rnE 'w-\[[0-9]+(px|rem)\]' src/`).
- **Impact** : Dette de cohérence du design system ; largeur non responsive et non alignée sur les tokens.
- **Recommandation** : Remplacer le `style` inline par des classes Tailwind (`w-64`, `md:w-72`, etc.) avec breakpoints.

#### F-UI-020 — Tokens `priority.*`/`status.*` déclarés mais inutilisés

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Des tokens sémantiques (`priority.*`, `status.*`) sont déclarés dans la configuration Tailwind mais jamais consommés, tandis que les couleurs correspondantes sont codées en dur ailleurs — symptôme d'absence de discipline de tokens centralisés.
- **Preuve** : `tailwind.config.ts` (déclaration des tokens) ; recoupé avec l'usage des littéraux de couleur (`commande: grep -rn 'priority-\|status-' src/`).
- **Impact** : Dette de design system ; tokens morts trompant la maintenance, couleurs dupliquées en dur.
- **Recommandation** : Soit consommer les tokens partout où priorité/statut sont colorés, soit les retirer ; documenter la palette sémantique.

#### F-UI-021 — Couleurs de marque en hexadécimal codées en dur dans `email.ts`

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Les gabarits d'e-mail (`src/lib/email.ts`) utilisent des couleurs de marque en hexadécimal littéral plutôt que des constantes/tokens partagés, dupliquant la palette et risquant une divergence avec l'UI.
- **Preuve** : `src/lib/email.ts` (couleurs hex en dur dans les templates) ; recoupé avec `commande: grep -rn '#[0-9a-fA-F]\{6\}' src/lib/email.ts`.
- **Impact** : Dette de cohérence visuelle entre e-mails et application ; maintenance dispersée.
- **Recommandation** : Centraliser les couleurs de marque dans un module partagé et les réutiliser dans les templates.

#### F-UI-022 — Landing : 12 couleurs hex en dur hors tokens

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : La page d'accueil publique (`src/app/page.tsx`) code en dur une douzaine de couleurs hexadécimales (fond `#0a0a0f`, opacités texte, accents) hors de tout token, créant une palette parallèle non maintenable.
- **Preuve** : `src/app/page.tsx` (≈12 littéraux hex, ex. `#0a0a0f`) ; `commande: grep -rn '#[0-9a-fA-F]' src/app/page.tsx`.
- **Impact** : Dette de design system ; impossible de thémer la landing de façon cohérente.
- **Recommandation** : Extraire ces couleurs vers des tokens CSS/Tailwind dédiés à la landing.

#### F-UI-023 — Palette Tailwind brute au lieu de tokens sémantiques (≈250 occurrences)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : L'application utilise massivement des couleurs Tailwind brutes (`gray-*`, `blue-*`, etc., ≈250 occurrences) plutôt que des tokens sémantiques (`background`, `foreground`, `muted`, `primary`), rendant le theming et le mode sombre fragiles.
- **Preuve** : `commande: grep -rnE 'text-(gray|zinc|slate|blue|red|green)-[0-9]' src/` (≈250) ; nombreux composants.
- **Impact** : Dette structurante ; cohérence de thème et accessibilité (contraste) difficiles à garantir globalement.
- **Recommandation** : Migrer progressivement vers les tokens sémantiques shadcn/ui ; règle de lint interdisant les couleurs brutes hors `tailwind.config`.

#### F-UI-024 — Couleurs de charts hex en dur (6 composants)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Six composants de graphiques (dashboard, finance, budget) codent leurs palettes en hexadécimal littéral au lieu de tokens, sans cohérence inter-charts ni adaptation au thème.
- **Preuve** : `src/components/dashboard/*-chart.tsx`, `src/components/finance/*-chart.tsx`, `src/components/budget/*-chart.tsx` (couleurs hex en dur) ; `commande: grep -rn '#[0-9a-fA-F]\{6\}' src/components/**/charts`.
- **Impact** : Charts non thémables, palettes divergentes entre modules.
- **Recommandation** : Définir une palette de charts centralisée (tokens) et la partager entre tous les graphiques.

#### F-UI-025 — Échelles arbitraires Tailwind systémiques (valeurs ad hoc)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Usage répandu de valeurs arbitraires Tailwind (`p-[13px]`, `text-[15px]`, espacements non alignés sur l'échelle) qui contournent l'échelle d'espacement/typographie du design system.
- **Preuve** : `commande: grep -rnE '\[[0-9]+px\]' src/` ; multiples composants.
- **Impact** : Incohérence visuelle et dette de maintenance ; rythme vertical non standardisé.
- **Recommandation** : Aligner sur l'échelle Tailwind standard ; n'autoriser les valeurs arbitraires que sur justification.

#### F-UI-027 — `data ?? []` confond loading et empty (13 sites)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : 13 composants utilisent `data ?? []` qui rend l'état « chargement en cours » indiscernable de l'état « aucun résultat » : pendant le chargement SWR, l'UI affiche immédiatement un état vide trompeur au lieu d'un skeleton.
- **Preuve** : `src/components/task/comment-list.tsx:46,76` ; `src/components/task/activity-feed.tsx:110,144` ; `src/components/task/subtask-list.tsx:52` ; `src/components/task/multi-assignee-selector.tsx:78,112` ; `commande: grep -rnE "(comments|activities|...) \?\? \[\]" src/` (13 lignes).
- **Impact** : Flash d'état vide au chargement, perception de « pas de données » alors que la requête est en cours.
- **Recommandation** : Distinguer explicitement `isLoading` (skeleton) de `data?.length === 0` (empty state) sur ces 13 sites.

#### F-UI-028 — Composants critiques sans skeleton/spinner (11+)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : Au moins 11 composants consommant un hook SWR n'affichent aucun indicateur de chargement (ni skeleton, ni spinner) pendant la résolution, laissant l'écran figé ou vide.
- **Preuve** : `src/components/task/task-attachments.tsx:30-101` ; `src/components/task/multi-assignee-selector.tsx:29-130` ; `src/components/custom-fields/custom-fields-section.tsx:44-78` ; `commande: grep -rnE "Skeleton|Loader2.*animate-spin|animate-pulse" src/components/task/ -l` (9 fichiers sur 25).
- **Impact** : Perception de réactivité dégradée, particulièrement sur mobile/réseau lent.
- **Recommandation** : Ajouter un skeleton/spinner conditionné par `isLoading` ; mutualiser un composant de chargement.

#### F-UI-029 — États empty/loading indistinguables (10 sites)

- **Axe** : UI
- **Sévérité** : Medium
- **Description** : 10 sites supplémentaires (distincts de F-UI-027) ne fournissent pas d'`EmptyState` explicite lorsqu'une liste est réellement vide après chargement, ou ne le distinguent pas du chargement, dégradant la clarté du parcours.
- **Preuve** : `src/app/(platform)/goals/page.tsx:198` ; `src/app/(platform)/notes/page.tsx:264,400` ; `src/app/(platform)/workspace/[workspaceId]/page.tsx:44-49` ; `src/components/views/list-view.tsx:79-87` ; `src/components/views/board-view.tsx:165-173` ; comparaison conforme : `src/components/dashboard/budget-widget.tsx:65-69`.
- **Impact** : Ambiguïté UX persistante sur les vues de listes asynchrones.
- **Recommandation** : Adopter un pattern unifié loading → empty → error → data sur tous les composants asynchrones.

### 3.2 Axe UX — Expérience

Trace statique des parcours critiques (auth, CRUD tâche, navigation workspaces), du feedback (toasts, confirmations destructives), de la gestion d'erreur (`error.tsx`, `not-found.tsx`, fallback réseau), de la navigation et de l'ergonomie mobile. 17 Findings (4 High, 13 Medium).

#### F-UX-001 — Suppression de tâche déclenchée sans aucune confirmation

- **Axe** : UX
- **Sévérité** : High
- **Description** : L'item « Supprimer » du menu de tâche exécute directement `handleDelete` → `DELETE /api/tasks/{id}` sans `<AlertDialog>` ni `window.confirm`. Le seul garde-fou (verrou PIN `task.locked`) est opt-in et désactivé par défaut. La suppression cascade en base (sous-tâches, commentaires, time entries, activité) sans corbeille ni undo. Le déclencheur est affiché sur chaque tâche de toutes les vues.
- **Preuve** : `src/components/task/task-action-menu.tsx:119` (`handleDelete`), `:226` (item direct) ; `src/hooks/use-tasks.ts:117-132` ; comparatif : `src/components/budget/budget-card.tsx:82-110` (AlertDialog).
- **Impact** : Perte de données utilisateur sur le parcours le plus utilisé, en un seul clic accidentel (risque accru sur mobile, cible tactile sous-dimensionnée). Critère « risque de perte de données » → High.
- **Recommandation** : Envelopper la suppression dans un `<AlertDialog>` (réutiliser le pattern `budget-card.tsx`) décrivant l'irréversibilité et la cascade ; envisager un soft-delete + undo.

#### F-UX-002 — Changement de workspace laisse l'URL sur l'ancien workspace

- **Axe** : UX
- **Sévérité** : High
- **Description** : Le sélecteur de workspace n'appelle que `setCurrentWorkspace(ws)` sans `router.push`. Sur une URL contenant `workspaceId`, l'état React change (sidebar, widgets) mais l'URL et le contenu central (`useParams`) restent sur l'ancien workspace, créant un état hybride durable : l'utilisateur peut modifier les paramètres du mauvais workspace ou mélanger des données de deux workspaces.
- **Preuve** : `src/components/layout/sidebar.tsx:148-160` ; `src/providers/workspace-provider.tsx:60-67` ; `src/app/(platform)/workspace/[workspaceId]/page.tsx:24-30`.
- **Impact** : Blocage du parcours critique « navigation entre workspaces » ; risque de fuite de contexte (agir dans le mauvais workspace). Critère « blocage parcours critique » → High.
- **Recommandation** : Enchaîner `setCurrentWorkspace` avec une navigation explicite, ou dériver `currentWorkspace` du `workspaceId` de l'URL (URL = source de vérité).

#### F-UX-003 — `callbackUrl` ignoré par les formulaires de connexion et d'inscription

- **Axe** : UX
- **Sévérité** : High
- **Description** : `LoginForm` et `RegisterForm` redirigent toujours en dur vers `/dashboard` et ne lisent jamais `callbackUrl`. La garde `requireAuth` redirige vers `/login` sans propager le chemin demandé. Résultat : un utilisateur invité (qui doit revenir sur `/invite/[token]`) ou suivant un lien profond atterrit sur le dashboard et perd sa destination.
- **Preuve** : `src/components/auth/login-form.tsx:70,119` (`router.push("/dashboard")`) ; `src/components/auth/register-form.tsx:88,118` ; `src/lib/auth-helpers.ts:65-72` ; `src/app/invite/[token]/page.tsx:130-138`.
- **Impact** : Blocage de deux parcours critiques (acceptation d'invitation, partage de liens profonds). Critère « blocage parcours critique » → High.
- **Recommandation** : Lire et valider `callbackUrl` (origine relative) dans les deux formulaires ; propager le `pathname` courant depuis `requireAuth`.

#### F-UX-013 — Lien cassé `/tasks/${id}` dans la recherche → 404

- **Axe** : UX
- **Sévérité** : High
- **Description** : Un résultat de recherche construit une URL `/tasks/${id}` (pluriel) alors que la route réelle de détail de tâche est `/task/[taskId]` (singulier). Le clic conduit systématiquement à une 404, brisant le parcours « rechercher puis ouvrir une tâche ».
- **Preuve** : `src/components/search/search-command.tsx:156` (`handleSelect(\`/tasks/${task.id}\`)`) ; comparatifs corrects au singulier : `src/app/(platform)/search/page.tsx:150`, `src/components/layout/sidebar.tsx:280` ; route réelle `src/app/(platform)/task/[taskId]/page.tsx`.
- **Impact** : Parcours de recherche → ouverture de tâche cassé sur un cas usuel → blocage utilisateur. Critère « parcours critique bloqué » → High.
- **Recommandation** : Corriger le lien en `/task/${id}` ; centraliser la construction des URLs de tâche dans un helper pour éviter la divergence.

#### F-UX-004 — Confirmations destructives via `window.confirm()` natif (5 sites)

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Cinq parcours destructifs (comptes, transactions, catégories, objectifs finance, suppression tâche depuis le calendrier) utilisent `window.confirm()` au lieu du `<AlertDialog>` du design system : incohérence visuelle, rendu dégradé/bloqué sur WebView Capacitor, libellés n'indiquant pas l'irréversibilité ni les cascades.
- **Preuve** : `src/components/finance/account-list.tsx:53` ; `transaction-list.tsx:38` ; `category-manager.tsx:59` ; `goal-list.tsx:27` ; `src/app/(platform)/calendar/page.tsx:458`.
- **Impact** : Problème UX notable et défaut de robustesse sur 5 parcours destructifs, dégradé sur la cible mobile principale.
- **Recommandation** : Migrer vers `<AlertDialog>` avec descriptions explicites ; pour le calendrier, passer par le hook `useDeleteTask` ; règle ESLint `no-restricted-globals` sur `confirm`.

#### F-UX-005 — Module finance : 7 mutations avalent les erreurs serveur sans retour utilisateur

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Les mutations du module finance suivent toutes le pattern `catch (error) { console.error(error); }` sans `toast` ni état d'erreur, puis ferment la modale dans le `finally` : l'utilisateur perçoit une réussite alors que le serveur a refusé l'opération (la liste ne se rafraîchit pas car `mutate()` n'est appelé que dans le chemin succès).
- **Preuve** : `src/components/finance/add-transaction-dialog.tsx:89-94` ; `account-list.tsx:55-64,166-182` ; `transaction-list.tsx:39-49` ; `goal-list.tsx:27-60` ; `category-manager.tsx:43-91`.
- **Impact** : Opérations comptables échouées sans feedback (ex. transaction non enregistrée perçue comme réussie). Recoupe F-UI-026.
- **Recommandation** : Remplacer `console.error` par un `toast({ variant: "destructive" })` (pattern déjà présent dans `task-action-menu.tsx`) ; ajouter des toasts de succès pour cohérence.

#### F-UX-006 — 7 suppressions de sous-entités sans confirmation, toast ni `catch`

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Sept parcours destructifs supplémentaires (pièces jointes, récurrence, item de checklist, tag, dépendance, template, champ personnalisé cascadant) suppriment des données en un clic sans confirmation ni feedback ; certains ont un `catch` vide commenté « erreur silencieuse ».
- **Preuve** : `src/components/task/task-attachments.tsx:64-67` ; `task-recurrence.tsx:58-61` ; `checklist-item.tsx:42-46` ; `task-dependencies.tsx:147-152` ; `src/hooks/use-templates.ts:47-50` ; `custom-fields/custom-field-manager.tsx:115-122`.
- **Impact** : Perte de données silencieuse et désynchronisation UI/serveur sur sept sous-parcours.
- **Recommandation** : Confirmation pour les suppressions cascadantes (champ personnalisé), toasts succès/erreur, `await mutate()` systématique.

#### F-UX-007 — Autosave des notes avale les échecs réseau

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : L'autosave de la page Notes effectue un `PATCH` dont l'échec est silencieusement ignoré (`catch { /* silently retry on next change */ }`) : l'utilisateur croit son contenu enregistré alors qu'il peut être perdu (notamment sur Capacitor avec connexion instable).
- **Preuve** : `src/app/(platform)/notes/page.tsx:104-115` (`saveNote`, catch silencieux) ; `src/app/(platform)/notes/page.tsx:135-144` (`flushSave`) ; recoupe F-LOG-027.
- **Impact** : Risque de perte de contenu utilisateur sans signal.
- **Recommandation** : Afficher un indicateur de statut d'enregistrement (« Enregistré » / « Échec, réessayer ») et retenter ou bloquer la navigation en cas d'échec.

#### F-UX-008 — Aucun fallback global sur erreurs SWR

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Le `SWRConfig` global ne déclare aucun `onError` : aucune stratégie centralisée n'informe l'utilisateur en cas d'échec de fetch, laissant chaque composant gérer (ou ignorer) l'erreur individuellement.
- **Preuve** : `src/lib/swr-config.tsx:34-44` (config sans `onError`) ; recoupe F-UI-026 et F-LOG-010.
- **Impact** : Absence de filet de sécurité UX global ; erreurs invisibles propagées partout.
- **Recommandation** : Ajouter un `onError` global émettant un toast discret, complété par des fallbacks locaux par composant.

#### F-UX-009 — Absence de `global-error.tsx` racine

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Aucun `src/app/global-error.tsx` n'existe : une erreur survenant dans le `RootLayout` (providers) n'est couverte par aucune frontière d'erreur dédiée et tombe sur l'écran d'erreur générique de Next.
- **Preuve** : `commande: find src/app -name "global-error.tsx"` (aucun résultat) ; `src/app/error.tsx` (boundary non racine).
- **Impact** : Erreurs de plus haut niveau non gérées proprement, sans message localisé ni récupération.
- **Recommandation** : Ajouter un `global-error.tsx` affichant un message FR et un bouton de réessai, et journalisant l'erreur (cf. F-INF-010).

#### F-UX-010 — Granularité insuffisante des `not-found.tsx` / `(auth)/error.tsx`

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Le route group `(platform)` n'a pas de `not-found.tsx` dédié : un `notFound()` retombe sur le 404 racine plein écran (sans sidebar), faisant perdre le contexte de navigation. La zone `(auth)` manque aussi de frontière d'erreur dédiée.
- **Preuve** : absence de `src/app/(platform)/not-found.tsx` ; `src/app/(platform)/task/[taskId]/page.tsx:35` (`notFound()`).
- **Impact** : Perte de contexte de navigation sur les 404 internes ; UX d'erreur incohérente entre zones.
- **Recommandation** : Ajouter un `not-found.tsx` dans `(platform)` (dans le layout, avec navigation) et une frontière d'erreur dans `(auth)`.

#### F-UX-011 — Aucun fallback réseau Capacitor (service worker désactivé)

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : L'application packagée Capacitor charge l'URL distante sans fallback réseau : le service worker est désactivé en natif (« casse la WebView »), aucun plugin `@capacitor/network` ni écoute `navigator.onLine` n'est branché, et la réponse offline du SW n'est jamais consommée. En cas de perte de connexion, la WebView affiche une erreur native non maîtrisée.
- **Preuve** : `src/app/layout.tsx:79-100` (registre SW conditionné à `!isNativePlatform`, commentaire ligne 80) ; `public/sw.js:79-91` (réponse `{ offline: true }` jamais consommée) ; `commande: grep -rn -E "@capacitor/network|navigator\.onLine" src/ public/` (0 occurrence applicative).
- **Impact** : Expérience dégradée hors ligne / sur réseau instable sur la cible mobile principale.
- **Recommandation** : Fournir une page de fallback réseau (ou un SW minimal) affichant un message FR et un bouton « Réessayer ».

#### F-UX-012 — `error.message` brut exposé à l'utilisateur

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Les frontières d'erreur affichent directement `error.message` (voire `error.digest`) brut à l'utilisateur, exposant des détails techniques peu clairs plutôt qu'un message FR maîtrisé.
- **Preuve** : `src/app/error.tsx:46` (`{error.message || "..."}`) ; `src/app/(platform)/error.tsx:18-22` (`{error.message}` en `font-mono`), `:24-28` (`error.digest`).
- **Impact** : Messages d'erreur non localisés/non maîtrisés présentés à l'utilisateur ; recoupe la normalisation d'erreur LOG.
- **Recommandation** : Mapper les erreurs vers des messages FR génériques côté UI ; ne montrer le détail technique qu'en dev.

#### F-UX-014 — Sidebar (10 items) vs MobileNav (5 items) divergents

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : La navigation desktop (sidebar, ~10 entrées) et la navigation mobile (`mobile-nav`, 5 entrées) exposent des ensembles divergents de destinations, sans règle claire de priorisation : certaines sections sont inaccessibles en mobile.
- **Preuve** : `src/components/layout/sidebar.tsx` ; `src/components/layout/mobile-nav.tsx:27`.
- **Impact** : Incohérence de navigation entre plateformes ; fonctions manquantes en mobile.
- **Recommandation** : Définir un modèle de navigation unifié (items principaux + menu « Plus ») cohérent desktop/mobile.

#### F-UX-015 — Breadcrumbs vides sur 9/10 modules

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Le composant breadcrumb (rendu sur toute la plateforme) repose sur un mapping `routeLabels` désaligné des segments réels et un algorithme `getSegmentsFromPath` qui retombe sur « Home » seul (segments vides) sur 9 modules sur 10, privant l'utilisateur de repérage hiérarchique.
- **Preuve** : `src/components/layout/breadcrumbs.tsx:18-29` (mapping `routeLabels`), `:35-55` (algorithme), `:60-66` (fallback Home) ; `src/components/layout/top-bar.tsx:42-47` (`<Breadcrumbs />`).
- **Impact** : Repérage de navigation dégradé sur la majorité des modules.
- **Recommandation** : Alimenter les breadcrumbs sur tous les modules ou retirer le composant des écrans non concernés.

#### F-UX-016 — Pas de handler BackButton Capacitor

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Aucun gestionnaire du bouton retour matériel Android (`App.addListener('backButton')`) n'est enregistré : le retour système peut fermer l'application au lieu de naviguer en arrière dans l'historique applicatif.
- **Preuve** : absence de listener `backButton` dans `src/` ; `commande: grep -rn 'backButton' src/`.
- **Impact** : Comportement de retour mobile non maîtrisé (sortie inattendue de l'app).
- **Recommandation** : Enregistrer un handler `backButton` qui gère l'historique de navigation et la fermeture des modales avant de quitter.

#### F-UX-017 — Navigation par `router.push()` au lieu de `<Link>`

- **Axe** : UX
- **Sévérité** : Medium
- **Description** : Plusieurs navigations utilisent `router.push()` sur des éléments cliquables au lieu d'un `<Link>` (11 sites dans la couche layout), ce qui prive du préchargement, de l'ouverture en nouvel onglet (Ctrl+clic) et d'une sémantique d'ancre accessible.
- **Preuve** : `src/components/layout/sidebar.tsx:172-244` (10 `<button onClick={router.push}>`), `:265-285` (favoris) ; `src/components/layout/mobile-nav.tsx:34-58` ; `src/components/layout/quick-action-fab.tsx:81-110` ; `src/components/layout/sidebar-list-item.tsx:23`.
- **Impact** : Perte de préchargement et d'accessibilité des liens ; navigation moins robuste.
- **Recommandation** : Remplacer les navigations par clic par `<Link>` quand la cible est une URL ; réserver `router.push` aux navigations programmatiques post-action.

### 3.3 Axe LOG — Logique applicative

Revue de la structure App Router, de la frontière server/client (`"use client"`), des hooks SWR (contrôle `res.ok`, clés, revalidation), de la validation Zod, de la gestion d'erreur des routes API et des `useEffect`. 30 Findings (1 High, 29 Medium).

> Point de conformité positif : les 59 fetchers SWR inventoriés vérifient tous `res.ok` (via fetcher local ou global) — conformité totale à la CLAUDE_Rule SWR. Les Findings LOG portent sur la gestion d'erreur côté consommateur, la stabilité des clés et la validation.

#### F-LOG-001 — Arbre de travail non propre au démarrage de l'audit

- **Axe** : LOG
- **Sévérité** : High
- **Description** : Au démarrage (tâche 1.1), `git status`/`git diff` révèlent 57 fichiers modifiés non commités (+2645/−763 sur 58 fichiers), touchant `prisma/schema.prisma`, `src/app/api/**`, `src/lib/auth*.ts`, `next.config.mjs`, `vercel.json`, `capacitor.config.ts`, `android/**`, `package.json`. Ces modifications pré-existent à l'audit. La baseline auditée est donc « HEAD + worktree », non figée.
- **Preuve** : `commande: git status --short` ; `commande: git diff --stat` ; sortie dans `notes/annexe-A-commandes-1.1.md` et `notes/00-baseline.md`.
- **Impact** : Traçabilité compromise : les Findings portent sur un état mêlant des modifications non revues à la référence, dans des zones critiques (schéma, auth, config Vercel/Capacitor) susceptibles d'altérer les conclusions BDD/INF/SEC/MOB. Critère « méthode / mode lecture seule non garanti sur la durée » → High.
- **Recommandation** : Demander à l'utilisateur de commiter/stasher ou de désigner explicitement la baseline, puis figer cette baseline dans « Périmètre et méthode » et « Limites et hypothèses ».

#### F-LOG-002 — Composant client co-localisé dans un dossier de route

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `task-detail-page-client.tsx` est placé directement dans le dossier de route `task/[taskId]/`, mélangeant couche de routage et couche de présentation au lieu d'un dossier `_components/` ou `src/components/`.
- **Preuve** : `src/app/(platform)/task/[taskId]/task-detail-page-client.tsx:1`.
- **Impact** : Confusion sur le rôle des fichiers ; dossier `app/` hybride si le pattern se répand.
- **Recommandation** : Déplacer vers `src/components/task/` ou un sous-dossier `_components/`.

#### F-LOG-003 — Page `invite` client-side avec fetch dans `useEffect`

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `src/app/invite/[token]/page.tsx` est `"use client"` et charge l'invitation via `useEffect`+`fetch`, contournant les Server Components (waterfall client, FCP dégradé, pas de contenu initial en cas d'erreur réseau).
- **Preuve** : `src/app/invite/[token]/page.tsx:1` (`"use client"`), `:31-47` (fetch dans useEffect).
- **Impact** : Spinner au lieu d'un rendu serveur ; premier affichage dégradé sur un parcours d'entrée (invitation).
- **Recommandation** : Convertir en Server Component qui fetch côté serveur, déléguant les interactions à un composant client enfant.

#### F-LOG-004 — Pages `terms`/`privacy` hors route group, providers et thème en dur

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `terms/page.tsx` et `privacy/page.tsx` héritent du `RootLayout` (tous les providers applicatifs) alors qu'elles sont statiques, et codent en dur le thème sombre (`bg-[#0a0a0f] text-white`).
- **Preuve** : `src/app/terms/page.tsx:11` ; `src/app/privacy/page.tsx:11` ; `src/app/layout.tsx:95-108`.
- **Impact** : JS inutile chargé pour des pages statiques ; incohérence de thème.
- **Recommandation** : Créer un route group `(static)` avec layout minimal ; utiliser les tokens de thème.

#### F-LOG-005 — Absence de `not-found.tsx` dans `(platform)`

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `(platform)` n'a pas de `not-found.tsx` : un `notFound()` retombe sur le 404 racine plein écran sans navigation plateforme.
- **Preuve** : `src/app/(platform)/task/[taskId]/page.tsx:35` (`notFound()`) ; absence de `src/app/(platform)/not-found.tsx`.
- **Impact** : Perte du contexte de navigation sur les 404 internes (recoupe F-UX-010).
- **Recommandation** : Ajouter un `not-found.tsx` dans `(platform)` rendu dans le layout.

#### F-LOG-006 — Absence totale de `loading.tsx` dans l'App Router

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Aucun `loading.tsx` n'existe : les pages Server Components avec accès Prisma n'ont pas de skeleton Suspense, donnant une impression de page figée pendant la résolution.
- **Preuve** : `commande: find src/app -name "loading.tsx"` (aucun résultat).
- **Impact** : Pas de feedback de chargement instantané lors des navigations (recoupe F-UI-028).
- **Recommandation** : Ajouter des `loading.tsx` dans `(platform)` et sur les routes à chargement long (`task/[taskId]`, `workspace/[workspaceId]`).

#### F-LOG-007 — `"use client"` injustifié sur 4 composants de rendu statique

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `category-badge.tsx`, `budget-alert.tsx`, `budget-skeleton.tsx`, `list-view-custom-fields.tsx` portent `"use client"` sans hook, handler ni API navigateur — ils pourraient être Server Components.
- **Preuve** : `src/components/budget/category-badge.tsx:1` ; `budget-alert.tsx:1` ; `budget-skeleton.tsx:1` ; `src/components/views/list-view-custom-fields.tsx:1`.
- **Impact** : JS inutile dans le bundle client (recoupe F-PRF-003).
- **Recommandation** : Retirer la directive `"use client"` de ces 4 fichiers.

#### F-LOG-008 — Pages de vue `"use client"` uniquement pour `useParams`

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : 4 pages de vue (`board`, `gantt`, `list-view`, `calendar`) sont `"use client"` seulement pour appeler `useParams()`, alors que `params` est disponible en prop côté serveur. La frontière client est ainsi remontée au niveau page.
- **Preuve** : `src/app/(platform)/workspace/[workspaceId]/space/[spaceId]/list/[listId]/{board,gantt,list-view,calendar}/page.tsx:1`.
- **Impact** : Arbre entier évalué côté client, FCP/SEO dégradés (recoupe F-PRF-004).
- **Recommandation** : Convertir en Server Components asynchrones recevant `params` en prop et passant aux enfants client.

#### F-LOG-009 — `dashboard/page.tsx` entièrement client

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : La page dashboard (~200 lignes, widgets, charts) est `"use client"` en entier ; bien qu'elle utilise des hooks, son squelette statique pourrait être un Server Component orchestrateur déléguant aux îlots interactifs.
- **Preuve** : `src/app/(platform)/dashboard/page.tsx:1`.
- **Impact** : Tout le code dashboard envoyé/hydraté côté client (TTI dégradé sur la page la plus visitée).
- **Recommandation** : Scinder en Server Component (layout statique + fetch serveur) + îlots client.

#### F-LOG-010 — Gestion d'erreur silencieuse dans 40 hooks SWR sur 59

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : 40 des 59 `useSWR` n'exposent pas `error` : sur exception du fetcher (réseau, 401, 500), l'UI reste en chargement infini ou en état vide trompeur. Même cause racine que F-UI-026, sous l'angle logique.
- **Preuve** : `src/components/task/task-dependencies.tsx:106` ; `src/components/task/activity-feed.tsx:55` ; `src/app/(platform)/notes/page.tsx:56` ; Annexe D.
- **Impact** : Aucun feedback d'erreur sur 40 endpoints ; recoupe l'UX (F-UX-008) et l'UI (F-UI-026).
- **Recommandation** : Destructurer `error` et afficher un fallback ; composant partagé `<SWRErrorFallback onRetry={mutate} />`.

#### F-LOG-011 — Polling `useRunningTimer` 5 s permanent dans le layout plateforme

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `useRunningTimer` (`refreshInterval: 5000`) est monté via `TimerButton` dans le `TopBar` du layout `(platform)` : `/api/time-entries/timer` est sollicité toutes les 5 s pour tous les utilisateurs connectés (720 req/h/utilisateur), qu'un timer soit actif ou non.
- **Preuve** : `src/hooks/use-time-entries.ts:35` ; `src/components/layout/top-bar.tsx:47` ; `src/app/(platform)/layout.tsx:24`.
- **Impact** : Charge serveur et consommation batterie mobile inutiles.
- **Recommandation** : Conditionner le polling à un timer actif (`refreshInterval: runningTimer ? 5000 : 0`).

#### F-LOG-012 — Clé SWR sans garde `null` dans `useCustomFieldsSidebar`

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `useCustomFieldsSidebar` construit ses clés sans garde : si `workspaceId`/`taskId` sont vides, des requêtes partent vers `/api/custom-fields?workspaceId=` ou `/api/tasks//custom-fields` (400/404 silencieux).
- **Preuve** : `src/hooks/use-custom-fields.ts:33`, `:37`.
- **Impact** : Requêtes inutiles vers des URLs invalides ; pollution du cache SWR.
- **Recommandation** : Gardes conditionnelles (`workspaceId ? url : null`), comme les autres hooks.

#### F-LOG-013 — Clé SWR non canonique dans `useTimeEntries`

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Appelé sans argument, `useTimeEntries` produit la clé `/api/time-entries?` (avec `?` terminal), URL non canonique qui empêche la déduplication avec `/api/time-entries` et déclenche un fetch immédiat non filtré.
- **Preuve** : `src/hooks/use-time-entries.ts:17` ; `src/app/(platform)/time-tracking/page.tsx:46`.
- **Impact** : Requête systématique au montage ; clés divergentes pour la même ressource.
- **Recommandation** : Normaliser la clé (`params.toString() ? url+? : "/api/time-entries"`).

#### F-LOG-014 — `revalidateOnFocus: false` absent sur les hooks à polling explicite

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : 5 hooks à `refreshInterval` explicite (notifications, reminders, runningTimer, dashboard, my-tasks) ne désactivent pas `revalidateOnFocus` : au retour de focus (fréquent sur mobile), une revalidation s'ajoute au polling, en rafales redondantes.
- **Preuve** : `src/hooks/use-notifications.ts:27` ; `src/hooks/use-time-entries.ts:35` ; `src/app/(platform)/dashboard/page.tsx:79` ; `src/app/(platform)/my-tasks/page.tsx:57`.
- **Impact** : Requêtes redondantes, particulièrement sur mobile.
- **Recommandation** : Ajouter `revalidateOnFocus: false` aux hooks définissant déjà un `refreshInterval`.

#### F-LOG-015 — Couverture Zod minoritaire (~26 % des routes acceptant des entrées)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Sur 96 routes, 25 seulement appliquent un schéma Zod (`safeParse`/`.parse()`) avant Prisma ; ~50 reposent sur de la validation manuelle ou aucune. Modules entiers (`finance/*`, `goals/*`, `templates`, `time-entries*`, plusieurs sous-ressources de tâche, `push/*`, `mobile-login`) n'utilisent aucun Zod.
- **Preuve** : `commande: find src/app/api -name route.ts | wc -l` (96) ; `commande: grep -rl 'safeParse\|\.parse(' src/app/api --include=route.ts | wc -l` (25) ; Annexe C.
- **Impact** : Validation hétérogène, messages d'erreur non standardisés, risque de champs non typés passés à Prisma.
- **Recommandation** : Standard projet : schéma Zod sous `src/lib/validations/<module>.ts` + `safeParse` avant Prisma ; migrer en priorité finance/goals/templates/time-entries/push.

#### F-LOG-016 — Module `finance/*` : body propagé à Prisma sans validation typée (8 routes)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Les 8 routes finance destructurent le body et le passent à Prisma sans Zod : `amount` non typé (arithmétique JS asymétrique sur `balance: { increment }`), `currency`/`color`/`type` sans whitelist ni format, bornes absentes.
- **Preuve** : `src/app/api/finance/transactions/route.ts:55-101` ; `finance/goals/[goalId]/contribute/route.ts:12-37` ; `finance/accounts/route.ts:38-58` ; aucun import `from "zod"` dans le module.
- **Impact** : Risque de corruption de données financières et 500 au lieu de 400 ; module sensible (intégrité comptable).
- **Recommandation** : Créer `src/lib/validations/finance.ts` (`amount: z.number().finite().positive()`, `type: z.enum(...)`, `currency` ISO 4217, `color` hex) et `safeParse` en tête de chaque handler.

#### F-LOG-017 — Champs énumérés sans whitelist Zod (recurrence, timer, custom-fields, push, mobile-login)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Plusieurs routes acceptent des valeurs d'ensembles fermés sans les valider : `recurrence.pattern`/`interval`/`dayOfMonth`, `timer.action`, whitelists `validTypes`/`allowed` codées en dur dans les handlers, `fcmToken` sans format, `mobile-login` sans réutiliser `loginSchema`.
- **Preuve** : `src/app/api/tasks/[taskId]/recurrence/route.ts:22-32` ; `time-entries/timer/route.ts:47` ; `custom-fields/route.ts:67-82` ; `me/notification-preferences/route.ts:33-46` ; `push/register-fcm/route.ts:10-13` ; `mobile-login/route.ts:32-37`.
- **Impact** : Valeurs invalides persistées (ex. `pattern: "annually"` cassant le cron), whitelists dupliquées non typées.
- **Recommandation** : Schémas Zod `z.enum(...)` exportés et réutilisés côté client/serveur ; réutiliser `loginSchema` dans `mobile-login`.

#### F-LOG-018 — Query strings non validées par Zod (aucune route)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Aucune des 96 routes ne valide ses `searchParams` via Zod : pas de coercion (`?limit=abc`), dates `new Date(raw)` → `Invalid Date` → 500 au lieu de 400, énumérés validés ad hoc.
- **Preuve** : `src/app/api/dashboard/stats/route.ts:13-14` ; `time-entries/report/route.ts:14-19` ; `tasks/route.ts:18-50` ; `search/route.ts:14-22`.
- **Impact** : Erreurs silencieuses converties en 500 ; cas limites non couverts ; pas de schéma partageable client/serveur.
- **Recommandation** : Helper `parseSearchParams(searchParams, schema)` avec `z.coerce.date()`/`z.coerce.number()` ; schémas réutilisables (pagination, dateRange).

#### F-LOG-019 — Schémas Zod serveur non mutualisés côté client (aucun `react-hook-form` + `zodResolver`)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Les 23 formulaires utilisent `useState` + validation manuelle ; `react-hook-form`/`@hookform/resolvers` absents de `package.json`. Les schémas Zod serveur (`registerSchema`, `createTaskSchema`, etc.) ne sont jamais réutilisés côté client (Zod est pourtant isomorphe).
- **Preuve** : `commande: grep -r 'react-hook-form\|zodResolver' src/` (aucun) ; `src/components/auth/register-form.tsx:30-50` ; `src/lib/validations/auth.ts:3-15`.
- **Impact** : Duplication des règles client/serveur (risque de divergence), validation tardive (après fetch), messages d'erreur non contextuels, a11y dégradée.
- **Recommandation** : Adopter `react-hook-form` + `zodResolver` et réutiliser les schémas Zod comme source unique de vérité.

#### F-LOG-020 — Deux routes effectuant des appels Prisma/push sans `try/catch`

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `me/notification-preferences` (GET/PATCH, appels Prisma) et `push/test` (POST, Prisma + envoi push) n'ont aucun `try/catch` : une exception remonte au runtime et renvoie une 500 HTML (au lieu du JSON `{ error }`), cassant les fetchers SWR (`SyntaxError: Unexpected token '<'`).
- **Preuve** : `src/app/api/me/notification-preferences/route.ts:5-50` ; `src/app/api/push/test/route.ts:8-42` ; `commande: find src/app/api -name 'route.ts' -exec grep -L 'try ' {} \;`.
- **Impact** : Réponse incohérente (HTML vs JSON) en cas de défaillance ; pas de log applicatif ; incohérence avec les 94 autres routes.
- **Recommandation** : Encapsuler chaque handler dans `try/catch` + `console.error` + 500 JSON ; à terme, wrapper `withErrorHandling`.

#### F-LOG-021 — Codes HTTP hétérogènes pour les conflits d'unicité (P2002) : 400 vs 409

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : 7 routes renvoient `409 Conflict` sur P2002, 3 renvoient `400 Bad Request` pour la même classe d'erreur (`workspaces/teams`, `teams/[teamId]/members`, `invites`), contredisant RFC 9110 (409 réservé aux conflits d'état).
- **Preuve** : `src/app/api/auth/register/route.ts:29-31` (409) ; `tags/route.ts:88-93` (409) ; `workspaces/[workspaceId]/teams/route.ts:88-93` (400) ; `workspaces/[workspaceId]/invites/route.ts:65-71` (400).
- **Impact** : Le client ne peut pas brancher une stratégie commune sur le statut ; monitoring confond conflits et erreurs de validation.
- **Recommandation** : Helper `handlePrismaError` mappant `P2002 → 409`, `P2025 → 404`, `P2003 → 400` ; aligner les 3 routes divergentes.

#### F-LOG-022 — Code `401` détourné pour un PIN de tâche incorrect (verify-pin)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `verify-pin` renvoie `401` sur PIN incorrect alors que l'utilisateur est authentifié et membre du workspace ; `401` est réservé à l'absence de credentials et peut déclencher la redirection automatique `/login` du fetcher SWR.
- **Preuve** : `src/app/api/tasks/[taskId]/verify-pin/route.ts:53-57` (401), `:48-50`/`:59-60` (200).
- **Impact** : Éjection possible de l'utilisateur vers `/login` à une erreur de PIN ; sémantique mélangée 200/401 sur un même endpoint.
- **Recommandation** : Utiliser `403` (ou `200` avec `valid:false`) ; documenter le contrat.

#### F-LOG-023 — Trois variantes de message 500 et `"Missing config"` classé 500

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Sur 171 réponses 500, trois libellés coexistent (`"Internal server error"` ×166, `"Server error"`, `"Something went wrong…"`), et `calendar/google/clear` renvoie `"Missing config"` en 500 alors qu'il s'agit d'une config OAuth manquante (devrait être 503 ou fail-fast au boot).
- **Preuve** : `src/app/api/mobile-login/route.ts:98` ; `auth/register/route.ts:90` ; `calendar/google/clear/route.ts:26` ; `commande: grep -rEn '"Internal server error"' src/app/api | wc -l` (166).
- **Impact** : Messages d'erreur incohérents/non localisés côté UI ; `"Missing config"` trompeur en debug.
- **Recommandation** : Helper `internalServerError()` uniforme + `code` machine-readable ; reclasser `"Missing config"` en 503 et valider l'env au démarrage.

#### F-LOG-024 — Pattern `try/catch + console.error + 500` dupliqué 170 fois sans wrapper

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : Le pattern défensif (correct en soi) est répété 170+ fois, avec des préfixes de log hétérogènes et sans `code` machine-readable. Aucun wrapper `withErrorHandling` n'existe, ce qui rend toute évolution (request-id, Sentry) coûteuse et n'empêche pas la récidive de F-LOG-020.
- **Preuve** : `commande: grep -rEn '} catch \(' src/app/api --include=route.ts | wc -l` (170+) ; `src/app/api/budget/route.ts:43-45` ; absence de `withErrorHandling` dans `src/lib`.
- **Impact** : Maintenance coûteuse, logs hétérogènes, message client collapsé en un seul libellé générique.
- **Recommandation** : Extraire `withApiHandler(handler)` centralisant format d'erreur, log préfixé et future intégration APM.

#### F-LOG-025 — `setWorkspaceId` synchronisé via `useEffect` (pattern dupliqué 5×)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : 5 composants poussent le `workspaceId` reçu en prop dans le store `useModal` via un `useEffect` identique — anti-pattern « external-sync » (React « You Might Not Need an Effect »).
- **Preuve** : `src/components/views/board-view.tsx:33-36` ; `list-view.tsx:34-37` ; `calendar-view.tsx:52-55` ; `gantt-view.tsx:39` ; `src/app/(platform)/calendar/page.tsx:117-119`.
- **Impact** : Duplication, re-renders inutiles, store désynchronisé si une vue oublie l'effet.
- **Recommandation** : Centraliser la synchronisation dans le layout `(platform)` ou faire dériver `workspaceId` du contexte par `useModal`.

#### F-LOG-026 — État dérivé synchronisé via `useEffect` (« state from props », 7 sites)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : 7 composants initialisent/réinitialisent un état de formulaire depuis une prop via `useState` + `useEffect`, provoquant un double rendu et un risque d'écrasement de la saisie en cours lors d'un `mutate()`.
- **Preuve** : `src/components/task/task-detail-content.tsx:48-53` ; `src/app/(platform)/notes/page.tsx:80-91` ; `settings/page.tsx:74-76` ; `budget/budget-form-dialog.tsx:74-91` ; `create-task-dialog.tsx:62-68` ; `quick-create-task.tsx:44-48`.
- **Impact** : Flicker, bug de course (saisie écrasée), `eslint-disable` masquant le risque.
- **Recommandation** : Pattern `key` pour réinitialiser au montage, calcul direct pendant le rendu, ou `useMemo`/init paresseuse.

#### F-LOG-027 — `useEffect` avec `eslint-disable react-hooks/exhaustive-deps` (page Notes)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : L'effet de la page Notes synchronise l'état d'édition sur `[selectedId]` tout en lisant `selectedNote`, avec `eslint-disable-line` masquant la dépendance manquante : risque de désynchronisation (et d'écrasement serveur via autosave) si `notes` change sans changement de `selectedId`.
- **Preuve** : `src/app/(platform)/notes/page.tsx:80-92` (dépendances `[selectedId]`, `eslint-disable` ligne 92), `:78`.
- **Impact** : Bug de course sur l'autosave ; linter aveuglé pour les régressions futures.
- **Recommandation** : Extraire un `<NoteEditor key={selectedId} note={...} />` initialisant son état au montage (pattern `key`), sans `eslint-disable`.

#### F-LOG-028 — `useEffect` qui devrait être Server Component ou SWR (settings, calendar-settings, timer)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : 3 `useEffect` font un `fetch` au montage pour des données accessibles via SWR/Server Component : `settings` (préférences, `.catch` silencieux), `calendar-settings` (token + statut Google, 3 `useCallback` redondants), `timer-button` (recherche debouncée maison ré-implémentant `useDebounce`/SWR, erreurs ignorées).
- **Preuve** : `src/app/(platform)/settings/page.tsx:78-83` ; `dashboard/calendar-settings/page.tsx:69-89,108-111` ; `src/components/time-tracking/timer-button.tsx:49-77`.
- **Impact** : Pas de gestion d'erreur/revalidation, duplication de logique d'infrastructure, fetchs ré-exécutés à chaque montage.
- **Recommandation** : Remplacer par `useSWR` dédiés (et `mutate` pour le retour OAuth) ; réutiliser `useDebounce` + SWR pour la recherche.

#### F-LOG-029 — `useEffect` écrivant une clé `localStorage` jamais relue (`runningTimer`, code mort)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `timer-button.tsx` écrit `localStorage["runningTimer"]` à chaque changement (toutes les 5 s) avec un commentaire « instant display on navigation », mais aucune lecture `getItem("runningTimer")` n'existe nulle part — code mort écrivant ~720 fois/h pour rien.
- **Preuve** : `src/components/time-tracking/timer-button.tsx:32-46`, `:107` ; `commande: grep -rn "runningTimer" src/ | grep localStorage` (aucun `getItem`).
- **Impact** : Stockage gaspillé, écritures runtime inutiles, fonctionnalité promise non implémentée (confusion).
- **Recommandation** : Supprimer l'effet et la suppression associée, ou implémenter la lecture symétrique (`fallbackData`) si le besoin est validé.

#### F-LOG-030 — Dépendances `useEffect` instables (`searchParams`, `toast`, refresh non protégé)

- **Axe** : LOG
- **Sévérité** : Medium
- **Description** : `calendar-settings` dépend de l'objet `searchParams` (instable) et rappelle `fetchGoogleStatus()` à chaque changement de query param, ré-émettant un toast d'erreur à chaque montage si l'URL contient `?error=`. `swr-config` appelle `refreshTokenCache()` sans `catch`, masquant un échec de bootstrap d'auth mobile.
- **Preuve** : `src/app/(platform)/dashboard/calendar-settings/page.tsx:113-141` ; `src/lib/swr-config.tsx:29-32`.
- **Impact** : Fetchs/toasts redondants ; échec silencieux du refresh de token mobile.
- **Recommandation** : Dépendre de strings stables (`success`, `error`), nettoyer l'URL après lecture, ajouter `.catch` au refresh.

### 3.4 Axe BDD — Base de données

Confrontation du `schema.prisma` (49 modèles) à ses usages, index, cascades `onDelete`, cohérence des migrations, requêtes N+1/scans complets et SQL brut. 31 Findings (11 High, 20 Medium).

> Point de conformité positif : aucun usage de `$queryRaw`/`$executeRaw`/`$queryRawUnsafe` n'a été détecté (tâche 8.6) — pas de risque d'injection par SQL brut.

#### F-BDD-005 — `FinanceTransaction.targetAccountId` : FK logique active mais non contrainte

- **Axe** : BDD
- **Sévérité** : High
- **Description** : `targetAccountId` (transferts entre comptes) est un champ scalaire sans `@relation` : pas d'intégrité référentielle, pas de cascade `onDelete` (transferts orphelins après suppression d'un compte), pas de contrainte `accountId != targetAccountId`. Champ activement lu/écrit (création de la transaction inverse).
- **Preuve** : `prisma/schema.prisma#FinanceTransaction` (champ sans `@relation`) ; `src/app/api/finance/transactions/route.ts:56,73,87-99` ; `src/components/finance/add-transaction-dialog.tsx:77,134`.
- **Impact** : Risque d'intégrité de données financières (soldes incohérents, transferts auto-référencés). Critère « intégrité de données » → High.
- **Recommandation** : Matérialiser `@relation` (`onDelete: SetNull`) + relation inverse, contrainte `CHECK (account_id <> target_account_id)`, durcir le contrôle workspace.

#### F-BDD-006 — `Favorite.targetId` polymorphe non contraint (4 modèles, aucune intégrité)

- **Axe** : BDD
- **Sévérité** : High
- **Description** : `Favorite` utilise un `type` + `targetId` polymorphe (task/list/space/folder) sans `@relation` : pas d'intégrité référentielle, pas de cascade (favoris orphelins après suppression de la cible), pas d'isolation workspace garantie, et résolution N+1 obligatoire (cf. F-BDD-024).
- **Preuve** : `prisma/schema.prisma#Favorite` ; annexe E §1.30 ; `commande: grep -rn "prisma\.favorite" src/`.
- **Impact** : Risque d'intégrité référentielle élevé (orphelins accumulés à chaque suppression). Critère « intégrité » → High.
- **Recommandation** : Matérialiser 4 FK exclusives (`taskId`/`listId`/`spaceId`/`folderId` + `CHECK num_nonnulls = 1`, `onDelete: Cascade`) ou 4 tables séparées ; à défaut, purge des orphelins + vérif ownership avant INSERT.

#### F-BDD-007 — Cohabitation contradictoire `Task.assigneeId` (FK simple) et `TaskAssignee` (table d'association)

- **Axe** : BDD
- **Sévérité** : High
- **Description** : `Task` déclare simultanément `assigneeId` (mono-assignation, `SetNull`) et la relation `assignees TaskAssignee[]` (multi-assignation, `Cascade`). Les deux sont écrits/lus en parallèle sans synchronisation : notifications, affichage, filtres et cascades incohérents (double vérité).
- **Preuve** : `prisma/schema.prisma#Task` (`assigneeId` + `assignees`) ; `src/app/api/tasks/route.ts:115,172` (écrit `assigneeId`) ; `src/app/api/tasks/[taskId]/assignees/route.ts:10,29,49` (écrit `TaskAssignee`) ; `src/app/api/tasks/[taskId]/comments/route.ts:100-105` (combinaison).
- **Impact** : Intégrité métier et double vérité : notifications/affichage/filtres divergents selon la source lue. Critère « double mécanisme contradictoire » → High.
- **Recommandation** : Choisir une source unique (recommandé : tout migrer vers `TaskAssignee`, retirer `assigneeId`), adapter routes/filtres/UI.

#### F-BDD-016 — 4 relations `creator: User` sans `onDelete` (Restrict implicite bloquant)

- **Axe** : BDD
- **Sévérité** : High
- **Description** : `Goal.creator`, `Budget.creator`, `BudgetTransaction.creator`, `BudgetTemplate.creator` n'ont pas de clause `onDelete` → `Restrict` par défaut, rendant **impossible** la suppression d'un utilisateur ayant créé l'un de ces objets (incohérent avec `Task.creator`/`TaskTemplate.creator` en `Cascade`). Bloque la suppression de compte (RGPD) et le re-seed.
- **Preuve** : `prisma/schema.prisma:537,666,696,749` ; `commande: grep -n "@relation(fields:" prisma/schema.prisma | grep -v "onDelete:"` (4 lignes) ; `prisma/seed.ts:29` (`user.deleteMany()`).
- **Impact** : Hard-fail bloquant sur le cycle de vie utilisateur (droit à l'effacement RGPD techniquement impossible) ; incohérence interne du schéma. Critère « hard-fail cycle de vie » → High.
- **Recommandation** : Passer les 3 relations financières en `onDelete: SetNull` (`creatorId` nullable) ; traiter `BudgetTemplate` par suppression du modèle (cf. F-BDD-002).

#### F-BDD-019 — Cascades `FinanceAccount → FinanceTransaction` et `Budget → BudgetTransaction` détruisent l'historique financier

- **Axe** : BDD
- **Sévérité** : High
- **Description** : Supprimer un compte ou un budget détruit en cascade **toutes** ses transactions historiques, sans pré-vérification de volume, archivage ni confirmation côté API. Incohérent avec `FinanceGoal` (`SetNull`). Aggravé par F-BDD-005 (orphelins `targetAccountId`).
- **Preuve** : `prisma/schema.prisma:694` (Budget→BudgetTransaction Cascade), `:835` (FinanceAccount→FinanceTransaction Cascade), `:866` (FinanceGoal SetNull) ; `src/app/api/finance/accounts/[accountId]/route.ts:53-67` ; `src/app/api/budget/[budgetId]/route.ts:94-111`.
- **Impact** : Perte irréversible de données comptables (plusieurs années) sans récupération ni soft-delete. Critère « perte de données / destruction massive silencieuse » → High.
- **Recommandation** : Passer en `onDelete: Restrict` + archivage (`isArchived`), ou conserver `Cascade` avec `_count` + confirmation `?confirm=true` ; harmoniser avec `FinanceGoal`.

#### F-BDD-022 — Aucune migration versionnée (`prisma/migrations/` absent)

- **Axe** : BDD
- **Sévérité** : High
- **Description** : Aucune migration SQL n'est versionnée : `prisma/` ne contient que `schema.prisma` et `seed.ts`. La base de production a été synchronisée hors dépôt (probablement `prisma db push`). Schéma non reproductible, dérive base↔schéma indétectable, aucun rollback atomique.
- **Preuve** : `commande: ls -la prisma/` (2 entrées) ; `commande: git ls-files prisma/` (schema + seed) ; `commande: git log --all -- 'prisma/migrations/*'` (vide) ; `.gitignore:33-35` (n'ignore pas `migrations/`) ; `vercel.json:2`.
- **Impact** : Reproductibilité et intégrité opérationnelle compromises (staging/dev/sinistre impossibles à provisionner depuis le dépôt). Critère « perte de données : migration manquante » → High.
- **Recommandation** : Baseline `prisma migrate diff --from-empty` → `0_init`, `migrate resolve --applied`, politique `migrate dev` documentée, test CI de dérive.

#### F-BDD-023 — `buildCommand` Vercel exécute `prisma generate` mais omet `prisma migrate deploy`

- **Axe** : BDD
- **Sévérité** : High
- **Description** : `vercel.json` build = `npx prisma generate && next build` : le client Prisma est régénéré mais aucune migration n'est appliquée en base. Une modification de schéma déploie un code attendant une colonne absente → 500 runtime, sans signal au build. Procédure manuelle `db push` non documentée, sujette à conditions de course.
- **Preuve** : `vercel.json:2` ; `package.json:5-19` (aucun script `prisma migrate`) ; `notes/inv-crons.md` ; recoupe F-BDD-022.
- **Impact** : Fenêtre d'erreur 500 en production à chaque évolution de schéma ; previews pointant sur la base de prod. Critère « panne en production » → High.
- **Recommandation** : `buildCommand: "npx prisma generate && npx prisma migrate deploy && next build"` (après baseline F-BDD-022) ; `DATABASE_URL` par environnement (Neon Branches pour les previews).

#### F-BDD-024 — N+1 polymorphe sur `Favorite` (1 requête par favori)

- **Axe** : BDD
- **Sévérité** : High
- **Description** : `GET /api/favorites` charge tous les favoris (sans `take:`) puis exécute un `findUnique` par favori selon `type` (N+1, non réductible par `Promise.all`), avec filtre workspace post-hoc côté code. Route appelée à chaque montage de sidebar / navigation entre workspaces.
- **Preuve** : `src/app/api/favorites/route.ts:37` (findMany sans take), `:43-110` (boucle), `:47,70,89` (findUnique polymorphes) ; recoupe F-BDD-006.
- **Impact** : Coût compute linéaire avec le nombre de favoris, non borné, sur un endpoint UI critique. Critère N+1 + endpoint critique → High (Property 7).
- **Recommandation** : Batcher par type (3 `findMany({ where: { id: { in: ids } } })`) → 4 requêtes totales quel que soit le nombre de favoris.

#### F-BDD-025 — Cron `budget-alerts` : `findMany` global sans `where`/`take` + `findFirst` par budget×seuil

- **Axe** : BDD
- **Sévérité** : High
- **Description** : Le cron quotidien charge **tous** les budgets de la base (sans `where` ni `take`) avec un `include` profond chargeant toutes les transactions et membres, puis exécute un `findFirst` de déduplication par budget×seuil (boucle imbriquée). Plusieurs centaines de requêtes possibles en pic.
- **Preuve** : `src/app/api/cron/budget-alerts/route.ts:16-25` (findMany sans where/take, include profond), `:29-72` (boucle), `:49-58` (findFirst) ; `vercel.json:14-17` ; recoupe F-BDD-010.
- **Impact** : Hydratation massive en mémoire (~50 000 lignes possibles) + N+1 sur table `Notification` non indexée. Critère N+1/scan + cron → High (Property 7).
- **Recommandation** : `where` ciblé + `groupBy` SQL pour les agrégats + `findMany` de dédup unique ; à terme `Budget.spentAmount` matérialisé.

#### F-BDD-026 — Crons `daily-tasks`/`upcoming-deadlines` : scan `Task` sans `take` + N+1 notifications

- **Axe** : BDD
- **Sévérité** : High
- **Description** : Les deux crons quotidiens chargent les tâches filtrées par `dueDate` sans `take:` ni `select` ; `upcoming-deadlines` exécute en plus un `findFirst` notification **par tâche × utilisateur** (boucle imbriquée M×T) sur la table `Notification` non indexée — risque de timeout serverless.
- **Preuve** : `src/app/api/cron/daily-tasks/route.ts:21-30` ; `src/app/api/cron/upcoming-deadlines/route.ts:21-30,55-78` ; recoupe F-BDD-008 et F-BDD-010.
- **Impact** : Coût O(M×T) croissant, risque de timeout silencieux (notifications planifiées perdues). Critère N+1/scan + cron → High (Property 7).
- **Recommandation** : `take:` borné + un `findMany` notification unique (`WHERE IN`) indexé par `Set` côté code + index `Notification(userId, type, link, createdAt)`.

#### F-BDD-029 — `GET /api/budget` charge toutes les transactions de tous les budgets (sans `take`/`select`)

- **Axe** : BDD
- **Sévérité** : High
- **Description** : `GET /api/budget` fait `include: { transactions }` sans `take:` ni `select`, rapatriant tout l'historique de chaque budget pour n'afficher qu'un récapitulatif ; `GET /api/budget/stats` fait de même puis agrège en JS au lieu de `groupBy` SQL. Coût linéaire et non borné dans le temps.
- **Preuve** : `src/app/api/budget/route.ts:33-43` ; `src/app/api/budget/stats/route.ts:28-32,50-103`.
- **Impact** : Bande passante et mémoire serveur proportionnelles à l'historique (risque OOM serverless avec quelques power-users). Critère scan/over-fetch sur table croissante → High (Property 7).
- **Recommandation** : `_count` + `groupBy({ _sum })` SQL pour les totaux ; route paginée séparée pour le détail des transactions.

#### F-BDD-001 — Modèle `BudgetAlert` mort (jamais persisté ni lu)

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : `BudgetAlert` (7 champs, 2 relations, 2 index) n'est jamais accédé via `prisma.budgetAlert.*` ; les seuils d'alerte sont codés en dur dans le cron qui écrit dans `Notification`. Table morte, index inutiles, fonctionnalité d'alertes paramétrables inopérante.
- **Preuve** : `prisma/schema.prisma#BudgetAlert` ; `commande: grep -rn "prisma\.budgetAlert" src/ prisma/` (exit 1) ; `src/app/api/cron/budget-alerts/route.ts:38-72`.
- **Impact** : Dette de schéma, index morts, fonctionnalité suggérée mais absente (confusion mainteneur).
- **Recommandation** : Activer (CRUD + lecture dans le cron + UI) ou supprimer le modèle et les types associés.

#### F-BDD-002 — Modèle `BudgetTemplate` mort

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : `BudgetTemplate` n'est jamais accédé (aucune route, aucun composant) ; seules des références typologiques existent. Table morte avec `@@index` inutile ; la relation `creator` sans `onDelete` bloquerait la suppression d'utilisateur (cf. F-BDD-016).
- **Preuve** : `prisma/schema.prisma#BudgetTemplate` ; `commande: grep -rn "prisma\.budgetTemplate" src/ prisma/` (exit 1) ; `src/types/index.ts:27,225`.
- **Impact** : Dette de schéma ; fonctionnalité « templates de budget » pré-câblée mais jamais finalisée.
- **Recommandation** : Activer ou supprimer (fusionnable avec F-BDD-001).

#### F-BDD-003 — `BudgetTransactionTag` peuplé mais non éditable ni filtrable

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Les tags de transaction sont créés et lus via include mais aucune route ne permet de les éditer, renommer, supprimer ou filtrer ; figés à la création. Pas d'index sur `name` pour un futur filtrage.
- **Preuve** : `prisma/schema.prisma#BudgetTransactionTag` ; `src/app/api/budget/[budgetId]/transactions/route.ts:96,138,146` ; `commande: grep -rn "prisma\.budgetTransactionTag" src/` (exit 1).
- **Impact** : Fonctionnalité « tags » incomplète ; incohérence (« courses »/« Courses ») non gérée.
- **Recommandation** : Compléter le CRUD (synchronisation des tags au PATCH, listing workspace, filtre) ou remplacer par un champ scalaire `tags String[]`.

#### F-BDD-004 — `BudgetTransaction.sourceBudgetId`/`targetBudgetId` jamais lus ni écrits (FK mortes)

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Les champs de transfert inter-budgets et le drapeau `isTransfer` ne sont jamais persistés ni lus (la fonctionnalité de transfert n'existe que pour `FinanceTransaction`). FK logiques mortes non matérialisées.
- **Preuve** : `prisma/schema.prisma#BudgetTransaction` ; `commande: grep -rn "sourceBudgetId\|targetBudgetId" src/ prisma/` (exit 1) ; `src/app/api/budget/[budgetId]/transactions/route.ts:16`.
- **Impact** : Dette de schéma ; risque d'incohérence comptable si `isTransfer` était activé côté client.
- **Recommandation** : Finaliser (relations + écriture + transaction inverse) ou supprimer les champs.

#### F-BDD-008 — `Task` : 7 champs filtrés/triés sans `@@index`

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : `Task` n'a aucun `@@index` alors que `listId`, `parentId`, `assigneeId`, `statusId`, `dueDate`, `position`, `updatedAt` sont filtrés/triés sur les endpoints les plus chauds (vue liste, mes tâches, calendrier, crons, recherche, calcul de position à chaque création).
- **Preuve** : `prisma/schema.prisma#Task` ; `src/app/api/tasks/route.ts:34,160` ; `src/app/api/my-tasks/route.ts:20` ; `src/app/api/dashboard/stats/route.ts:87` ; `src/app/api/search/route.ts:55`.
- **Impact** : `Seq Scan` croissant sur la table la plus volumineuse, à chaque ouverture de liste/création de tâche.
- **Recommandation** : Index `[listId, parentId]`, `[assigneeId, dueDate]`, `[dueDate]`, `[statusId]`, `[parentId]`, `[listId, statusId, position]`.

#### F-BDD-009 — Enfants de `Task` sans index sur la FK parente

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : `Comment`, `Activity`, `Attachment`, `Checklist`, `ChecklistItem`, `CustomFieldValue` n'ont aucun `@@index` sur la FK parente alors que c'est le filtre principal de chaque listing (chaque ouverture de tâche = 6 `Seq Scan`).
- **Preuve** : `prisma/schema.prisma` (modèles sans `@@index`) ; `src/app/api/tasks/[taskId]/comments/route.ts:20` ; `activity/route.ts:18` ; `dashboard/stats/route.ts:101`.
- **Impact** : Scans répétés à chaque ouverture de tâche et au dashboard.
- **Recommandation** : `@@index([taskId])` (et `[taskId, createdAt]` quand le tri suit), `[checklistId]`, `[taskId]` sur `CustomFieldValue`.

#### F-BDD-010 — `Notification` sans index (`userId`, `(userId, read)`, `(userId, type, createdAt)`)

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Modèle parmi les plus écrits, sans aucun `@@index`. Lectures (cloche), `updateMany` (mark-read) et déduplications de 3 crons filtrent toutes par `userId`/`(userId,type,createdAt)` → `Seq Scan` à chaque appel, multiplié par item dans les crons.
- **Preuve** : `prisma/schema.prisma#Notification` ; `src/app/api/notifications/route.ts:13` ; `mark-read/route.ts:30` ; `cron/budget-alerts/route.ts:50`.
- **Impact** : Poste de coût compute potentiellement le plus élevé du back-end à mesure que la table grossit.
- **Recommandation** : `@@index([userId, createdAt])`, `[userId, read]`, `[userId, type, createdAt]` ; politique de rétention.

#### F-BDD-011 — `Reminder` sans index (`(userId, workspaceId, remindAt)`, `(completed, remindAt)`)

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Aucun `@@index` alors que le cron de rappels (réveil fréquent) et l'UI filtrent par `(userId, workspaceId)`, `remindAt`, `completed` → scan complet à chaque réveil malgré une fenêtre temporelle très sélective.
- **Preuve** : `prisma/schema.prisma#Reminder` ; `src/app/api/reminders/route.ts:36` ; `src/app/api/cron/reminders/route.ts:21,82`.
- **Impact** : Coût compute récurrent du cron le plus chaud ; UID `/reminders` dégradée.
- **Recommandation** : `@@index([userId, workspaceId, remindAt])` et `[completed, remindAt]`.

#### F-BDD-012 — `TimeEntry` sans index (timer en cours, rapports)

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Aucun `@@index` alors que la détection du timer en cours (`userId, endTime IS NULL`, appelée à chaque chargement de la barre) et les rapports (`taskId/userId, startTime`) scannent toute la table.
- **Preuve** : `prisma/schema.prisma#TimeEntry` ; `src/app/api/time-entries/timer/route.ts:13,58,112` ; `src/app/api/time-entries/report/route.ts:34-50`.
- **Impact** : Scan à chaque tick du timer affiché ; rapports lents à l'échelle.
- **Recommandation** : `@@index([userId, endTime])` (ou index partiel SQL `WHERE end_time IS NULL`), `[taskId, startTime]`, `[userId, startTime]`.

#### F-BDD-013 — `Space`/`Folder`/`List`/`Goal`/`TaskTemplate`/`CustomField` : FK + `workspaceId` non indexés

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Six modèles filtrés par scope (`workspaceId`/`spaceId`/`folderId`) et triés par `order`/`createdAt` n'ont aucun `@@index` ; le rendu de la sidebar (`/api/spaces`) déclenche une cascade de `Seq Scan`.
- **Preuve** : `prisma/schema.prisma` (6 modèles sans `@@index`) ; `src/app/api/spaces/route.ts:37` ; `folders/route.ts:37` ; `lists/route.ts:34` ; `custom-fields/route.ts:33`.
- **Impact** : Coût croissant du rendu de sidebar et des listings de configuration.
- **Recommandation** : `[workspaceId, order]` / `[spaceId, order]` / `[spaceId, folderId, order]` / `[workspaceId, createdAt]` selon le modèle.

#### F-BDD-014 — `WorkspaceMember` : `@@unique([workspaceId, userId])` ne couvre pas `where: { userId }`

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : La colonne de tête de l'unique est `workspaceId` ; une recherche `members: { some: { userId } }` (15+ routes, dont `/api/workspaces` appelée à chaque chargement post-auth) n'est pas servie par l'index → `Seq Scan`.
- **Preuve** : `prisma/schema.prisma#WorkspaceMember` ; `src/app/api/workspaces/route.ts:13` ; `src/app/api/budget/route.ts:13-22` ; multiples helpers d'ownership.
- **Impact** : `Seq Scan` sur l'endpoint le plus chargé après auth et sur chaque vérification d'ownership.
- **Recommandation** : Ajouter `@@index([userId])` séparé de l'unique composite.

#### F-BDD-015 — `TaskDependency` : `dependencyTaskId` non couvert par l'unique composite

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : `@@unique([dependentTaskId, dependencyTaskId])` ne sert pas la recherche inverse `where: { dependencyTaskId }`, exécutée à chaque ouverture de l'onglet Dépendances → `Seq Scan`.
- **Preuve** : `prisma/schema.prisma#TaskDependency` ; `src/app/api/tasks/[taskId]/dependencies/route.ts:51,61`.
- **Impact** : Scan inverse à chaque ouverture (impact modéré, table petite).
- **Recommandation** : Ajouter `@@index([dependencyTaskId])`.

#### F-BDD-017 — Cascade `Status.tasks` (`onDelete: Cascade`) : destruction silencieuse possible

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Supprimer un `Status` cascade sur toutes les tâches associées. Le risque est mitigé par une garde applicative 409 dans la seule route de suppression, mais le filet est applicatif (fragile) et non posé au niveau schéma.
- **Preuve** : `prisma/schema.prisma:265` ; `src/app/api/lists/[listId]/statuses/route.ts:206-213,218`.
- **Impact** : Perte massive de données dès qu'une nouvelle voie de suppression contourne la garde.
- **Recommandation** : Passer `Task.status` en `onDelete: Restrict` (garde au niveau base) ; conserver le 409 pour l'UX.

#### F-BDD-018 — Cascade `Folder → List → Tasks` sans confirmation côté API

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Les suppressions de folder/space/workspace cascadent sur toute l'arborescence (listes, tâches, sous-entités) sans pré-vérification de volume ni confirmation côté API ; la seule protection est la dialog UI, contournable par appel API direct.
- **Preuve** : `prisma/schema.prisma:223,264,208,194` ; `src/app/api/folders/[folderId]/route.ts:108-141` ; `spaces/[spaceId]/route.ts:110-138` ; `workspaces/[workspaceId]/route.ts:114-149`.
- **Impact** : Destruction massive silencieuse possible via l'API (mobile, script, client tiers).
- **Recommandation** : Conserver les `Cascade` mais ajouter un `_count` et exiger `?confirm=true` côté API.

#### F-BDD-020 — Cascade subtasks asymétrique avec `Activity` (perte d'auditabilité)

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : `Task.parent → Cascade` supprime les sous-tâches (et leurs `Activity` via `Activity.task Cascade`) sans logger d'activité pour les enfants cascadés ; le verrou `task.locked` est contourné indirectement (suppression du parent non verrouillé).
- **Preuve** : `prisma/schema.prisma:268,355,570` ; `src/app/api/tasks/[taskId]/route.ts:381-399`.
- **Impact** : Perte d'auditabilité sur les sous-tâches cascadées ; contournement du verrou.
- **Recommandation** : Check récursif des sous-tâches verrouillées avant suppression ; archiver l'activité avant cascade.

#### F-BDD-021 — Asymétrie `Task.assignee → SetNull` vs `TaskAssignee.user → Cascade`

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : La suppression d'un utilisateur produit un état hybride sur une même tâche (`assigneeId` mis à NULL, ligne `TaskAssignee` détruite), aggravant la double vérité de F-BDD-007 sur le cycle de vie.
- **Preuve** : `prisma/schema.prisma:266,485,267` ; recoupe F-BDD-007.
- **Impact** : Perte d'information asymétrique, décrémentation silencieuse des assignés.
- **Recommandation** : Aligner les comportements (idéalement via la résolution de F-BDD-007), ou `SetNull` des deux côtés.

#### F-BDD-027 — Cron `reminders` : `findFirst` notification par reminder (boucle séquentielle)

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : Le cron de rappels (findMany bien borné) exécute un `findFirst` de déduplication + un `update` par reminder dans une boucle séquentielle, sur `Notification` non indexée (2N requêtes/cycle).
- **Preuve** : `src/app/api/cron/reminders/route.ts:21-29,33-41,74-78` ; recoupe F-BDD-010/F-BDD-011.
- **Impact** : Latence séquentielle et coût récurrent à l'échelle (≥ Medium par Property 7).
- **Recommandation** : `findMany` batch unique avant la boucle + `Set` côté code ; `updateMany`.

#### F-BDD-028 — `GET /api/spaces` : `include` profond cascadé sans `select`

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : La route de la sidebar charge `folders → lists → statuses` sans `select` ni `take`, rapatriant toute l'arborescence (descriptions et métadonnées inutiles) à chaque rendu/refocus.
- **Preuve** : `src/app/api/spaces/route.ts:36-55` ; recoupe F-BDD-013.
- **Impact** : Réponse JSON volumineuse, scans cascadés, à chaque montage de sidebar (≥ Medium par Property 7).
- **Recommandation** : `select` strict (id/name/color/order) ; combiner aux index F-BDD-013 ; envisager une route `/api/sidebar` cachée.

#### F-BDD-030 — Routes calendrier : `findMany` Task sans `take` + `include` profond

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : `feed/[token]`, `export`, `google/sync` chargent les tâches par `dueDate` sans `take:` avec `include` profond ; `google/sync` ajoute un N+1 d'appels Google Calendar (risque de quota 429 sans back-off). `tasks/calendar` est conforme (`take: 500` + `select`).
- **Preuve** : `src/app/api/calendar/feed/[token]/route.ts:32-66` ; `calendar/export/route.ts:17-50` ; `calendar/google/sync/route.ts:118-185`.
- **Impact** : Feeds iCal volumineux, risque de quota Google (≥ Medium par Property 7).
- **Recommandation** : `take: 1000` + `select` strict ; batcher/mettre en cache les appels Google Calendar.

#### F-BDD-031 — 18 endpoints de listing sans `take:` ni pagination

- **Axe** : BDD
- **Sévérité** : Medium
- **Description** : 53 des 62 `findMany` sont sans `take:` ; 18 endpoints à listing transverse sur tables croissantes (`time-entries`, `notes`, `templates`, `finance/transactions`, `budget/[id]/transactions`, sous-ressources de tâche, `workspaces/[id]/lists`, `goals`, etc.) n'ont aucune pagination.
- **Preuve** : `commande: grep -rn "take:" src/ --include="*.ts"` (9 occurrences vs 62 `findMany`) ; références ligne par ligne en `notes/axe-bdd.md` (8.5).
- **Impact** : Latence croissante et risque OOM serverless à l'échelle (≥ Medium par Property 7).
- **Recommandation** : Pagination systématique (`take` + cursor) ; règle « tout `findMany` a un `take:` ou un commentaire justifiant ».

### 3.5 Axe INF — Vercel / Infra

Revue de `vercel.json` (functions, regions, headers, crons), de l'authentification des crons, des variables d'environnement vs `.env.example`, de `next.config.mjs` et de l'observabilité. 13 Findings (2 High, 11 Medium).

#### F-INF-003 — Crons ne vérifient pas le header standard `Authorization: Bearer <CRON_SECRET>`

- **Axe** : INF
- **Sévérité** : High
- **Description** : Les 4 cron handlers lisent uniquement le query string `?secret=` ou le header non standard `x-vercel-cron-secret`, mais pas le header officiel `Authorization: Bearer <CRON_SECRET>` que Vercel injecte. Or `vercel.json` ne déclare que `path`+`schedule` (aucun moyen d'injecter `?secret=`). Si Vercel n'envoie que le header standard, les 4 crons renvoient 401 en production.
- **Preuve** : `src/app/api/cron/{reminders,daily-tasks,upcoming-deadlines,budget-alerts}/route.ts:9-14` (lecture `searchParams.get("secret") ?? headers.get("x-vercel-cron-secret")`) ; `vercel.json:4-21` ; `commande: rg -i 'authorization' src/app/api/cron/` (0 résultat). À confirmer via External_Console (logs Vercel).
- **Impact** : Risque que toutes les notifications planifiées (rappels, récapitulatifs, échéances, alertes budget) ne soient jamais envoyées (401 systématiques), sans alerte applicative. Critère « panne en production » → High.
- **Recommandation** : Accepter en priorité `request.headers.get("authorization") === \`Bearer ${CRON_SECRET}\`` ; confirmer le statut HTTP des crons en console Vercel avant remédiation.

#### F-INF-011 — Crons : `try/catch` global unique, une itération en erreur abandonne tout le batch

- **Axe** : INF
- **Sévérité** : High
- **Description** : Les 4 crons englobent le `findMany` initial **et** la boucle d'envoi dans un unique `try/catch` sans isolation par itération : une exception sur un seul item interrompt le handler (500) et toutes les itérations restantes sont ignorées. Pour `reminders`, le cleanup `updateMany(completed: true)` placé après la boucle peut rendre des rappels manqués irrécupérables.
- **Preuve** : `src/app/api/cron/reminders/route.ts:20-92` ; `daily-tasks/route.ts:19-80` ; `upcoming-deadlines/route.ts:20-87` ; `budget-alerts/route.ts:15-79`.
- **Impact** : Panne en cascade : un item défaillant bloque toutes les notifications du run, sans contexte de diagnostic. Critère « panne en production / blocage utilisateur majeur » → High.
- **Recommandation** : `try/catch` par itération (`console.error` contextuel + `continue`) ; conserver le `try/catch` externe pour les erreurs hors boucle ; vérifier la politique de retry Vercel.

#### F-INF-001 — Cron handlers sans `maxDuration`/`memory` explicites

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : `vercel.json` ne déclare aucune section `functions` et les handlers cron n'exportent pas `maxDuration` : ils tournent avec la valeur par défaut (≈10-15 s), insuffisante dès que le volume croît (boucles d'envoi sans idempotence ni file d'attente).
- **Preuve** : `vercel.json:1-22` (pas de `functions`) ; boucles dans `cron/reminders/route.ts:34-78`, `cron/budget-alerts/route.ts:25-72` ; aucun `export const maxDuration`.
- **Impact** : Risque de timeout en production (rappels/alertes non envoyés sans reprise).
- **Recommandation** : Déclarer `functions: { "src/app/api/cron/**/route.ts": { maxDuration: 60, memory: 512 } }` ou `export const maxDuration` ; confirmer la limite du plan en console Vercel.

#### F-INF-002 — Aucune `regions` (désalignement possible avec Neon)

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : `vercel.json` ne déclare pas `regions` : les fonctions sont déployées dans la région par défaut, potentiellement distincte de l'instance Neon, ajoutant un round-trip inter-régions par requête Prisma (amplifié sur les routes multi-requêtes).
- **Preuve** : `vercel.json:1-22` ; usage `process.env.DATABASE_URL` (`notes/inv-env.md`) ; routes BDD-intensives (`dashboard/stats`, `favorites`). Région Neon à confirmer via External_Console.
- **Impact** : Latence accrue proportionnelle au nombre de requêtes BDD enchaînées, surcoût compute.
- **Recommandation** : Récupérer la région Neon (console) et déclarer `regions: ["<region>"]` alignée.

#### F-INF-004 — Crons acceptent le secret en query string (exposition passive aux logs)

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : Les crons acceptent `CRON_SECRET` via `?secret=` ; les query strings sont consignés en clair dans les logs HTTP Vercel/CDN et peuvent fuir via `Referer`.
- **Preuve** : `src/app/api/cron/{reminders,daily-tasks,upcoming-deadlines,budget-alerts}/route.ts:11`.
- **Impact** : Fuite passive possible du secret → invocation libre des crons (spam e-mails/push, saturation de quotas).
- **Recommandation** : Supprimer la branche `searchParams.get("secret")` et n'utiliser que le header `Authorization` (cf. F-INF-003) ; canal query string réservé au non-prod.

#### F-INF-005 — Variables serveur requises absentes de `.env.example`

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : 7 variables serveur requises (`FIREBASE_SERVICE_ACCOUNT`, `RESEND_API_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `CRON_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) sont référencées dans le code mais absentes de `.env.example` (9 variables seulement y figurent).
- **Preuve** : `.env.example:1-13` ; `src/lib/firebase-admin.ts:8` ; `src/lib/email.ts:3` ; `src/lib/push.ts:3-4` ; `cron/*/route.ts:6-7` ; `calendar/google/*/route.ts`.
- **Impact** : Reproduction d'environnement non documentée pour FCM/e-mail/Web Push/cron/OAuth ; dégradation silencieuse de fonctionnalités majeures.
- **Recommandation** : Compléter `.env.example` (noms + commentaires, sans valeurs), aligné sur la config Vercel réelle.

#### F-INF-006 — Variables de config non secrètes absentes de `.env.example` (fallbacks liés au déploiement)

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : `FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`, `VAPID_CONTACT_EMAIL` ne sont pas documentées et reposent sur des fallbacks codés en dur liés au déploiement actuel (`onboarding@resend.dev`, `clickup-clone-three.vercel.app`, `contact@done.app`).
- **Preuve** : `.env.example:1-13` ; `src/lib/email.ts:5-6` ; `src/lib/push.ts:5`.
- **Impact** : Délivrabilité e-mail dégradée, liens d'invitation pointant vers la mauvaise URL en cas de domaine personnalisé/nouveau déploiement.
- **Recommandation** : Documenter ces 3 variables ; `console.warn` au démarrage en production si absentes.

#### F-INF-007 — `output: "standalone"` incohérent avec Vercel

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : `next.config.mjs` déclare `output: "standalone"` (mode auto-hébergement) alors que le déploiement est sur Vercel (qui ignore `.next/standalone/`). Configuration morte, trompeuse pour un futur passage Docker.
- **Preuve** : `next.config.mjs:6` ; `vercel.json:3` (`framework: nextjs`).
- **Impact** : Configuration trompeuse ; artefact `.next/standalone/` inutilisé alourdissant le build.
- **Recommandation** : Retirer `output: "standalone"` si Vercel est l'unique cible, ou documenter l'intention Docker et ses pré-requis.

#### F-INF-008 — `images.unoptimized: true` + `remotePatterns: [{ hostname: "**" }]`

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : L'optimiseur d'images est désactivé globalement tout en autorisant n'importe quel hôte HTTPS distant — configuration contradictoire et inerte (aucun `next/image` utilisé). Si l'optimiseur est réactivé sans resserrer `remotePatterns`, l'endpoint `/_next/image` devient un proxy ouvert.
- **Preuve** : `next.config.mjs:7-12` ; `commande: rg -l 'from "next/image"' src/` (aucun).
- **Impact** : Dette de configuration ; surface d'attaque latente (proxy de bande passante) ; images servies en taille brute.
- **Recommandation** : Supprimer `remotePatterns` si on garde `unoptimized: true`, ou retirer `unoptimized` et restreindre `remotePatterns` à la liste exhaustive des hôtes.

#### F-INF-009 — `experimental` activé sans pin de version Next

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : `optimizePackageImports` et `scrollRestoration` sont activés sous `experimental` alors que `next` est pinné en `^16.2.6` (caret) : un upgrade mineur peut renommer/déplacer ces drapeaux (warning de build, perte silencieuse de l'optimisation), sans commentaire justificatif.
- **Preuve** : `next.config.mjs:13-19` ; `package.json:43` (`"next": "^16.2.6"`).
- **Impact** : Régression silencieuse possible (warning, perte de tree-shaking) au prochain `npm install`.
- **Recommandation** : Documenter chaque drapeau ; vérifier la sortie de build aux upgrades ; envisager un pin strict.

#### F-INF-010 — Aucun outil d'observabilité tiers (`console.error` seul)

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : Aucun APM/logger structuré (Sentry, Datadog, OpenTelemetry, `@vercel/analytics`) ni `instrumentation.ts` ; `console.error` (rétention Vercel limitée) est l'unique signal, sans alerte automatique ni `global-error.tsx`.
- **Preuve** : `package.json` (aucun paquet d'observabilité) ; `commande: find . -maxdepth 3 -name "instrumentation*"` (0) ; `src/app/error.tsx:16-18` ; absence de `global-error.tsx`.
- **Impact** : Pas d'alerte automatique, rétention courte des logs, post-mortem difficile, pas de tracing.
- **Recommandation** : Installer Sentry (ou drain de logs) via `instrumentation.ts` ; ajouter `global-error.tsx`.

#### F-INF-012 — Blocs `catch { }` silencieux sur chemins métier (avatar, Google Calendar)

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : 5 blocs `catch { }` avalent l'erreur sans log : refresh token Google (`401 "Token expired"` indistinct d'une panne), suppression d'événements Google, cleanup avatar (échec d'`unlink` sur FS Vercel éphémère). Diagnostic impossible.
- **Preuve** : `commande: grep -rEn "catch\s*\{" src/app/api --include="route.ts"` ; `calendar/google/clear/route.ts:55,85` ; `calendar/google/sync/route.ts:214` ; `user/avatar/route.ts:64,101`.
- **Impact** : Échecs silencieux non diagnostiquables ; dérive Google Calendar/avatars non signalée.
- **Recommandation** : `catch (err) { console.error("[tag]", err); ... }` ; capturer le code d'erreur structuré de `googleapis`.

#### F-INF-013 — `sendNotificationToUsers` : erreurs FCM/Web Push non-410 silencieusement avalées

- **Axe** : INF
- **Sévérité** : Medium
- **Description** : Les envois push sont fire-and-forget avec un `.catch` ne traitant que `"GONE"`/`registration-token-not-registered` ; toute autre erreur (Firebase mal configuré, quota, réseau) est avalée sans log. Si `FIREBASE_SERVICE_ACCOUNT` est mal configuré, tous les push échouent silencieusement.
- **Preuve** : `src/lib/notifications.ts:74-101` ; `src/lib/firebase-admin.ts:8-11` (throw synchrone swallowed).
- **Impact** : FCM silencieusement désactivable sans signal ; race condition sur `prisma.pushSubscription.delete` (`UnhandledRejection`).
- **Recommandation** : Logger systématiquement avant de filtrer le cas GONE ; `.catch` sur le `delete` imbriqué ; capturer via APM.

### 3.6 Axe MOB — Mobile / Capacitor

Revue de `capacitor.config.ts` (dev/prod), du `AndroidManifest.xml` (permissions, `applicationId`, backup, FileProvider), des plugins déclarés vs utilisés, du cycle de vie du token FCM et de la conformité du build APK. 12 Findings (1 High, 11 Medium).

> Points de conformité positifs : `applicationId` cohérent sur 7 emplacements ; permissions du manifeste justifiées ; aucun keystore ni secret de signing commité dans git (`.gitignore` actif).

#### F-MOB-004 — `android:allowBackup="true"` non restreint expose le token d'authentification mobile

- **Axe** : MOB
- **Sévérité** : High
- **Description** : Le manifeste déclare `allowBackup="true"` sans `dataExtractionRules`/`fullBackupContent` : Android Auto Backup sauvegarde tout `/data/data/com.done.app/` (dont `CapacitorStorage.xml`) vers le cloud Google. Or le `mobile_auth_token` (JWT 30 j, bearer de toutes les requêtes API mobiles) est stocké via Capacitor Preferences → sauvegardé en clair et restaurable sur tout appareil.
- **Preuve** : `android/app/src/main/AndroidManifest.xml:5` ; `src/lib/storage.ts:17-19` ; `src/components/auth/login-form.tsx:109` ; `src/lib/swr-config.tsx:15` ; `commande: grep -nE 'allowBackup|dataExtractionRules' AndroidManifest.xml`.
- **Impact** : Fuite de credentials : token bearer sauvegardé en clair (cloud Google, `adb backup`) et restauré sur un autre appareil, valide 30 j sans révocation. Critère « exposition de secrets côté client » → High.
- **Recommandation** : `allowBackup="false"` ou exclure `CapacitorStorage.xml` via `dataExtractionRules`/`backup_rules` ; migrer le token vers Android Keystore/EncryptedSharedPreferences ; révocation à la déconnexion.

#### F-MOB-001 — `*.ngrok-free.app` autorisé dans `server.allowNavigation` en production

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : `allowNavigation` liste `*.ngrok-free.app` (motif de tunnel de développement) dans la config packagée en production, élargissant la surface de navigation de la WebView à n'importe quel sous-domaine ngrok.
- **Preuve** : `capacitor.config.ts:11` ; `android/app/src/main/assets/capacitor.config.json:9`.
- **Impact** : Artefact de dev en production ; surface d'attaque accrue (phishing/redirection vers un tunnel tiers).
- **Recommandation** : Retirer `*.ngrok-free.app` du build prod ; externaliser via `process.env` pour le dev ; régénérer via `cap sync`.

#### F-MOB-002 — `server.url` codé en dur, sans aiguillage dev/prod, divergent de `BUILD_APK.md`

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : `server.url` est une valeur littérale sans `process.env` ; `BUILD_APK.md` référence un `process.env.CAPACITOR_SERVER_URL` inexistant et une procédure d'édition manuelle, source de commit accidentel d'URL de dev.
- **Preuve** : `capacitor.config.ts:8` ; `BUILD_APK.md:31,33` ; `commande: grep -n 'CAPACITOR_SERVER_URL' capacitor.config.ts src/` (aucune).
- **Impact** : Bascule dev/prod fragile, divergence doc/code, risque de fuite d'URL de dev.
- **Recommandation** : Câbler `process.env.CAPACITOR_SERVER_URL` ; aligner `BUILD_APK.md` ; hook pre-commit interdisant `localhost`/`ngrok` dans la config.

#### F-MOB-003 — `webDir: "public"` incohérent avec Next.js (aucun export statique)

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : `webDir: "public"` ne pointe pas vers des assets web buildés (Next.js sans `output: "export"`). Ne fonctionne que parce que `server.url` est défini ; la suppression de `server.url` (Mode 2 de `BUILD_APK.md`) chargerait `public/` sans coquille applicative (écran blanc).
- **Preuve** : `capacitor.config.ts:5` ; `BUILD_APK.md:50-58` ; absence de `output: "export"` dans `next.config.mjs`.
- **Impact** : Configuration latente non robuste ; APK cassé en mode standalone.
- **Recommandation** : Migrer vers `output: "export"` + `webDir: "out"`, ou assumer le wrapper WebView (retirer le Mode 2, `webDir` vers un shell minimal).

#### F-MOB-005 — `FileProvider` déclaré sans usage, scope `path="."` trop large

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : Le `<provider>` FileProvider (`grantUriPermissions="true"`, `path="."` couvrant tout le stockage externe et le cache) est déclaré par le boilerplate mais jamais utilisé (aucun `@capacitor/share`/`filesystem`, aucun Intent `ACTION_SEND`). Déclaration orpheline non conforme au moindre privilège.
- **Preuve** : `AndroidManifest.xml:29-39` ; `res/xml/file_paths.xml:3-4` ; `commande: grep -rnE 'FileProvider|Intent\.ACTION_(VIEW|SEND)|content://' src/` (0).
- **Impact** : Dette ; risque latent si un futur code émet un Intent avec un URI `content://` (scope trop large).
- **Recommandation** : Supprimer le provider et `file_paths.xml` si aucun partage n'est planifié, ou restreindre le scope à un sous-dossier dédié.

#### F-MOB-006 — `plugins.SplashScreen` configure un plugin `@capacitor/splash-screen` non installé

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : Le bloc `plugins.SplashScreen` (`launchShowDuration`, `backgroundColor`) cible un plugin non installé, non enregistré (`capacitor.plugins.json`), non câblé Gradle et jamais importé → options silencieusement ignorées au runtime.
- **Preuve** : `capacitor.config.ts:23-26` ; `package.json:21-25` (pas de `@capacitor/splash-screen`) ; `capacitor.plugins.json` (2 entrées) ; `commande: grep -rnE "@capacitor/splash-screen|SplashScreen" src/` (0).
- **Impact** : Configuration morte trompeuse (le contributeur croit le splash configurable côté Capacitor).
- **Recommandation** : Installer le plugin + `cap sync` si un splash Capacitor est voulu, sinon supprimer le bloc et documenter le splash natif Android.

#### F-MOB-007 — `google-services.json` présent mais non versionné et non ignoré

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : `android/app/google-services.json` (consommé par le plugin `google-services`) est présent sur disque mais ni suivi par git, ni ignoré (règle `.gitignore` commentée), ni jamais commité. Build non reproductible (clone propre ne compile pas) et risque de commit accidentel.
- **Preuve** : `commande: ls -la android/app/google-services.json` ; `commande: git ls-files --error-unmatch` (exit 1) ; `commande: git check-ignore -v` (exit 1) ; `android/.gitignore:64-65` (commenté).
- **Impact** : Reproductibilité du build compromise, hygiène de versionnement ambiguë (clé API restreinte, pas de fuite de secret exploitable).
- **Recommandation** : Trancher : versionner le fichier (clé restreinte) ou l'ignorer activement + fournir un `.example` et une procédure documentée.

#### F-MOB-008 — Aucun désenregistrement du token FCM à la déconnexion

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : Le logout efface le token/cookie mobile mais ne supprime aucune `PushSubscription` et n'appelle ni `PushNotifications.unregister()` ni une route de suppression FCM (inexistante). Les notifications continuent vers l'appareil d'un utilisateur déconnecté tant que le token reste valide.
- **Preuve** : `src/lib/mobile-auth.tsx:65-72` ; `src/app/api/mobile-logout/route.ts:4-13` ; `commande: grep -rn "register-fcm|unregister|pushSubscription" src/` (aucune suppression).
- **Impact** : Fuite potentielle d'informations vers un appareil partagé/cédé (notifications de l'utilisateur déconnecté).
- **Recommandation** : Route `DELETE /api/push/register-fcm` appelée au logout ; `PushNotifications.unregister()` ; suppression de la `PushSubscription` ciblée côté serveur.

#### F-MOB-009 — `register-fcm` sans rate limit + réassignation inconditionnelle du token

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : `POST /api/push/register-fcm` n'a pas de rate limiting (contraire à `requirements.md` 6.4) et fait un `upsert` réassignant inconditionnellement un `fcmToken` à l'appelant (`update: { userId }`) : un utilisateur soumettant un token tiers le détourne vers son compte (déni de service ciblé contre la victime).
- **Preuve** : `src/app/api/push/register-fcm/route.ts:16-24` ; `commande: grep -rn "ratelimit|@upstash" src/` (mobile-login uniquement).
- **Impact** : Détournement/DoS du canal de notification ; modèle de confiance incorrect (propriété déclarée, non prouvée). Recoupe F-SEC-007.
- **Recommandation** : `checkRateLimit` indexé `user.id`/IP ; ne réassigner qu'avec preuve de possession ; clé d'unicité composite `(userId, fcmToken)`.

#### F-MOB-010 — Purge des tokens FCM périmés inopérante (filtrage `err.message` au lieu de `err.code`)

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : La suppression d'un token mort est conditionnée à `err.message === "GONE" || includes("registration-token-not-registered")`, alors que firebase-admin expose le code dans `err.code` (`"messaging/registration-token-not-registered"`). La condition est probablement toujours fausse pour FCM → tokens périmés jamais supprimés (`PushSubscription` sans `updatedAt`/TTL).
- **Preuve** : `src/lib/notifications.ts:78-85` ; `src/lib/firebase-admin.ts:38-57` ; `prisma/schema.prisma:614-630`.
- **Impact** : Accumulation de tokens morts, tentatives d'envoi vouées à l'échec, aggravation de F-MOB-008.
- **Recommandation** : Filtrer sur `err.code` ; brancher séparément le 410 Web Push ; ajouter `updatedAt`/purge périodique.

#### F-MOB-011 — Divergence `BUILD_APK.md`/`build.gradle` sur les secrets de signing (méthode documentée inopérante)

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : La `signingConfig` lit `System.getenv(...)`, mais `BUILD_APK.md` présente comme méthode principale `~/.gradle/gradle.properties` (propriétés Gradle, non lues par `getenv`) : un développeur suivant la doc produit un APK **non signé** (simple `logger.warn`).
- **Preuve** : `android/app/build.gradle:27-30,38,47-49` ; `BUILD_APK.md:114-129` ; `.env.example:5-9`.
- **Impact** : Release non signée silencieusement → refus d'installation/publication, perte de temps de diagnostic.
- **Recommandation** : `project.findProperty(...) ?: System.getenv(...)` ; `throw GradleException` si signing incomplet en release ; aligner doc/`.env.example`.

#### F-MOB-012 — Keystores stockés dans l'arbre du dépôt (racine + `android/app/`), nom divergent

- **Axe** : MOB
- **Sévérité** : Medium
- **Description** : Deux keystores (`done.keystore` racine et `android/app/done.keystore`, tailles différentes) sont présents dans l'arbre de travail (contre la consigne `BUILD_APK.md` « hors du repo »), nom divergent de `done-release.keystore` documenté, et seule la règle `*.keystore` les protège du commit. Ambiguïté sur la clé canonique.
- **Preuve** : `commande: ls -la done.keystore android/app/done.keystore` ; `BUILD_APK.md:93,109,147` ; `.gitignore:49` ; `commande: git check-ignore -v done.keystore`.
- **Impact** : Risque structurel d'exposition (un `git add -f`/régression `.gitignore` près du commit) ; procédure de signature manuelle inopérante (nom divergent) ; risque de signer avec la mauvaise clé.
- **Recommandation** : Déplacer les keystores hors du dépôt ; règle `.gitignore` dédiée par chemin ; supprimer la copie sous `android/app/` ; clarifier la clé canonique et le nom.

### 3.7 Axe SEC — Sécurité

Revue de la configuration NextAuth, de l'ownership par route API (96 routes), du rate limiting Upstash, des secrets `NEXT_PUBLIC_*`, des en-têtes de sécurité, des cookies de session et du CORS. 13 Findings (6 High, 7 Medium).

> Points de conformité positifs (aucun Finding) : aucun secret métier ne porte le préfixe `NEXT_PUBLIC_*` (tâche 11.4) ; aucun en-tête CORS permissif (`Access-Control-Allow-Origin: *`) sur routes authentifiées (tâche 11.7) ; en-têtes `X-Frame-Options`, `X-Content-Type-Options`, HSTS, `frame-ancestors` correctement positionnés.

#### F-SEC-001 — Module Finance : accès inter-workspace/inter-utilisateur sans ownership

- **Axe** : SEC
- **Sévérité** : High
- **Description** : Les routes Finance authentifient l'appelant mais ne vérifient pas l'appartenance du `workspaceId`/`accountId`/`categoryId`/`goalId` manipulé. Notamment : création de transaction sur un `accountId` arbitraire **modifiant le solde d'un autre utilisateur**, contribution gonflant l'objectif d'autrui, modification/suppression de catégories tierces.
- **Preuve** : `src/app/api/finance/categories/route.ts:19-25,46-54` ; `finance/categories/[categoryId]/route.ts:15-18,35-37` ; `finance/goals/[goalId]/contribute/route.ts:22-37` ; `finance/transactions/route.ts:62-92` ; `finance/accounts/route.ts:47-57`.
- **Impact** : Fuite et corruption de données financières entre utilisateurs/workspaces (soldes falsifiés). Critère « fuite de données entre utilisateurs/workspaces » → High (Property 7).
- **Recommandation** : Helper d'autorisation unique (membership `workspaceMember` + remontée `id → workspaceId/userId`) appliqué avant tout accès Prisma, retournant 403/404. Priorité : `transactions`, `contribute`.

#### F-SEC-002 — Objectifs (Goals) : accès inter-workspace sans ownership

- **Axe** : SEC
- **Sévérité** : High
- **Description** : `GET/POST /api/goals` et `GET/PATCH/DELETE /api/goals/[goalId]` (+ `targets`) ne vérifient jamais la membership : lecture, modification et suppression d'objectifs d'un workspace tiers par simple connaissance de l'identifiant (seul `assertGoalUnlocked` contrôle `locked`, pas l'appartenance).
- **Preuve** : `src/app/api/goals/route.ts:9-19,34-47` ; `goals/[goalId]/route.ts:11-19,30-60,71-86` ; `goals/[goalId]/targets/route.ts`.
- **Impact** : Fuite et altération d'objectifs entre workspaces. Critère « fuite inter-workspace » → High (Property 7).
- **Recommandation** : Contrôle de membership sur `GET`/`POST` ; remontée `goal.workspaceId` sur les routes `[goalId]` ; mutualiser avec F-SEC-001.

#### F-SEC-003 — Tasks/Lists/reorder sans ownership

- **Axe** : SEC
- **Sévérité** : High
- **Description** : `GET /api/tasks?listId=`, `GET /api/lists?spaceId=|folderId=` retournent les données de n'importe quelle liste/space connu ; `PATCH /api/tasks/reorder` met à jour position **et `statusId`** de tâches arbitraires sans contrôle workspace (les `POST` correspondants, eux, vérifient).
- **Preuve** : `src/app/api/tasks/route.ts:24-30,36-76` ; `src/app/api/lists/route.ts:14-38` ; `src/app/api/tasks/reorder/route.ts:38-50`.
- **Impact** : Lecture de toutes les tâches/listes de workspaces tiers + modification de statuts d'autres workspaces (corruption). Critère « fuite et modification inter-workspace » → High (Property 7).
- **Recommandation** : Remonter au workspace et vérifier `workspaceMember` avant `findMany` ; sur `reorder`, valider l'appartenance de toutes les tâches ciblées.

#### F-SEC-004 — Sous-ressources de tâche sans contrôle `task → workspace`

- **Axe** : SEC
- **Sévérité** : High
- **Description** : De nombreuses sous-ressources (`activity`, `comments`, `checklists`, `subtasks`, `assignees`, `attachments`, `tags`, `recurrence`, `dependencies`, `duplicate`) opèrent sur le `taskId` du path sans remonter à `task.list.space.workspace.members`, en lecture comme en écriture (certains `POST` vérifient, d'autres non).
- **Preuve** : `src/app/api/tasks/[taskId]/activity/route.ts:18-26` ; `comments/route.ts:19-27` ; `assignees/route.ts:10-50` ; `recurrence/route.ts:11-45` ; `tags/route.ts:24-140` ; `duplicate/route.ts:46-47`.
- **Impact** : Lecture et altération des sous-ressources de n'importe quelle tâche par son `id` (fuite + modification inter-workspace). Critère « fuite inter-workspace » → High (Property 7).
- **Recommandation** : Helper `assertTaskAccess(taskId, userId)` (404 si non membre) en première instruction de chaque handler, GET inclus.

#### F-SEC-005 — Time Tracking : fuite globale inter-utilisateur

- **Axe** : SEC
- **Sévérité** : High
- **Description** : `GET /api/time-entries/report` (et `GET /api/time-entries`) partent d'un `where` non scopé par utilisateur ; sans `workspaceId`, ils retournent **toutes** les entrées de temps de la plateforme avec noms et e-mails. `GET /api/time-entries/[entryId]` lit n'importe quelle entrée par `id`.
- **Preuve** : `src/app/api/time-entries/report/route.ts:21-56` ; `src/app/api/time-entries/route.ts:21-31` ; `time-entries/[entryId]/route.ts:17-25`.
- **Impact** : Fuite massive inter-utilisateurs (activité chronométrée + PII). Critère « fuite de données entre utilisateurs » → High (Property 7).
- **Recommandation** : Filtre par défaut `userId: user.id` (et/ou membership) sur toutes les lectures ; `workspaceId` obligatoire sur `report` ; vérifier `entry.userId === user.id`.

#### F-SEC-006 — Templates : accès inter-workspace sans ownership

- **Axe** : SEC
- **Sévérité** : High
- **Description** : `GET/POST/DELETE /api/templates` ne vérifient jamais la membership : lecture des templates d'un workspace tiers, création dans un workspace non membre, suppression de templates d'autrui par `id`.
- **Preuve** : `src/app/api/templates/route.ts:14-25,46-57,78-84`.
- **Impact** : Fuite et corruption inter-workspace. Critère « fuite inter-workspace » → High (Property 7).
- **Recommandation** : Vérifier la membership sur `GET`/`POST` ; remonter `template.workspaceId` sur `DELETE` ; mutualiser avec F-SEC-001.

#### F-SEC-007 — Push : vol de token FCM / désinscription tierce

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : `register-fcm` réassigne inconditionnellement un `fcmToken` à l'appelant (vol de token), `subscribe` fait `deleteMany({ endpoint })` sans vérif owner, et `unsubscribe` n'a **aucune authentification** (désinscription du device d'autrui par `endpoint`, qui n'est pas un secret).
- **Preuve** : `src/app/api/push/register-fcm/route.ts:16-23` ; `push/subscribe/route.ts:21` ; `push/unsubscribe/route.ts:5-12`.
- **Impact** : Détournement/DoS du canal de notification ; `unsubscribe` viole la Property 8 (route sans auth). Pas de fuite de données métier directe → Medium.
- **Recommandation** : Scoper rattachement/suppression par `userId` ; exiger `getCurrentUser` sur `unsubscribe` ; recoupe F-MOB-009.

#### F-SEC-008 — Rate limiting absent hors `/api/mobile-login`

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : `checkRateLimit` n'est utilisé que sur `mobile-login`. Aucune limitation sur `auth/register` (spam, énumération), le login NextAuth (bruteforce), `PATCH /api/user/password`, l'envoi d'invitations (quota Resend), les routes push. Le limiteur est de plus désactivé si Upstash n'est pas configuré.
- **Preuve** : `src/lib/rate-limit.ts:12-19,32-35` ; `src/app/api/mobile-login/route.ts:18` ; `commande: grep -rn 'checkRateLimit' src/` (2 occurrences).
- **Impact** : Surface de bruteforce/spam/énumération/abus de quota e-mail. Pas de fuite directe → Medium.
- **Recommandation** : Étendre `checkRateLimit` à register, login credentials, password, invites, push ; confirmer la config Upstash en console.

#### F-SEC-009 — CSP `script-src` avec `'unsafe-inline'` et `'unsafe-eval'`

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : La CSP applique `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, neutralisant la défense anti-XSS (scripts inline injectés exécutables, `eval` autorisé). L'app injecte des scripts inline via `dangerouslySetInnerHTML` (fetch interceptor, SW), ce qui explique mais coûte cher.
- **Preuve** : `next.config.mjs:38-43` ; `src/app/layout.tsx:60-100`.
- **Impact** : Pas de défense en profondeur en cas de XSS (recoupe F-SEC-011 sur le vol du token mobile). Autres en-têtes corrects → Medium.
- **Recommandation** : CSP basée sur nonces (middleware) ; retirer `'unsafe-inline'`/`'unsafe-eval'` ; externaliser les scripts inline.

#### F-SEC-010 — Session JWT NextAuth sans durée/rotation explicite ni cookie durci

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : `session: { strategy: "jwt" }` sans `maxAge`/`updateAge` (défaut 30 j), sans bloc `cookies` durci, sans révocation possible (JWT pur ; `PrismaAdapter` inopérant pour la persistance de session).
- **Preuve** : `src/lib/auth.ts:8-11,55-66` (pas de `maxAge`/`cookies`).
- **Impact** : Session compromise exploitable jusqu'à 30 j sans révocation ; durée implicite non documentée. Pas de fuite directe → Medium.
- **Recommandation** : `maxAge`/`updateAge` explicites + bloc `cookies` durci (`__Host-`, `sameSite`, `secure`, `httpOnly`) ; envisager `strategy: "database"`.

#### F-SEC-011 — JWT mobile 30 j sans révocation ; `mobile-me` ne relit pas la base

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : Le JWT mobile (HS256, 30 j) est non révocable et stocké en `localStorage` (exposé au XSS, cf. F-SEC-009) ; `GET /api/mobile-me` renvoie les claims du token sans relecture base (compte supprimé reste exploitable jusqu'à expiration).
- **Preuve** : `src/app/api/mobile-login/route.ts:66-92` ; `src/app/api/mobile-me/route.ts:19-30` ; `src/app/layout.tsx:66`.
- **Impact** : Fenêtre d'exploitation de 30 j pour un token volé ; `mobile-me` peut refléter un compte inexistant. Recoupe F-MOB-004. → Medium.
- **Recommandation** : Token court + refresh révocable (ou `tokenVersion`) ; `mobile-me` relit la base ; privilégier le cookie httpOnly.

#### F-SEC-012 — OAuth Google Calendar : `state` non signé (CSRF / fixation de compte)

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : Le flux OAuth utilise `state = user.id` (prévisible) et le callback consomme ce `state` sans authentifier l'appelant ni vérifier son intégrité (`upsert where { userId: state }`).
- **Preuve** : `src/app/api/calendar/google/auth/route.ts` ; `src/app/api/calendar/google/callback/route.ts:8,60-76`.
- **Impact** : Rattachement croisé possible d'un calendrier Google à un `userId` tiers (exploitabilité réduite par le besoin d'un `code` OAuth valide) → Medium.
- **Recommandation** : `state` aléatoire opaque stocké côté serveur (cookie signé/TTL) et vérifié au callback ; déduire le `userId` de la session.

#### F-SEC-013 — Token feed calendrier en URL + cache CDN public ; route de test push en prod

- **Axe** : SEC
- **Sévérité** : Medium
- **Description** : `GET /api/calendar/feed/[token]` utilise le token en path comme seul facteur d'auth avec `Cache-Control: public, max-age=3600` (fuite possible via logs/Referer/cache partagé) ; `POST /api/push/test` (« à supprimer en prod ») déclenche un envoi push réel.
- **Preuve** : `src/app/api/calendar/feed/[token]/route.ts:13-20,75-81` ; `src/app/api/push/test/route.ts:5,21-33`.
- **Impact** : Fuite passive du token de feed ; surface d'attaque inutile (route de test). → Medium.
- **Recommandation** : `Cache-Control: private, no-store` + rotation du token de feed ; retirer/conditionner `push/test` à `NODE_ENV !== "production"`.

### 3.8 Axe PRF — Performance

Revue de la taille des bundles, de la répartition Server/Client Components, des images, des requêtes BDD et du caching SWR. 8 Findings (0 High, 8 Medium).

> Aucun Finding High : la performance relève entièrement de dette Medium (analyse statique sans profilage en production). Points conformes : aucun `<img>` brut, `lodash`/`moment` absents, imports `lucide-react`/`date-fns` tree-shakés, `dashboard/stats` (parallélisation + `groupBy` + `take`) servant de patron de référence.

#### F-PRF-001 — `framer-motion` importé statiquement (32 modules, dont le layout global)

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : `framer-motion` (lourd) est importé statiquement dans 32 modules client, dont des composants de layout présents sur toutes les pages (sidebar items, mobile-nav, breadcrumbs, account-switcher, FAB), sans `LazyMotion` ni `next/dynamic`, et absent d'`optimizePackageImports`.
- **Preuve** : `src/components/layout/mobile-nav.tsx:4` ; `sidebar-list-item.tsx:3` ; `breadcrumbs.tsx:4` ; `next.config.mjs:13` ; `commande: grep -rl 'from "framer-motion"' src/ | wc -l` (32).
- **Impact** : Bundle de premier chargement alourdi sur toutes les pages plateforme (TTI mobile).
- **Recommandation** : `LazyMotion` + composant `m`, et/ou chargement différé via `next/dynamic` ; mesurer avec `@next/bundle-analyzer`.

#### F-PRF-002 — `recharts` importé statiquement (finance/budget)

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : `recharts` (lourd, basé D3) est importé statiquement dans 4 composants de graphique eux-mêmes importés sans `next/dynamic` dans les pages `/finance` et `/budget/[budgetId]`, gonflant le bundle de ces routes ; le pattern différé existe pourtant ailleurs (`tasks-by-priority-chart.tsx`).
- **Preuve** : `src/components/finance/expense-chart.tsx:4` ; `budget/budget-pie-chart.tsx:3` ; `src/app/(platform)/finance/page.tsx:24-25` ; pattern de référence `dashboard/tasks-by-priority-chart.tsx:6`.
- **Impact** : Bundles `/finance` et `/budget` gonflés par une dépendance graphique chargée en synchrone.
- **Recommandation** : Charger les 4 graphiques via `next/dynamic` (`ssr: false` + skeleton).

#### F-PRF-003 — Primitives `Card`/`Badge`/`Skeleton` marquées `"use client"`

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : Trois primitives pures de `src/components/ui/` portent `"use client"` (contrairement à la distribution shadcn/ui), forçant l'inclusion client de leur code chez tous leurs consommateurs (26/12/20 fichiers) et la contagion client par import.
- **Preuve** : `src/components/ui/card.tsx:1` ; `badge.tsx:1` ; `skeleton.tsx:1` ; `commande: grep -rln 'from "@/components/ui/card"' src/ | wc -l` (26).
- **Impact** : JS de présentation embarqué inutilement ; bascule client par contagion (anti « Server Components par défaut »).
- **Recommandation** : Retirer `"use client"` de ces 3 primitives.

#### F-PRF-004 — Frontière client au niveau page (22/24 pages plateforme)

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : 22 des 24 pages `(platform)` sont `"use client"` (202/333 fichiers `src/`), dont plusieurs pages volumineuses (645/610/450 lignes), embarquant tout l'arbre JSX statique dans le bundle client.
- **Preuve** : `commande: ... → 22/24` ; `commande: grep -rln '"use client"' src/ | wc -l` (202) ; `dashboard/calendar-settings/page.tsx:1` ; recoupe F-LOG-008/009.
- **Impact** : Bundle de premier chargement gonflé sur les routes les plus visitées ; FCP/TTI dégradés.
- **Recommandation** : Pattern « Server Component orchestrateur + îlots client » sur les pages les plus lourdes en priorité.

#### F-PRF-005 — Avatars servis sans optimisation ni conversion

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : Tous les avatars passent par `<AvatarImage>` (`<img>` brut), sans redimensionnement serveur, conversion WebP/AVIF ni `srcset` ; uploads jusqu'à 2 Mo affichés dans des cercles de 24-64 px ; `images.unoptimized: true` non justifié (build `standalone`, app Capacitor charge l'URL distante).
- **Preuve** : `next.config.mjs:8,5,9-10` ; `src/components/ui/avatar.tsx:27` ; `src/app/api/user/avatar/route.ts:8` ; `commande: grep -rn 'next/image' src/` (0).
- **Impact** : Bande passante gaspillée sur les vues à forte densité d'avatars (mobile Capacitor).
- **Recommandation** : Redimensionner/compresser à l'upload (`sharp` → WebP ~128 px) et/ou activer `next/image` (`unoptimized: false`).

#### F-PRF-006 — Recherche non-sargable `contains` (pas d'index trigramme)

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : `/api/search` et `/api/tasks` utilisent `{ contains: q }` (`LIKE '%q%'`) sans index trigramme/GIN ni full-text : chaque recherche déclenche un `Seq Scan` (le `take:` n'est appliqué qu'après scan+tri) ; `/api/search` exécute 3 scans par frappe (débouncée). `budget/transactions` aggrave avec `mode: "insensitive"`.
- **Preuve** : `src/app/api/search/route.ts:44-45,65,80-81` ; `src/app/api/tasks/route.ts:43-44` ; `prisma/schema.prisma:5-14` (pas de `fullTextSearch`).
- **Impact** : Latence de recherche croissant linéairement avec le volume, charge Postgres non bornée (Property 7).
- **Recommandation** : Index GIN trigramme (`pg_trgm`) sur les colonnes recherchées ou full-text Postgres ; homogénéiser `mode`.

#### F-PRF-007 — `finance/stats` : waterfall séquentiel + agrégations en JS

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : `GET /api/finance/stats` enchaîne 5 requêtes Prisma indépendantes en `await` séquentiels (latence = somme et non max), rapatrie toutes les transactions du mois (sans `select`) pour agréger en JS au lieu de `groupBy`/`aggregate` SQL, et n'expose aucun `Cache-Control`.
- **Preuve** : `src/app/api/finance/stats/route.ts:21,25,27-41,43,54,64` ; contre-exemple `dashboard/stats:51,178`.
- **Impact** : Latence de l'écran Finance dégradée par construction, surcoût compute/mémoire (Property 7).
- **Recommandation** : `Promise.all` ; `groupBy({ _sum })` au lieu de `findMany`+reduce ; `aggregate` pour `totalBalance` ; `Cache-Control`.

#### F-PRF-008 — Cache SWR uniforme pour données de référence

- **Axe** : PRF
- **Sévérité** : Medium
- **Description** : La configuration SWR globale traite les données de référence (peu volatiles) comme les données volatiles (revalidation au focus/reconnexion par défaut), provoquant des re-fetches inutiles de ressources stables.
- **Preuve** : `src/lib/swr-config.tsx:34-44` (config globale uniforme) ; Annexe D.
- **Impact** : Re-fetches redondants de données de référence (charge réseau/serveur), distinct du polling (F-LOG-011) et des clés (F-LOG-013).
- **Recommandation** : Gabarits SWR par classe de donnée (volatile vs référence : `dedupingInterval` long, `revalidateOnFocus: false`).

---

## 4. Limites et hypothèses

### Éléments à confirmer via External_Console

L'audit ayant été conduit hors connexion aux consoles Vercel et Neon, les points suivants n'ont pas pu être confirmés et restent **à valider en lecture seule** par l'utilisateur :

- **Vercel** : variables d'environnement réellement définies en production (notamment celles absentes de `.env.example`, cf. F-INF-005/006, et qu'aucune `NEXT_PUBLIC_*` supplémentaire ne contienne un secret, cf. F-SEC-011) ; plan tarifaire et rétention effective des Runtime Logs (F-INF-010) ; région de déploiement des fonctions (F-INF-002) ; politique de retry des Cron Jobs et statut HTTP réel des 4 crons sur 7 jours (confirme/infirme F-INF-003) ; `DATABASE_URL` par environnement de preview (F-INF-023).
- **Neon** : région de l'instance Postgres (alignement avec Vercel, F-INF-002) ; état réel du schéma vs `schema.prisma` (dérive non détectable sans migrations, F-BDD-022) ; mesures `EXPLAIN ANALYZE` confirmant l'impact des index manquants (F-BDD-008 à F-BDD-015) et de la recherche non-sargable (F-PRF-006).
- **Configuration OAuth Google** (F-SEC-012) et **quotas FCM/Resend** (F-INF-013, F-SEC-008).

Aucun accès console n'a été utilisé pendant l'audit : il n'y a donc **aucune date de consultation** à consigner (les External_Console n'ont pas été sollicitées, conformément au mode lecture seule et à l'absence d'accès fourni).

### Hypothèses retenues

- **Baseline auditée** : « HEAD `8b920995` + worktree non propre » au démarrage (cf. F-LOG-001). 57 fichiers étaient déjà modifiés non commités, dont des zones critiques (`schema.prisma`, routes API, auth, config Vercel/Capacitor). Les Findings portent sur cet état combiné ; certaines conclusions BDD/INF/SEC/MOB pourraient varier selon la baseline finalement retenue par l'utilisateur.
- **Analyse statique uniquement** : aucun code applicatif n'a été exécuté hors `next build`. Les estimations de performance (latence, poids de bundle, contraste de couleur) sont déduites du code et non mesurées ; le poids réel des bundles nécessite `@next/bundle-analyzer` (non exécuté).
- **Sévérités des cas-limites** : trois Findings ont été examinés au regard de la Property 7(a) et **maintenus en Medium** avec justification documentée — `F-SEC-007`/`F-MOB-009` (réassignation `fcmToken` : exige la connaissance d'un token spécifique à l'appareil, impact primaire sur l'intégrité du canal et non la lecture directe d'enregistrements métier), `F-SEC-012` (fixation OAuth : nécessite un `code` Google valide), `F-SEC-013` (token de feed en lecture seule). Ces classements peuvent être réévalués avec l'utilisateur si besoin.
- **Cron secret présent** : la Property 7(b) (cron sans secret = High) n'est **pas déclenchée au sens strict** : les 4 crons disposent d'un contrôle de secret. `F-INF-003` reste High au titre du risque de panne en production (401 systématiques), `F-INF-004` reste Medium (exposition passive).
- **Routes ouvertes par conception** : `/api/auth/[...nextauth]`, `/api/auth/register` (cf. rate-limit F-SEC-008), `/api/mobile-login`/`logout`, `/api/push/vapid-public-key`, `/api/invites/[token]` (GET) sont considérées comme légitimement ouvertes (non-Finding au titre de la Property 8).

---

## 5. Annexes

### Annexe A — Commandes exécutées

Journal des commandes shell réellement exécutées pendant l'audit (mode lecture seule). Aucune commande destructive. La sortie complète du build figure en Annexe B. Source intégrale : `notes/annexe-A-commandes.md` (et `notes/annexe-A-commandes-1.1.md` pour la Phase 0).

| Phase / Tâche | Commande (résumé) | Exit | But |
| --- | --- | --- | --- |
| 1.1 | `git status --short` ; `git diff --stat` | 0 | Baseline : 57 fichiers modifiés (+2645/−763), worktree non propre (F-LOG-001). |
| 2.1 | `npm run build` (= `next build`) | 0 | Build_Check (19 s, 77 pages, aucun warning bloquant). Sortie → Annexe B. |
| 3.1 | `find src/app/api -name "route.ts" \| wc -l` | 0 | 96 routes API (zéro `.js`). |
| 3.2 | `grep -rn -E "useSWR\b\|..." src/` | 0 | 59 fetchers SWR (23 hooks, 25 composants, 10 pages, 1 provider). |
| 3.3 | `ls -la prisma/` ; `git ls-files prisma/` ; `git log --all -- 'prisma/migrations/*'` | 0 | Aucune migration versionnée (F-BDD-022). |
| 3.5 | `grep -RonE "process\.env\.[A-Za-z_]+" src/ prisma/ \| sort -u` | 0 | 16 variables d'env référencées (croisées avec `.env.example`). |
| 5.1 | `grep -rn 'size="icon"' src/` ; `grep -rn 'aria-label' src/ \| wc -l` | 0 | 50 boutons icônes / 21 `aria-label` / 2 `sr-only` (F-UI-004). |
| 5.2 | `grep -rn '<AvatarImage' src/ \| grep -v ' alt=' \| wc -l` ; `grep -rn '<Label\b' ... \| grep -c htmlFor` | 0 | 39/40 avatars sans `alt` ; 43/88 labels liés (F-UI-009, F-UI-011). |
| 7.4 | `grep -rl 'safeParse\|\.parse(' src/app/api \| wc -l` | 0 | 25/96 routes avec Zod (F-LOG-015). |
| 7.5 | `grep -rEn '} catch \(' src/app/api \| wc -l` ; `find ... -exec grep -L 'try '` | 0/0 | 170+ blocs catch ; 2 routes sans try/catch (F-LOG-020/024). |
| 8.5 | `grep -rn "take:" src/ --include="*.ts"` ; `grep -rn "prisma\..*\.findMany" src/` | 0 | 9 `take:` pour 62 `findMany` (F-BDD-031). |
| 9.2 | `rg -i 'authorization' src/app/api/cron/` | 1 | Header standard Vercel jamais lu (F-INF-003). |
| 10.x | `ls -la ... google-services.json` ; `git check-ignore -v done.keystore` | — | `google-services.json` non versionné/non ignoré (F-MOB-007) ; keystores ignorés via `*.keystore` (F-MOB-012). |
| 11.x | `grep -rn 'checkRateLimit' src/` ; `grep -rn 'NEXT_PUBLIC_' src/` ; `grep 'Access-Control-Allow' .` | — | Rate limit sur `mobile-login` seul (F-SEC-008) ; aucun secret `NEXT_PUBLIC_*` ; aucun CORS permissif. |

> Convention : toutes les commandes sont de lecture/inspection ou `next build`. Plusieurs sous-tâches (3.4, 3.6, 9.4, etc.) ont été réalisées via les outils de lecture internes sans commande shell. Le journal exhaustif (≈100 commandes) figure dans `notes/annexe-A-commandes.md`.

### Annexe B — Log du Build_Check

| Champ | Valeur |
| --- | --- |
| Commande | `npm run build` (= `next build`) |
| Exit code | `0` (succès) |
| Durée | 19 s |
| TypeScript | terminé en 8.9 s |
| Compilation | « Compiled successfully in 7.6s » (Next.js 16.2.6, Turbopack) |
| Pages générées | 77/77 (292 ms, 15 workers) |
| stderr | vide |
| Warnings bloquants | aucun |

- **Environnements chargés** : `.env.local`, `.env`. **Expérimentaux actifs** : `optimizePackageImports`, `scrollRestoration` (message normal « use with caution »).
- **Inventaire issu du build** : 77 routes, dont **94 routes API** `/api/**` (toutes `ƒ` dynamiques) et **4 crons** (`budget-alerts`, `daily-tasks`, `reminders`, `upcoming-deadlines`). Pages statiques (`○`) : `/`, `/_not-found`, `/login`, `/privacy`, `/register`, `/terms`.
- **Non-régression** : `git status --short` post-build identique au baseline ; seule écriture dans `.next/` (gitignoré). Aucun warning TypeScript/ESLint bloquant → pas de Finding `F-LOG` High lié au build.

Sortie complète : `notes/annexe-B-build-log.md`.

### Annexe C — Inventaire des routes API

96 fichiers `route.ts` sous `src/app/api/**` (zéro `.js`). Synthèse (détail exhaustif route par route dans `notes/annexe-C-routes-api.md`, colonnes : Méthodes, Auth NextAuth, Ownership, Validation entrée, Scope des données) :

| Indicateur | Valeur |
| --- | --- |
| Routes avec contrôle NextAuth (`getCurrentUser`/`requireAuth`) | 92 |
| Routes à auth alternative | 4 crons (`CRON_SECRET`), 1 feed (token DB), 1 NextAuth handler, `register`/`mobile-login`/`mobile-logout` ouvertes, `mobile-me` (JWT direct), `google/callback` (state=userId), `invites/[token]` GET, `push/unsubscribe` (aucune), `push/vapid-public-key` |
| Routes avec ownership (workspace/owner/via parent) | ~80 |
| Routes signalées `⚠️` (auth présente, ownership absent/partiel) | Finance, Goals, `tasks`/`lists` GET, `tasks/reorder`, sous-ressources `tasks/[taskId]/*`, time-entries, templates, push → couvertes par F-SEC-001 à 007 et F-SEC-013 (Property 8) |
| Routes utilisant Zod | ~30 |
| Routes en validation manuelle | ~50 |
| Routes sans validation explicite | ~16 |

Toutes les routes `⚠️` sont référencées par l'`evidence` d'un Finding SEC (Property 8). Les routes ouvertes par conception (NextAuth handler, register, mobile-login/logout, vapid-public-key, invites GET) sont jugées acceptables.

### Annexe D — Inventaire des hooks SWR

59 fetchers `useSWR` inventoriés (23 dans `src/hooks/`, 1 provider, 25 composants, 10 pages) ; 5 `useSWRConfig` ; aucun `useSWRInfinite`/`useSWRMutation`. Détail (clé, fetcher, `res.ok`, gestion d'erreur, options) dans `notes/annexe-D-hooks-swr.md`.

| Indicateur | Valeur |
| --- | --- |
| Fetchers contrôlant `res.ok` | **59/59** (via fetcher local ou global) — conformité totale à la CLAUDE_Rule |
| Fetchers exposant `error` au consommateur | 19/59 (40 ne l'exposent pas → F-LOG-010 / F-UI-026) |
| Config globale (`src/lib/swr-config.tsx:34-44`) | `dedupingInterval: 2000`, `refreshInterval: 0`, `revalidateOnFocus: true`, `revalidateOnReconnect: true`, `errorRetryCount: 2`, fetcher ajoutant `Authorization: Bearer <token>` + `if (!res.ok) throw` |
| Hooks à polling explicite | 5 (notifications 30 s, reminders 60 s, runningTimer 5 s, dashboard 300 s, my-tasks 30 s) → F-LOG-011/014 |

### Annexe E — Inventaire des modèles Prisma

49 modèles déclarés dans `prisma/schema.prisma` (30 596 octets, provider `postgresql`, `previewFeatures = ["driverAdapters"]`). **Aucune migration versionnée** sous `prisma/migrations/` (F-BDD-022). Détail modèle par modèle (champs, index, relations, `onDelete`) dans `notes/annexe-E-prisma.md`.

Constats structurants (repris dans les Findings BDD) :

| Thème | Constat | Findings |
| --- | --- | --- |
| Modèles morts | `BudgetAlert`, `BudgetTemplate`, `BudgetTransactionTag` (partiel) | F-BDD-001/002/003 |
| FK logiques non contraintes | `targetAccountId`, `Favorite.targetId`, `source/targetBudgetId` | F-BDD-004/005/006 |
| Double vérité | `Task.assigneeId` vs `TaskAssignee` | F-BDD-007 |
| Index manquants | `Task`, enfants de `Task`, `Notification`, `Reminder`, `TimeEntry`, `Space/Folder/List/...`, `WorkspaceMember`, `TaskDependency` | F-BDD-008 à 015 |
| Cascades `onDelete` | `creator` Restrict, `Status`, `Folder→List`, Finance (destructif), subtasks, assignee | F-BDD-016 à 021 |
| Migrations | aucune migration ; `buildCommand` sans `migrate deploy` | F-BDD-022/023 |
| N+1 / scans / over-fetch | favoris, 3 crons, `/api/spaces`, `/api/budget`, calendrier, 18 listings | F-BDD-024 à 031 |

> Modèles couverts par leurs index existants (aucun Finding d'index) : `Budget`, `BudgetTransaction`, `FinanceTransaction`, `FinanceAccount`, `FinanceGoal`, `FinanceGoalContribution`, `FinanceCategory`, `Note`, `PushSubscription`, `BudgetTransactionTag`, `WorkspaceInvite`, `Tag`, `TaskTag`, `TaskAssignee`, `Status`, `Team`, `TeamMember`, `BudgetCategory`.
