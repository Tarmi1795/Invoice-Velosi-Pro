import { useData } from "./useData";

interface SESRecord {
  id: string;
  proforma_inv_id: string | null;
  ses_no: string | null;
  ses_date: string | null;
  ses_value: number | null;
  sap_work_order: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useSES() {
  const hook = useData<SESRecord>("/api/ses");
  
  return {
    ...hook,
    data: hook.data as SESRecord[],
  };
}