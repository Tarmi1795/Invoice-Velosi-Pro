# Invoice Velosi Pro — Development Progress

## Current Goal

Building and improving the **Invoice Velosi Pro** Next.js application — a project management/inspection invoice system using Prisma + SQLite. Goals across this conversation include: implementing AI-powered Excel column mapping, adding batch selection/actions to data tables, database performance optimization (indexing), creating ACSI helper scripts, form validation & auto-date improvements, and restructuring the Work Orders monitoring page with separate ITP/PO, PO, and SR/SO sections.

## Instructions

1. Use the existing 3-tier AI mapping system (training data → rules-based fuzzy matching → LLM fallback)
2. Keep the app running during migrations — use `prisma db push --accept-data-loss` instead of `migrate dev`
3. For batch upload: fail entire batch on validation error, report which rows failed
4. For client-side form validation: POST-only validation (not PUT) for backward compatibility with existing records
5. For Work Orders: accordion auto-close behavior (opening one closes others)
6. For N/A mapping in batch upload: skip unmapped columns instead of erroring
7. Do NOT modify Prisma schema for the Work Orders task unless confirmed necessary
8. SES and Invoice forms should link to ITP/PO records via dropdown selects
9. 1:1 PO relationship: each PO maps to exactly one ITP and one SR/SO — enforced via `@unique` on `po_no` fields
10. Windows PowerShell uses `;` instead of `&&` for command chaining

## Discoveries

- The AI column mapping system was **already fully implemented** before this conversation — `aiColumnMapper.ts`, `minimaxClient.ts`, `batch-ai-map/route.ts`, `EnhancedBatchUploadModal`, `MappingReviewModal` all existed
- Only the SES page was using `EnhancedBatchUploadModal` — all other pages used old `BatchUploadModal`
- Database is SQLite at `prisma/dev.db` with `DATABASE_URL="file:./dev.db"`
- Turbopack caching causes phantom `ReferenceError` for `FileText` / `Trash2` — fixed by clearing `.next` folder and adding missing imports
- `sqlite3` npm package's native `backup()` method has a callback invocation bug in version 3.52.0 — used `fs.copyFileSync` instead for reliable backups
- `FormModal.tsx` is a pure UI container — form state is owned by each page component (no centralized auto-date possible)
- The settings page (`/settings`) already had full workflow preset management built out
- `DataTable.tsx` already had `overflow-x-auto` — no changes needed for horizontal scroll
- `EnhancedBatchUploadModal.expectedHeaders` prop was the key to making batch uploads work for new entity types
- `ses_records.itp_po_id` is a plain FK column (no Prisma `@relation` defined), so Prisma `include` cannot be used for joining — must use a manual two-query approach with `Promise.all` and a `Map`
- `itp_pos` has `project_id` FK to `projects`, so project_name must be fetched via `include: { projects: { select: { project_name: true } } }`
- ESLint shows many pre-existing `any` type warnings and unused variable warnings across the codebase — these were not introduced by recent changes
- Seed script correctly skips when existing presets are found (database had 1 preset from prior work)

## Accomplished

### Completed:
1. ✅ Replaced `BatchUploadModal` with `EnhancedBatchUploadModal` on 5 pages: Projects, Inspectors, Inspections, Invoices, ITP/PO Monitoring — each with correct `entityType` prop
2. ✅ Fixed `aiColumnMapper.ts` duplicate key error (removed duplicate `inspector_id`/`project_id` entries)
3. ✅ Fixed `/api/monitoring/batch/route.ts` payload mismatch (`rows` vs `items`)
4. ✅ Enhanced `DataTable.tsx`: checkboxes per row, row highlighting, `batchActions` prop, selectable default `true`, rows-per-page selector (10/50/100)
5. ✅ Added batch actions to all 5 pages: Delete (Projects, Inspectors, Invoices, Monitoring, ITP/PO), Create Proforma + Delete (Inspections)
6. ✅ Added `Trash2` import to `monitoring/page.tsx`
7. ✅ Database performance indexes: added `@@index` to 8 models across all FK columns, status fields, date fields, search fields via `prisma db push --accept-data-loss`
8. ✅ Created `src/lib/dateUtils.ts` with `todayISO()` utility
9. ✅ Server-side validation on POST routes: Inspections (`inspector_id`), Invoices (`inspection_id`), SES (`proforma_inv_id`), Monitoring (`inspector_id`)
10. ✅ Batch fail-fast validation with `{ error, failedRows: [{ row, reason }]` response
11. ✅ Client-side form validation with `formError` state + red banner on all forms
12. ✅ Auto-date on form load: `inspection_start_date`, `proforma_inv_date`, `ses_date`, `expiryDate` pre-filled with today
13. ✅ Inline yellow warning on inspections form when `inspector_id` not set
14. ✅ Created `acsi_db.js` — singleton Prisma wrapper with all entity helpers, tested and working
15. ✅ Created `acsi_backup.js` — uses `fs.copyFileSync`, verified creating 212KB backups
16. ✅ Batch upload N/A mapping: "N/A — Skip this field" option in `MappingReviewModal`, skips unmapped columns in transform
17. ✅ Added `po_no @unique` to `itp_pos`, new `po_records` model, new `service_orders` model
18. ✅ Added `itp_po_id`, `po_no @unique`, `sr_so_no` to `proformas_and_invoices`
19. ✅ Added `itp_po_id` to `ses_records`
20. ✅ Created all API routes: `/api/po_records` (GET, POST, `/[id]`, DELETE, `/batch`), `/api/service_orders` (GET, POST, `/[id]`, DELETE, `/batch`)
21. ✅ Work Orders page: completely rebuilt monitoring page with 3 accordion sections (ITP/PO, PO Records, SR/SO) — auto-close, stats cards, DataTable per section, batch upload per section
22. ✅ Invoice form: added `itp_po_id` select, `po_no` select, `sr_so_no` free-text input
23. ✅ SES form: added `itp_po_id` select linked to ITP/PO list
24. ✅ Client form: added `preset_id` dropdown, `WORKFLOW PRESET` column in table, fetches from `/api/presets`
25. ✅ Settings page already had full preset management (confirmed, no changes needed)
26. ✅ Seed default presets script (`prisma/seed.ts`) with 2 default presets + `npm run db:seed` command in `package.json`
27. ✅ SES table: added `ITP/PO NO` and `ITP PROJECT` columns by manually joining `itp_pos` → `projects` data via `Promise.all` + Map approach (since `itp_po_id` is not a Prisma relation)
28. ✅ Fixed `openEditModal` in `clients/page.tsx` to explicitly cast `preset_id` to `String` to prevent relation object leaking into form state
29. ✅ Build passes with all changes

