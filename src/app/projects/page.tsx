
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { Plus, Edit, Trash2, UploadCloud } from "lucide-react";

export default function ProjectPage() {
  const [data, setData] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const initialForm = {
    contract_id: "",
    project_name: "",
    po_no: "",
    itp_code: "",
    budget: "",
    focal_name: "",
    focal_email: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects', { cache: 'no-store' });
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      await Promise.all([
        
          fetch('/api/clients', { cache: 'no-store' }).then(r => r.json()).then(d => {
            setClients(Array.isArray(d) ? d : []);
          })
        
      ]);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRelationships();
  }, []);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const url = editingItem ? `/api/projects/${editingItem.id}` : '/api/projects';
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
    if (confirm("Delete this item?")) {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    const fd: any = {};
    Object.keys(initialForm).forEach(k => {
      if(k.includes('date') && item[k]) {
        fd[k] = new Date(item[k]).toISOString().split('T')[0];
      } else {
        fd[k] = item[k] !== null ? item[k] : "";
      }
    });
    setFormData(fd);
    setIsModalOpen(true);
  };

  const columns = [
    { key: "project_name", label: "PROJECT NAME" },
    { key: "contract_id", label: "CONTRACT ID" },
    { key: "po_no", label: "PO NO" },
    { key: "itp_code", label: "ITP CODE" },
    { key: "focal_name", label: "FOCAL NAME" },
    { key: "focal_email", label: "FOCAL EMAIL" },
    { key: "active_status", label: "STATUS", render: (val: any) => val ? 'Active' : 'Inactive' },
    { key: "created_at", label: "CREATED", render: (val: any) => val ? new Date(val).toLocaleDateString() : '—' },
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
        <h1 className="text-2xl font-bold text-white">Projects</h1>
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
                <Plus size={18} /> Add Project
            </button>
        </div>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="project_name" />
      )}

      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Edit Project" : "New Project"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">CLIENTS</label>
                <select 
                  className="input !bg-[#111827]" 
                  value={formData.contract_id} 
                  onChange={ev => setFormData({...formData, contract_id: ev.target.value})}
                >
                  <option value="">Select contract id...</option>
                  {clients.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.client_name || opt.id}</option>
                  ))}
                </select>
              </div>
              
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">PROJECT NAME</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.project_name} 
                onChange={ev => setFormData({...formData, project_name: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">PO NO</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.po_no} 
                onChange={ev => setFormData({...formData, po_no: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">ITP CODE</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.itp_code} 
                onChange={ev => setFormData({...formData, itp_code: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">BUDGET</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.budget} 
                onChange={ev => setFormData({...formData, budget: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">FOCAL NAME</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.focal_name} 
                onChange={ev => setFormData({...formData, focal_name: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">FOCAL EMAIL</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.focal_email} 
                onChange={ev => setFormData({...formData, focal_email: ev.target.value})} 
              />
            </div>
            

          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#374151]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </FormModal>

      <BatchUploadModal 
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          entityName="Project"
          apiEndpoint="/api/projects"
          onSuccess={fetchData}
          expectedHeaders={['contract_id', 'project_name', 'po_no', 'itp_code', 'budget', 'focal_name', 'focal_email']}
      />
    </div>
  );
}
