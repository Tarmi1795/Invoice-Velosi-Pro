
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { Plus, Edit, Trash2, UploadCloud } from "lucide-react";

export default function ClientPage() {
  const [data, setData] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const initialForm = {
    client_name: "",
    contract_no: "",
    currency: "QAR",
    original_contract_value: "",
    running_balance: "",
    description: "",
    preset_id: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/presets', { cache: 'no-store' });
      const d = await res.json();
      setPresets(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPresets();
  }, []);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const url = editingItem ? `/api/clients/${editingItem.id}` : '/api/clients';
    const method = editingItem ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialForm);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this client/contract?")) {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    const fd: any = {};
    Object.keys(initialForm).forEach(k => {
      fd[k] = item[k] !== null && item[k] !== undefined ? item[k] : "";
    });
    setFormData(fd);
    setIsModalOpen(true);
  };

  const getPresetName = (presetId: string) => {
    const p = presets.find(pr => pr.id === presetId);
    return p ? p.preset_name : "—";
  };

  const columns = [
    { key: "client_name", label: "CLIENT NAME" },
    { key: "contract_no", label: "CONTRACT NO" },
    { key: "currency", label: "CURRENCY" },
    { 
      key: "preset_id", 
      label: "WORKFLOW PRESET",
      render: (val: any) => val ? (
        <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded">
          {getPresetName(val)}
        </span>
      ) : <span className="text-gray-600 text-xs">None</span>
    },
    {
      key: "original_contract_value",
      label: "CONTRACT VALUE",
      render: (val: any, row: any) => val ? `${row.currency || 'QAR'} ${Number(val).toLocaleString()}` : '—'
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="text-orange-500 hover:text-orange-400 p-1">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-400 p-1">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Clients & Contracts</h1>
        <div className="flex gap-3">
            <button 
                onClick={() => setIsBatchModalOpen(true)}
                className="btn-secondary flex items-center gap-2"
            >
                <UploadCloud size={18} /> Batch Input
            </button>
            <button 
                onClick={() => {
                    setEditingItem(null);
                    setFormData(initialForm);
                    setIsModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
            >
                <Plus size={18} /> Add Client
            </button>
        </div>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="client_name" />
      )}

      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Edit Client" : "New Client"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">CLIENT NAME</label>
            <input required type="text" className="input" value={formData.client_name} onChange={ev => setFormData({...formData, client_name: ev.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">CONTRACT NO</label>
            <input required type="text" className="input" value={formData.contract_no} onChange={ev => setFormData({...formData, contract_no: ev.target.value})} />
          </div>
          
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-gray-300">WORKFLOW PRESET</label>
            <select className="input !bg-[#111827]" value={formData.preset_id} onChange={ev => setFormData({...formData, preset_id: ev.target.value})}>
              <option value="">No preset (show all fields)</option>
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.preset_name} — {p.description || ''}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Determines which fields appear in Inspection, Invoice, and SES forms when working under this contract.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">CURRENCY</label>
            <select className="input" value={formData.currency} onChange={ev => setFormData({...formData, currency: ev.target.value})}>
              <option value="QAR">QAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">ORIGINAL CONTRACT VALUE</label>
            <input type="number" step="any" className="input" value={formData.original_contract_value} onChange={ev => setFormData({...formData, original_contract_value: ev.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">RUNNING BALANCE</label>
            <input type="number" step="any" className="input" value={formData.running_balance} onChange={ev => setFormData({...formData, running_balance: ev.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">DESCRIPTION</label>
            <input type="text" className="input" value={formData.description} onChange={ev => setFormData({...formData, description: ev.target.value})} />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#374151]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Client</button>
          </div>
        </form>
      </FormModal>

      <BatchUploadModal 
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          entityName="Client"
          apiEndpoint="/api/clients"
          onSuccess={fetchData}
          expectedHeaders={['client_name', 'contract_no', 'currency', 'original_contract_value', 'running_balance', 'description', 'preset_id']}
      />
    </div>
  );
}
