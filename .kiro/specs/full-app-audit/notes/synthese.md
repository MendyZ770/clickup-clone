# Synthèse — Tableau croisé sévérité × axe (Tâche 14.4)

> Tableau de synthèse exécutive croisant la **sévérité** (High, Medium) et l'**axe** d'audit, destiné à la section « Synthèse exécutive » de `audit-report.md` (cf. `design.md` > Components and Interfaces > Structure de `audit-report.md` > 1).
>
> Source : liste consolidée des 153 Findings (cf. `notes/consolidation.md`, tâche 14.3). Comptage automatique des en-têtes `### F-XXX-NNN` et des lignes `- **Sévérité**` de chaque note par axe (commandes en annexe A, tâche 14).
>
> **Mode lecture seule** : aucune écriture hors `.kiro/specs/full-app-audit/`.

## Tableau croisé sévérité × axe

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

## Vérification Property 4 — Cohérence du tableau

La Property 4 exige que la somme de **toutes** les cellules du tableau croisé égale le nombre total de Findings.

- **Somme par colonne High** : 8 + 4 + 1 + 11 + 2 + 1 + 6 + 0 = **33**.
- **Somme par colonne Medium** : 21 + 13 + 29 + 20 + 11 + 11 + 7 + 8 = **120**.
- **Somme High + Medium** : 33 + 120 = **153**.
- **Somme par ligne Total** : 29 + 17 + 30 + 31 + 13 + 12 + 13 + 8 = **153**.
- **Nombre total de Findings inventoriés** (sections par axe, cf. `consolidation.md` §0) : **153**.

Les trois calculs concordent : `Σ(High) + Σ(Medium) = Σ(Total ligne) = nombre total de Findings = 153`. **Property 4 vérifiée.** ✓

## Lecture rapide

- **Axes les plus chargés** : BDD (31), LOG (30), UI (29).
- **Axes au plus fort taux de High** : SEC (6/13 ≈ 46 %) et BDD (11/31 ≈ 35 %) concentrent l'essentiel du risque de sécurité et d'intégrité de données.
- **Findings High au total** : 33 (≈ 22 % des Findings), dont 6 fuites/altérations inter-workspace (SEC), 11 intégrité/performance BDD, 8 accessibilité bloquante UI, 4 parcours critiques UX, 2 infra (cron/batch), 1 sécurité mobile (token), 1 méthode (LOG-001).
- **Aucun Finding High en PRF** : la performance relève entièrement de dette Medium (cohérent avec une analyse statique sans profilage en production).

> Note : `axe-sec.md` peut être partiel (SEC dépend des sous-tâches 11.1–11.7) ; à la date de cette consolidation, l'axe SEC compte 13 Findings (F-SEC-001 à F-SEC-013). Si des Findings SEC supplémentaires sont produits ultérieurement, ce tableau et la vérification Property 4 devront être recalculés en conséquence.
