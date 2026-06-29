# Note 00 — Extraction des CLAUDE_Rules pour l'audit

> Source unique : `/Users/zerbib/clickup-clone/CLAUDE.md`
> Objet : extraire de `CLAUDE.md` les règles anti-destruction et les conventions de code que l'`Audit_System` doit respecter pendant toute la durée de l'audit `full-app-audit` (mode lecture seule).
> Périmètre : cette note est un guide opérationnel pour l'auditeur. Elle ne contient pas de Finding et ne préjuge d'aucun verdict sur le code.

## 1. Principes directeurs (rappel)

- L'audit est **strictement non destructif**. Les seules écritures autorisées sont à l'intérieur de `.kiro/specs/full-app-audit/` (rapport, plan, notes, annexes) et, indirectement, dans `.next/` si un `Build_Check` est exécuté.
- Les CLAUDE_Rules **priment sur toute autre instruction** car « un LLM peut mal interpréter une demande ambiguë et causer une perte de données irréversible » (cf. `CLAUDE.md`).
- Toute zone vérifiable uniquement via une `External_Console` (Vercel, Neon) doit être marquée « à confirmer via console » plutôt que faire l'objet d'une vérification active.

## 2. Règles anti-destruction Postgres / Neon

### 2.1 Opérations strictement interdites pendant l'audit

L'auditeur **n'exécute jamais** les commandes suivantes, sous aucune forme directe ou indirecte (script, alias, hook, MCP, sub-agent) :

- `prisma migrate reset` (drop complet du schéma)
- `prisma db push --force-reset`
- `prisma migrate dev`, `prisma migrate deploy` (toute application de migration)
- `prisma db push` (synchronisation schéma → BDD)
- `prisma db seed`, ou tout script de seed qui supprime/insère des lignes
- `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`
- `DELETE FROM <table>` sans clause `WHERE` suffisamment restrictive
- `UPDATE <table> SET ...` sans clause `WHERE` suffisamment restrictive
- Toute migration ajoutant/retirant des colonnes ou des contraintes
- Toute exécution de `$queryRawUnsafe` / `$executeRawUnsafe`

### 2.2 Protocole obligatoire si une opération destructive devenait nécessaire

`CLAUDE.md` impose, en dehors du contexte d'audit, le protocole suivant. Pendant l'audit, **ce protocole reste hors champ** : si l'audit identifie un besoin d'opération destructive, il l'inscrit comme `Finding` à investiguer dans un workflow d'exécution ultérieur, sans déclencher le protocole lui-même.

1. Annoncer l'opération en décrivant précisément ce qui sera supprimé/modifié.
2. Exécuter `./scripts/backup-db.sh <label>` **avant** de continuer.
3. Obtenir une **confirmation explicite** de l'utilisateur (ex. « confirme avec OK »).
4. **Jamais** en parallèle d'autres commandes.

### 2.3 Sauvegardes Neon (rappel, hors champ d'exécution audit)

- `./scripts/backup-db.sh [label]` — dump immédiat dans `~/backups/clickup-clone/`
- `./scripts/restore-db.sh` — liste les sauvegardes
- `./scripts/restore-db.sh <fichier.dump>` — restauration (demande confirmation)
- Rotation automatique : 30 backups conservés
- Formats : `.dump` (binaire, compressé) + `.sql` (texte, inspectable)
- Neon Point-in-Time Recovery natif (7 jours sur plan gratuit) — utilisable depuis la console Neon

> Implication audit : la simple **lecture** des scripts `./scripts/backup-db.sh` et `./scripts/restore-db.sh` est autorisée. Les **exécuter** ne l'est pas pendant la phase d'audit.

### 2.4 Lecture de la base et des secrets

- Aucune connexion directe à Neon depuis l'auditeur (psql, Prisma Studio, scripts ad hoc) pendant l'audit.
- Les fichiers `.env`, `.env.local` peuvent être listés, mais leur contenu de type secret (clés, jetons, URLs avec credentials) **ne doit pas être recopié** dans les notes ou le rapport. Référencer par nom de variable uniquement.

## 3. Règles anti-destruction Git / fichiers

L'auditeur **n'exécute jamais** les commandes suivantes pendant l'audit :

