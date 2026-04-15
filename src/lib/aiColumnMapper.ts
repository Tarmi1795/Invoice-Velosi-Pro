import { prisma } from "./db";
import { callMiniMax, extractJSONFromResponse } from "./minimaxClient";

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";
export type MappingSource = "training" | "rules" | "llm" | "user";

export interface ColumnMapping {
  excelHeader: string;
  normalizedHeader: string;
  dbField: string | null;
  confidence: ConfidenceLevel;
  source: MappingSource;
  sampleValues: string[];
  instruction?: string;
}

export interface MappingResult {
  mappings: ColumnMapping[];
  unmappedHeaders: string[];
  totalColumns: number;
}

const ENTITY_FIELDS: Record<string, string[]> = {
  clients: [
    "client_name", "contract_no", "currency", "original_contract_value", 
    "running_balance", "description", "contract_start_date", "contract_end_date", "preset_id"
  ],
  projects: [
    "contract_id", "project_name", "po_no", "itp_code", "focal_name", 
    "focal_email", "active_status"
  ],
  inspections: [
    "project_id", "inspector_id", "report_no", "coordinator_name", "vendor_location",
    "inspection_start_date", "inspection_end_date", "work_duration", "ot_duration",
    "duration_tag", "travel_routing", "mileage", "expenses_amount", "ts_filename", "ts_file_verified"
  ],
  invoices: [
    "inspection_id", "proforma_inv_no", "proforma_inv_date", "sap_sales_order",
    "invoice_no", "invoice_date", "conso_invoice_no", "conso_filename",
    "total_amount", "credit_memo_no", "credit_memo_amount", "payment_status"
  ],
  ses: [
    "proforma_inv_id", "ses_no", "ses_date", "ses_value", "sap_work_order", "po_no", "itp_code", "status"
  ],
  inspectors: [
    "full_name", "job_title", "base_location"
  ],
  itp_pos: [
    "project_id", "inspector_id", "itp_po_number", "location", "expiry_date",
    "designation", "rates", "original_budget", "total_invoiced", "status"
  ],
};

