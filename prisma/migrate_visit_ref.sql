-- migrate_visit_ref.sql
-- Replaces inspections_summary.id (UUID) with visit_ref (String @id)
-- inspection_id in proformas_and_invoices now stores visit_ref strings
-- SQLite FK constraints require table recreation (ALTER TABLE ADD CONSTRAINT does NOT work)

PRAGMA foreign_keys = OFF;

-- ============================================================
-- Phase A: Recreate inspections_summary with visit_ref as PK
-- ============================================================

CREATE TABLE "inspections_summary_new" (
    "visit_ref" TEXT NOT NULL PRIMARY KEY,
    "project_name" TEXT,
    "employee_no" TEXT,
    "coordinator_name" TEXT,
    "vendor_location" TEXT,
    "inspection_start_date" DATETIME,
    "inspection_end_date" DATETIME,
    "report_no" TEXT,
    "work_duration" REAL,
    "ot_duration" REAL,
    "duration_tag" TEXT DEFAULT 'Hrs.',
    "travel_routing" TEXT,
    "mileage" REAL,
    "expenses_amount" REAL,
    "ts_filename" TEXT,
    "ts_file_verified" INTEGER DEFAULT 0,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "inspections_summary_new"
SELECT
    COALESCE("report_no", "id") AS "visit_ref",
    "project_name",
    "employee_no",
    "coordinator_name",
    "vendor_location",
    "inspection_start_date",
    "inspection_end_date",
    "report_no",
    "work_duration",
    "ot_duration",
    "duration_tag",
    "travel_routing",
    "mileage",
    "expenses_amount",
    "ts_filename",
    "ts_file_verified",
    "created_at",
    "updated_at"
FROM "inspections_summary";

DROP TABLE "inspections_summary";
ALTER TABLE "inspections_summary_new" RENAME TO "inspections_summary";

-- ============================================================
-- Phase B: Recreate proformas_and_invoices with FK embedded in CREATE TABLE
-- (ALTER TABLE ADD CONSTRAINT does NOT work for FKs in SQLite)
-- ============================================================

CREATE TABLE "proformas_and_invoices_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspection_id" TEXT,
    "itp_po_id" TEXT,
    "po_no" TEXT,
    "sr_so_no" TEXT,
    "proforma_inv_no" TEXT,
    "proforma_inv_date" DATETIME,
    "sap_sales_order" TEXT,
    "invoice_no" TEXT,
    "invoice_date" DATETIME,
    "conso_invoice_no" TEXT,
    "conso_filename" TEXT,
    "total_amount" REAL,
    "credit_memo_no" TEXT,
    "credit_memo_amount" REAL,
    "payment_status" TEXT DEFAULT 'Pending',
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("inspection_id") REFERENCES "inspections_summary" ("visit_ref") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "proformas_and_invoices_new"
SELECT * FROM "proformas_and_invoices";

DROP TABLE "proformas_and_invoices";
ALTER TABLE "proformas_and_invoices_new" RENAME TO "proformas_and_invoices";

-- Recreate indexes
CREATE INDEX IF NOT EXISTS "proformas_and_invoices_inspection_id_idx" ON "proformas_and_invoices" ("inspection_id");
CREATE INDEX IF NOT EXISTS "proformas_and_invoices_payment_status_idx" ON "proformas_and_invoices" ("payment_status");
CREATE INDEX IF NOT EXISTS "proformas_and_invoices_proforma_inv_no_idx" ON "proformas_and_invoices" ("proforma_inv_no");
CREATE INDEX IF NOT EXISTS "proformas_and_invoices_invoice_no_idx" ON "proformas_and_invoices" ("invoice_no");
CREATE INDEX IF NOT EXISTS "proformas_and_invoices_itp_po_id_idx" ON "proformas_and_invoices" ("itp_po_id");
CREATE INDEX IF NOT EXISTS "proformas_and_invoices_po_no_idx" ON "proformas_and_invoices" ("po_no");
CREATE INDEX IF NOT EXISTS "proformas_and_invoices_sr_so_no_idx" ON "proformas_and_invoices" ("sr_so_no");

PRAGMA foreign_keys = ON;
