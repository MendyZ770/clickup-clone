-- Un seul minuteur actif (endTime IS NULL) par utilisateur.
-- À appliquer AVANT de déployer le code qui traduit la violation d'unicité
-- (Prisma P2002) en HTTP 409 dans /api/time-entries/timer.
--
-- Vérifier au préalable l'absence de doublons :
--   SELECT "userId", COUNT(*)
--   FROM "TimeEntry"
--   WHERE "endTime" IS NULL
--   GROUP BY "userId"
--   HAVING COUNT(*) > 1;
-- Si des doublons existent, les clôturer manuellement (endTime = now()) avant
-- de créer l'index, sinon la création échouera.

CREATE UNIQUE INDEX IF NOT EXISTS "TimeEntry_userId_single_active_idx"
  ON "TimeEntry" ("userId")
  WHERE "endTime" IS NULL;
