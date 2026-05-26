# Notes de sécurité — Done

## Dépendances et risques connus

### Next-Auth v4 (vulnérabilité uuid)

Le projet utilise actuellement **next-auth v4** (`^4.24.14`). Cette version dépend de la librairie `uuid` qui présente une vulnérabilité modérée (ReDoS sur certaines entrées non-validées).

**Pourquoi ne pas migrer vers next-auth v5 ?**
- next-auth v5 (Auth.js) est une réécriture majeure avec une API complètement différente.
- La migration nécessite de refondre l'ensemble du système d'authentification (adapters, providers, callbacks, JWT strategy).
- Le risque est jugé acceptable à court terme car l'application n'expose pas l'API `uuid` directement aux utilisateurs et les entrées sont contrôlées via Zod.

**Actions recommandées :**
- Surveiller les releases de next-auth pour un patch v4 corrigeant la dépendance uuid.
- Planifier la migration v5 dans un sprint dédié (2–3 jours de travail).

## Headers de sécurité

Les headers suivants sont configurés dans `next.config.mjs` :

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` adapté à Next.js + Vercel + Google Fonts.

## Variables sensibles à rotate régulièrement

- `NEXTAUTH_SECRET` : clé de signature JWT.
- `GOOGLE_CLIENT_SECRET` : secret OAuth Google Calendar.
- Mot de passe base de données Neon.
- Certificat de signing Android (keystore + alias password).

## Signalement de vulnérabilités

Contact : support@done.app
