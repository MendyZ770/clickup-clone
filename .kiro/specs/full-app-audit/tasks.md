# Implementation Plan: full-app-audit

## Overview

Ce document est le plan d'exécution de l'audit lui-même. Chaque tâche correspond à un pas concret, strictement non destructif, qui produit une preuve ou un Finding consigné dans des notes hors dépôt. Les livrables finaux (`audit-report.md` et un `tasks.md` de remédiation) sont produits respectivement aux phases 5 et après vérification des propriétés en phase 6.

Conventions :

- Aucune tâche n'écrit dans le code applicatif ni dans la base. Toutes les écritures se limitent à `.kiro/specs/full-app-audit/` (notes, rapport, plan de remédiation) et à `.next/` (build).
- Chaque Finding détecté pendant la phase 3 utilise le schéma normalisé du design (`### F-XXX-NNN — Titre`) et est stocké dans une note par axe avant consolidation.
- Toutes les commandes shell exécutées sont consignées dans le journal initialisé en tâche 1.4 (annexe A du rapport).
- Les références « _Design : §X_ » pointent vers une section du document `design.md`. Les références « _Requirements : N.M_ » pointent vers une clause précise de `requirements.md`.

## Tasks

- [x] 1. Phase 0 — Préparation et cadrage
  - [x] 1.1 Vérifier que `git status` est propre hors `.kiro/specs/full-app-audit/`
    - Exécuter `git status --short` et `git diff --stat`, consigner la sortie dans le journal des commandes.
    - Si des modifications existent ailleurs que `.kiro/specs/full-app-audit/`, marquer un Finding `F-LOG-NNN` Severity_High pour violation potentielle du mode lecture seule et stopper l'audit jusqu'à confirmation utilisateur.
    - _Design : Architecture > Workflow d'exécution > Phase 0_
    - _Requirements : 1.1, 1.4_

  - [x] 1.2 Lire `CLAUDE.md` et extraire les CLAUDE_Rules pertinentes
    - Lire `/Users/zerbib/clickup-clone/CLAUDE.md` en entier.
    - Produire une note `notes/00-claude-rules.md` (hors dépôt) listant les règles anti-destruction et conventions à respecter pendant l'audit, en particulier les règles Postgres/Neon et SWR (`res.ok`).
    - _Design : Architecture > Approche méthodologique > 1_
    - _Requirements : 1.3_

  - [x] 1.3 Lire `package.json`, `next.config.*`, `tsconfig.json` et identifier les commandes disponibles
    - Lire les scripts npm (`build`, `start`, `lint`, `prisma`).
    - Confirmer la commande de build à utiliser pour la phase 1 (`next build` ou équivalent du script `build`).
    - Noter les versions clés (Next.js, Prisma, NextAuth, SWR, Capacitor) dans `notes/00-stack.md`.
    - _Design : Architecture > Approche méthodologique > 1_
    - _Requirements : 2.6_

  - [x] 1.4 Initialiser le journal des commandes (annexe A)
    - Créer la note `notes/annexe-A-commandes.md` avec en-têtes de tableau (commande, but, exit code, durée, résumé sortie).
    - À chaque commande exécutée pendant l'audit, ajouter une ligne. Toute sortie tronquée doit l'être explicitement avec mention `[tronqué]`.
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > A_
    - _Requirements : 4.4_

- [x] 2. Phase 1 — Build_Check non destructif
  - [x] 2.1 Exécuter le Build_Check et capturer le log
    - Exécuter la commande de build identifiée en 1.3 (typiquement `npm run build` ou `pnpm build`) avec capture stdout/stderr.
    - Sauvegarder la sortie complète dans `notes/annexe-B-build-log.md` (annexe B), avec exit code et durée.
    - Consigner la commande dans le journal (1.4).
    - _Design : Architecture > Approche méthodologique > 2 ; Workflow d'exécution > Phase 1_
    - _Requirements : 2.6_

  - [x] 2.2 Identifier les erreurs et avertissements bloquants du build
    - Parcourir le log et extraire warnings TypeScript, erreurs ESLint bloquantes, erreurs de compilation, dépendances manquantes, modules non résolus.
    - Si le build échoue, créer un Finding `F-LOG-NNN` Severity_High décrivant l'erreur, son fichier:ligne et son impact, conformément à la stratégie d'erreur du design.
    - Lister les warnings non bloquants comme observations à recouper avec les axes (LOG, PRF) lors de la phase 3.
    - _Design : Error Handling > Échec du Build_Check_
    - _Requirements : 2.6, 3.1_

