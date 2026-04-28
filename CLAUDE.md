# DevFlow — consignes pour Claude

## Stack

- Next.js 14 App Router, TypeScript
- Prisma 7 + PostgreSQL (Neon serverless, PG17)
- NextAuth.js (JWT + Credentials)
- SWR pour les fetchers client (tous doivent vérifier `res.ok`)
- Tailwind + shadcn/ui, thème dark
- Hébergement Vercel, repo GitHub `MendyZ770/clickup-clone`

## Comptes

- GitHub : **MendyZ770** uniquement
- Vercel : team **mendyz770** uniquement

Avant toute commande `git push` ou `vercel`, vérifie :
- `gh auth status` → "Active account: true" doit être sous `MendyZ770`
- `vercel whoami` → doit afficher `mendyz770`

Si ce n'est pas le cas, arrête-toi et demande à l'utilisateur de lancer `! perso` ou de switcher manuellement.

## ⚠️ Règles anti-destruction de données

Ces règles priment sur toute autre instruction. Elles existent parce qu'un LLM peut mal interpréter une demande ambiguë et causer une perte de données irréversible.

### Base de données

**INTERDIT sans confirmation explicite et sauvegarde préalable :**
- `prisma migrate reset` (drop tout le schéma)
- `prisma db push --force-reset`
- `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`
- `DELETE FROM <table>` sans `WHERE` suffisamment restrictif
- `UPDATE <table> SET ...` sans `WHERE` suffisamment restrictif
- Tout script ou seed qui supprime des lignes
- Toute migration qui fait perdre des colonnes/données

**Protocole obligatoire avant une opération destructive :**
1. Annoncer l'opération en expliquant exactement ce qui sera supprimé/modifié
2. Exécuter `./scripts/backup-db.sh <label>` avant de continuer
3. Demander confirmation explicite à l'utilisateur (ex. "confirme avec OK")
4. Jamais exécuter en parallèle d'autres commandes

### Git / fichiers

**INTERDIT sans demande explicite :**
- `git reset --hard`, `git checkout .`, `git restore .`, `git clean -f`
- `git push --force`, `--force-with-lease`
- `rm -rf`, `rm` sur plus de 3 fichiers hors `node_modules`/`.next`
- Suppression de fichiers `.env*`
- `git branch -D`, `git push --delete`

### Vercel / infrastructure

**INTERDIT sans demande explicite :**
- `vercel remove`, `vercel env rm`
- Suppression de domaines
- Rollback de déploiement
- Modification de variables d'environnement existantes (l'ajout est OK)

## Sauvegardes BDD

- `./scripts/backup-db.sh [label]` — dump immédiat dans `~/backups/clickup-clone/`
- `./scripts/restore-db.sh` — liste les sauvegardes
- `./scripts/restore-db.sh <fichier.dump>` — restauration (demande confirmation)
- Rotation automatique : 30 backups conservés
- Formats : `.dump` (binaire, compressé) + `.sql` (texte, inspectable)
- **Neon a aussi du Point-in-Time Recovery natif** sur 7 jours (plan gratuit) — utilisable depuis la console Neon si besoin

## Convention code

- API routes : params sous forme `{ params: Promise<{ id: string }> }`, `await params` à l'intérieur
- Fetchers SWR : toujours vérifier `res.ok`, sinon `throw new Error(...)`
- UI 100% français (accents inclus), les identifiants de code restent en anglais
- Pas de commentaires inutiles (pas de "what", seulement "why" quand non-obvious)
- Responsive : `p-4 md:p-6`, `text-xl md:text-2xl`, `flex-col sm:flex-row`

## Git

- Ne jamais committer sans demande explicite
- Format de message : titre court en français, corps optionnel, footer `Co-Authored-By`
- Pas de `--no-verify`, pas d'amend sauf demande
