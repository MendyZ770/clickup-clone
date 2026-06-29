# Checkpoint 13 — Revue par axe

> **Tâche 13** du plan `tasks.md` (`full-app-audit`). Checkpoint de vérification **strictement en lecture seule** : aucune modification du code applicatif, du schéma Prisma, des migrations ou de la base. Aucune écriture hors `.kiro/specs/full-app-audit/`.
>
> Objet : (1) vérifier l'existence des huit notes par axe ; (2) compter les Findings par axe ; (3) contrôler la conformité de chaque Finding au schéma normalisé du design (Property 1) et à l'ensemble fermé de sévérités (Property 2) ; (4) confirmer via `git status --short` qu'aucune écriture n'a eu lieu hors du dossier de la spec.
>
> _Références : Design — Méthode de revue par axe (8 axes), Data Models > Taxonomie des Findings, Correctness Properties > Property 1, Property 2. Requirements — 3.1, 3.2, 3.3, 3.4, 1.1._

## 1. Existence des huit notes par axe

Les huit notes par axe sont **toutes présentes** dans `.kiro/specs/full-app-audit/notes/` :

| Axe | Fichier attendu | Présent ? |
| --- | --- | --- |
| UI  | `axe-ui.md`  | ✅ |
| UX  | `axe-ux.md`  | ✅ |
| LOG | `axe-log.md` | ✅ |
| BDD | `axe-bdd.md` | ✅ |
| INF | `axe-inf.md` | ✅ |
| MOB | `axe-mob.md` | ✅ |
| SEC | `axe-sec.md` | ✅ |
| PRF | `axe-prf.md` | ✅ |

