# Baseline d'audit

> Décision utilisateur consignée à l'issue de la tâche 1.1 — Phase 0.

## Décision

L'audit porte sur l'état courant **HEAD + worktree** du dépôt local `/Users/zerbib/clickup-clone`, c'est-à-dire l'union de :

1. l'arbre commité au HEAD courant ;
2. les modifications non commitées de l'arbre de travail (fichiers modifiés, supprimés indexés et fichiers non suivis listés en tâche 1.1).

À documenter explicitement dans `audit-report.md` :

- Section « Périmètre et méthode » : mention de la baseline « HEAD + worktree » et de la décision utilisateur.
- Section « Limites et hypothèses » : rappel que les modifications non commitées sont incluses dans le périmètre, avec impact possible sur la reproductibilité.

## Identifiants de baseline

| Champ | Valeur |
|-------|--------|
| Dépôt | `/Users/zerbib/clickup-clone` |
| Branche | `main` |
| HEAD SHA | `8b920995eda6a2d274009d1b967b59c88d098e3d` |
| Timestamp UTC du gel (`date -u`) | `2026-05-29T02:57:38Z` (issu de l'horloge de la machine hôte ; à confirmer si l'horloge n'est pas synchronisée) |
| État worktree | Non propre : 57 fichiers modifiés, 1 supprimé indexé (`apk/Done.apk`), nombreux fichiers non suivis (cf. `notes/annexe-A-commandes-1.1.md`) |

## Conséquences

- Le Finding `F-LOG-001` (consigné dans `notes/axe-log.md`, Severity_High) est **conservé** dans le rapport. Il documente le fait que la baseline n'est pas un HEAD propre, ce qui constitue une dette de traçabilité, indépendamment de la décision de poursuivre l'audit.
- Aucune écriture ne sera effectuée hors `.kiro/specs/full-app-audit/` pendant la suite de l'audit ; le mode lecture seule reste en vigueur.
- En tâche 1.4, le journal `notes/annexe-A-commandes.md` sera initialisé puis le contenu de `notes/annexe-A-commandes-1.1.md` y sera fusionné.
