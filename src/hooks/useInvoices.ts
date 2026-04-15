import { useData } from "./useData";

interface Invoice {
  id: string;
  inspection_id: string | null;
  proforma_inv_no: string | null;
  proforma_inv_date: string | null;
  sap_sales_order: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  conso_invoice_no: string | null;
  conso_filename: string | null;
  total_amount: number | null;
  credit_memo_no: string | null;
  credit_memo_amount: number | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export function useInvoices() {
  const hook = useData<Invoice>("/api/invoices");
  
  return {
    ...hook,
    data: hook.data as Invoice[],
  };
}