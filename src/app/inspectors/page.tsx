
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { Plus, Edit, Trash2, UploadCloud } from "lucide-react";

export default function InspectorPage() {
  const [data, setData] = useState<any[]>([]);
  
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const initialForm = {
    full_name: "",
    job_title: "",
    base_location: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inspectors', { cache: 'no-store' });
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
        
      ]);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    
  }, []);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const url = editingItem ? `/api/inspectors/${editingItem.id}` : '/api/inspectors';
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
      await fetch(`/api/inspectors/${id}`, { method: 'DELETE' });
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
    { key: "full_name", label: "FULL NAME" },
    { key: "job_title", label: "JOB TITLE" },
    { key: "base_location", label: "BASE LOCATION" },
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
        <h1 className="text-2xl font-bold text-white">Inspectors</h1>
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
                <Plus size={18} /> Add Inspector
            </button>
        </div>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="full_name" />
      )}

      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Edit Inspector" : "New Inspector"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">FULL NAME</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.full_name} 
                onChange={ev => setFormData({...formData, full_name: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">JOB TITLE</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.job_title} 
                onChange={ev => setFormData({...formData, job_title: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">BASE LOCATION</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.base_location} 
                onChange={ev => setFormData({...formData, base_location: ev.target.value})} 
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
          entityName="Inspector"
          apiEndpoint="/api/inspectors"
          onSuccess={fetchData}
          expectedHeaders={['full_name', 'job_title', 'base_location']}
      />
    </div>
  );
}
