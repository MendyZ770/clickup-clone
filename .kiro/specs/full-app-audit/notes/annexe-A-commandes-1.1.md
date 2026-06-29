# Journal des commandes — extrait tâche 1.1

> Note temporaire à fusionner dans `notes/annexe-A-commandes.md` lorsque la tâche 1.4 aura initialisé l'annexe A.
> Toutes les commandes ci-dessous sont strictement de lecture / inspection.

| # | Commande | But | Exit code | Durée | Résumé sortie |
|---|----------|-----|-----------|-------|---------------|
| 1 | `git status --short` | Vérifier la propreté du dépôt avant audit (tâche 1.1) | 0 | <1 s | 57 fichiers modifiés (`M`), 1 fichier supprimé indexé (`D apk/Done.apk`), nombreux fichiers non suivis dont `.kiro/`, `.agents/`, `android/app/google-services.json`, `skills-lock.json`, plusieurs nouvelles routes API sous `src/app/api/cron/*`, `src/app/api/me/notification-preferences`, `src/app/api/mobile-logout`, `src/app/api/push/*`, et nouveaux fichiers `src/components/capacitor-push-init.tsx`, `src/components/task/create-task-dialog.tsx`, `src/components/ui/switch.tsx`, `src/hooks/use-capacitor-push.ts`, `src/lib/firebase-admin.ts`, `src/lib/notifications.ts`, `src/lib/storage.ts`. [voir détail dans `notes/axe-log.md` F-LOG-001] |
| 2 | `git diff --stat` | Mesurer l'ampleur des modifications hors `.kiro/specs/full-app-audit/` | 0 | <1 s | 58 fichiers modifiés, +2645 −763 lignes. Les modifications touchent des zones critiques : schéma Prisma (`prisma/schema.prisma` +35 lignes), routes API (`src/app/api/**`), couche d'authentification (`src/lib/auth*.ts`), configuration Next/Vercel/Capacitor (`next.config.mjs`, `vercel.json`, `capacitor.config.ts`, `android/**`), pages applicatives (`src/app/(auth)/**`, `src/app/(platform)/**`), composants critiques (`src/components/layout/**`, `src/components/task/**`, `src/components/auth/**`), `package.json` (+3 lignes) et `package-lock.json` (+1799 lignes). [voir détail dans `notes/axe-log.md` F-LOG-001] |

## Observations

- L'arbre de travail n'est pas propre **avant** le démarrage de l'audit. Les modifications pré-existent à toute action de l'`Audit_System` ; elles ne résultent pas d'écritures effectuées dans le cadre de l'audit.
- Aucune modification hors `.kiro/specs/full-app-audit/` n'a été produite par l'`Audit_System` jusqu'à présent (seules deux commandes `git` en lecture ont été exécutées).
- L'audit est mis en pause conformément à la consigne de la tâche 1.1 (« stopper l'audit jusqu'à confirmation utilisateur »).
