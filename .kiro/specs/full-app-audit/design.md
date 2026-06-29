# Design Document

## Overview

L'audit `full-app-audit` est une mission d'analyse 360° en lecture seule de l'application Done. Le livrable est composé de deux fichiers Markdown rédigés en français dans `.kiro/specs/full-app-audit/` :

- `audit-report.md` — le rapport d'audit structuré, contenant l'ensemble des Findings classés par axe et par sévérité, avec preuves, impact et recommandation.
- `tasks.md` — le plan de tâches priorisé dérivé du rapport, avec traçabilité bijective vers les Findings.

Aucun fichier source applicatif n'est modifié pendant la phase d'audit. Toutes les commandes shell exécutées sont consignées en annexe du rapport. Les External_Console (Vercel, Neon) ne sont consultées qu'avec un accès en lecture seule fourni par l'utilisateur ; à défaut, les zones concernées sont marquées « à confirmer via console ».

## Architecture

### Approche méthodologique

L'audit suit quatre temps strictement non destructifs :

1. **Cadrage et inspection statique** — Lecture du `CLAUDE.md`, du `package.json`, de `prisma/schema.prisma`, de `vercel.json`, de `capacitor.config.*`, du `AndroidManifest.xml`, de `.env.example` et des hooks SWR. Construction des inventaires (routes API, hooks, modèles Prisma, plugins Capacitor, env vars, crons).
2. **Build_Check non destructif** — Exécution de `next build` (ou commande équivalente déclarée dans `package.json`). Le résultat (exit code, warnings, erreurs) est consigné dans l'annexe « build log ». Cette étape ne modifie aucun fichier hors `.next/`.
3. **Revue par axe** — Application d'une checklist dédiée à chacun des huit axes (`UI`, `UX`, `LOG`, `BDD`, `INF`, `MOB`, `SEC`, `PRF`). Toute observation devient un Finding selon le schéma normalisé décrit dans Data Models.
4. **Consolidation et rédaction** — Tri par axe et par sévérité, génération de la synthèse exécutive, dérivation du Task_Plan, vérification finale des invariants (cf. Correctness Properties).

### Workflow d'exécution

Le `tasks.md` matérialise les phases suivantes, dans cet ordre :

1. **Phase 0 — Préparation** : lecture de `CLAUDE.md`, vérification que le mode lecture seule est respecté (`git status` propre hors `.kiro/`).
2. **Phase 1 — Build_Check** : exécution du build, capture du log, identification immédiate des erreurs bloquantes.
3. **Phase 2 — Inventaires** : routes API, hooks SWR, modèles Prisma, plugins Capacitor, variables d'environnement, jobs cron.
4. **Phase 3 — Revue par axe** : application des checklists des huit axes, génération des Findings au fur et à mesure dans des notes hors dépôt.
5. **Phase 4 — Consolidation** : déduplication, fusion des Findings à cause commune, attribution des sévérités, calcul du tableau de synthèse.
6. **Phase 5 — Rédaction** : génération de `audit-report.md` puis dérivation de `tasks.md`.
7. **Phase 6 — Vérification finale** : application des invariants de la section Correctness Properties (sommes du tableau, traçabilité, ordre des sections).

## Components and Interfaces

### Structure de `audit-report.md`

#### 1. Synthèse exécutive

Une page maximum, contenant :

- 3 à 6 puces résumant les risques majeurs.
- Un tableau croisé sévérité × axe :

| Axe       | High | Medium | Total |
| --------- | ---- | ------ | ----- |
| UI        |      |        |       |
| UX        |      |        |       |
| LOG       |      |        |       |
| BDD       |      |        |       |
| INF       |      |        |       |
| MOB       |      |        |       |
| SEC       |      |        |       |
| PRF       |      |        |       |
| **Total** |      |        |       |

La somme du tableau doit égaler le nombre total de Findings (cf. Property 4).

#### 2. Périmètre et méthode

- Sources lues (chemins racine, fichiers de config, dossiers parcourus).
- Commandes exécutées (table : commande, but, sortie résumée, exit code).
- Périmètre exclu (zones non analysées et raison).
- Référence aux CLAUDE_Rules respectées.

