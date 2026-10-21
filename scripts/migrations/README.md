# Migrations préparées, non appliquées

Ces fichiers SQL ne sont **jamais** exécutés automatiquement. Chacun est appliqué
avec `./scripts/apply-schema-change.sh <fichier.sql> <DATABASE_URL>`, qui commence
par un `./scripts/backup-db.sh`.

- `2026-10-21-revoked-mobile-tokens.sql` — table `RevokedMobileToken` (révocation
  des JWT mobiles). **À appliquer avant de déployer** le code courant : la
  vérification de révocation interroge cette table à chaque requête authentifiée
  par Bearer token.
- `2026-10-21-money-decimal.sql` — colonnes monétaires en `numeric(14,2)`
  (`GoalTarget`, budgets, alertes, comptes, transactions, objectifs) et index
  de réconciliation. À appliquer uniquement avec la modification de
  `prisma/schema.prisma` et le déploiement du code financier Decimal.
- `2026-10-22-time-entry-single-active.sql` — index partiel garantissant un seul
  minuteur actif par utilisateur. À appliquer avant de déployer le code qui
  traduit la violation d'unicité (P2002) en HTTP 409 ; vérifier l'absence de
  doublons avec la requête fournie en tête du fichier.
- `2026-10-22-cron-reliability.sql` — colonne `Reminder.lastNotifiedAt`, index
  `(completed, remindAt)` et index `TaskRecurrence.nextDueDate`. À appliquer
  avant de déployer le cron de rappels fiabilisé et le worker de récurrences.
