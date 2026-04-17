-- Migrate projects.contract_id (UUID) → contract_no (String FK)
-- Backup: prisma/dev.db.backup
-- Run: sqlite3 prisma/dev.db < prisma/migrate_contract_no.sql

-- Step A: Add new column
ALTER TABLE "projects" ADD COLUMN "contract_no" TEXT;

-- Step B: Backfill existing rows — look up contract_no from clients_and_contracts using the existing contract_id UUID
UPDATE "projects"
SET "contract_no" = (
  SELECT "contract_no" FROM "clients_and_contracts"
  WHERE "clients_and_contracts"."id" = "projects"."contract_id"
)
WHERE "contract_id" IS NOT NULL;

-- Step C: Add FK constraint
ALTER TABLE "projects" ADD CONSTRAINT "projects_contract_no_fkey"
  FOREIGN KEY ("contract_no") REFERENCES "clients_and_contracts" ("contract_no")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Step D: Drop old column (safe — all non-null contract_ids have been backfilled)
ALTER TABLE "projects" DROP COLUMN "contract_id";