#### 3. Sections par axe

Une section dédiée par axe, dans cet ordre : `UI`, `UX`, `LOG`, `BDD`, `INF`, `MOB`, `SEC`, `PRF`. Chaque section :

- Contient un paragraphe de contexte (≤ 5 lignes) résumant ce qui a été inspecté.
- Liste les Findings de cet axe, **triés par sévérité décroissante** (High avant Medium), puis par identifiant croissant.
- Si l'axe n'a aucun Finding, indique explicitement « Aucun Finding pour cet axe » avec une note de confiance.

#### 4. Limites et hypothèses

- Éléments non vérifiables sans External_Console et liste des informations manquantes.
- Hypothèses retenues lorsque la lecture du code ne permet pas une conclusion certaine.
- Date et nature des accès consoles utilisés, le cas échéant.

#### 5. Annexes

- **A. Commandes exécutées** : journal complet (commande, exit code, durée, résumé).
- **B. Build log** : sortie résumée du `Build_Check` (warnings, erreurs).
- **C. Inventaire des routes API** : tableau (route, méthodes HTTP, auth ?, ownership ?, validation ?, scope des données).
- **D. Inventaire des hooks SWR** : tableau (hook, fetcher, contrôle `res.ok` ?).
- **E. Inventaire des modèles Prisma** : tableau (modèle, champs, usages détectés, index).

### Méthode de revue par axe

Chaque axe a une checklist concrète. L'observation d'un écart matérialise un Finding.

**UI (`F-UI-NNN`)** — composants `shadcn/ui` et primitives Radix (props requises, `aria-label`) ; accessibilité (rôles ARIA, hiérarchie des titres, focus visible, contraste, alt text) ; responsive (breakpoints Tailwind, pas de débordement horizontal mobile) ; design tokens (variables Tailwind/CSS plutôt que littéraux ad hoc) ; états `loading`/`error`/`empty` sur les composants asynchrones.

