# Unified Multi-Client Invoice & SES Tracking Schema

This PostgreSQL schema is designed to automate invoice tracking, Service Entry Sheets (SES), and project tracking across multiple client workflows (QELNG, QP/WWI, and Call-Offs). It is optimized for modern full-stack business automation and perfectly suited for a Supabase backend.

## 1. `clients_and_contracts` (Multi-Client & Budgets)
This table acts as the multi-tenant foundation, allowing the system to handle different currencies and track the overall budget depletion for Call-Off agreements.

* `id`: UUID, Primary Key
* `client_name`: VARCHAR (e.g., 'QELNG', 'QP', 'Qatar Shell', 'Dolphin')
* `contract_no`: VARCHAR (The overarching Contract or Framework Agreement)
* `currency`: VARCHAR(3) (e.g., 'USD', 'QAR', 'EUR')
* `original_contract_value`: DECIMAL(15,2)
* `running_balance`: DECIMAL(15,2) *(To track depletion based on Call-off sheets)*
* `created_at`: TIMESTAMPTZ DEFAULT NOW()
* `updated_at`: TIMESTAMPTZ DEFAULT NOW()

## 2. `projects`
Links specific Purchase Orders (POs) and ITP codes to the master contract.

* `id`: UUID, Primary Key
* `contract_id`: UUID, Foreign Key -> `clients_and_contracts.id`
* `project_name`: VARCHAR 
* `po_no`: VARCHAR (Purchase Order for this specific project/call-off)
* `itp_code`: VARCHAR 
* `focal_name`: VARCHAR 
* `focal_email`: VARCHAR
* `active_status`: BOOLEAN DEFAULT TRUE

## 3. `inspectors`
Maintains a unified list of personnel across all projects.

* `id`: UUID, Primary Key
* `full_name`: VARCHAR 
* `job_title`: VARCHAR 
* `base_location`: VARCHAR 

## 4. `inspections_summary` (Core Transactional Table)
Merges the standard 'Daily/Hourly' billing logic with the 'Travel/Mileage' logic found in Call-Off agreements.

* `id`: UUID, Primary Key
* `project_id`: UUID, Foreign Key -> `projects.id`
* `inspector_id`: UUID, Foreign Key -> `inspectors.id`
* `coordinator_name`: VARCHAR *(From Call-Off sheet)*
* `vendor_location`: VARCHAR *(e.g., SNY VALVE - CHINA)*
* `inspection_start_date`: DATE
* `inspection_end_date`: DATE
* `report_no`: VARCHAR 
* `work_duration`: DECIMAL(10,2) *(Number of Days or Hours)*
* `ot_duration`: DECIMAL(10,2)
* `duration_tag`: VARCHAR ('Hrs.', 'Days')
* `travel_routing`: VARCHAR *(e.g., 'Jianhu /Yancheng / Jianhu')*
* `mileage`: DECIMAL(10,2)
* `expenses_amount`: DECIMAL(10,2) *(Covers Accommodation / Other)*
* `ts_filename`: VARCHAR *(Timesheet filename)*
* `ts_file_verified`: BOOLEAN DEFAULT FALSE *(To mimic 'File Found' checks)*

## 5. `proformas_and_invoices` 
Supports standard 1-to-1 invoicing as well as consolidated invoicing (grouping max 5 inspections) and credit memos.

* `id`: UUID, Primary Key
* `inspection_id`: UUID, Foreign Key -> `inspections_summary.id`
* `proforma_inv_no`: VARCHAR 
* `proforma_inv_date`: DATE
* `sap_sales_order`: VARCHAR 
* `invoice_no`: VARCHAR 
* `invoice_date`: DATE
* `conso_invoice_no`: VARCHAR *(For grouping max 5 invoices under one Call-Off Conso)*
* `conso_filename`: VARCHAR
* `total_amount`: DECIMAL(15,2)
* `credit_memo_no`: VARCHAR
* `credit_memo_amount`: DECIMAL(15,2)
* `payment_status`: VARCHAR ('Pending', 'Paid', 'With Term')

## 6. `ses_records` (Service Entry Sheets)
Tracks the approval layer between proforma generation and final commercial invoicing.

* `id`: UUID, Primary Key
* `proforma_inv_id`: UUID, Foreign Key -> `proformas_and_invoices.id`
* `ses_no`: VARCHAR 
* `ses_date`: DATE
* `ses_value`: DECIMAL(15,2)
* `sap_work_order`: VARCHAR
* `status`: VARCHAR ('Pending', 'Received', 'Returned for Revision')

---

### Implementation Notes for ORM (Prisma/Sequelize/Supabase)
* **Foreign Keys:** Ensure cascading deletes are carefully managed. Deleting a `Contract` should probably restrict or cascade to `Projects`, but deleting an `Inspector` should be restricted if they have existing `inspections_summary` records.
* **Consolidation Logic:** When generating a consolidated invoice, query the `inspections_summary` where `proformas_and_invoices.conso_invoice_no` matches the target batch.
* **Row-Level Security (RLS):** If exposing this via an API, use RLS policies to restrict viewing of specific `clients_and_contracts` based on user roles.
