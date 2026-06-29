# Requirements Document

## Introduction

Cette spec définit le périmètre, la qualité et le livrable d'un audit complet en lecture seule de l'application Done (clone ClickUp). L'audit couvre 360° l'UI, l'UX, la logique applicative, la base de données Postgres/Prisma, l'infrastructure Vercel, la couche mobile Capacitor/Android, la sécurité et la performance. Le livrable est un rapport d'audit structuré accompagné d'un plan de tâches priorisé. Aucune correction de code, aucune migration et aucune opération destructive ne sont effectuées pendant l'audit. Toute action s'inscrit dans les règles anti-destruction définies dans `CLAUDE.md`.

## Glossary

- **Audit_System**: L'agent d'audit qui produit le rapport et le plan de tâches, en mode lecture seule sur le dépôt et les consoles externes.
- **Repository**: Le dépôt local du projet Done à `/Users/zerbib/clickup-clone`, incluant le code Next.js, le schéma Prisma, les configurations Vercel et le projet Android Capacitor.
- **Audit_Report**: Le document Markdown final produit par l'`Audit_System`, contenant les constats, leur sévérité et leur axe.
- **Task_Plan**: Le plan d'actions priorisé déduit du rapport, livré dans `tasks.md` et destiné à un workflow d'exécution séparé.
- **Finding**: Une observation individuelle de l'audit, classée par axe et par sévérité, accompagnée de preuves (chemin de fichier, ligne, extrait).
- **Severity_High**: Sévérité indiquant un risque de sécurité, de perte de données, de panne en production ou un blocage utilisateur majeur.
- **Severity_Medium**: Sévérité indiquant une dette technique significative, un défaut de robustesse, un problème UX notable ou une dégradation de performance mesurable.
- **Audit_Axis**: L'un des axes d'analyse: UI, UX, Logique_Applicative, Base_De_Donnees, Vercel_Infra, Mobile_Capacitor, Securite, Performance.
- **CLAUDE_Rules**: Les conventions et règles anti-destruction définies dans `CLAUDE.md` à la racine du dépôt.
- **External_Console**: Les consoles tierces (Vercel, Neon) auxquelles l'utilisateur peut fournir un accès en lecture seule ou des captures d'écran sur demande.
- **Build_Check**: L'exécution non destructive de `next build` (ou équivalent disponible dans `package.json`) pour vérifier la compilation TypeScript et Next.js.

## Requirements

### Requirement 1 — Mode lecture seule et conformité aux règles du dépôt

**User Story:** En tant que mainteneur, je veux que l'audit soit strictement non destructif, afin de ne risquer aucune altération du code, de la base de données ou de l'infrastructure pendant la phase d'analyse.

#### Acceptance Criteria

1. THE Audit_System SHALL effectuer toutes ses opérations en lecture seule sur le Repository, sans modifier, créer ni supprimer de fichier source applicatif en dehors du dossier `.kiro/specs/full-app-audit/`.
2. IF une opération envisagée modifie le schéma Prisma, exécute une migration, ou écrit dans la base de données, THEN THE Audit_System SHALL s'abstenir de l'exécuter et consigner l'élément concerné comme Finding à investiguer.
3. THE Audit_System SHALL respecter les CLAUDE_Rules, en particulier les règles anti-destruction relatives à Postgres/Neon et aux conventions du projet.
4. WHERE une commande shell est nécessaire, THE Audit_System SHALL se limiter à des commandes de lecture, d'inspection ou de compilation non destructive, à l'exclusion de toute commande de déploiement, de suppression ou de migration.
5. IF une information requiert l'accès à une External_Console, THEN THE Audit_System SHALL demander explicitement à l'utilisateur l'accès en lecture seule ou des captures d'écran avant d'inclure des conclusions sur cette zone.

### Requirement 2 — Couverture exhaustive des axes d'audit

**User Story:** En tant que mainteneur, je veux une vue 360° équilibrée, afin d'identifier les risques majeurs sur tous les plans de l'application.

#### Acceptance Criteria

