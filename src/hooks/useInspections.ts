import { useData } from "./useData";

interface Inspection {
  id: string;
  project_name: string | null;
  employee_no: string | null;
  coordinator_name: string | null;
  vendor_location: string | null;
  inspection_start_date: string | null;
  inspection_end_date: string | null;
  report_no: string | null;
  work_duration: number | null;
  ot_duration: number | null;
  duration_tag: string | null;
  travel_routing: string | null;
  mileage: number | null;
  expenses_amount: number | null;
  ts_filename: string | null;
  ts_file_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function useInspections() {
  const hook = useData<Inspection>("/api/inspections");
  
  return {
    ...hook,
    data: hook.data as Inspection[],
  };
}