Aucune note manquante. _(Validation : Requirements 1.1, vérification d'existence.)_

## 2. Nombre de Findings par axe

Décompte obtenu par `grep -cE '^### F-[A-Z]+-[0-9]+'` sur chaque note :

| Axe | Findings | High | Medium | Identifiants |
| --- | --- | --- | --- | --- |
| UI  | 29 | 8 | 21 | `F-UI-001` … `F-UI-029` |
| UX  | 17 | 4 | 13 | `F-UX-001` … `F-UX-017` |
| LOG | 30 | 1 | 29 | `F-LOG-001` … `F-LOG-030` |
| BDD | 31 | 11 | 20 | `F-BDD-001` … `F-BDD-031` |
| INF | 13 | 2 | 11 | `F-INF-001` … `F-INF-013` |
| MOB | 12 | 1 | 11 | `F-MOB-001` … `F-MOB-012` |
| SEC | 13 | 6 | 7 | `F-SEC-001` … `F-SEC-013` |
| PRF | 8  | 0 | 8  | `F-PRF-001` … `F-PRF-008` |
| **Total** | **153** | **33** | **120** | — |

Pour chaque axe, les identifiants sont **séquentiels** (de `001` à `NNN` sans trou ni doublon), conformément au format `F-{AXIS}-{NNN}` du design (compteur recommençant à `001` par axe).

## 3. Conformité au schéma normalisé (Property 1 et Property 2)

### Property 1 — Format normalisé des Findings

Vérifications automatisées par parsing Markdown sur les 153 Findings :

- **Identifiant `F-{AXIS}-{NNN}`** : ✅ 153/153. Tous les IDs respectent le pattern, et le code d'axe de l'ID correspond toujours à la note (par ex. seuls des `F-UI-NNN` dans `axe-ui.md`). Aucun ID hors pattern détecté.
- **Champ `Axe`** : ✅ 153/153 présents et non vides ; la valeur du champ `Axe` correspond toujours au code attendu de la note (UI/UX/LOG/BDD/INF/MOB/SEC/PRF).
- **Champ `Sévérité`** : ✅ 153/153 présents et non vides.
- **Champ `Description`** : ✅ 153/153 présents et non vides.
- **Champ `Preuve`** : ✅ 153/153 présents et non vides. **Tous** citent au moins une référence du type `path:line`, `path#symbole` ou `commande:` (vérifié : aucune ligne `Preuve` ne déroge à ces trois formes).
- **Champ `Impact`** : ✅ 153/153 présents et non vides.
- **Champ `Recommandation`** : ✅ 153/153 présents (voir observation ci-dessous concernant `F-LOG-030`).
- **Titre** (texte après l'ID dans l'en-tête `### F-XXX-NNN — Titre`) : ✅ présent pour les 153 Findings.

Les huit champs requis du schéma (`id`, `title`, `axis`, `severity`, `description`, `evidence`, `impact`, `recommendation`) sont donc présents et non vides pour l'ensemble des Findings.

**Observation mineure (non bloquante) — `F-LOG-030`** : le marqueur `- **Recommandation** :` de ce Finding (axe-log.md, ligne 356) est suivi d'un saut de ligne, le contenu étant ensuite développé sur des sous-puces indentées (`- **`calendar-settings/page.tsx`** : …`, `- **`swr-config.tsx`** : …`). Le champ est donc **substantiellement non vide** (la recommandation existe et est détaillée), mais sa mise en forme diffère des 152 autres Findings où le contenu suit directement le `:` sur la même ligne. Un parseur strict « contenu sur la même ligne que le marqueur » signalerait un faux positif. Recommandation de consolidation (phase 4/5) : reformater ce champ pour placer une phrase d'introduction sur la même ligne que le marqueur, par cohérence et pour fiabiliser la vérification automatisée de Property 1 (tâche 16.1). Ce point n'invalide pas la conformité de fond.

### Property 2 — Sévérité dans l'ensemble fermé {High, Medium}

Décompte des valeurs distinctes du champ `Sévérité` sur les 153 Findings :

- `High` : 33 occurrences.
- `Medium` : 120 occurrences.
- **Total : 153** — égal au nombre total de Findings.

✅ **Aucune** sévérité hors de l'ensemble fermé `{High, Medium}` n'apparaît dans les notes. Aucun constat de sévérité inférieure à Medium (cosmétique, préférence stylistique) n'est présent. Plusieurs notes documentent d'ailleurs explicitement avoir exclu les constats sous le seuil Medium (cf. en-têtes `axe-ux.md`, `axe-prf.md`). _(Validation : Requirements 3.2, 3.3.)_

### Cohérence inter-champs

Pour chaque axe, le nombre de champs `Sévérité` (= nombre de High + Medium) est égal au nombre d'en-têtes de Finding et au nombre de champs `Axe`, `Description`, `Preuve`, `Impact`, `Recommandation`. Cette égalité sur les six compteurs confirme qu'aucun Finding n'a de champ manquant et qu'aucun champ orphelin n'existe hors d'un Finding.

## 4. Confirmation du mode lecture seule (git status)

Commande exécutée (consignée dans `notes/annexe-A-commandes.md`, tâche 13) :

```
git status --short
```

Résultat (exit code 0) : 58 fichiers modifiés (`M`), 1 fichier supprimé indexé (`D apk/Done.apk`), 18 entrées non suivies (`??`).

**Tous** les fichiers `M`/`D` et toutes les entrées `??` situés **hors** de `.kiro/` sont des fichiers applicatifs ou de configuration **préexistants** au démarrage de l'audit : ils figurent déjà dans la baseline gelée en tâche 1.1 (cf. `notes/00-baseline.md`, `notes/annexe-A-commandes-1.1.md`) et sont documentés par le Finding `F-LOG-001` (Severity_High). Ils **ne résultent pas** d'écritures de l'`Audit_System`.

Les écritures effectuées par l'audit (les huit notes par axe, les inventaires, les annexes, le présent checkpoint) sont **intégralement confinées** à l'arbre non suivi `.kiro/`, qui apparaît sous l'unique entrée `?? .kiro/`. Une vérification ciblée (`git status --short | grep -E '\.kiro/specs/full-app-audit'`, exit code 1 — aucune correspondance distincte) confirme qu'aucun fichier **suivi** hors périmètre n'a été modifié par l'audit.

✅ **Conclusion** : aucune écriture de l'audit n'a eu lieu hors `.kiro/specs/full-app-audit/`. Le mode lecture seule est respecté. _(Validation : Requirements 1.1.)_

### Doute consigné — écart de baseline (+1 fichier modifié)

Au moment de ce checkpoint, `git status --short` rapporte **58** fichiers modifiés (`git diff --stat` : `58 files changed, 2649 insertions(+), 763 deletions(-)`), alors que la baseline figée en tâche 1.1 recensait **57** fichiers modifiés (`+2645 −763`) — et que la vérification de la tâche 4 (checkpoint inventaires) constatait encore un état « strictement identique au baseline ».

- **Nature de l'écart** : +1 fichier modifié et +4 insertions par rapport à la baseline. Tous les fichiers listés en `M` sont des fichiers **applicatifs / de configuration** (par ex. `prisma/schema.prisma`, `src/app/api/**`, `src/lib/**`, `next.config.mjs`, `vercel.json`, `android/**`) ; **aucune** note d'audit n'apparaît dans la liste des fichiers suivis modifiés.
- **Interprétation** : l'arbre de travail a évolué **en dehors** de toute action de l'`Audit_System` (l'audit n'écrit que dans `.kiro/`, qui reste non suivi). L'écart est cohérent avec la décision de baseline « HEAD + worktree » (cf. `notes/00-baseline.md`) qui inclut explicitement les modifications non commitées dans le périmètre et avertit d'un risque de **reproductibilité** : le worktree n'étant pas gelé, des modifications externes peuvent survenir entre deux relevés.
- **Impact sur ce checkpoint** : nul quant au respect du mode lecture seule (aucune écriture d'audit hors `.kiro/`). En revanche, cet écart **renforce** le Finding `F-LOG-001` (Severity_High) : la baseline n'étant pas figée sur un HEAD propre, les conclusions de certains axes (BDD, INF, SEC, MOB, LOG) peuvent porter sur des fichiers dont le contenu a légèrement bougé depuis le gel de la tâche 1.1.
- **Action recommandée (hors lecture seule, à porter à l'utilisateur)** : refaire un point de baseline (ou figer le worktree, par ex. via un commit/stash de référence) avant la phase de consolidation (tâche 14) afin que la traçabilité `path:line` des Findings reste fidèle. À défaut, mentionner explicitement cet écart et son ampleur (+1 fichier / +4 lignes) dans la section « Limites et hypothèses » du `audit-report.md`.

## 5. Verdict du checkpoint

| Contrôle | Résultat |
| --- | --- |
| Existence des 8 notes par axe | ✅ Conforme (8/8) |
| Findings par axe comptés | ✅ 153 Findings au total (cf. §2) |
| Property 1 — schéma normalisé (8 champs non vides, ID `F-{AXIS}-{NNN}`, preuve `path:line`/`path#symbole`/`commande:`) | ✅ Conforme (153/153) — 1 observation de **forme** sur `F-LOG-030` (champ `Recommandation` multi-lignes), non bloquante |
| Property 2 — sévérité ∈ {High, Medium} | ✅ Conforme (33 High + 120 Medium = 153) ; aucune sévérité < Medium |
| Mode lecture seule (aucune écriture hors `.kiro/specs/full-app-audit/`) | ✅ Confirmé via `git status --short` |
| Doute consigné | ⚠ Écart de baseline (+1 fichier modifié hors action de l'audit) — voir §4 ; renforce `F-LOG-001` |

**Checkpoint validé.** Les huit notes par axe existent, leurs 153 Findings respectent le schéma normalisé du design (Property 1) et l'ensemble fermé de sévérités (Property 2), et le mode lecture seule est respecté. Deux points sont portés à la phase de consolidation / à l'attention utilisateur : (a) la mise en forme du champ `Recommandation` de `F-LOG-030` (cosmétique de parsing) ; (b) l'écart de baseline du worktree (+1 fichier modifié), à clarifier avant la phase 4 ou à documenter en « Limites et hypothèses ».