- [x] 3. Phase 2 — Inventaires
  - [x] 3.1 Inventorier les routes API sous `src/app/api/**/route.{ts,js}`
    - Lister exhaustivement les fichiers `route.ts`/`route.js` et, par fichier : méthodes HTTP exportées, présence d'un contrôle NextAuth, présence d'une vérification d'ownership (workspace, owner, membership), présence d'une validation d'entrée (Zod ou équivalent), portée des données retournées.
    - Produire le tableau dans `notes/annexe-C-routes-api.md` (annexe C).
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > C_
    - _Requirements : 2.3, 6.1, 6.2_

  - [x] 3.2 Inventorier les hooks SWR sous `src/hooks/` (et tout fetcher SWR ailleurs)
    - Pour chaque hook : nom, clé SWR, fetcher, contrôle `res.ok` présent ?, gestion erreur explicite ?, options (`dedupingInterval`, `revalidateOnFocus`, etc.).
    - Produire le tableau dans `notes/annexe-D-hooks-swr.md` (annexe D).
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > D_
    - _Requirements : 2.4_

  - [x] 3.3 Inventorier les modèles Prisma et confronter aux migrations
    - Lire `prisma/schema.prisma` et lister modèles, champs, relations, index (`@@index`, `@unique`), `onDelete`/`onUpdate`.
    - Lister les migrations présentes sous `prisma/migrations/` et noter toute dérive apparente (modèle ou champ dans le schéma sans migration correspondante, ou inversement).
    - Produire le tableau dans `notes/annexe-E-prisma.md` (annexe E).
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 5. Annexes > E_
    - _Requirements : 2.2, 7.1, 7.3_

  - [x] 3.4 Inventorier les plugins Capacitor déclarés et utilisés
    - Comparer `package.json` (dépendances `@capacitor/*` et plugins tiers), `android/app/src/main/assets/capacitor.plugins.json`, et les imports effectifs dans le code.
    - Identifier plugins importés mais non déclarés (et inversement) dans `notes/inv-plugins-capacitor.md`.
    - _Design : Méthode de revue par axe > Mobile/Capacitor_
    - _Requirements : 2.5, 8.5_

  - [x] 3.5 Inventorier les variables d'environnement référencées dans le code
    - Rechercher toutes les occurrences de `process.env.X` dans `src/` et `prisma/`.
    - Comparer la liste obtenue à `.env.example` et identifier les variables référencées mais absentes du fichier d'exemple, et inversement.
    - Consigner dans `notes/inv-env.md`.
    - _Design : Méthode de revue par axe > Vercel/Infra_
    - _Requirements : 8.3_

  - [x] 3.6 Inventorier les jobs cron Vercel et leurs endpoints cibles
    - Lire `vercel.json` (sections `crons`, `functions`, `headers`, `rewrites`).
    - Pour chaque cron : path, schedule, existence du `route.ts` cible sous `src/app/api/`, présence d'un contrôle `CRON_SECRET` ou autre authentification.
    - Consigner dans `notes/inv-crons.md`.
    - _Design : Méthode de revue par axe > Vercel/Infra_
    - _Requirements : 8.1_

- [x] 4. Checkpoint inventaires
  - Vérifier que les six inventaires (3.1 à 3.6) sont complets et croisés avec les CLAUDE_Rules. S'assurer qu'aucune commande exécutée n'a modifié le dépôt (`git status` sur la racine reste propre hors `.kiro/`). Demander à l'utilisateur en cas de doute.

- [x] 5. Phase 3 — Revue Axe UI
  - [x] 5.1 Auditer composants `shadcn/ui` et primitives Radix
    - Vérifier les props requises, la présence d'`aria-label` sur composants interactifs sans texte visible, l'usage cohérent des variants.
    - Consigner les écarts dans `notes/axe-ui.md` au format Finding `F-UI-NNN`.
    - _Design : Méthode de revue par axe > UI_
    - _Requirements : 2.1, 4.3_

  - [x] 5.2 Auditer accessibilité (rôles ARIA, hiérarchie titres, focus, contraste, alt)
    - Inspecter pages et composants principaux sous `src/app/` et `src/components/`.
    - Consigner Findings dans `notes/axe-ui.md`.
    - _Design : Méthode de revue par axe > UI_
    - _Requirements : 2.1_

  - [x] 5.3 Auditer responsive (breakpoints Tailwind, débordement horizontal mobile)
    - Inspecter classes Tailwind sur layouts critiques (sidebar, listes de tâches, modales).
    - Consigner Findings dans `notes/axe-ui.md`.
    - _Design : Méthode de revue par axe > UI_
    - _Requirements : 2.1_

  - [x] 5.4 Auditer design tokens (variables Tailwind/CSS vs littéraux ad hoc)
    - Repérer couleurs, espacements, rayons codés en dur hors tokens.
    - Consigner Findings dans `notes/axe-ui.md`.
    - _Design : Méthode de revue par axe > UI_
    - _Requirements : 2.1_

  - [x] 5.5 Auditer états `loading`/`error`/`empty` sur composants asynchrones
    - Pour chaque composant consommant un hook SWR (cf. 3.2), vérifier la gestion explicite des trois états.
    - Consigner Findings dans `notes/axe-ui.md`.
    - _Design : Méthode de revue par axe > UI_
    - _Requirements : 2.1_

