-- Migration: itp_pos.inspector_id now stores inspectors.employee_no (String) instead of UUID
-- A. Backfill inspector_id with employee_no values using the existing UUID FK
UPDATE "itp_pos"
SET "inspector_id" = (
    SELECT "employee_no" FROM "inspectors"
    WHERE "inspectors"."id" = "itp_pos"."inspector_id"
)
WHERE "inspector_id" IS NOT NULL;

-- B. Verify no orphans
SELECT COUNT(*) AS orphan_count FROM "itp_pos" ip
WHERE ip."inspector_id" IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM "inspectors" i WHERE i."employee_no" = ip."inspector_id");
-- If orphan_count > 0, STOP and investigate

-- C. Recreate itp_pos with embedded FK (SQLite requires FK in CREATE TABLE)
-- First backup the table data
CREATE TABLE "itp_pos_backup" AS SELECT * FROM "itp_pos";

DROP TABLE "itp_pos";

CREATE TABLE "itp_pos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT,
    "itp_po_number" TEXT,
    "po_no" TEXT UNIQUE,
    "location" TEXT,
    "inspector_id" TEXT,
    "expiry_date" DATETIME,
    "designation" TEXT,
    "rates" REAL,
    "original_budget" REAL DEFAULT 0,
    "total_invoiced" REAL DEFAULT 0,
    "status" TEXT DEFAULT 'Active',
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("inspector_id") REFERENCES "inspectors" ("employee_no") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "itp_pos" SELECT * FROM "itp_pos_backup";
DROP TABLE "itp_pos_backup";