- `git reset --hard`, `git checkout .`, `git restore .`, `git clean -f`
- `git push`, `git push --force`, `git push --force-with-lease`
- `git commit` (l'audit ne commit pas ; les fichiers de la spec restent en working tree jusqu'à demande explicite de l'utilisateur)
- `git branch -D`, `git push --delete`
- `rm -rf` ou `rm` sur plus de 3 fichiers hors `node_modules`/`.next`
- Suppression de fichiers `.env*`
- `git config --global` ou modification de configuration git

Commandes de lecture autorisées : `git status`, `git diff`, `git log`, `git ls-files`, `git show`.

## 4. Règles anti-destruction Vercel / infrastructure

L'auditeur **n'exécute jamais** les commandes suivantes pendant l'audit :

- `vercel remove`, `vercel env rm`
- `vercel deploy`, `vercel --prod`, `vercel rollback`
- Modification (ajout, mise à jour, suppression) d'une variable d'environnement Vercel
- Modification de domaines, redirections, headers via la CLI ou l'API Vercel

Lecture autorisée uniquement : `vercel whoami`, `vercel env ls` (sans capture de valeurs), à condition d'un accès `External_Console` confirmé par l'utilisateur. À défaut, marquer « à confirmer via console ».

## 5. Comptes et identité

`CLAUDE.md` impose qu'avant toute commande `git push` ou `vercel`, l'identité soit vérifiée :

- `gh auth status` doit indiquer `Active account: true` sous **MendyZ770**.
- `vercel whoami` doit retourner **mendyz770**.

> Implication audit : aucune commande `git push` ni `vercel` n'étant prévue pendant l'audit, ces vérifications ne sont **pas requises** ; mais en cas de doute sur l'identité, arrêter et solliciter l'utilisateur (`! perso` ou switch manuel).

## 6. Conventions de code à utiliser comme grille d'audit

Ces conventions ne sont pas des règles anti-destruction, mais elles définissent la grille de lecture des Findings sur les axes `LOG`, `UI`, `UX` et `SEC`.

### 6.1 SWR — `res.ok` obligatoire

> « Fetchers SWR : toujours vérifier `res.ok`, sinon `throw new Error(...)` » (`CLAUDE.md`).

- Tout fetcher SWR (`useSWR`, `useSWRMutation`, `useSWRInfinite`, ou wrapper personnalisé) doit, **avant** de retourner ou parser la réponse, contrôler `res.ok` et lever une erreur si `false`.
- L'absence de ce contrôle est un Finding `F-LOG-NNN` de sévérité **Medium** au minimum (cf. `design.md` > Méthode de revue par axe > Logique applicative ; `requirements.md` 2.4).
- Le contrôle peut prendre des formes équivalentes : `if (!res.ok) throw new Error(...)`, helper centralisé qui jette en cas de non-2xx, ou utilisation d'un client (axios, ky) configuré pour rejeter sur statut non-2xx.

### 6.2 Routes API Next.js — paramètres dynamiques en `Promise`

> « API routes : params sous forme `{ params: Promise<{ id: string }> }`, `await params` à l'intérieur » (`CLAUDE.md`).

- Toute route dynamique sous `src/app/api/**/[param]/route.ts` doit typer `params` comme `Promise<...>` et faire `await params` avant utilisation.
- Une signature non conforme avec Next.js 16 / App Router est un Finding `F-LOG-NNN` (au minimum Medium ; High si cela provoque un échec de build, cf. tâche 2.2).

### 6.3 UI — français + identifiants en anglais

> « UI 100% français (accents inclus), les identifiants de code restent en anglais » (`CLAUDE.md`).

- Tout texte affiché à l'utilisateur (labels, messages d'erreur, toasts, placeholders, titres) doit être en français, accents inclus.
- Les noms de variables, fonctions, composants, types restent en anglais.
- Un mélange (ex. message d'erreur en anglais affiché à l'utilisateur) est un Finding `F-UI-NNN` ou `F-UX-NNN` de sévérité **Medium**.

### 6.4 Commentaires

> « Pas de commentaires inutiles (pas de "what", seulement "why" quand non-obvious) » (`CLAUDE.md`).

