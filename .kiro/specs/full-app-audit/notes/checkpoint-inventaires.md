# Checkpoint — Phase 2 (Inventaires) — Tâche 4

## Objet

Cette note matérialise le **checkpoint d'achèvement de la Phase 2 (Inventaires)** prévu en tâche 4 de `tasks.md`. Elle confirme :

1. que les six inventaires (3.1 à 3.6) sont complets ;
2. qu'ils sont croisés avec les CLAUDE_Rules consignées en tâche 1.2 (`notes/00-claude-rules.md`) ;
3. qu'aucune commande exécutée pendant la phase 2 n'a modifié le dépôt hors `.kiro/specs/full-app-audit/`.

Mode strictement **lecture seule**. Toute écriture est confinée à `.kiro/specs/full-app-audit/notes/`.

## 1. État des six inventaires

| Sous-tâche | Inventaire | Fichier | Volume | Statut | Couverture / décompte |
|---|---|---|---|---|---|
| 3.1 | Routes API | `notes/annexe-C-routes-api.md` | 173 lignes | **Complet** | 96 fichiers `route.ts` recensés (commande `find`, exit 0). Le tableau de l'annexe documente les 96 lignes — décompte cohérent (cf. section « Vérification du décompte » de l'annexe). Colonnes présentes : Méthodes, Auth NextAuth, Ownership, Validation entrée, Scope des données, Notes. Marqueurs `⚠️` posés sur les candidats SEC à instruire en 11.2 (Property 7/8). |
| 3.2 | Hooks SWR | `notes/annexe-D-hooks-swr.md` | 172 lignes | **Complet** | 59 fetchers `useSWR` recensés (D.1 = 23 hooks ; D.2 = 1 provider ; D.3 = 25 composants ; D.4 = 10 pages app ; total 59). 5 `useSWRConfig` hors fetchers. Aucun `useSWRInfinite` ni `useSWRMutation`. Colonnes : Clé, Fetcher, `res.ok` ?, Gestion erreur explicite, Options non par défaut. Vérification `res.ok` : **59/59 = 100 %**. |
| 3.3 | Modèles Prisma | `notes/annexe-E-prisma.md` | 1254 lignes | **Complet (avec dérive identifiée)** | 49 modèles documentés (sections 1.1 à 1.49) avec champs, attributs, index et relations. Synthèse transverse présente (datasource, générateur, récapitulatifs `@@index`, `@@unique`, `onDelete`). **Dérive structurelle identifiée et documentée** (section 4) : aucune migration sous `prisma/migrations/` (validé par `ls`, `.gitignore`, `git ls-files`, `git log --all`). Cette dérive sera matérialisée en Finding `F-BDD-NNN` lors de la tâche 8.4 — son inscription est conforme aux attendus du livrable d'inventaire. |
| 3.4 | Plugins Capacitor | `notes/inv-plugins-capacitor.md` | 98 lignes | **Complet** | Trois sources croisées (`package.json`, `capacitor.plugins.json`, imports `src/`). 2 plugins natifs métier en usage effectif (`@capacitor/preferences`, `@capacitor/push-notifications`) ; bijection stricte entre package.json, `capacitor.plugins.json`, `capacitor.settings.gradle` et `capacitor.build.gradle`. Observation transmise à la phase 3 (axe MOB 10.1/10.3) : configuration `plugins.SplashScreen` orpheline (plugin non installé). |
| 3.5 | Variables d'environnement | `notes/inv-env.md` | 98 lignes | **Complet** | 16 variables `process.env.X` recensées dans `src/` et `prisma/` (commande #2 du journal A) ; absence confirmée de la notation crochet (commande #3, exit 1). Confrontation à `.env.example` (9 variables) → 10 variables référencées non documentées (dont 6 secrets serveur), 4 variables Gradle Android documentées non utilisées en TS (attendu, à confirmer en MOB 10.5). |
| 3.6 | Crons Vercel | `notes/inv-crons.md` | 97 lignes | **Complet** | `vercel.json` lu : 4 entrées `crons`, bijection complète avec les 4 fichiers `route.ts` sous `src/app/api/cron/`. Schéma d'auth identique pour les 4 routes (`CRON_SECRET` via `?secret=` ou header `x-vercel-cron-secret`). Observation transmise à la phase 3 (axe INF 9.2) : header lu non standard Vercel (Vercel envoie `Authorization: Bearer <CRON_SECRET>`). |