- [x] 6. Phase 3 — Revue Axe UX
  - [x] 6.1 Auditer parcours critiques (auth, CRUD tâche, navigation workspaces)
    - Tracer le flux dans le code (pages, formulaires, server actions, routes API) sans exécuter l'application.
    - Consigner Findings dans `notes/axe-ux.md` au format `F-UX-NNN`.
    - _Design : Méthode de revue par axe > UX_
    - _Requirements : 2.1, 4.3_

  - [x] 6.2 Auditer feedback (toasts, spinners, messages d'erreur, confirmations destructives)
    - Vérifier la présence de `toast`/`sonner` ou équivalent sur opérations asynchrones et destructives.
    - Consigner Findings dans `notes/axe-ux.md`.
    - _Design : Méthode de revue par axe > UX_
    - _Requirements : 2.1_

  - [x] 6.3 Auditer gestion d'erreur côté UX (`error.tsx`, `not-found.tsx`, fallback réseau)
    - Vérifier la présence des fichiers `error.tsx`/`not-found.tsx` aux bons niveaux du routeur et leur contenu.
    - Consigner Findings dans `notes/axe-ux.md`.
    - _Design : Méthode de revue par axe > UX_
    - _Requirements : 2.1_

  - [x] 6.4 Auditer navigation (cohérence liens, état actif, retour arrière mobile)
    - Vérifier la cohérence des `href`, l'usage de `usePathname`, le comportement du retour mobile.
    - Consigner Findings dans `notes/axe-ux.md`.
    - _Design : Méthode de revue par axe > UX_
    - _Requirements : 2.1_

  - [x] 6.5 Auditer ergonomie mobile (zones tactiles ≥ 44 px, gestes, clavier virtuel)
    - Inspecter tailles de boutons, espacement, gestion `padding-bottom: env(safe-area-inset-bottom)`.
    - Consigner Findings dans `notes/axe-ux.md`.
    - _Design : Méthode de revue par axe > UX_
    - _Requirements : 2.1_

- [x] 7. Phase 3 — Revue Axe LOG (Logique applicative)
  - [x] 7.1 Auditer la structure App Router (`route.ts` / `page.tsx` / `layout.tsx`)
    - Vérifier la séparation correcte des fichiers et la cohérence des conventions.
    - Consigner Findings dans `notes/axe-log.md` au format `F-LOG-NNN`.
    - _Design : Méthode de revue par axe > Logique applicative_
    - _Requirements : 2.1_

  - [x] 7.2 Auditer la frontière server/client (directives `"use client"`)
    - Repérer les `"use client"` non justifiés et les imports serveur dans des composants client.
    - Consigner Findings dans `notes/axe-log.md`.
    - _Design : Méthode de revue par axe > Logique applicative_
    - _Requirements : 2.1_

  - [x] 7.3 Auditer hooks SWR — contrôle `res.ok`, gestion clé, revalidation
    - À partir de l'inventaire 3.2, lister tous les fetchers ne contrôlant pas `res.ok` (Severity_Medium minimum) et noter clés instables ou revalidations excessives.
    - Consigner Findings dans `notes/axe-log.md`.
    - _Design : Méthode de revue par axe > Logique applicative_
    - _Requirements : 2.4_

  - [x] 7.4 Auditer la validation Zod sur entrées API et formulaires
    - Pour chaque route API (cf. 3.1) et chaque formulaire, vérifier la présence d'un schéma Zod et son application avant accès Prisma.
    - Consigner Findings dans `notes/axe-log.md`.
    - _Design : Méthode de revue par axe > Logique applicative_
    - _Requirements : 6.2_

  - [x] 7.5 Auditer la gestion d'erreur dans les routes API (`try/catch`, propagation)
    - Vérifier que chaque route gère ses erreurs et renvoie des codes HTTP cohérents, sans fuite de détails techniques.
    - Consigner Findings dans `notes/axe-log.md`.
    - _Design : Méthode de revue par axe > Logique applicative_
    - _Requirements : 2.1_

  - [x] 7.6 Auditer les side-effects (`useEffect`) et leur justification
    - Repérer les `useEffect` qui devraient être dérivés, gérés côté serveur ou intégrés à un Server Component.
    - Consigner Findings dans `notes/axe-log.md`.
    - _Design : Méthode de revue par axe > Logique applicative_
    - _Requirements : 2.1_

- [x] 8. Phase 3 — Revue Axe BDD (Base de données)
  - [x] 8.1 Confronter le schéma Prisma à ses usages effectifs
    - À partir de l'inventaire 3.3 et des recherches dans le code, lister modèles, champs, relations non utilisés, et inversement.
    - Consigner Findings dans `notes/axe-bdd.md` au format `F-BDD-NNN`.
    - _Design : Méthode de revue par axe > BDD_
    - _Requirements : 2.2, 7.1_

  - [x] 8.2 Auditer les index (`@@index`, `@unique`) sur champs filtrés/joints/triés
    - Pour chaque modèle, identifier les champs présents dans `where`, `orderBy`, `include` sans index correspondant.
    - Consigner Findings dans `notes/axe-bdd.md` (Severity_Medium minimum si l'usage est avéré).
    - _Design : Méthode de revue par axe > BDD_
    - _Requirements : 7.4_

  - [x] 8.3 Auditer les relations et cascades (`onDelete`/`onUpdate`)
    - Vérifier la cohérence des cascades par rapport aux flux métier et la sécurité des suppressions.
    - Consigner Findings dans `notes/axe-bdd.md`.
    - _Design : Méthode de revue par axe > BDD_
    - _Requirements : 2.2_

  - [x] 8.4 Auditer la cohérence entre `prisma/migrations/` et le schéma courant
    - Vérifier qu'aucun champ ou modèle du schéma n'est absent de l'historique de migrations, et inversement.
    - Consigner Findings dans `notes/axe-bdd.md`.
    - _Design : Méthode de revue par axe > BDD_
    - _Requirements : 7.3_

  - [x] 8.5 Auditer les requêtes potentiellement N+1 ou les balayages complets
    - Repérer `findMany` sans `take`, `findUnique`/`findFirst` exécutés en boucle, absence de `select`/`include` ciblé.
    - Consigner Findings dans `notes/axe-bdd.md` (Severity_Medium minimum, conformément à Property 7).
    - _Design : Méthode de revue par axe > BDD_
    - _Requirements : 7.2_

  - [x] 8.6 Auditer les usages de SQL brut (`$queryRaw`, `$executeRaw`)
    - Repérer toute utilisation et vérifier que les entrées sont paramétrées et validées (pas de concaténation directe d'entrée utilisateur).
    - Consigner Findings dans `notes/axe-bdd.md` (Severity_High si interpolation non sûre).
    - _Design : Méthode de revue par axe > BDD_
    - _Requirements : 7.5_

- [x] 9. Phase 3 — Revue Axe INF (Vercel / Infra)
  - [x] 9.1 Auditer `vercel.json` (functions, regions, headers, rewrites)
    - Vérifier la cohérence des `regions`, `memory`, `maxDuration` par rapport aux usages.
    - Consigner Findings dans `notes/axe-inf.md` au format `F-INF-NNN`.
    - _Design : Méthode de revue par axe > Vercel/Infra_
    - _Requirements : 2.5_

  - [x] 9.2 Auditer chaque cron par rapport à son endpoint cible et au `CRON_SECRET`
    - À partir de l'inventaire 3.6, vérifier l'existence de chaque route cible, sa méthode HTTP et la présence d'un contrôle d'authentification (`CRON_SECRET`, header Vercel).
    - Tout cron sans secret ni authentification → Finding `F-INF-NNN` ou `F-SEC-NNN` Severity_High (cf. Property 7).
    - Consigner dans `notes/axe-inf.md`.
    - _Design : Méthode de revue par axe > Vercel/Infra_
    - _Requirements : 8.1, 8.2_

  - [x] 9.3 Auditer les variables d'environnement vs `.env.example`
    - À partir de l'inventaire 3.5, lister chaque variable référencée dans le code mais absente du fichier d'exemple.
    - Consigner Findings dans `notes/axe-inf.md`.
    - _Design : Méthode de revue par axe > Vercel/Infra_
    - _Requirements : 8.3_

  - [x] 9.4 Auditer `next.config.*` et sa cohérence avec Vercel
    - Vérifier `images.domains`, `experimental`, `headers`, `rewrites`, `redirects`.
    - Consigner Findings dans `notes/axe-inf.md`.
    - _Design : Méthode de revue par axe > Vercel/Infra_
    - _Requirements : 2.5_

  - [x] 9.5 Auditer logs et monitoring (`console.error` sur chemins critiques)
    - Vérifier la présence d'une journalisation des erreurs sur routes API, server actions et cron handlers.
    - Consigner Findings dans `notes/axe-inf.md`.
    - _Design : Méthode de revue par axe > Vercel/Infra_
    - _Requirements : 2.1_

- [x] 10. Phase 3 — Revue Axe MOB (Mobile / Capacitor)
  - [x] 10.1 Auditer `capacitor.config.{ts,json}` (`appId`, `appName`, `webDir`, `server.url`)
    - Vérifier la cohérence dev/prod du `server.url` et l'absence d'URL de dev en production.
    - Consigner Findings dans `notes/axe-mob.md` au format `F-MOB-NNN`.
    - _Design : Méthode de revue par axe > Mobile/Capacitor_
    - _Requirements : 2.5, 8.4_

  - [x] 10.2 Auditer `AndroidManifest.xml` (permissions, `applicationId`)
    - Vérifier que chaque permission déclarée correspond à une fonctionnalité réelle, et que `applicationId` est aligné avec `capacitor.config`.
    - Consigner Findings dans `notes/axe-mob.md`.
    - _Design : Méthode de revue par axe > Mobile/Capacitor_
    - _Requirements : 8.4_

  - [x] 10.3 Auditer plugins déclarés vs plugins utilisés
    - À partir de l'inventaire 3.4, signaler tout plugin importé mais non installé/déclaré, ou inversement.
    - Consigner Findings dans `notes/axe-mob.md`.
    - _Design : Méthode de revue par axe > Mobile/Capacitor_
    - _Requirements : 8.5_

  - [x] 10.4 Auditer FCM (`google-services.json` présent, gestion serveur du token)
    - Vérifier la présence du fichier (sans en exposer le contenu) et la chaîne d'enregistrement/refresh du token (client → API → Prisma).
    - Consigner Findings dans `notes/axe-mob.md`.
    - _Design : Méthode de revue par axe > Mobile/Capacitor_
    - _Requirements : 8.4_

  - [x] 10.5 Auditer la conformité du build APK à `BUILD_APK.md` (audit visuel)
    - Lire `BUILD_APK.md` et vérifier la cohérence avec `android/app/build.gradle` ; vérifier qu'aucun keystore n'est commité dans le dépôt git par erreur (lecture du `.gitignore` et de `git ls-files`).
    - Consigner Findings dans `notes/axe-mob.md`.
    - _Design : Méthode de revue par axe > Mobile/Capacitor_
    - _Requirements : 1.1, 2.5_

- [x] 11. Phase 3 — Revue Axe SEC (Sécurité)
  - [x] 11.1 Auditer la configuration NextAuth (stratégies, durée, rotation)
    - Lire la configuration NextAuth (providers, callbacks, session) et vérifier la cohérence avec la stratégie attendue.
    - Consigner Findings dans `notes/axe-sec.md` au format `F-SEC-NNN`.
    - _Design : Méthode de revue par axe > Sécurité_
    - _Requirements : 6.1_

  - [x] 11.2 Auditer l'ownership par route API
    - Pour chaque route de l'inventaire 3.1, vérifier (i) auth NextAuth et (ii) vérification d'appartenance (workspace, owner, membership).
    - Toute fuite de données entre utilisateurs ou workspaces → Finding `F-SEC-NNN` Severity_High (Property 7).
    - Toute route sans auth + ownership → Finding `F-SEC-NNN` (Property 8).
    - Consigner dans `notes/axe-sec.md`.
    - _Design : Méthode de revue par axe > Sécurité ; Correctness Properties > Property 7, Property 8_
    - _Requirements : 6.1, 6.5_

  - [x] 11.3 Auditer le rate limiting Upstash sur routes sensibles
    - Vérifier la présence d'un rate limit sur `/api/auth/*`, envois e-mail (Resend), envoi push, opérations destructives.
    - Consigner Findings dans `notes/axe-sec.md`.
    - _Design : Méthode de revue par axe > Sécurité_
    - _Requirements : 6.4_

  - [x] 11.4 Auditer secrets côté client (`NEXT_PUBLIC_*`)
    - Rechercher toutes les variables `NEXT_PUBLIC_*` et vérifier qu'aucune ne contient de secret métier (clé Resend, Firebase Server Key, jeton Vercel, etc.).
    - Consigner Findings dans `notes/axe-sec.md` (Severity_High si un secret est exposé).
    - _Design : Méthode de revue par axe > Sécurité_
    - _Requirements : 6.3_

  - [x] 11.5 Auditer les en-têtes de sécurité (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
    - Vérifier `next.config.*` et `vercel.json` pour la déclaration des headers.
    - Consigner Findings dans `notes/axe-sec.md`.
    - _Design : Méthode de revue par axe > Sécurité_
    - _Requirements : 6.6_

  - [x] 11.6 Auditer les cookies de session (`httpOnly`, `secure`, `sameSite`)
    - Vérifier la configuration NextAuth et toute autre émission de cookie.
    - Consigner Findings dans `notes/axe-sec.md`.
    - _Design : Méthode de revue par axe > Sécurité_
    - _Requirements : 6.6_

  - [x] 11.7 Auditer la configuration CORS
    - Vérifier l'absence de `Access-Control-Allow-Origin: *` sur routes authentifiées.
    - Consigner Findings dans `notes/axe-sec.md`.
    - _Design : Méthode de revue par axe > Sécurité_
    - _Requirements : 6.6_

- [x] 12. Phase 3 — Revue Axe PRF (Performance)
  - [x] 12.1 Auditer la taille du bundle et les imports lourds
    - Inspecter le log de build (2.1) pour la taille des bundles, repérer imports lourds non tree-shakés (icônes, lodash, moment, etc.).
    - Consigner Findings dans `notes/axe-prf.md` au format `F-PRF-NNN`.
    - _Design : Méthode de revue par axe > Performance_
    - _Requirements : 2.1_

  - [x] 12.2 Auditer la répartition Server/Client Components
    - Repérer les `"use client"` excessifs alourdissant le bundle.
    - Consigner Findings dans `notes/axe-prf.md`.
    - _Design : Méthode de revue par axe > Performance_
    - _Requirements : 2.1_

  - [x] 12.3 Auditer les images (`next/image`, dimensionnement, formats modernes)
    - Vérifier l'absence de `<img>` HTML brut sur images critiques et la définition des `width`/`height`.
    - Consigner Findings dans `notes/axe-prf.md`.
    - _Design : Méthode de revue par axe > Performance_
    - _Requirements : 2.1_

  - [x] 12.4 Auditer les requêtes BDD (pagination, `select` ciblé, absence de `findMany` sans `take`)
    - Croiser avec l'audit BDD 8.5. Tout `findMany` sans pagination sur table à fort cardinalité → Finding `F-PRF-NNN` ou `F-BDD-NNN` (Property 7).
    - Consigner Findings dans `notes/axe-prf.md`.
    - _Design : Méthode de revue par axe > Performance ; Correctness Properties > Property 7_
    - _Requirements : 7.2_

  - [x] 12.5 Auditer le caching SWR (clés stables, `dedupingInterval`, revalidations)
    - Croiser avec l'inventaire 3.2 pour repérer les clés instables ou revalidations excessives.
    - Consigner Findings dans `notes/axe-prf.md`.
    - _Design : Méthode de revue par axe > Performance_
    - _Requirements : 2.1_

- [x] 13. Checkpoint revue par axe
  - Vérifier que les huit notes par axe (`axe-ui.md` … `axe-prf.md`) existent et que chaque Finding respecte le schéma normalisé. Confirmer qu'aucune écriture n'a eu lieu hors `.kiro/specs/full-app-audit/`. Consulter l'utilisateur en cas de doute sur une sévérité.

- [x] 14. Phase 4 — Consolidation des Findings
  - [x] 14.1 Dédupliquer les Findings au sein de chaque axe
    - Identifier les doublons exacts ou quasi-exacts et fusionner descriptions/preuves.
    - _Design : Architecture > Workflow d'exécution > Phase 4_
    - _Requirements : 5.5_

  - [x] 14.2 Fusionner les Findings à cause commune (cross-axe)
    - Repérer les Findings de différents axes pointant la même cause racine et les marquer pour fusion en tâche unique de remédiation (cf. 15.6).
    - _Design : Architecture > Workflow d'exécution > Phase 4_
    - _Requirements : 5.5_

  - [x] 14.3 Attribuer la sévérité finale à chaque Finding
    - Appliquer les définitions Severity_High / Severity_Medium du design.
    - Vérifier les contraintes minimales (Property 7) : fuite cross-utilisateur ou cron sans secret → High ; N+1/scan complet → Medium minimum.
    - _Design : Data Models > Définitions de sévérité ; Correctness Properties > Property 7_
    - _Requirements : 3.2, 3.3, 6.5, 7.2, 8.2_

  - [x] 14.4 Calculer le tableau de synthèse sévérité × axe
    - Compter par axe et par sévérité ; vérifier que la somme totale égale le nombre total de Findings (Property 4).
    - Consigner le tableau dans `notes/synthese.md`.
    - _Design : Components and Interfaces > Synthèse exécutive ; Correctness Properties > Property 4_
    - _Requirements : 4.2_

- [x] 15. Phase 5 — Rédaction des livrables
  - [x] 15.1 Rédiger la « Synthèse exécutive » dans `audit-report.md`
    - 3 à 6 puces de risques majeurs + tableau croisé sévérité × axe issu de 14.4.
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 1_
    - _Requirements : 4.2_

  - [x] 15.2 Rédiger « Périmètre et méthode »
    - Sources lues, commandes exécutées (renvoi vers annexe A), périmètre exclu, référence aux CLAUDE_Rules respectées.
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 2_
    - _Requirements : 4.4_

  - [x] 15.3 Rédiger les sections par axe dans l'ordre `UI, UX, LOG, BDD, INF, MOB, SEC, PRF`
    - Pour chaque axe : paragraphe de contexte ≤ 5 lignes, Findings triés par sévérité décroissante puis par identifiant croissant (Property 5).
    - Si aucun Finding pour un axe, indiquer explicitement « Aucun Finding pour cet axe » avec note de confiance.
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 3 ; Correctness Properties > Property 5_
    - _Requirements : 4.3_

  - [x] 15.4 Rédiger « Limites et hypothèses »
    - Lister éléments à confirmer via External_Console, hypothèses retenues, dates et nature des accès consoles utilisés.
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 4_
    - _Requirements : 3.5, 4.5, 4.6_

  - [x] 15.5 Rédiger les annexes A à E dans `audit-report.md`
    - Insérer le contenu des notes : annexe A (commandes), B (build log), C (routes API), D (hooks SWR), E (modèles Prisma).
    - _Design : Components and Interfaces > Structure de `audit-report.md` > 5_
    - _Requirements : 4.4_

  - [x] 15.6 Dériver le `tasks.md` de remédiation depuis l'`audit-report.md`
    - Créer un nouveau fichier `tasks-remediation.md` (puis discuter avec l'utilisateur pour le renommage final) contenant les tâches groupées par axe dans l'ordre `SEC > BDD > INF > LOG > MOB > UX > UI > PRF`, triées par sévérité maximale décroissante puis par identifiant Finding croissant (Property 5).
    - Chaque tâche référence au moins un Finding ; les Findings à cause commune sont fusionnés en une seule tâche (Property 6).
    - Aucune tâche destructive ; les tâches sont des consignes pour un workflow d'exécution ultérieur.
    - _Design : Components and Interfaces > Format du Task_Plan ; Correctness Properties > Property 5, Property 6_
    - _Requirements : 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 16. Phase 6 — Vérification finale (Correctness Properties)
  - [x] 16.1 Vérifier Property 1 — Format normalisé des Findings
    - Pour chaque Finding du rapport, confirmer la présence des huit champs requis non vides et la conformité du `id` au pattern `F-{AXIS}-{NNN}` ; vérifier que `evidence` cite `path:line`, `path#symbole` ou une commande.
    - _Design : Correctness Properties > Property 1_
    - _Requirements : 3.1, 3.4_

  - [x] 16.2 Vérifier Property 2 — Sévérité dans l'ensemble fermé
    - Confirmer que chaque sévérité ∈ {High, Medium} et qu'aucun constat inférieur à Medium n'apparaît.
    - _Design : Correctness Properties > Property 2_
    - _Requirements : 3.2, 3.3_

  - [x] 16.3 Vérifier Property 3 — Couverture exhaustive
    - Pour chaque élément des inventaires (routes API, hooks SWR, modèles Prisma, plugins Capacitor, env vars), confirmer soit la conformité aux règles d'axe, soit l'existence d'un Finding référençant l'élément dans `evidence`.
    - _Design : Correctness Properties > Property 3_
    - _Requirements : 2.1, 2.3, 2.4, 6.1, 7.1, 7.4, 7.5, 8.3, 8.5_

  - [x] 16.4 Vérifier Property 4 — Cohérence du tableau de synthèse
    - Recalculer les totaux par axe et par sévérité et confirmer que la somme du tableau de la « Synthèse exécutive » égale le nombre total de Findings dans les sections par axe.
    - _Design : Correctness Properties > Property 4_
    - _Requirements : 4.2_

  - [x] 16.5 Vérifier Property 5 — Tri par sévérité
    - Pour chaque section d'axe du rapport, confirmer le tri `High` avant `Medium`. Pour `tasks-remediation.md`, confirmer le tri par sévérité maximale décroissante au sein de chaque axe.
    - _Design : Correctness Properties > Property 5_
    - _Requirements : 4.3, 5.2_

  - [x] 16.6 Vérifier Property 6 — Traçabilité bijective Findings ↔ Tâches
    - Confirmer que chaque tâche référence au moins un Finding existant et que chaque Finding est référencé par au moins une tâche ; vérifier la contiguïté des tâches au sein d'un axe.
    - _Design : Correctness Properties > Property 6_
    - _Requirements : 5.1, 5.3, 5.4_

  - [x] 16.7 Vérifier Property 7 — Sévérité minimale pour classes critiques
    - Confirmer que toute fuite de données entre utilisateurs/workspaces ou cron sans secret est `High` ; toute requête N+1 ou balayage complet est `High` ou `Medium`.
    - _Design : Correctness Properties > Property 7_
    - _Requirements : 6.5, 7.2, 8.2_

  - [x] 16.8 Vérifier Property 8 — Auth et ownership pour chaque route API
    - Pour chaque route inventoriée en 3.1, confirmer soit la présence d'auth NextAuth + ownership, soit l'existence d'un Finding d'axe `SEC` référençant la route dans `evidence`.
    - _Design : Correctness Properties > Property 8_
    - _Requirements : 6.1_

## Notes

- Chaque tâche est strictement non destructive : lecture de fichiers, exécution de commandes inspectives (`git status`, `npm run build`), prise de notes dans `.kiro/specs/full-app-audit/`. Aucune modification du code applicatif, du schéma Prisma, des migrations ou de la base de données.
- Les notes intermédiaires (par axe, inventaires, annexes) sont consolidées dans `audit-report.md` à la phase 5 puis peuvent être supprimées si l'utilisateur le souhaite.
- Les vérifications de propriétés (16.1 à 16.8) sont obligatoires : elles garantissent la qualité formelle du livrable et ne sont pas des tests optionnels.
- Si une zone nécessite une External_Console (Vercel, Neon) sans accès fourni, elle est marquée « à confirmer via console » dans la section « Limites et hypothèses » sans bloquer la production du rapport.
- En cas d'échec du Build_Check, l'audit continue avec les inventaires conformément à la stratégie d'erreur du design (le constat devient un Finding `F-LOG-NNN` Severity_High).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 4, "tasks": ["5.1", "6.1", "7.1", "8.1", "9.1", "10.1", "11.1", "12.1"] },
    { "id": 5, "tasks": ["5.2", "6.2", "7.2", "8.2", "9.2", "10.2", "11.2", "12.2"] },
    { "id": 6, "tasks": ["5.3", "6.3", "7.3", "8.3", "9.3", "10.3", "11.3", "12.3"] },
    { "id": 7, "tasks": ["5.4", "6.4", "7.4", "8.4", "9.4", "10.4", "11.4", "12.4"] },
    { "id": 8, "tasks": ["5.5", "6.5", "7.5", "8.5", "9.5", "10.5", "11.5", "12.5"] },
    { "id": 9, "tasks": ["7.6", "8.6", "11.6"] },
    { "id": 10, "tasks": ["11.7"] },
    { "id": 11, "tasks": ["14.1"] },
    { "id": 12, "tasks": ["14.2"] },
    { "id": 13, "tasks": ["14.3"] },
    { "id": 14, "tasks": ["14.4"] },
    { "id": 15, "tasks": ["15.1"] },
    { "id": 16, "tasks": ["15.2"] },
    { "id": 17, "tasks": ["15.3"] },
    { "id": 18, "tasks": ["15.4"] },
    { "id": 19, "tasks": ["15.5"] },
    { "id": 20, "tasks": ["15.6"] },
    { "id": 21, "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8"] }
  ]
}
```
