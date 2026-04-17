/**
 * Shared data normalization utility for batch uploads.
 * Handles the messy ways Excel cells can store data:
 * - Whitespace padding
 * - "NA" / "N/A" / "n/a" / empty strings → null
 * - Numbers stored as strings or vice versa
 * - Dates in various formats (including Excel serial numbers)
 * - Boolean strings ("true"/"false", "1"/"0")
 */

const SYSTEM_FIELDS = new Set(["id", "created_at", "updated_at"]);

// Fields that should always be stored as strings (IDs, codes, text references)
const STRING_FIELDS = new Set([
  // ses_records
  "proforma_inv_id", "itp_po_id", "po_no", "ses_no", "sap_work_order", "itp_code", "status",
  // inspections_summary
  "project_name", "employee_no", "coordinator_name", "vendor_location", "report_no",
  "duration_tag", "travel_routing", "ts_filename",
  // proformas_and_invoices
  "inspection_id", "sr_so_no", "proforma_inv_no", "sap_sales_order", "invoice_no",
  "conso_invoice_no", "conso_filename", "credit_memo_no", "payment_status",
  // projects
  "contract_no", "project_name", "itp_code", "focal_name", "focal_email",
  // clients_and_contracts
  "client_name", "contract_no", "currency", "description", "preset_id",
  // itp_pos
  "itp_po_number", "inspector_id", "inspector_name", "location", "designation",
  // inspectors
  "full_name", "job_title", "base_location",
  // po_records
  "client_name", "project_name", "contract_no",
  // service_orders
]);

// Fields that should be stored as numbers
const NUMBER_FIELDS = new Set([
  "amount", "original_contract_value", "running_balance",
  "work_duration", "ot_duration", "mileage", "expenses_amount",
  "ses_value", "total_amount", "credit_memo_amount",
  "rates", "original_budget",
]);

// Fields that should be stored as dates
const DATE_FIELDS = new Set([
  "ses_date", "inspection_start_date", "inspection_end_date",
  "proforma_inv_date", "invoice_date", "contract_start_date",
  "contract_end_date", "expiry_date", "revised_date",
]);

// Fields that should be stored as booleans
const BOOLEAN_FIELDS = new Set([
  "ts_file_verified", "active_status",
]);

/**
 * Returns true if the given value represents "not applicable" / blank.
 */
function isBlank(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") {
    const t = val.trim().toUpperCase();
    return t === "" || t === "NA" || t === "N/A";
  }
  return false;
}

/**
 * Parse a date from various formats including Excel serial numbers.
 */
function parseDate(val: unknown): Date | null {
  if (isBlank(val)) return null;
  if (typeof val === "number" && val > 25000 && val < 60000) {
    // Likely an Excel serial date number (1900-based)
    // Excel's serial: days since Dec 30 1899
    const d = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof val === "number") {
    // Unix timestamp or other numeric date
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof val === "string") {
    const cleaned = val.trim();
    // Try ISO format first
    let d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d;
    // Try MM/DD/YYYY
    const mdy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
      d = new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]));
      if (!isNaN(d.getTime())) return d;
    }
    // Try DD/MM/YYYY (common in some locales)
    const dmy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
      d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

/**
 * Normalize a raw cell value based on its field name.
 */
function normalizeValue(key: string, val: unknown): unknown {
  if (isBlank(val)) return null;

  if (STRING_FIELDS.has(key)) {
    if (typeof val === "number") return String(val);
    return String(val).trim();
  }

  if (NUMBER_FIELDS.has(key)) {
    if (typeof val === "string") {
      const cleaned = val.replace(/[^0-9.-]/g, "");
      return cleaned === "" ? null : Number(cleaned);
    }
    return val === "" ? null : Number(val);
  }

  if (DATE_FIELDS.has(key)) {
    const d = parseDate(val);
    return d;
  }

  if (BOOLEAN_FIELDS.has(key)) {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const t = val.trim().toLowerCase();
      return t === "true" || t === "1" || t === "yes";
    }
    return Boolean(val);
  }

  // Default: trim strings, pass through numbers/booleans
  if (typeof val === "string") {
    const t = val.trim();
    return t === "" ? null : t;
  }

  return val;
}

/**
 * Normalize an entire row object — runs every cell through the normalizer.
 * Use this in all batch API routes instead of raw row objects.
 *
 * @param row - raw row from Excel/XLSX
 * @param extraStringFields - optional additional fields to treat as strings (for custom entity fields)
 */
export function normalizeRow(
  row: Record<string, unknown>,
  extraStringFields: string[] = []
): Record<string, unknown> {
  const extra = new Set(extraStringFields);
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(row)) {
    if (SYSTEM_FIELDS.has(key)) continue;

    const effectiveKey = STRING_FIELDS.has(key) || extra.has(key) ? key : key;
    result[key] = normalizeValue(effectiveKey, val);
  }

  return result;
}

/**
 * Normalize and validate a row with specific field type overrides.
 * Use this when you know exactly which fields need which treatment.
 *
 * @param row - raw row
 * @param options - field lists for this entity
 */
export function normalizeRowWithOptions(
  row: Record<string, unknown>,
  options: {
    stringFields?: string[];
    numberFields?: string[];
    dateFields?: string[];
    booleanFields?: string[];
  } = {}
): Record<string, unknown> {
  const {
    stringFields = [],
    numberFields = [],
    dateFields = [],
    booleanFields = [],
  } = options;

  const strSet = new Set([...STRING_FIELDS, ...stringFields]);
  const numSet = new Set([...NUMBER_FIELDS, ...numberFields]);
  const dateSet = new Set([...DATE_FIELDS, ...dateFields]);
  const boolSet = new Set([...BOOLEAN_FIELDS, ...booleanFields]);

  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(row)) {
    if (SYSTEM_FIELDS.has(key)) continue;

    if (strSet.has(key)) {
      if (isBlank(val)) { result[key] = null; continue; }
      result[key] = typeof val === "number" ? String(val) : String(val).trim();
      continue;
    }

    if (numSet.has(key)) {
      if (isBlank(val)) { result[key] = null; continue; }
      if (typeof val === "string") {
        const cleaned = val.replace(/[^0-9.-]/g, "");
        result[key] = cleaned === "" ? null : Number(cleaned);
      } else {
        result[key] = Number(val);
      }
      continue;
    }

    if (dateSet.has(key)) {
      result[key] = parseDate(val);
      continue;
    }

    if (boolSet.has(key)) {
      if (typeof val === "boolean") { result[key] = val; continue; }
      if (typeof val === "string") {
        const t = val.trim().toLowerCase();
        result[key] = t === "true" || t === "1" || t === "yes";
      } else {
        result[key] = Boolean(val);
      }
      continue;
    }

    // Default fallback
    if (isBlank(val)) { result[key] = null; continue; }
    if (typeof val === "string") {
      const t = val.trim();
      result[key] = t === "" ? null : t;
    } else {
      result[key] = val;
    }
  }

  return result;
}