**UX (`F-UX-NNN`)** — parcours critiques (auth, création/édition/suppression de tâche, navigation entre workspaces) ; feedback (toasts, spinners, messages d'erreur clairs, confirmations destructives) ; gestion d'erreur (`error.tsx`, `not-found.tsx`, fallback réseau) ; navigation (cohérence des liens, état actif, retour arrière mobile) ; mobile (zones tactiles ≥ 44 px, gestes, clavier virtuel ne masquant pas les inputs).

**Logique applicative (`F-LOG-NNN`)** — structure App Router (séparation `route.ts` / `page.tsx` / `layout.tsx`) ; frontière server/client (directives `"use client"` justifiées, pas d'import serveur dans des composants client) ; hooks SWR (fetcher contrôlant systématiquement `res.ok`, gestion de la clé, revalidation) ; validation Zod sur entrées API et formulaires ; gestion d'erreur (`try/catch` sur les routes, propagation contrôlée) ; side-effects (`useEffect` justifiés).

**BDD (`F-BDD-NNN`)** — schéma Prisma vs usage (modèles, champs, relations) ; index (`@@index`, `@unique` sur champs filtrés/joints/triés) ; relations (`onDelete`/`onUpdate` cohérents, cascades explicites) ; migrations (cohérence `prisma/migrations/` ↔ schéma courant) ; requêtes N+1 (détection `findMany` + `findUnique` en boucle ; usage approprié de `include`/`select`) ; SQL brut (`$queryRaw`/`$executeRaw` paramétrés, aucune entrée non validée interpolée).

**Vercel/Infra (`F-INF-NNN`)** — `vercel.json` (functions, regions, headers, rewrites) ; crons (chaque cron pointe vers un endpoint existant authentifié par `CRON_SECRET`) ; variables d'environnement (toute `process.env.X` est documentée dans `.env.example`) ; `next.config.*` cohérent avec Vercel ; logs et monitoring (présence de `console.error` sur chemins critiques).

**Mobile/Capacitor (`F-MOB-NNN`)** — `capacitor.config.{ts,json}` (`appId`, `appName`, `webDir`, `server.url` adapté dev/prod) ; `AndroidManifest.xml` (permissions cohérentes avec les fonctionnalités, `applicationId` aligné avec `capacitor.config`) ; plugins déclarés vs utilisés (tout plugin importé est dans `capacitor.plugins.json` et `package.json`) ; FCM (`google-services.json` présent, gestion serveur du token) ; build APK (conformité `BUILD_APK.md`, pas de keystore commité par erreur — audit visuel).

**Sécurité (`F-SEC-NNN`)** — sessions NextAuth (stratégies, durée, rotation) ; ownership par route API (ressource appartient à l'utilisateur authentifié — workspace, owner, membership) ; rate limiting Upstash sur routes sensibles (`/api/auth/*`, mail, push, opérations destructives) ; secrets côté client (aucun secret métier en `NEXT_PUBLIC_*`) ; headers (`Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options`) ; cookies de session (`httpOnly`, `secure`, `sameSite`) ; CORS restreint au strict nécessaire.

**Performance (`F-PRF-NNN`)** — bundle size (`next/bundle-analyzer` activable, imports lourds non tree-shakés) ; Server vs Client Components (par défaut serveur, `"use client"` réservé aux frontières interactives) ; images (`next/image`, dimensionnement, formats modernes) ; requêtes BDD (pagination, `select` ciblé, pas de `findMany` sans `take`) ; SWR caching (clés stables, `dedupingInterval` raisonnable, pas de revalidation excessive).

### Format du Task_Plan

Le fichier `tasks.md` respecte le format suivant :

```markdown
# Plan de tâches — full-app-audit

## Axe SEC

- [ ] 1. Titre court de la tâche
  - Findings : F-SEC-001, F-SEC-004
  - Sévérité maximale : High
  - Action : description de l'action de remédiation à mener

- [ ] 2. ...

## Axe BDD

- [ ] 3. ...
```

Règles :

- Tâches **regroupées par axe** dans l'ordre `SEC > BDD > INF > LOG > MOB > UX > UI > PRF`. À l'intérieur d'un axe, l'ordre est par sévérité maximale décroissante (High avant Medium), puis par identifiant Finding croissant.
- Chaque tâche référence **au moins un Finding** par son identifiant `F-XXX-NNN`.
- Plusieurs Findings à cause commune sont fusionnés en une seule tâche listant tous les identifiants concernés.
- Aucune tâche n'effectue d'action destructive ; les tâches sont des consignes pour un workflow d'exécution ultérieur.

## Data Models

### Taxonomie des Findings

Chaque Finding est un bloc Markdown structuré, identifiable et auto-suffisant.

#### Schéma de Finding

```markdown
### F-XXX-NNN — {Titre}

- **Axe** : {UI | UX | LOG | BDD | INF | MOB | SEC | PRF}
- **Sévérité** : {High | Medium}
- **Description** : {Constat factuel, 1 à 4 phrases.}
- **Preuve** : `{chemin/relatif/fichier}:{ligne}` ou `{chemin}#{symbole}` ou `commande: {cmd}`
- **Impact** : {Conséquence pour l'utilisateur, l'intégrité des données ou la sécurité.}
- **Recommandation** : {Action(s) concrète(s); pas d'implémentation pendant l'audit.}
```

#### Format d'identifiant

`F-{AXIS}-{NNN}` où :

- `{AXIS}` est le code à 2-3 lettres de l'axe (cf. table ci-dessous).
- `{NNN}` est un compteur séquentiel à 3 chiffres, recommençant à `001` pour chaque axe.

Exemples : `F-SEC-001`, `F-BDD-014`, `F-MOB-003`.

#### Codes d'axe

| Code | Axe                  | Glossaire             |
| ---- | -------------------- | --------------------- |
| UI   | Interface            | UI                    |
| UX   | Expérience           | UX                    |
| LOG  | Logique applicative  | Logique_Applicative   |
| BDD  | Base de données      | Base_De_Donnees       |
| INF  | Vercel / Infra       | Vercel_Infra          |
| MOB  | Mobile / Capacitor   | Mobile_Capacitor      |
| SEC  | Sécurité             | Securite              |
| PRF  | Performance          | Performance           |

#### Définitions de sévérité

**Severity_High** — un seul critère suffit :

- Risque de sécurité avéré : fuite de données entre utilisateurs/workspaces, exposition de secrets côté client, route API non authentifiée renvoyant des données sensibles, cron public sans secret.
- Risque de perte de données : migration manquante, requête destructive non protégée, absence de validation menant à une corruption.
- Panne en production : erreur de build, route critique en 500, dépendance non installée référencée à l'exécution.
- Blocage utilisateur majeur : parcours critique (auth, création tâche) bloqué sur un cas usuel.

**Severity_Medium** — un seul critère suffit :

- Dette technique significative : duplication structurante, contournement de validation, hook SWR sans `res.ok`.
- Défaut de robustesse : absence de gestion d'erreur, état loading/empty manquant sur un parcours non critique.
- Problème UX notable : navigation cassée sur cas particulier, feedback utilisateur absent, accessibilité dégradée non bloquante.
- Dégradation de performance mesurable : requête N+1, absence d'index sur champ filtré, bundle client gonflé par import lourd.

Les constats inférieurs à Medium (cosmétique, préférence stylistique) sont exclus du rapport.

### Représentation logique

```ts
type Severity = "High" | "Medium";
type Axis = "UI" | "UX" | "LOG" | "BDD" | "INF" | "MOB" | "SEC" | "PRF";

interface Finding {
  id: string;            // Format: F-{AXIS}-{NNN}
  title: string;
  axis: Axis;
  severity: Severity;
  description: string;
  evidence: string;      // path:line | path#symbol | command:...
  impact: string;
  recommendation: string;
  needsExternalConsole?: boolean;
}

interface Task {
  number: number;
  axis: Axis;
  title: string;
  findings: string[];    // Liste d'IDs F-XXX-NNN
  maxSeverity: Severity;
  action: string;
}
```

## Error Handling

- **Échec du Build_Check** : l'erreur n'interrompt pas l'audit ; elle est consignée comme Finding `F-LOG-XXX` Severity_High et le rapport continue avec les inventaires.
- **Fichier attendu absent** (`vercel.json`, `capacitor.config.*`, etc.) : Finding correspondant et poursuite de l'audit.
- **Accès External_Console refusé ou absent** : la zone est marquée « à confirmer via console » dans la section « Limites et hypothèses » sans bloquer la production du rapport.
- **Sortie de commande tronquée** : la commande est consignée avec sa troncature ; un Finding est créé si l'observation reste exploitable, sinon listée en limite.
- **Conflit entre code et CLAUDE_Rules** : Finding Severity_High sur l'axe LOG ou SEC selon le domaine, sans modification du code.

## Testing Strategy

L'audit n'exécute pas de tests automatisés sur le code applicatif. La « Testing Strategy » porte ici sur la **vérification du livrable lui-même** :

- **Vérifications structurelles automatisables** : les Correctness Properties ci-dessous (format des Findings, sévérités fermées, somme du tableau de synthèse, tri, traçabilité bijective Findings ↔ Tâches) sont vérifiables par parsing du Markdown produit.
- **Vérifications d'inventaire** : un script de relecture peut comparer la liste des routes trouvées sous `src/app/api/**/route.{ts,js}` à l'inventaire annexe et au tableau de l'axe SEC pour détecter les omissions.
- **Vérifications qualitatives** : la fusion des Findings à cause commune et la rédaction en français restent vérifiées par revue humaine.
- **Build_Check** : exécuté une seule fois, son log est joint en annexe ; relancer le build n'apporte pas de signal additionnel pendant l'audit.

## Correctness Pre-work

L'analyse de testabilité a été effectuée via l'outil `prework`. Elle classe chaque critère d'acceptation en `PROPERTY`, `EXAMPLE`, `EDGE_CASE`, `INTEGRATION` ou `SMOKE`, puis consolide les propriétés universelles via une étape de réflexion (élimination des redondances entre 3.2/3.3, 5.1/5.3, et regroupement des règles « couverture ↔ Finding » en une propriété générique).

## Correctness Properties

*Une propriété est une caractéristique ou un comportement qui doit rester vrai sur toutes les exécutions valides du système — ici, sur tout rapport d'audit produit selon ce design. Les propriétés ci-dessous portent sur la structure du livrable, pas sur le code applicatif audité.*

### Property 1: Format normalisé des Findings

*Pour tout* Finding `F` figurant dans `audit-report.md`, `F` contient les huit champs requis (`id`, `title`, `axis`, `severity`, `description`, `evidence`, `impact`, `recommendation`), tous non vides ; `F.id` respecte le pattern `F-{AXIS}-{NNN}` et `F.evidence` cite soit un chemin relatif `path:line`, soit `path#symbole`, soit une commande exécutée.

**Validates: Requirements 3.1, 3.4**

### Property 2: Sévérité dans l'ensemble fermé

*Pour tout* Finding `F` figurant dans `audit-report.md`, `F.severity ∈ { "High", "Medium" }`. Aucune sévérité inférieure à Medium n'apparaît dans le rapport.

**Validates: Requirements 3.2, 3.3**

### Property 3: Couverture exhaustive correspond aux Findings

*Pour tout* élément `E` examiné par l'audit (route API sous `src/app/api/**`, hook SWR sous `src/hooks/`, modèle Prisma déclaré dans `schema.prisma`, plugin Capacitor importé dans le code, variable d'environnement référencée par `process.env`), soit `E` satisfait la règle de l'axe correspondant, soit un Finding du rapport référence explicitement `E` dans son champ `evidence`.

**Validates: Requirements 2.1, 2.3, 2.4, 6.1, 7.1, 7.4, 7.5, 8.3, 8.5**

### Property 4: Cohérence du tableau de synthèse

*Pour tout* rapport produit, la somme des cellules du tableau croisé sévérité × axe figurant dans la « Synthèse exécutive » est égale au nombre total de Findings figurant dans les sections par axe.

**Validates: Requirements 4.2**

### Property 5: Tri par sévérité

*Pour toute* section d'axe dans `audit-report.md` et *pour toute* paire de Findings consécutifs `(F_i, F_{i+1})` au sein de cette section, `severity(F_i) ≥ severity(F_{i+1})` selon l'ordre `High > Medium`. *Pour toute* paire de tâches consécutives `(T_i, T_{i+1})` dans `tasks.md`, si `T_i` et `T_{i+1}` sont dans le même axe, alors `maxSeverity(T_i) ≥ maxSeverity(T_{i+1})`.

**Validates: Requirements 4.3, 5.2**

### Property 6: Traçabilité bijective Findings et Tâches

*Pour toute* tâche `T` de `tasks.md`, `T.findings` est non vide et chaque identifiant qu'il contient correspond à un Finding existant dans `audit-report.md`. *Pour tout* Finding `F` du rapport, il existe au moins une tâche `T` telle que `F.id ∈ T.findings`. *Pour tout* axe `A`, l'ensemble des tâches référençant un Finding d'axe `A` forme un bloc contigu dans `tasks.md`.

**Validates: Requirements 5.1, 5.3, 5.4**

### Property 7: Sévérité minimale imposée pour classes critiques

*Pour tout* Finding `F` décrivant (a) une fuite de données entre utilisateurs ou workspaces distincts, ou (b) un endpoint cron sans secret ni authentification, alors `F.severity == "High"`. *Pour tout* Finding `F` décrivant une requête N+1 ou un balayage complet de table, `F.severity ∈ { "High", "Medium" }`.

**Validates: Requirements 6.5, 7.2, 8.2**

### Property 8: Auth et ownership pour chaque route API

*Pour toute* route déclarée sous `src/app/api/**/route.{ts,js}`, soit la route effectue à la fois (i) un contrôle d'authentification NextAuth et (ii) une vérification d'appartenance de la ressource à l'utilisateur authentifié, soit un Finding d'axe `SEC` du rapport référence cette route dans son `evidence`.

**Validates: Requirements 6.1**
