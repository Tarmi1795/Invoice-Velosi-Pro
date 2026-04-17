import { prisma } from "./db";
import { suggestMatch } from "./entityMatcher";

export interface ValidationIssue {
  row: number;
  field: string;
  originalValue: string;
  suggestedValue: string | null;
  suggestionData?: any;
  type: "missing_project" | "missing_inspector" | "missing_client" | "missing_contract";
}

export async function validateBatchData(
  entityType: string,
  rows: any[]
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  // Parallel fetch lookup tables matching any potential entity
  const [dbProjects, dbInspectors, dbClients] = await Promise.all([
    prisma.projects.findMany({ select: { id: true, project_name: true } }),
    prisma.inspectors.findMany({ select: { employee_no: true, full_name: true } }),
    prisma.clients_and_contracts.findMany({ select: { contract_no: true, client_name: true } }),
  ]);

  const projectCandidates = dbProjects.map(p => ({ id: p.id, name: p.project_name }));
  const inspectorCandidates = dbInspectors.map(i => ({ employee_no: i.employee_no || undefined, name: i.full_name || "" }));
  
  // Create unique sets for clients and contracts
  const clientSet = new Set(dbClients.map(c => c.client_name).filter(Boolean));
  const contractSet = new Set(dbClients.map(c => c.contract_no).filter(Boolean));
  const clientCandidates = Array.from(clientSet).map(name => ({ name: name as string }));
  const contractCandidates = Array.from(contractSet).map(no => ({ name: no as string }));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Validate project_name
    if (row.project_name) {
      const match = suggestMatch(String(row.project_name), projectCandidates);
      if (!match || !match.isExact) {
        issues.push({
          row: i + 1,
          field: "project_name",
          originalValue: String(row.project_name),
          suggestedValue: match ? match.name : null,
          suggestionData: match ? { id: match.id } : null,
          type: "missing_project"
        });
      }
    }

    // Validate inspector_name or inspector_id (which could be name or employee_no)
    const inspValue = row.inspector_name || row.inspector_id;
    if (inspValue) {
      // Is it a direct hit on employee_no?
      const isDirectEmpNo = inspectorCandidates.some(c => c.employee_no === String(inspValue));
      if (!isDirectEmpNo) {
        const match = suggestMatch(String(inspValue), inspectorCandidates);
        if (!match || !match.isExact) {
           // Provide suggestion
           issues.push({
             row: i + 1,
             field: row.inspector_name ? "inspector_name" : (row.inspector_id ? "inspector_id" : "employee_no"),
             originalValue: String(inspValue),
             // In batch routes, we usually want the employee_no for the DB. If we suggest, let's suggest the direct identity.
             suggestedValue: match && match.employee_no ? match.employee_no : (match ? match.name : null),
             suggestionData: match ? { employee_no: match.employee_no, full_name: match.name } : null,
             type: "missing_inspector"
           });
        }
      }
    }

    // Validate client_name
    if (row.client_name) {
      const match = suggestMatch(String(row.client_name), clientCandidates);
      if (!match || !match.isExact) {
        issues.push({
          row: i + 1,
          field: "client_name",
          originalValue: String(row.client_name),
          suggestedValue: match ? match.name : null,
          type: "missing_client"
        });
      }
    }

    // Validate contract_no
    if (row.contract_no) {
      const match = suggestMatch(String(row.contract_no), contractCandidates);
      if (!match || !match.isExact) {
        issues.push({
          row: i + 1,
          field: "contract_no",
          originalValue: String(row.contract_no),
          suggestedValue: match ? match.name : null,
          type: "missing_contract"
        });
      }
    }
  }

  return issues;
}
