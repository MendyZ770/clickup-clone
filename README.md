# Done

Done est un outil de gestion de projets et de finances pensé pour les développeurs web.
Kanban, sprints, time tracking, calendrier, gestion budgétaire — tout ce qu'il faut pour livrer vos projets clients dans les temps.

## Stack technique

- **Next.js 16** (App Router) + **TypeScript**
- **Prisma 5** + **PostgreSQL** (Neon serverless)
- **NextAuth.js** (JWT + Credentials)
- **Tailwind CSS** + **shadcn/ui**
- **Capacitor 8** pour le wrapper Android
- **Vercel** (hébergement)

## Scripts npm utiles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lancer le serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` | Linter ESLint |
| `npm run cap:sync` | Sync les assets web vers Android |
| `npm run cap:open` | Ouvrir Android Studio |
| `npm run android:build` | Compiler l'APK debug |
| `npm run android:release` | Compiler l'APK release |

## Mobile Android

Voir [BUILD_APK.md](BUILD_APK.md) pour la procédure complète de compilation et de signature de l'APK.

Pour la stratégie de publication sur le Play Store (Capacitor vs TWA), voir [docs/PLAY_STORE_STRATEGY.md](docs/PLAY_STORE_STRATEGY.md).

## Sécurité

Voir [docs/SECURITY.md](docs/SECURITY.md) pour les notes sur les dépendances et les en-têtes de sécurité.

## Développement

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
# Copier .env.example vers .env.local et remplir les valeurs

# 3. Lancer le serveur
npm run dev

# 4. Ouvrir http://localhost:3000
```