**Verdict : 6/6 inventaires complets.** Tous les fichiers attendus existent, sont substantiels (jamais d'ébauche vide), et possèdent les colonnes/sections requises par `tasks.md` § 3 et `design.md` > Components and Interfaces > Annexes.

## 2. Croisement avec les CLAUDE_Rules

Cette table confirme que chaque CLAUDE_Rule **codifiable** dans un inventaire dispose d'une couverture documentaire dans la phase 2. Les CLAUDE_Rules purement procédurales (interdictions de commandes destructives, identité git/vercel) ne se matérialisent pas dans un inventaire ; elles sont rappelées pour mémoire.

| CLAUDE_Rule (`notes/00-claude-rules.md`) | Inventaire(s) qui la matérialisent | Statut |
|---|---|---|
| § 2.1–2.4 — Anti-destruction Postgres/Neon (interdictions `prisma migrate*`, `db push*`, etc.) | `annexe-E-prisma.md` (lecture seule du schéma ; absence de migrations documentée § 4) ; `inv-env.md` (énumération de `DATABASE_URL` sans capture de valeur) | **Couvert.** Aucune commande Prisma n'a été lancée pendant la phase 2 (cf. journal A). |
| § 3 — Anti-destruction Git/fichiers (commandes `git` lecture seule uniquement) | `annexe-A-commandes.md` (toutes les commandes consignées sont en lecture seule : `find`, `grep`, `ls`, `wc`, `git status --short`, `git ls-files`, `git log --all`, `git diff --stat`, `npm run build`) | **Couvert.** |
| § 4 — Anti-destruction Vercel (aucune commande `vercel`) | `inv-crons.md`, `inv-env.md` (lecture de `vercel.json` et de `.env.example` uniquement, sans appel `vercel` CLI) | **Couvert.** |
| § 5 — Identité gh / vercel | n/a | **Hors champ phase 2** (aucun `git push`, aucun `vercel`). |
| § 6.1 — SWR : `res.ok` obligatoire | `annexe-D-hooks-swr.md` colonne « `res.ok` ? » + section configuration globale du `SWRProvider` | **Couvert.** Le contrôle est confirmé sur 59/59 fetchers (100 %). Une instruction en 7.3 reste possible si une absence apparaît à la relecture ciblée. |
| § 6.2 — API routes : `params: Promise<...>` + `await params` | `annexe-C-routes-api.md` colonne « Notes » + colonne « Méthodes » (signatures vérifiables au cas par cas) | **Couvert structurellement.** L'inventaire fournit les chemins/méthodes, prêt pour la vérification ligne à ligne en 7.1/7.2. |
| § 6.3 — UI 100 % français | n/a (objet de l'axe UI/UX en 5/6) | **Hors champ phase 2** (revue par axe). |
| § 6.4 — Commentaires utiles uniquement | n/a (sous le seuil Medium, exclu du rapport) | **Exclu** par `requirements.md` 3.3. |
| § 6.5 — Responsive Tailwind | n/a (objet de l'axe UI 5.3) | **Hors champ phase 2.** |
| § 6.6 — Pas de commit sans demande | `annexe-A-commandes.md` (aucun `git commit` consigné) | **Couvert.** |

**Verdict : tous les CLAUDE_Rules codifiables au stade des inventaires sont couverts.** Aucune règle anti-destruction n'a été enfreinte pendant la phase 2.

## 3. Vérification de propreté de l'arbre de travail

Commande exécutée : `git status --short` à la racine du dépôt (cf. journal A — Tâche 4 — Commande #1, exit code 0).

Sortie obtenue (abrégée) :

- 57 entrées `M` (fichiers modifiés non indexés) ;
- 1 entrée `D` (`apk/Done.apk`, supprimé indexé) ;
- 18 entrées `??` (fichiers / dossiers non suivis), dont `.agents/`, `.kiro/`, `android/app/google-services.json`, `skills-lock.json`, plusieurs nouveaux dossiers de routes API sous `src/app/api/cron/*`, `src/app/api/me/notification-preferences/`, `src/app/api/mobile-logout/`, `src/app/api/push/*`, et plusieurs nouveaux fichiers TS sous `src/components/`, `src/hooks/`, `src/lib/`.

**Comparaison avec le baseline** (`notes/00-baseline.md`, capturé en tâche 1.1, HEAD `8b920995eda6a2d274009d1b967b59c88d098e3d`, gel `2026-05-29T02:57:38Z`) :

| Indicateur | Baseline (tâche 1.1) | Checkpoint (tâche 4) | Δ |
|---|---|---|---|
| Fichiers `M` | 57 | 57 | 0 |
| Fichiers `D` | 1 (`apk/Done.apk`) | 1 (`apk/Done.apk`) | 0 |
| Entrées `??` | identiques | identiques | 0 |

**Verdict : l'état du dépôt est strictement identique au baseline.** Les commandes exécutées pendant les phases 0, 1 et 2 (cf. annexe A) — `npm run build`, `find`, `grep`, `ls`, `wc`, `git status --short`, `git ls-files`, `git log --all`, `git diff --stat` — sont toutes en lecture seule (et `npm run build` n'écrit que dans `.next/`, conforme aux CLAUDE_Rules § 7). **Aucune modification supplémentaire n'a été introduite hors `.kiro/specs/full-app-audit/`**. La non-propreté préexistante est déjà documentée par le Finding `F-LOG-001` (`notes/axe-log.md`, Severity_High) et par la décision utilisateur consignée dans `notes/00-baseline.md` (baseline « HEAD + worktree »).

## 4. Doutes et points à confirmer

Conformément à l'instruction de la tâche 4 (« Demander à l'utilisateur en cas de doute »), les points suivants ont été identifiés. **Aucun n'est bloquant pour la sortie de la phase 2** ; tous sont consignés ici pour traçabilité et seront traités dans les phases ultérieures conformément au plan.

| # | Point | Pourquoi ce n'est pas bloquant |
|---|---|---|
| D1 | **Absence totale de dossier `prisma/migrations/`** alors que le schéma déclare 49 modèles avec contraintes et cascades. | Dérive structurelle déjà **documentée** dans `annexe-E-prisma.md` § 4. Sa matérialisation en Finding (axe BDD) est explicitement prévue par la tâche 8.4 (`Auditer la cohérence entre prisma/migrations/ et le schéma courant`). Pas un défaut d'inventaire. |
| D2 | **Arbre de travail non propre au baseline** (57 fichiers modifiés, plusieurs nouveaux dossiers). | Décision utilisateur **déjà actée** en tâche 1.1 / `notes/00-baseline.md` : la baseline est « HEAD + worktree ». Le Finding `F-LOG-001` Severity_High est conservé dans le rapport et documenté dans la section « Limites et hypothèses » (tâche 15.4). Pas un nouveau doute. |
| D3 | **Variables Gradle Android** (`RELEASE_STORE_FILE`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD`) présentes dans `.env.example` mais non utilisées dans `src/` ni `prisma/`. | Comportement **attendu** documenté par le commentaire de `.env.example` (« définies dans `~/.gradle/gradle.properties` ou env CI »). Vérification de leur consommation effective par Gradle prévue à la tâche 10.5 (axe MOB), hors champ inventaire. |
| D4 | **Plugin SplashScreen configuré dans `capacitor.config.ts`** mais non installé (ni dans `package.json`, ni dans `capacitor.plugins.json`). | Configuration silencieusement ignorée par Capacitor au runtime. Observation **transmise** à la phase 3 (tâche 10.1 / 10.3, axe MOB) où elle deviendra `F-MOB-NNN`. |
| D5 | **Crons Vercel** : les routes lisent `x-vercel-cron-secret` au lieu du header officiel Vercel `Authorization: Bearer <CRON_SECRET>` ; le secret est aussi accepté en query string `?secret=`. | Observation **transmise** à la phase 3 (tâche 9.2 axe INF, possiblement 11.x axe SEC). Au minimum un secret est présent — donc pas une violation immédiate de la Property 7 (cron sans secret = High). |
| D6 | **Routes API marquées `⚠️`** dans `annexe-C-routes-api.md` (ownership absent ou partiel sur de nombreuses routes : `/api/finance/categories/*`, `/api/goals/*`, `/api/templates`, `/api/tasks/{id}/*`, `/api/time-entries/*`, etc.). | Liste **explicitement fléchée** vers la tâche 11.2 (axe SEC, Property 7/8). L'inventaire est complet ; la qualification finale en Finding interviendra en phase 3. |

**Aucun de ces points ne nécessite une intervention utilisateur immédiate.** Tous relèvent du périmètre d'instruction prévu par les phases 3 à 5 du plan (`tasks.md` §§ 5–15) et seront classés en Findings normalisés à ce moment-là.

## 5. Conclusion du checkpoint

- **Inventaires** : 6/6 complets, exhaustifs, conformes aux conventions de colonnes/sections imposées par `design.md`.
- **CLAUDE_Rules** : toutes les règles codifiables au stade des inventaires sont couvertes ; aucune règle anti-destruction enfreinte pendant la phase 2.
- **Propreté du working tree** : strictement identique au baseline ; aucune écriture hors `.kiro/specs/full-app-audit/` produite par les commandes d'audit.
- **Doutes** : 6 points listés, aucun bloquant — tous fléchés vers les phases suivantes.

**La Phase 2 est validée.** Le plan peut passer à la Phase 3 (Revue par axe — tâches 5 à 12).

## Références croisées

- `tasks.md` § 4 (la présente tâche).
- `notes/00-claude-rules.md` (référentiel anti-destruction).
- `notes/00-baseline.md` (décision utilisateur sur la baseline).
- `notes/annexe-A-commandes.md` (journal des commandes, dont l'invocation `git status --short` du checkpoint).
- `notes/annexe-C-routes-api.md`, `notes/annexe-D-hooks-swr.md`, `notes/annexe-E-prisma.md`, `notes/inv-plugins-capacitor.md`, `notes/inv-env.md`, `notes/inv-crons.md` (les six inventaires).
- `notes/axe-log.md` (Finding `F-LOG-001` sur la non-propreté préexistante).
