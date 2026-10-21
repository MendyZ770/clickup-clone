-- Fiabilisation des crons : rappels idempotents et récurrences indexées.
-- À appliquer avant de déployer le code qui lit Reminder.lastNotifiedAt
-- et le worker /api/cron/recurring-tasks.

ALTER TABLE "Reminder" ADD COLUMN IF NOT EXISTS "lastNotifiedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Reminder_completed_remindAt_idx"
  ON "Reminder" ("completed", "remindAt");

CREATE INDEX IF NOT EXISTS "TaskRecurrence_nextDueDate_idx"
  ON "TaskRecurrence" ("nextDueDate");

-- Contrôle : aucun rappel non traité ne doit être marqué complété sans envoi.
SELECT COUNT(*) AS "rappels_non_completes_en_retard"
FROM "Reminder"
WHERE "completed" = false AND "remindAt" < NOW();
