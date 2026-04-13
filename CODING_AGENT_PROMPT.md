# Invoice Velosi Pro - Coding Agent Prompt

You are building a complete, production-ready full-stack invoice tracking application called "Invoice Velosi Pro".

## Project Location
Work in the current directory (do NOT leave this directory). This is a fresh Next.js project.

## Database Setup
PostgreSQL schema is provided in the project folder as `unified_invoice_schema.sql`.
1. Connect to PostgreSQL at `localhost:54322`, port `54322`, user `postgres`, password `postgres`
2. Create a new database: `CREATE DATABASE invoice_velosi_pro;`
3. Run the SQL file: `\i unified_invoice_schema.sql` (or use psql with -f flag)
4. Confirm all 6 tables and 3 views are created

Database connection string for Prisma:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/invoice_velosi_pro"
```

## Tech Stack
- Next.js 14 with App Router + TypeScript
- Prisma ORM
- Tailwind CSS for all styling
- Next.js API routes for backend
- `pg` library for raw SQL where Prisma doesn't fit

## Design System
- Background: #0f1117, Cards: #1a1d27, Border: #2d2f3d, Text: #e4e4e7, Muted: #6b7280
- Accent blue: #3b82f6
- Status colors: green=#22c55e (paid), yellow=#eab308 (sent/pending), red=#ef4444 (overdue)
- Font: Segoe UI (system)
- Dark theme, professional dashboard style
- Responsive tables with horizontal scroll

## Database Schema
Tables:
1. `clients_and_contracts` — id (uuid PK), client_name (varchar 100), contract_no (varchar 50), currency (varchar 3, default QAR), original_contract_value (decimal 15,2), running_balance (decimal 15,2), description (text), created_at (timestamptz), updated_at (timestamptz)
2. `projects` — id (uuid PK), contract_id (uuid FK→clients_and_contracts), project_name (varchar 200), po_no (varchar 50), itp_code (varchar 50), focal_name (varchar 100), focal_email (varchar 150), active_status (boolean, default TRUE), created_at, updated_at
3. `inspectors` — id (uuid PK), full_name (varchar 100), job_title (varchar 100), base_location (varchar 100), created_at, updated_at
4. `inspections_summary` — id (uuid PK), project_id (uuid FK→projects), inspector_id (uuid FK→inspectors), coordinator_name (varchar 100), vendor_location (varchar 200), inspection_start_date (date), inspection_end_date (date), report_no (varchar 50), work_duration (decimal 10,2), ot_duration (decimal 10,2), duration_tag (varchar 10, default 'Hrs.'), travel_routing (varchar 500), mileage (decimal 10,2), expenses_amount (decimal 15,2), ts_filename (varchar 255), ts_file_verified (boolean default FALSE), created_at, updated_at
5. `proformas_and_invoices` — id (uuid PK), inspection_id (uuid FK→inspections_summary), proforma_inv_no (varchar 50), proforma_inv_date (date), sap_sales_order (varchar 50), invoice_no (varchar 50), invoice_date (date), conso_invoice_no (varchar 50), conso_filename (varchar 255), total_amount (decimal 15,2), credit_memo_no (varchar 50), credit_memo_amount (decimal 15,2), payment_status (varchar 30, default 'Pending'), created_at, updated_at. payment_status check: (Pending, Paid, With Term, Cancelled)
6. `ses_records` — id (uuid PK), proforma_inv_id (uuid FK→proformas_and_invoices), ses_no (varchar 50), ses_date (date), ses_value (decimal 15,2), sap_work_order (varchar 50), status (varchar 30, default 'Pending'), created_at, updated_at. status check: (Pending, Received, Returned for Revision, Approved)

Views:
- `vw_budget_balances` — contract_id, client_name, contract_no, currency, original_contract_value, running_balance, total_invoiced, pct_depleted, remaining, budget_status (OK/WARNING/LOW BALANCE/OVER BUDGET)
- `vw_invoice_pipeline` — client_name, contract_no, project_name, po_no, report_no, vendor_location, inspection_start_date, proforma_inv_no, proforma_inv_date, sap_sales_order, invoice_no, invoice_date, total_amount, payment_status, conso_invoice_no, ses_no, ses_date, ses_value, ses_status
- `vw_conso_invoice_detail` — conso_invoice_no, client_name, contract_no, invoice_date, total_amount, payment_status, inspection_count, report_numbers

## Pages to Build
1. `/` — Dashboard: 4 stat cards (Total Clients, Active Projects, Pending Invoices, Total Revenue), recent invoices table, budget status alerts
2. `/clients` — CRUD for clients and contracts, show running_balance and depletion %
3. `/projects` — CRUD with contract FK dropdown, PO/ITP fields, active status toggle
4. `/inspectors` — CRUD for personnel, job title and base location
5. `/inspections` — CRUD with project and inspector dropdowns, ALL billing fields (work_duration, ot_duration, duration_tag, travel_routing, mileage, expenses_amount), ts_filename, ts_file_verified toggle
6. `/invoices` — CRUD linked to inspection, consolidated invoice grouping (conso_invoice_no), payment_status dropdown, credit memo fields
7. `/ses` — CRUD linked to proforma/invoice, SES status workflow (Pending/Received/Returned/Approved)
8. `/reports` — Tabbed: Budget Balances view, Invoice Pipeline view, Consolidated Invoice Detail view

## API Routes (Next.js App Router)
- `GET /api/clients` — list with search, pagination
- `POST /api/clients` — create
- `GET /api/clients/[id]` — get one
- `PUT /api/clients/[id]` — update
- `DELETE /api/clients/[id]` — delete
- Same pattern for: projects, inspectors, inspections, invoices, ses
- `/api/dashboard` — stats (total clients, active projects, pending invoices, total revenue)
- `/api/reports/budget-balances` — from vw_budget_balances
- `/api/reports/invoice-pipeline` — from vw_invoice_pipeline
- `/api/reports/conso-invoice-detail` — from vw_conso_invoice_detail

## Required Components
- `Sidebar.tsx` — navigation with icons, active state highlight, collapsible
- `StatCard.tsx` — reusable stat display (value, label, color)
- `DataTable.tsx` — reusable table: search input, pagination (prev/next, show total), sortable columns, horizontal scroll
- `FormModal.tsx` — modal form for create/edit
- `StatusBadge.tsx` — color-coded pill (Paid=green, Sent=yellow, Overdue=red, Pending=gray, etc.)
- `Select.tsx` — styled dropdown for all FK relationships
- `ConfirmDialog.tsx` — delete confirmation modal

## Form Validation
- All required fields validated
- Numeric fields > 0
- Valid dates
- Foreign key selects have placeholder "Select..."

## Critical Rules
- DO NOT run `prisma migrate` — use `npx prisma db pull` to sync schema
- Never delete or alter existing database data
- Every form must work end-to-end (submit → DB update → UI refresh)
- Proper error handling with user-friendly messages
- All API routes return proper JSON with correct HTTP status codes

## Steps
1. Initialize Next.js: `npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-git --yes`
2. Set up Prisma: create `prisma/schema.prisma` with the DATABASE_URL, run `npx prisma db pull`, then `npx prisma generate`
3. Install dependencies: `npm install pg @prisma/client`
4. Create API routes for all entities
5. Build all UI pages
6. Test everything works

## End Goal
Fully functional dark-themed web app with:
- Working navigation between all pages
- Full CRUD for all 6 entities
- Real data from PostgreSQL
- Professional invoice dashboard look
- Handles 500+ rows with pagination
- Ready for real invoice tracking workflow