-- Migration: Replace UUID FKs with readable strings in inspections_summary
-- A. Add new columns
ALTER TABLE "inspections_summary" ADD COLUMN "employee_no" TEXT;
ALTER TABLE "inspections_summary" ADD COLUMN "project_name" TEXT;

-- B. Backfill employee_no: look up inspectors.employee_no using existing inspector_id UUID
UPDATE "inspections_summary"
SET "employee_no" = (
  SELECT "employee_no" FROM "inspectors"
  WHERE "inspectors"."id" = "inspections_summary"."inspector_id"
)
WHERE "inspector_id" IS NOT NULL;

-- C. Backfill project_name: look up projects.project_name using existing project_id UUID
UPDATE "inspections_summary"
SET "project_name" = (
  SELECT "project_name" FROM "projects"
  WHERE "projects"."id" = "inspections_summary"."project_id"
)
WHERE "project_id" IS NOT NULL;

-- D. Drop old columns
ALTER TABLE "inspections_summary" DROP COLUMN "inspector_id";
ALTER TABLE "inspections_summary" DROP COLUMN "project_id";