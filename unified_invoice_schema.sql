CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE clients_and_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(100),
    contract_no VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'QAR',
    original_contract_value DECIMAL(15,2),
    running_balance DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES clients_and_contracts(id),
    project_name VARCHAR(200),
    po_no VARCHAR(50),
    itp_code VARCHAR(50),
    focal_name VARCHAR(100),
    focal_email VARCHAR(150),
    active_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100),
    job_title VARCHAR(100),
    base_location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspections_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    inspector_id UUID REFERENCES inspectors(id),
    coordinator_name VARCHAR(100),
    vendor_location VARCHAR(200),
    inspection_start_date DATE,
    inspection_end_date DATE,
    report_no VARCHAR(50),
    work_duration DECIMAL(10,2),
    ot_duration DECIMAL(10,2),
    duration_tag VARCHAR(10) DEFAULT 'Hrs.',
    travel_routing VARCHAR(500),
    mileage DECIMAL(10,2),
    expenses_amount DECIMAL(15,2),
    ts_filename VARCHAR(255),
    ts_file_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proformas_and_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspections_summary(id),
    proforma_inv_no VARCHAR(50),
    proforma_inv_date DATE,
    sap_sales_order VARCHAR(50),
    invoice_no VARCHAR(50),
    invoice_date DATE,
    conso_invoice_no VARCHAR(50),
    conso_filename VARCHAR(255),
    total_amount DECIMAL(15,2),
    credit_memo_no VARCHAR(50),
    credit_memo_amount DECIMAL(15,2),
    payment_status VARCHAR(30) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'With Term', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ses_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_inv_id UUID REFERENCES proformas_and_invoices(id),
    ses_no VARCHAR(50),
    ses_date DATE,
    ses_value DECIMAL(15,2),
    sap_work_order VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Received', 'Returned for Revision', 'Approved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views
CREATE VIEW vw_budget_balances AS
SELECT 
    c.id AS contract_id,
    c.client_name,
    c.contract_no,
    c.currency,
    c.original_contract_value,
    c.running_balance,
    COALESCE((SELECT SUM(total_amount) FROM proformas_and_invoices pi JOIN inspections_summary isu ON pi.inspection_id = isu.id JOIN projects p ON isu.project_id = p.id WHERE p.contract_id = c.id), 0) AS total_invoiced,
    CASE WHEN c.original_contract_value > 0 THEN (COALESCE((SELECT SUM(total_amount) FROM proformas_and_invoices pi JOIN inspections_summary isu ON pi.inspection_id = isu.id JOIN projects p ON isu.project_id = p.id WHERE p.contract_id = c.id), 0) / c.original_contract_value) * 100 ELSE 0 END AS pct_depleted,
    c.original_contract_value - COALESCE((SELECT SUM(total_amount) FROM proformas_and_invoices pi JOIN inspections_summary isu ON pi.inspection_id = isu.id JOIN projects p ON isu.project_id = p.id WHERE p.contract_id = c.id), 0) AS remaining,
    CASE 
        WHEN (CASE WHEN c.original_contract_value > 0 THEN (COALESCE((SELECT SUM(total_amount) FROM proformas_and_invoices pi JOIN inspections_summary isu ON pi.inspection_id = isu.id JOIN projects p ON isu.project_id = p.id WHERE p.contract_id = c.id), 0) / c.original_contract_value) * 100 ELSE 0 END) > 100 THEN 'OVER BUDGET'
        WHEN (CASE WHEN c.original_contract_value > 0 THEN (COALESCE((SELECT SUM(total_amount) FROM proformas_and_invoices pi JOIN inspections_summary isu ON pi.inspection_id = isu.id JOIN projects p ON isu.project_id = p.id WHERE p.contract_id = c.id), 0) / c.original_contract_value) * 100 ELSE 0 END) > 90 THEN 'LOW BALANCE'
        WHEN (CASE WHEN c.original_contract_value > 0 THEN (COALESCE((SELECT SUM(total_amount) FROM proformas_and_invoices pi JOIN inspections_summary isu ON pi.inspection_id = isu.id JOIN projects p ON isu.project_id = p.id WHERE p.contract_id = c.id), 0) / c.original_contract_value) * 100 ELSE 0 END) > 75 THEN 'WARNING'
        ELSE 'OK'
    END AS budget_status
FROM clients_and_contracts c;

CREATE VIEW vw_invoice_pipeline AS
SELECT 
    c.client_name,
    c.contract_no,
    p.project_name,
    p.po_no,
    isu.report_no,
    isu.vendor_location,
    isu.inspection_start_date,
    pi.proforma_inv_no,
    pi.proforma_inv_date,
    pi.sap_sales_order,
    pi.invoice_no,
    pi.invoice_date,
    pi.total_amount,
    pi.payment_status,
    pi.conso_invoice_no,
    sr.ses_no,
    sr.ses_date,
    sr.ses_value,
    sr.status AS ses_status
FROM proformas_and_invoices pi
JOIN inspections_summary isu ON pi.inspection_id = isu.id
JOIN projects p ON isu.project_id = p.id
JOIN clients_and_contracts c ON p.contract_id = c.id
LEFT JOIN ses_records sr ON sr.proforma_inv_id = pi.id;

CREATE VIEW vw_conso_invoice_detail AS
SELECT 
    pi.conso_invoice_no,
    c.client_name,
    c.contract_no,
    MAX(pi.invoice_date) AS invoice_date,
    SUM(pi.total_amount) AS total_amount,
    MAX(pi.payment_status) AS payment_status,
    COUNT(isu.id) AS inspection_count,
    STRING_AGG(isu.report_no, ', ') AS report_numbers
FROM proformas_and_invoices pi
JOIN inspections_summary isu ON pi.inspection_id = isu.id
JOIN projects p ON isu.project_id = p.id
JOIN clients_and_contracts c ON p.contract_id = c.id
WHERE pi.conso_invoice_no IS NOT NULL
GROUP BY pi.conso_invoice_no, c.client_name, c.contract_no;
