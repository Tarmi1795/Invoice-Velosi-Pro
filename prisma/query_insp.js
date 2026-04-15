const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
console.error("DB Path:", dbPath);

const db = new sqlite3.Database(dbPath);
const asepHendraId = '581c808b-7254-4feb-98c3-d89a65182836';

db.all(`
  SELECT 
    i.id,
    i.coordinator_name,
    i.vendor_location,
    i.inspection_start_date,
    i.inspection_end_date,
    i.report_no,
    i.work_duration,
    i.ot_duration,
    i.expenses_amount,
    i.ts_filename,
    i.ts_file_verified,
    p.project_name,
    p.po_no,
    pi.proforma_inv_no,
    pi.invoice_no,
    pi.total_amount,
    pi.payment_status
  FROM inspections_summary i
  LEFT JOIN projects p ON i.project_id = p.id
  LEFT JOIN proformas_and_invoices pi ON pi.inspection_id = i.id
  WHERE i.inspector_id = ?
  ORDER BY i.inspection_start_date DESC
  LIMIT 20
`, [asepHendraId], (err, rows) => {
  if (err) {
    console.error("ERROR:", err.message);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
