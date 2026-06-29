# Inventaire — Jobs cron Vercel et endpoints cibles (tâche 3.6)

## Objet

Cette note constitue l'**inventaire des jobs cron Vercel** déclarés dans `vercel.json` et de leurs endpoints cibles sous `src/app/api/`. Elle satisfait la tâche 3.6 du plan (`tasks.md`) et alimentera l'axe **INF (Vercel/Infra)** lors de la phase 3 (cf. `design.md` > Méthode de revue par axe > Vercel/Infra) ainsi que le contrôle `Property 7 / Property 8` lors de la phase 6 (cf. `requirements.md` clauses 8.1, 8.2).

Mode strictement **lecture seule** : aucune modification du code, du schéma Prisma, des migrations ou de la base. Toute écriture est confinée à `.kiro/specs/full-app-audit/notes/`.

## Source

Fichier `vercel.json` situé à la racine du dépôt (`/Users/zerbib/clickup-clone/vercel.json`). Le fichier **existe** : aucune anomalie d'absence à recouper en phase 3.

Champs racine présents :

- `buildCommand` : `"npx prisma generate && next build"`
- `framework` : `"nextjs"`
- `crons` : tableau de **4 entrées** (cf. tableau ci-dessous)

Champs racine **absents** (à confirmer en phase 9.1 / 9.4 si pertinent) :