1. THE Audit_System SHALL couvrir chacun des Audit_Axis suivants dans l'Audit_Report: UI, UX, Logique_Applicative, Base_De_Donnees, Vercel_Infra, Mobile_Capacitor, Securite, Performance.
2. THE Audit_System SHALL lire l'intégralité du schéma Prisma (`prisma/schema.prisma`) et la liste des migrations présentes dans `prisma/migrations/`.
3. THE Audit_System SHALL parcourir chaque dossier de route API sous `src/app/api/` et documenter, par route, l'authentification, la validation des entrées et le périmètre des données retournées.
4. THE Audit_System SHALL inspecter chaque hook SWR sous `src/hooks/` ou équivalent, et vérifier la présence du contrôle `res.ok` dans les fetchers, conformément aux CLAUDE_Rules.
5. THE Audit_System SHALL examiner la configuration Vercel (`vercel.json`, crons, variables d'environnement référencées dans le code) et la configuration Capacitor (`capacitor.config.*`, `android/`).
6. THE Audit_System SHALL exécuter un Build_Check non destructif et consigner son résultat (succès, avertissements, erreurs) dans l'Audit_Report.
7. WHERE l'audit identifie un domaine fonctionnel non couvert par l'inventaire fourni, THE Audit_System SHALL l'ajouter à l'Audit_Report avec une note de découverte.

### Requirement 3 — Format normalisé des constats

**User Story:** En tant que mainteneur, je veux que chaque constat soit traçable et actionnable, afin de pouvoir prioriser et corriger sans ambiguïté.

#### Acceptance Criteria

1. THE Audit_System SHALL formater chaque Finding avec les champs suivants: identifiant unique, titre, axe, sévérité, description, preuve (chemin de fichier et plage de lignes ou commande exécutée), impact, recommandation.
2. THE Audit_System SHALL classer chaque Finding selon une sévérité parmi Severity_High ou Severity_Medium.
3. THE Audit_System SHALL exclure de l'Audit_Report tout constat de sévérité inférieure à Severity_Medium, y compris les remarques cosmétiques, stylistiques ou de simple préférence.
4. WHEN une preuve cite un fichier du Repository, THE Audit_System SHALL fournir le chemin relatif depuis la racine du dépôt et au moins un numéro de ligne ou un nom de symbole identifiable.
5. IF un Finding ne peut être confirmé sans accès à une External_Console, THEN THE Audit_System SHALL le marquer explicitement comme « à confirmer via console » et lister la donnée manquante.
6. THE Audit_System SHALL rédiger l'ensemble du contenu textuel de l'Audit_Report en français.

### Requirement 4 — Structure du rapport d'audit

**User Story:** En tant que mainteneur, je veux un rapport structuré et navigable, afin de retrouver rapidement les conclusions par axe et par sévérité.

#### Acceptance Criteria

1. THE Audit_System SHALL produire l'Audit_Report sous la forme d'un fichier Markdown unique livré dans le dossier `.kiro/specs/full-app-audit/`.
2. THE Audit_Report SHALL contenir une section « Synthèse exécutive » résumant en moins d'une page les risques principaux et le nombre de Findings par sévérité et par axe.
3. THE Audit_Report SHALL contenir une section dédiée par Audit_Axis, listant les Findings de cet axe triés par sévérité décroissante.
4. THE Audit_Report SHALL contenir une section « Périmètre et méthode » décrivant les sources lues, les commandes exécutées et les zones non couvertes faute d'accès.
5. THE Audit_Report SHALL contenir une section « Limites et hypothèses » listant les éléments non vérifiables sans External_Console et les hypothèses retenues.
6. WHERE des éléments sont issus d'une External_Console fournie par l'utilisateur, THE Audit_Report SHALL en indiquer la source et la date de consultation.

### Requirement 5 — Plan de tâches priorisé

**User Story:** En tant que mainteneur, je veux un plan de remédiation priorisé, afin de pouvoir attaquer les actions de correction dans un ordre cohérent.

#### Acceptance Criteria

1. THE Audit_System SHALL produire un Task_Plan dérivé directement des Findings de l'Audit_Report.
2. THE Task_Plan SHALL ordonner les tâches par priorité décroissante, en plaçant les éléments Severity_High avant les éléments Severity_Medium.
3. THE Task_Plan SHALL associer chaque tâche à au moins un identifiant de Finding correspondant dans l'Audit_Report.
4. THE Task_Plan SHALL regrouper les tâches par Audit_Axis pour faciliter la répartition du travail.
5. WHERE plusieurs Findings ont une cause commune, THE Audit_System SHALL les fusionner en une tâche unique référant tous les Findings concernés.
6. THE Task_Plan SHALL exclure toute tâche d'exécution ou de correction depuis la phase d'audit elle-même; les corrections relèvent d'un workflow d'exécution ultérieur.

### Requirement 6 — Vérifications de sécurité et de robustesse

**User Story:** En tant que mainteneur, je veux que l'audit identifie en priorité les risques de sécurité et de perte de données, afin de protéger les utilisateurs et l'intégrité de la base.

#### Acceptance Criteria

1. THE Audit_System SHALL vérifier, pour chaque route sous `src/app/api/`, la présence d'un contrôle d'authentification NextAuth et d'une vérification de l'appartenance de la ressource à l'utilisateur courant.
2. THE Audit_System SHALL identifier les routes acceptant des paramètres dynamiques et vérifier la validation et l'échappement des entrées avant accès à Prisma.
3. THE Audit_System SHALL repérer les usages de secrets (`.env`, `.env.local`, clés Firebase, jetons Resend, identifiants Google) qui seraient exposés au client ou commités dans le dépôt.
4. THE Audit_System SHALL vérifier la configuration de la limitation de débit Upstash sur les routes sensibles (authentification, envoi d'e-mails, push) et signaler toute absence.
5. IF une route renvoie des données appartenant à un autre utilisateur ou workspace que celui de l'appelant, THEN THE Audit_System SHALL classer le Finding en Severity_High.
6. THE Audit_System SHALL vérifier la configuration des cookies de session, des en-têtes de sécurité et de la configuration CORS définie côté Next.js et Vercel.

### Requirement 7 — Vérifications base de données et migrations

**User Story:** En tant que mainteneur, je veux m'assurer que la base reste cohérente avec le code, afin d'éviter dérives de schéma et requêtes coûteuses en production.

#### Acceptance Criteria

1. THE Audit_System SHALL comparer les modèles déclarés dans `prisma/schema.prisma` avec les usages effectifs dans le code applicatif et signaler les modèles, champs ou relations non utilisés.
2. THE Audit_System SHALL identifier les requêtes Prisma susceptibles de provoquer un problème N+1 ou un balayage complet, et les classer au minimum en Severity_Medium.
3. THE Audit_System SHALL vérifier la cohérence entre les migrations présentes dans `prisma/migrations/` et le schéma courant.
4. IF des index recommandés sont absents pour des champs fréquemment filtrés ou triés, THEN THE Audit_System SHALL produire un Finding listant les champs concernés et l'impact estimé.
5. THE Audit_System SHALL signaler tout usage de requêtes SQL brutes (`$queryRaw`, `$executeRaw`) et vérifier qu'aucune entrée non validée n'y est interpolée.

### Requirement 8 — Vérifications Vercel, crons et mobile Capacitor

**User Story:** En tant que mainteneur, je veux comprendre l'état de l'infrastructure et de la couche mobile, afin d'éviter des incidents de production et des régressions sur Android.

#### Acceptance Criteria

1. THE Audit_System SHALL inventorier les jobs cron définis dans `vercel.json` ou via l'API Vercel et vérifier l'existence et l'authentification de chaque endpoint cible.
2. IF un endpoint cron n'est protégé par aucun secret ni en-tête d'authentification, THEN THE Audit_System SHALL produire un Finding Severity_High.
3. THE Audit_System SHALL inventorier les variables d'environnement référencées dans le code et signaler celles absentes de `.env.example`.
4. THE Audit_System SHALL inspecter la configuration Capacitor et le manifeste Android (`AndroidManifest.xml`) pour vérifier la cohérence des permissions, du `applicationId` et de la configuration des notifications push Firebase.
5. WHERE une fonctionnalité dépend d'un plugin Capacitor non installé ou non déclaré, THE Audit_System SHALL produire un Finding correspondant.
6. WHEN l'utilisateur fournit un accès en lecture seule à la console Vercel ou Neon, THE Audit_System SHALL consulter cet accès et croiser les configurations observées avec celles déclarées dans le Repository.
