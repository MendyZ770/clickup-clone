-- PRÉPARÉ, NON APPLIQUÉ.
-- Ce fichier ne doit être exécuté qu'EN MÊME TEMPS que la bascule
-- `Float` -> `Decimal @db.Decimal(14,2)` dans prisma/schema.prisma et le
-- balayage des appels financiers (le client Prisma actuel refuserait un
-- `numeric` sur un champ typé `float`).
-- Appliquer avec : ./scripts/apply-schema-change.sh scripts/migrations/2026-10-21-money-decimal.sql <DATABASE_URL>
--
-- Contrôles avant application (valeurs hors plage numeric(14,2)) :
--   SELECT id, "currentValue", "targetValue" FROM "GoalTarget"
--     WHERE abs("currentValue") >= 1000000000000 OR abs("targetValue") >= 1000000000000;
--   SELECT id, "amount" FROM "BudgetTransaction" WHERE abs("amount") >= 1000000000000;
--   SELECT id, "balance" FROM "FinanceAccount" WHERE abs("balance") >= 1000000000000;
--   SELECT id, "amount" FROM "FinanceTransaction" WHERE abs("amount") >= 1000000000000;
--   SELECT id, "targetAmount", "currentAmount" FROM "FinanceGoal"
--     WHERE abs("targetAmount") >= 1000000000000 OR abs("currentAmount") >= 1000000000000;
BEGIN;

ALTER TABLE "GoalTarget"
  ALTER COLUMN "currentValue" TYPE numeric(14,2) USING round("currentValue"::numeric, 2),
  ALTER COLUMN "targetValue"  TYPE numeric(14,2) USING round("targetValue"::numeric, 2);

ALTER TABLE "Budget"             ALTER COLUMN "amount"        TYPE numeric(14,2) USING round("amount"::numeric, 2);
ALTER TABLE "BudgetTransaction"  ALTER COLUMN "amount"        TYPE numeric(14,2) USING round("amount"::numeric, 2);
ALTER TABLE "BudgetTemplate"     ALTER COLUMN "amount"        TYPE numeric(14,2) USING round("amount"::numeric, 2);
ALTER TABLE "BudgetAlert"        ALTER COLUMN "threshold"     TYPE numeric(14,2) USING round("threshold"::numeric, 2);

ALTER TABLE "FinanceAccount"     ALTER COLUMN "balance"       TYPE numeric(14,2) USING round("balance"::numeric, 2);
ALTER TABLE "FinanceTransaction" ALTER COLUMN "amount"        TYPE numeric(14,2) USING round("amount"::numeric, 2);
ALTER TABLE "FinanceGoal"        ALTER COLUMN "targetAmount"  TYPE numeric(14,2) USING round("targetAmount"::numeric, 2);
ALTER TABLE "FinanceGoal"        ALTER COLUMN "currentAmount" TYPE numeric(14,2) USING round("currentAmount"::numeric, 2);
ALTER TABLE "FinanceGoalContribution" ALTER COLUMN "amount"   TYPE numeric(14,2) USING round("amount"::numeric, 2);

CREATE INDEX IF NOT EXISTS "FinanceAccount_ebAccountId_idx"
  ON "FinanceAccount" ("ebAccountId");

CREATE INDEX IF NOT EXISTS "FinanceTransaction_targetAccountId_idx"
  ON "FinanceTransaction" ("targetAccountId");

CREATE INDEX IF NOT EXISTS "FinanceTransaction_accountId_date_idx"
  ON "FinanceTransaction" ("accountId", "date");

DROP INDEX IF EXISTS "FinanceTransaction_accountId_idx";

COMMIT;

-- Contrôle après application :
--   SELECT table_name, column_name, data_type, numeric_precision, numeric_scale
--   FROM information_schema.columns
--   WHERE table_name IN ('GoalTarget','Budget','BudgetTransaction','BudgetTemplate','BudgetAlert',
--                        'FinanceAccount','FinanceTransaction','FinanceGoal','FinanceGoalContribution')
--     AND column_name IN ('currentValue','targetValue','amount','threshold','balance','targetAmount','currentAmount')
--   ORDER BY table_name, column_name;
