import { useData } from "./useData";

interface Client {
  id: string;
  client_name: string;
  contract_no: string;
  currency: string;
  original_contract_value: number;
  running_balance: number;
  description: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  preset_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const hook = useData<Client>("/api/clients");
  
  return {
    ...hook,
    data: hook.data as Client[],
  };
}