### In Progress:
- None — all tasks complete

### Remaining (from task file, not yet addressed):
- None — all remaining tasks from the task file have been addressed

## Relevant Files / Directories

**AI Mapping System:**
- `src/lib/aiColumnMapper.ts` — 3-tier mapping logic
- `src/lib/minimaxClient.ts` — MiniMax API client
- `src/app/api/batch-ai-map/route.ts` — AI mapping API (POST analyze + PUT save training)
- `src/components/EnhancedBatchUploadModal.tsx` — batch upload modal with AI flow
- `src/components/MappingReviewModal.tsx` — mapping review UI with N/A option added

**DataTable:**
- `src/components/DataTable.tsx` — enhanced with batch actions, checkboxes, row highlighting, rows-per-page

**API Routes (new/modified):**
- `src/app/api/inspections/route.ts` — added `inspector_id` validation
- `src/app/api/inspections/batch/route.ts` — batch fail-fast validation
- `src/app/api/ses/route.ts` — added `proforma_inv_id` validation, manual ITP/PO join for linked info
- `src/app/api/ses/batch/route.ts` — batch fail-fast validation
- `src/app/api/invoices/route.ts` — added `inspection_id` validation
- `src/app/api/invoices/batch/route.ts` — batch fail-fast validation
- `src/app/api/monitoring/route.ts` — added `inspector_id` validation, rebuilt as Work Orders accordion
- `src/app/api/po_records/route.ts` — new CRUD route
- `src/app/api/po_records/[id]/route.ts` — new single-record route
- `src/app/api/po_records/batch/route.ts` — new batch route
- `src/app/api/service_orders/route.ts` — new CRUD route
- `src/app/api/service_orders/[id]/route.ts` — new single-record route
- `src/app/api/service_orders/batch/route.ts` — new batch route

**Pages (forms with validation + auto-date):**
- `src/app/inspections/page.tsx` — auto-date on `inspection_start_date`, inspector warning, validation
- `src/app/invoices/page.tsx` — auto-date on `proforma_inv_date`, `itp_po_id`/`po_no`/`sr_so_no` fields
- `src/app/ses/page.tsx` — auto-date on `ses_date`, `itp_po_id` field, ITP/PO NO + ITP PROJECT columns
- `src/app/monitoring/page.tsx` — auto-date on `expiryDate`, fully rebuilt as Work Orders accordion page
- `src/app/clients/page.tsx` — `preset_id` dropdown, WORKFLOW PRESET column, fixed `openEditModal`

**Database:**
- `prisma/schema.prisma` — all models with indexes, `po_records`, `service_orders`, `itp_pos.po_no @unique`, `proformas_and_invoices.po_no @unique`, `itp_po_id`/`po_no`/`sr_so_no` on invoices, `itp_po_id` on ses
- `prisma/dev.db` — SQLite database
- `prisma/seed.ts` — seed script with 2 default presets
- `.env` — `DATABASE_URL="file:./dev.db"`

**Utilities:**
- `src/lib/dateUtils.ts` — `todayISO()` utility

**ACSI Scripts:**
- `acsi_db.js` — Prisma wrapper for ACSI agent
- `acsi_backup.js` — SQLite backup to OneDrive

**Settings:**
- `src/app/settings/page.tsx` — already had full preset management (confirmed, no changes needed)

**Root scripts:**
- `package.json` — added `db:seed` script: `npx tsx prisma/seed.ts`
