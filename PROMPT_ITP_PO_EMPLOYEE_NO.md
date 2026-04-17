# Feature: Link `itp_pos` to `inspectors` via `employee_no` instead of UUID

## Goal

Replace `itp_pos.inspector_id` (UUID FK to `inspectors.id`) with `itp_pos.inspector_id` pointing to `inspectors.employee_no` (readable string FK).

**Why:** Both `inspectors` and `itp_pos` now have `employee_no`. Use it as the FK — batch uploads and UI can write/read `employee_no` directly, no UUID lookup needed.

---

## Steps

### 1. Backup database first
- Copy `prisma/dev.db` to `prisma/dev.db.backup`

### 2. Update Prisma schema (`prisma/schema.prisma`)

In `model itp_pos`:
- Keep `inspector_id` column name — it will now store `employee_no` string values instead of UUID
- Update the relation:

```prisma
model itp_pos {
  ...
  inspector_id   String?   // now stores inspectors.employee_no (String), not UUID
  ...
  inspectors     inspectors? @relation(fields: [inspector_id], references: [employee_no])
}
```

In `model inspectors`:
- `employee_no` already exists and is `@unique` ✅

### 3. Migration SQL (SQLite — save as `prisma/migrate_itp_employee_no.sql`)

```sql
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
```

Run with: `sqlite3 prisma/dev.db < prisma/migrate_itp_employee_no.sql`

### 4. Update UI: ITP/PO Page

In the ITP/PO list/table component:
- Display `inspector_id` as `employee_no` (already a string now)
- When selecting an inspector in the form/dropdown: show `employee_no — full_name` (e.g., "EMP001 — John Doe")
- Value sent to API: `employee_no` string

### 5. Update UI: Inspectors Page

- The `employee_no` field is already displayed on the Inspectors page
- No major changes needed here — just ensure `employee_no` is visible in the table

### 6. Update batch upload for ITP/PO

In `src/app/api/itp_pos/batch/route.ts`:
- Write `inspector_id` directly using `employee_no` from Excel
- No UUID lookup needed

### 7. Update all code referencing `itp_pos.inspector_id`

Search and replace:
- Any file using `itp_pos.inspector_id` — values are now `employee_no` strings
- API routes for `itp_pos`
- Components rendering ITP/PO table

### 8. Verify

- `SELECT inspector_id, employee_no FROM itp_pos LIMIT 5` — inspector_id now stores employee_no strings
- `SELECT employee_no, full_name FROM inspectors` — confirm all employee_no values are valid
- Orphan count = 0 confirmed
- Batch upload with employee_no works

---

## Constraints
- Always backup before schema changes
- Test on dev.db first
- Do NOT run `npx prisma db push` — only `npx prisma generate` after schema update
- `employee_no` in `inspectors` must remain `@unique`