const RULES_MAPPINGS: Record<string, { field: string; patterns: string[] }> = {
  invoice_no: {
    field: "invoice_no",
    patterns: ["invoice.*no", "inv.*no", "inv.*#", "invoice.*number", "inv.*number", "^inv$", "^invoice$"]
  },
  proforma_inv_no: {
    field: "proforma_inv_no",
    patterns: ["proforma.*no", "proforma.*inv", "pf.*no", "pf.*inv", "proforma.*number"]
  },
  invoice_date: {
    field: "invoice_date",
    patterns: ["invoice.*date", "inv.*date", "date.*inv", "^inv.*date$"]
  },
  proforma_inv_date: {
    field: "proforma_inv_date",
    patterns: ["proforma.*date", "pf.*date", "proforma.*inv.*date"]
  },
  total_amount: {
    field: "total_amount",
    patterns: ["total.*amount", "amount", "total", "value", "sum", "grand.*total"]
  },
  payment_status: {
    field: "payment_status",
    patterns: ["payment.*status", "status", "payment.*state", "inv.*status"]
  },
  credit_memo_no: {
    field: "credit_memo_no",
    patterns: ["credit.*memo.*no", "credit.*no", "cm.*no", "credit.*memo"]
  },
  credit_memo_amount: {
    field: "credit_memo_amount",
    patterns: ["credit.*amount", "credit.*memo.*value", "cm.*amount"]
  },
  sap_sales_order: {
    field: "sap_sales_order",
    patterns: ["sap.*order", "sales.*order", "sap.*so", "so.*sap"]
  },
  conso_invoice_no: {
    field: "conso_invoice_no",
    patterns: ["conso.*no", "conso.*inv", "consolidated.*no", "cons.*inv"]
  },
  client_name: {
    field: "client_name",
    patterns: ["client.*name", "client", "company.*name", "customer", "customer.*name"]
  },
  contract_no: {
    field: "contract_no",
    patterns: ["contract.*no", "contract.*#", "contract.*number", "contract.*id"]
  },
  project_name: {
    field: "project_name",
    patterns: ["project.*name", "project", "proj.*name", "job.*name"]
  },
  po_no: {
    field: "po_no",
    patterns: ["po.*no", "po.*#", "purchase.*order", "p\\.?o\\.?.*no", "^po$"]
  },
  itp_code: {
    field: "itp_code",
    patterns: ["itp.*code", "itp", "inspection.*test.*plan"]
  },
  report_no: {
    field: "report_no",
    patterns: ["report.*no", "report.*#", "report.*number", "inspection.*report"]
  },
  coordinator_name: {
    field: "coordinator_name",
    patterns: ["coordinator", "coord.*name", "contact.*person"]
  },
  vendor_location: {
    field: "vendor_location",
    patterns: ["vendor.*location", "vendor", "location", "site", "venue"]
  },
  inspector_id: {
    field: "inspector_id",
    patterns: ["inspector.*id", "inspector"]
  },
  project_id: {
    field: "project_id",
    patterns: ["project.*id", "proj.*id", "project"]
  },
  work_duration: {
    field: "work_duration",
    patterns: ["work.*duration", "duration", "work.*hrs", "regular.*hrs"]
  },
  ot_duration: {
    field: "ot_duration",
    patterns: ["ot.*duration", "overtime", "ot.*hrs", "ot.*hours"]
  },
  mileage: {
    field: "mileage",
    patterns: ["mileage", "km", "miles", "distance"]
  },
  expenses_amount: {
    field: "expenses_amount",
    patterns: ["expenses", "expense", "perdiem", "allowances"]
  },
  full_name: {
    field: "full_name",
    patterns: ["full.*name", "name", "inspector.*name", "employee.*name"]
  },
  job_title: {
    field: "job_title",
    patterns: ["job.*title", "title", "position", "role"]
  },
  base_location: {
    field: "base_location",
    patterns: ["base.*location", "location", "base", "office"]
  },
  currency: {
    field: "currency",
    patterns: ["currency", "curr", "curr.*code"]
  },
  description: {
    field: "description",
    patterns: ["description", "desc", "notes", "remarks", "comments"]
  },
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function fuzzyMatch(header: string, pattern: string): boolean {
  const normalizedHeader = normalizeHeader(header);
  const normalizedPattern = pattern.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  if (normalizedHeader === normalizedPattern) return true;
  
  const levenshteinThreshold = Math.max(2, Math.floor(normalizedPattern.length * 0.3));
  
  const distance = levenshteinDistance(normalizedHeader, normalizedPattern);
  return distance <= levenshteinThreshold;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

async function getTrainingMappings(entityType: string, headers: string[]): Promise<Map<string, { dbField: string; instruction?: string }>> {
  const normalized = headers.map(normalizeHeader);
  
  const trainings = await prisma.column_mapping_training.findMany({
    where: {
      entity_type: entityType,
      excel_header: { in: normalized }
    }
  });
  
  const map = new Map<string, { dbField: string; instruction?: string }>();
  trainings.forEach(t => {
    map.set(t.excel_header, { dbField: t.db_field, instruction: t.instruction || undefined });
  });
  
  return map;
}

async function saveTrainingData(
  entityType: string, 
  excelHeader: string, 
  dbField: string, 
  instruction?: string
): Promise<void> {
  const normalized = normalizeHeader(excelHeader);
  
  await prisma.column_mapping_training.upsert({
    where: {
      entity_type_excel_header: {
        entity_type: entityType,
        excel_header: normalized,
      }
    },
    update: {
      db_field: dbField,
      instruction: instruction || null,
      use_count: { increment: 1 }
    },
    create: {
      entity_type: entityType,
      excel_header: normalized,
      db_field: dbField,
      instruction: instruction || null,
      use_count: 1,
    }
  });
}

async function mapWithLLM(
  entityType: string,
  headers: string[],
  sampleRows: string[][]
): Promise<ColumnMapping[]> {
  const availableFields = ENTITY_FIELDS[entityType] || [];
  
  const systemPrompt = `You are a database column mapper for an invoice management system.
You map Excel/CSV column headers to database field names.
For ambiguous mappings, use the sample data rows to infer the correct field.

IMPORTANT RULES:
- "PO" typically maps to "po_no" (Purchase Order number)
- "ITP" or "ITP Code" maps to "itp_code"
- "Name" alone is ambiguous - use sample data context to decide (could be client_name, full_name, project_name, etc.)
- Dates in different positions mean different things (first date = invoice date, later dates may be due dates, etc.)
- SES numbers typically start with patterns like "61009"

Return a JSON array mapping each header to a db field. Use "unknown" for unmappable headers.
Format: [{"header": "original", "field": "db_field_name", "confidence": "high|medium|low"}]`;

  const headerStr = headers.join(", ");
  const sampleStr = sampleRows.map(row => `[${row.join(", ")}]`).join("\n");
  
  const userPrompt = `Map these Excel headers to database fields:
Headers: ${headerStr}

Sample data (first 3 rows):
${sampleStr}

Available database fields for ${entityType}: ${availableFields.join(", ")}

IMPORTANT: Return ONLY a JSON array with this exact format, no other text:
[{"header": "original_header", "field": "db_field_name", "confidence": "high|medium|low"}, ...]

Use "unknown" confidence for uncertain mappings. Only map to fields from the available list.`;

  try {
    const response = await callMiniMax(userPrompt, systemPrompt);
    const parsed = extractJSONFromResponse(response);
    
    if (!parsed || !Array.isArray(parsed)) {
      console.error("LLM response parsing failed:", response);
      return headers.map(h => ({
        excelHeader: h,
        normalizedHeader: normalizeHeader(h),
        dbField: null,
        confidence: "unknown" as ConfidenceLevel,
        source: "llm" as MappingSource,
        sampleValues: [],
      }));
    }
    
    return headers.map(h => {
      const normalizedH = normalizeHeader(h);
      const match = parsed.find((p: any) => {
        const pHeader = p.header || p.excel_header || p.name || "";
        const pField = p.field || p.database_field || p.db_field || "";
        const normalizedPHeader = normalizeHeader(pHeader);
        return normalizedPHeader === normalizedH || 
               normalizedPHeader.includes(normalizedH) ||
               normalizedH.includes(normalizedPHeader);
      });
      
      if (match) {
        const field = match.field || match.database_field || match.db_field || null;
        const fieldExists = field && availableFields.includes(field);
        return {
          excelHeader: h,
          normalizedHeader: normalizeHeader(h),
          dbField: fieldExists ? field : null,
          confidence: (fieldExists ? (match.confidence || "medium") : "unknown") as ConfidenceLevel,
          source: "llm" as MappingSource,
          sampleValues: [],
        };
      }
      
      return {
        excelHeader: h,
        normalizedHeader: normalizeHeader(h),
        dbField: null,
        confidence: "unknown" as ConfidenceLevel,
        source: "llm" as MappingSource,
        sampleValues: [],
      };
    });
  } catch (error) {
    console.error("LLM mapping failed:", error);
    return headers.map(h => ({
      excelHeader: h,
      normalizedHeader: normalizeHeader(h),
      dbField: null,
      confidence: "unknown" as ConfidenceLevel,
      source: "llm" as MappingSource,
      sampleValues: [],
    }));
  }
}

export async function analyzeColumns(
  entityType: string,
  headers: string[],
  sampleRows: string[][]
): Promise<MappingResult> {
  console.log("[aiColumnMapper] analyzeColumns called:", { entityType, headerCount: headers.length });
  
  const mappings: ColumnMapping[] = [];
  const trainingMappings = await getTrainingMappings(entityType, headers);
  console.log("[aiColumnMapper] Training mappings found:", trainingMappings.size);
  
  const unmappedHeaders: string[] = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const normalized = normalizeHeader(header);
    const sampleValues = sampleRows.map(row => row[i] || "").filter(Boolean);
    
    if (trainingMappings.has(normalized)) {
      const trained = trainingMappings.get(normalized)!;
      mappings.push({
        excelHeader: header,
        normalizedHeader: normalized,
        dbField: trained.dbField,
        confidence: "high",
        source: "training",
        sampleValues,
        instruction: trained.instruction,
      });
      continue;
    }
    
    let matched = false;
    
    for (const [fieldName, config] of Object.entries(RULES_MAPPINGS)) {
      for (const pattern of config.patterns) {
        if (fuzzyMatch(header, pattern)) {
          console.log("[aiColumnMapper] Rules match:", header, "->", fieldName, "(pattern:", pattern + ")");
          mappings.push({
            excelHeader: header,
            normalizedHeader: normalized,
            dbField: fieldName,
            confidence: "high",
            source: "rules",
            sampleValues,
          });
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    if (!matched) {
      unmappedHeaders.push(header);
    }
  }
  
  console.log("[aiColumnMapper] After rules - unmapped headers:", unmappedHeaders);
  
  if (unmappedHeaders.length > 0) {
    console.log("[aiColumnMapper] Calling LLM for unmapped headers:", unmappedHeaders);
    const llmMappings = await mapWithLLM(entityType, unmappedHeaders, sampleRows);
    console.log("[aiColumnMapper] LLM mappings result:", llmMappings.map(lm => ({ header: lm.excelHeader, field: lm.dbField, confidence: lm.confidence })));
    
    for (const lm of llmMappings) {
      if (lm.dbField) {
        mappings.push(lm);
      } else {
        mappings.push({
          excelHeader: lm.excelHeader,
          normalizedHeader: lm.normalizedHeader,
          dbField: null,
          confidence: "unknown",
          source: "llm",
          sampleValues: lm.sampleValues,
        });
      }
    }
  }
  
  console.log("[aiColumnMapper] Final mappings:", mappings.map(m => ({ header: m.excelHeader, field: m.dbField, source: m.source })));
  
  return {
    mappings,
    unmappedHeaders: mappings.filter(m => !m.dbField).map(m => m.excelHeader),
    totalColumns: headers.length,
  };
}

export async function saveUserCorrection(
  entityType: string,
  excelHeader: string,
  dbField: string,
  instruction?: string
): Promise<void> {
  await saveTrainingData(entityType, excelHeader, dbField, instruction);
}

export function getAvailableFields(entityType: string): string[] {
  return ENTITY_FIELDS[entityType] || [];
}