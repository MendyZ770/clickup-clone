# Stratégie Play Store — Capacitor vs Trusted Web Activity (TWA)

Ce document présente les deux options pour publier **Done** sur le Google Play Store et leurs tradeoffs.

---

## Option A : Capacitor Wrapper (implémentation actuelle)

L'application est un conteneur Android natif (WebView) qui charge l'application web hébergée sur Vercel. Le projet utilise `@capacitor/android@8.3.4`.

### Avantages
- Push notifications natives via `@capacitor/push-notifications`.
- Accès facile aux APIs natives Android si besoin futur (capaciteurs, stockage local, etc.).
- Contrôle total sur le splash screen et l'intégration système.

### Inconvénients
- Risque de rejet Google Play si le wrapper ne fournit pas suffisamment de "fonctionnalités natives" (politique des WebViews).
- Taille de l'APK plus importante (embarque le runtime WebView + bridge Capacitor).
- Maintenance du projet Android (Gradle, SDK, permissions).

### Quand choisir cette option ?
- Si tu prévois d'ajouter des fonctionnalités natives (scan QR, accès fichier, etc.).
- Si les push notifications sont un critère majeur dès le lancement.

---

## Option B : Trusted Web Activity (TWA) via Bubblewrap

Une TWA affiche le PWA directement dans un onglet Chrome personnalisé, sans WebView embarqué. Le projet `@bubblewrap/cli` génère le wrapper.

### Avantages
- Alignement maximal avec les recommandations Google (moins de risque de rejet).
- APK très léger (le navigateur système fait le rendu).
- Mise à jour instantanée du contenu (le PWA est servi par le serveur).
- Le manifeste PWA (`public/manifest.json`) est respecté nativement.

### Inconvénients
- Pas d'accès direct aux APIs natives Android (pas de Capacitor plugins).
- Push notifications limitées : nécessite l'API Notification du web + Digital Asset Links pour la validation du domaine.
- Moins de contrôle sur le splash screen et les transitions.

### Quand choisir cette option ?
- Si l'application reste principalement web (gestion de projets/finances sans capteurs natifs).
- Si tu veux le chemin le plus direct vers la publication Play Store sans friction.

---

## Recommandation

**À court terme** : conserver Capacitor (option A) mais surveiller le retour de l'équipe de review Google. Simplifier la configuration (`allowNavigation` restreint, pas de `?v=5` en dur) réduit déjà les signaux de "wrapper non qualitatif".

**À moyen terme** : migrer vers une TWA via `@bubblewrap/cli` si un rejet survient ou si l'application n'a pas besoin de plugins natifs complexes.

## Références

- [Trusted Web Activity — Chrome Developers](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
