# 02 — Analyse des erreurs et avertissements du Build_Check (Phase 1, tâche 2.2)

## Objet

Cette note dépouille le log du `Build_Check` capturé en tâche 2.1 (annexe B, `notes/annexe-B-build-log.md`) afin d'identifier :

1. les **erreurs bloquantes** (compilation TypeScript, ESLint en mode bloquant, dépendances manquantes, modules non résolus) ;
2. les **avertissements non bloquants** à recouper avec les axes pertinents en phase 3.

Référence : `design.md` > Error Handling > « Échec du Build_Check » et `requirements.md` clauses 2.6 et 3.1. Le format de Finding utilisé en cas de besoin est `F-XXX-NNN` tel que défini dans `design.md` > Data Models.

## Conclusion synthétique

- **Build_Check exit code** : `0` (succès), durée ≈ 19 s, stderr vide (cf. annexe B § Métadonnées d'exécution).
- **Erreurs de compilation TypeScript** : aucune. La phase « Running TypeScript … Finished TypeScript in 8.9s » s'est terminée sans message d'erreur, et aucun diagnostic `TSxxxx` n'apparaît dans la stdout.
- **Erreurs / warnings ESLint bloquants** : aucun. Le pipeline `next build` (Next.js 16.2.6 / Turbopack) n'a produit aucune ligne contenant `error`, `warn`, `warning` ou `failed` (vérifié sur l'intégralité de la stdout reproduite en annexe B).
- **Erreurs de compilation Turbopack** : aucune. Sortie : « ✓ Compiled successfully in 7.6s ».
- **Dépendances manquantes / modules non résolus** : aucun message du type `Module not found`, `Cannot find module`, `Can't resolve` n'a été émis.
- **Génération de pages statiques** : `77/77` pages générées en 292 ms, sans erreur.

> **Décision Finding** : le `Build_Check` n'ayant **pas** échoué, **aucun Finding `F-LOG-NNN` Severity_High** n'est créé au titre de `design.md` > Error Handling > « Échec du Build_Check ». Cette section de la stratégie d'erreur ne s'applique pas. Les observations non bloquantes ci-dessous sont consignées comme **pointeurs** pour les axes LOG et PRF, et non comme Findings formels (les Findings seront produits, le cas échéant, dans les notes par axe `axe-log.md` et `axe-prf.md` lors de la phase 3).

## Erreurs / warnings bloquants

- Aucun.

## Avertissements et observations non bloquants à recouper en phase 3

> Format : chaque puce est tagguée `[AXE]` pour faciliter le recoupement avec les notes par axe. La preuve renvoie systématiquement à l'annexe B (la stdout y est reproduite intégralement).

- `[LOG] [PRF]` **Mention « Experiments (use with caution) »** — la stdout liste deux expérimentaux Next.js déclarés dans `next.config.mjs` : `optimizePackageImports` et `scrollRestoration` (« ✓ scrollRestoration »). Il s'agit d'un **message d'information standard** de Next.js indiquant que des flags expérimentaux sont actifs ; ce n'est pas un warning de compilation. À recouper en tâche 9.4 (Axe INF — `next.config.*`), 12.1/12.2 (Axe PRF — bundle, tree-shaking) et, accessoirement, 7.1 (Axe LOG — structure App Router). Preuve : `notes/annexe-B-build-log.md` § « Stdout complète » lignes « Experiments (use with caution) » + « ✓ scrollRestoration ».
- `[PRF]` **Bundler Turbopack pour le build** — bannière « Next.js 16.2.6 (Turbopack) ». Le build de production utilise Turbopack ; le comportement de bundling et de tree-shaking peut différer de celui de Webpack et doit être pris en compte lors de l'audit du bundle (taille, imports lourds, code splitting). À recouper en tâches 12.1 et 12.2. Preuve : annexe B § « Stdout complète » première ligne du bandeau Next.js.
- `[LOG]` **Environnements chargés** — la stdout affiche « Environments: .env.local, .env », confirmant que les deux fichiers sont effectivement chargés au build. À croiser avec l'inventaire env (tâche 3.5) et avec l'axe SEC (tâche 11.4 — pas de secret dans `NEXT_PUBLIC_*`). Aucun Finding LOG ici, simple pointeur d'inventaire.
- `[LOG] [PRF]` **Pages statiques effectives** — seules `/_not-found`, `/login`, `/privacy`, `/register`, `/terms` sont marquées `○` (Static) dans la table de routes du log. Le reste, dont 94 routes API et toutes les pages applicatives, est marqué `ƒ` (Dynamic, server-rendered on demand). Pertinent pour l'axe PRF (12.1) si l'on souhaite identifier des pages additionnelles candidates au prerendering, et pour l'axe LOG (7.1) sur la cohérence App Router. Preuve : annexe B § « Stdout complète » section « Route (app) » et légende « ○ (Static) / ƒ (Dynamic) ».
- `[LOG]` **Pas de signal de désactivation TypeScript ou ESLint dans le build** — la sortie du build n'indique ni `Skipping linting` ni `Skipping validation of types`. Cela suggère que `next build` exécute bien la vérification TypeScript ; à confronter en tâche 9.4 (cohérence `next.config.*`). Aucun Finding ici.

## Limites de l'analyse

- L'analyse repose **strictement** sur la stdout consignée en annexe B (4 711 octets, non tronquée). Aucun outil tiers (eslint, tsc en mode strict, audit de bundle) n'a été ré-exécuté pour cette tâche, conformément au mode lecture seule et au principe « Build_Check exécuté une seule fois » (cf. `design.md` > Correctness Pre-work).
- Si le pipeline `next build` masquait silencieusement certains warnings TypeScript ou ESLint via une configuration (`typescript.ignoreBuildErrors`, `eslint.ignoreDuringBuilds`), cela ne pourrait être détecté ici. Ce point est explicitement renvoyé à la tâche 9.4 (audit de `next.config.*`) qui statuera sur la présence ou non de ces flags.

## Références

- Annexe B (log complet) : `notes/annexe-B-build-log.md`.
- Journal des commandes : `notes/annexe-A-commandes.md` (entrée correspondant à `npm run build`).
- Stratégie d'erreur appliquée : `design.md` > Error Handling > « Échec du Build_Check ».
- Schéma de Finding (non utilisé ici, build OK) : `design.md` > Data Models > Finding `F-XXX-NNN`.
- Clauses requirements couvertes : 2.6 (Build_Check exécuté et consigné), 3.1 (format normalisé des constats — non instancié faute d'erreur).