- Convention stylistique. Les écarts isolés sont **inférieurs à Medium** et donc **exclus** du rapport (cf. `requirements.md` 3.3). À ne consigner que s'ils traduisent un problème de clarté plus large déjà couvert par un autre Finding.

### 6.5 Responsive

> « Responsive : `p-4 md:p-6`, `text-xl md:text-2xl`, `flex-col sm:flex-row` » (`CLAUDE.md`).

- L'audit `UI` (tâches 5.3) vérifie l'usage cohérent des breakpoints Tailwind et l'absence de débordement horizontal sur mobile.
- Les écarts cosmétiques restent sous le seuil Medium ; un défaut affectant la lisibilité ou l'accessibilité d'un parcours critique devient `F-UI-NNN` Medium.

### 6.6 Git — politique de commit

> « Ne jamais committer sans demande explicite » + « Pas de `--no-verify`, pas d'amend sauf demande ».

- L'audit ne commit **rien**. Toutes les écritures restent en working tree dans `.kiro/specs/full-app-audit/`.
- Le format de message (titre court en français, corps optionnel, footer `Co-Authored-By`) est documenté pour l'éventuel workflow d'exécution ultérieur, hors champ de cet audit.

## 7. Implications opérationnelles pour les phases de l'audit

| Phase | Garde-fou CLAUDE_Rules à appliquer |
| ----- | ---------------------------------- |
| Phase 0 — Préparation (tâches 1.1 à 1.4) | `git status` lecture seule ; aucune écriture hors `.kiro/specs/full-app-audit/`. |
| Phase 1 — Build_Check (tâches 2.1, 2.2) | `npm run build` (ou équivalent) **uniquement** ; pas de `prisma`, pas de `vercel`, pas de `next dev`. La sortie peut écrire dans `.next/` ; cela reste conforme au mode lecture seule sur la BDD et le code source applicatif. |
| Phase 2 — Inventaires (tâches 3.1 à 3.6) | Lecture de fichiers exclusivement ; aucune connexion BDD, aucune commande `prisma`. |
| Phase 3 — Revue par axe (tâches 5 à 12) | Recherches statiques (`grep`, `read_file`) ; aucune exécution de code applicatif. |
| Phase 4 — Consolidation (tâche 14) | Édition des notes uniquement. |
| Phase 5 — Rédaction (tâche 15) | Écriture de `audit-report.md` et du plan de remédiation dans `.kiro/specs/full-app-audit/`. |
| Phase 6 — Vérification (tâche 16) | Relecture statique uniquement. |

## 8. Liste de contrôle « avant chaque commande »

Avant d'exécuter toute commande shell pendant l'audit, vérifier les quatre points suivants :

1. La commande est-elle **strictement de lecture** ou un `next build` ? Sinon, ne pas l'exécuter.
2. La commande touche-t-elle à `prisma`, à la BDD Neon, à `vercel`, à `git push`, ou à des suppressions de fichiers ? Si oui, **stop**.
3. La sortie de la commande sera-t-elle consignée dans le journal `notes/annexe-A-commandes.md` (commande, but, exit code, durée, résumé) ?
4. Si la commande révèle un secret (`.env`, clé, jeton), s'engager à ne pas recopier la valeur dans les notes ou le rapport (référencer par nom de variable seulement).

## 9. Glossaire CLAUDE_Rules ↔ Audit

| Terme `CLAUDE.md` | Mapping audit |
| ----------------- | ------------- |
| « anti-destruction de données » | Cadre du `Requirement 1` (mode lecture seule) |
| « Postgres / Neon » | Cadre des axes `BDD` et `INF` |
| « SWR / `res.ok` » | Cadre des axes `LOG` (et impact `UX` indirect) |
| « API routes / params Promise » | Cadre de l'axe `LOG` |
| « UI français » | Cadre des axes `UI` et `UX` |
| « Vercel / vercel.json » | Cadre de l'axe `INF` |
| « gh auth / vercel whoami » | Hors champ audit (pas de push/deploy) |

---

**Cette note est figée à l'issue de la tâche 1.2.** Toute évolution ultérieure (ex. clarification reçue de l'utilisateur, nouvelle règle ajoutée à `CLAUDE.md`) sera consignée par addendum au bas du fichier, daté.