- `functions` : non déclaré → la configuration de mémoire / `maxDuration` / régions des fonctions est **héritée des valeurs par défaut Vercel** pour le framework Next.js. À recouper avec `next.config.*` (tâche 9.4) et avec les besoins réels des cron handlers (durée d'exécution potentielle de boucles Prisma + envois e-mail/push).
- `headers` : non déclaré → aucun header HTTP global n'est défini au niveau de la plateforme Vercel via ce fichier. La présence ou non de headers de sécurité (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) doit être vérifiée côté `next.config.*` ou via `middleware.ts` lors de la tâche 11.5.
- `rewrites` : non déclaré → aucune réécriture d'URL au niveau Vercel. Le routage applicatif repose intégralement sur l'App Router de Next.js (`src/app/...`).

## Tableau des crons

Pour chaque cron : `path` (depuis `vercel.json`), `schedule` (cron expression UTC selon convention Vercel), existence du fichier `route.ts` cible sous `src/app/api/`, méthode HTTP exportée par la route, présence d'un contrôle d'authentification (`CRON_SECRET` ou autre), commentaire de synthèse.

| # | Path                          | Schedule (UTC) | Route cible existe ?                                           | Méthode HTTP | Auth présente ?                                                                                                                                                                          | Commentaire |
|---|-------------------------------|----------------|----------------------------------------------------------------|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| 1 | `/api/cron/reminders`         | `0 8 * * *`    | Oui — `src/app/api/cron/reminders/route.ts`                    | `GET`        | Oui — `process.env.CRON_SECRET` comparé à `searchParams.get("secret") ?? request.headers.get("x-vercel-cron-secret")`. Si `CRON_SECRET` non défini en env, la route renvoie 401.         | Le contrôle accepte deux canaux : query string `?secret=` **ou** header `x-vercel-cron-secret`. Le header officiel envoyé par Vercel pour les crons est `Authorization: Bearer <CRON_SECRET>` ; la route ne lit PAS ce header. À recouper en phase 9.2 (Property 7 — cron sans secret = High). |
| 2 | `/api/cron/daily-tasks`       | `0 8 * * *`    | Oui — `src/app/api/cron/daily-tasks/route.ts`                  | `GET`        | Oui — même schéma que ci-dessus (`CRON_SECRET` via `?secret=` ou header `x-vercel-cron-secret`).                                                                                         | Même observation : le header `Authorization` standard Vercel n'est pas vérifié. Coïncidence de schedule avec le cron `reminders` (`0 8 * * *`) → exécution simultanée à 08:00 UTC, à valider sous l'angle charge BDD en phase 12.4. |
| 3 | `/api/cron/upcoming-deadlines`| `0 9 * * *`    | Oui — `src/app/api/cron/upcoming-deadlines/route.ts`           | `GET`        | Oui — même schéma (`CRON_SECRET` via `?secret=` ou header `x-vercel-cron-secret`).                                                                                                       | Même observation que ci-dessus sur le header `Authorization`. |
| 4 | `/api/cron/budget-alerts`     | `0 10 * * *`   | Oui — `src/app/api/cron/budget-alerts/route.ts`                | `GET`        | Oui — même schéma (`CRON_SECRET` via `?secret=` ou header `x-vercel-cron-secret`).                                                                                                       | Même observation que ci-dessus sur le header `Authorization`. |

### Détail du contrôle d'authentification (identique pour les 4 routes)

Extrait représentatif (cf. `src/app/api/cron/reminders/route.ts` lignes 7–14, structure dupliquée à l'identique dans les trois autres routes) :

```ts
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") ?? request.headers.get("x-vercel-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... logique métier
}
```

Observations factuelles à recouper en phase 3 (axe INF / SEC) :

- **Présence d'un secret** : conforme à l'exigence minimale (Property 7 — cron sans secret = High). Aucun cron du fichier n'est ouvert sans authentification.
- **Header lu** : `x-vercel-cron-secret`. Vercel documente officiellement l'envoi du header `Authorization: Bearer <CRON_SECRET>` pour les crons protégés ; la route ne lit pas ce header. À confronter à la documentation Vercel et à la configuration effective dans la console (External_Console) en phase 9.2.
- **Canal alternatif `?secret=`** : autoriser le secret en query string l'expose potentiellement aux logs serveur, aux logs d'accès Vercel et aux référents HTTP en cas de redirection. À évaluer en phase 11 (axe SEC).
- **Pas de défense en profondeur** : aucun autre contrôle (IP source, User-Agent Vercel, signature) n'est appliqué. À noter pour phase 9.2.
- **Méthode HTTP** : Vercel invoque les crons en `GET` par défaut, donc l'export `GET` est cohérent avec la déclaration `vercel.json` (aucune autre méthode HTTP n'est exportée par les quatre fichiers).
- **Codes de retour** : `401` en cas d'échec d'authentification, `500` en cas d'erreur interne, `200` avec payload JSON en succès — conforme aux attentes pour des handlers cron observables.

## Couverture inverse — fichiers `route.ts` sous `src/app/api/cron/` non référencés par `vercel.json`

Listing du dossier `src/app/api/cron/` :

- `src/app/api/cron/budget-alerts/`
- `src/app/api/cron/daily-tasks/`
- `src/app/api/cron/reminders/`
- `src/app/api/cron/upcoming-deadlines/`

→ **Bijection complète** : les 4 sous-dossiers correspondent aux 4 entrées de `crons` dans `vercel.json`. Aucun handler cron orphelin (route présente mais non planifiée) ni cron déclaré sans handler (planification sans route cible).

## Autres sections de `vercel.json`

- **`functions`** : section **absente** du fichier. Aucune configuration explicite de `memory`, `maxDuration`, `regions` par fonction. Conséquence : toutes les Route Handlers (y compris les quatre cron handlers) utilisent les valeurs par défaut du plan Vercel courant. À noter pour la tâche 9.1 (`Auditer vercel.json`) : si les cron handlers exécutent des boucles longues (envois e-mail Resend dans `reminders`, parcours de tous les budgets dans `budget-alerts`), une `maxDuration` explicite et un dimensionnement mémoire pourraient être pertinents. Aucun finding ici, simple observation.
- **`headers`** : section **absente**. Aucun header HTTP global ni spécifique à un path n'est imposé au niveau de la plateforme Vercel via ce fichier. À recouper avec `next.config.*` et `middleware.ts` en phase 11.5 (audit des en-têtes de sécurité — CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- **`rewrites`** : section **absente**. Aucune réécriture d'URL côté Vercel. Le routage applicatif est entièrement géré par Next.js App Router. Pas d'impact pour l'inventaire crons.
- **Autres champs racine présents** : `buildCommand` (`npx prisma generate && next build`) et `framework` (`nextjs`). Le `buildCommand` confirme l'exécution préalable de `prisma generate` à chaque build Vercel, cohérent avec la configuration Prisma observée en tâche 1.3.

## Pistes d'investigation pour la phase 3 (axe INF / axe SEC)

À ne PAS traiter dans cette tâche d'inventaire — listées ici uniquement pour traçabilité vers la phase 3 (tâches 9.2, 11.x) :

1. **Header lu vs header officiel Vercel** : la route lit `x-vercel-cron-secret` au lieu du header standard `Authorization: Bearer <CRON_SECRET>`. À confirmer avec la doc officielle Vercel courante et avec la configuration effective en console (External_Console). Potentiel finding `F-INF-NNN` ou `F-SEC-NNN`.
2. **Acceptation du secret en query string `?secret=`** : exposition potentielle dans les logs HTTP et les logs Vercel. Potentiel finding axe SEC (severity à arbitrer).
3. **Coïncidence de schedules à 08:00 UTC** entre `reminders` et `daily-tasks` : à recouper avec le profil de charge BDD en phase 12.4.
4. **Absence de configuration `functions`** : à arbitrer en phase 9.1 selon la durée réelle d'exécution observée (External_Console / logs Vercel).
5. **Absence de `headers` au niveau Vercel** : à recouper en phase 11.5 ; vérifier que les en-têtes de sécurité sont bien définis ailleurs (next.config.* ou middleware).

## Référence croisée

- Source : `vercel.json` (racine du dépôt).
- Routes cibles : `src/app/api/cron/{reminders,daily-tasks,upcoming-deadlines,budget-alerts}/route.ts`.
- Tâche orchestrante : `tasks.md` § 3.6 (Phase 2 — Inventaires).
- Phase d'exploitation : `tasks.md` §§ 9.1, 9.2 (axe INF), 11.x (axe SEC) le cas échéant.
- Propriétés concernées : `design.md` > Correctness Properties > Property 7 (cron sans secret = High), Property 8 (auth + ownership des routes API — non applicable strictement aux crons mais à recouper).
- Requirements : 8.1 (référence directe de la tâche 3.6), 8.2 (sera consommé en 9.2).
