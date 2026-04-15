import { useData } from "./useData";

interface Project {
  id: string;
  contract_no: string | null;
  project_name: string;
  po_no: string | null;
  itp_code: string | null;
  focal_name: string | null;
  focal_email: string | null;
  active_status: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const hook = useData<Project>("/api/projects");
  
  return {
    ...hook,
    data: hook.data as Project[],
  };
}