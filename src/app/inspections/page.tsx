
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { EnhancedBatchUploadModal } from "@/components/EnhancedBatchUploadModal";
import { Plus, Edit, Trash2, UploadCloud, FileText } from "lucide-react";
import { todayISO } from "@/lib/dateUtils";

export default function InspectionPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  
  const initialForm = {
    project_id: "",
    inspector_id: "",
    report_no: "",
    coordinator_name: "",
    vendor_location: "",
    inspection_start_date: "",
    inspection_end_date: "",
    work_duration: "",
    ot_duration: "",
    duration_tag: "",
    travel_routing: "",
    mileage: "",
    expenses_amount: "",
    ts_filename: "",
    ts_file_verified: false
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inspections', { cache: 'no-store' });
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
        
          fetch('/api/projects', { cache: 'no-store' }).then(r => r.json()).then(d => {
            setProjects(Array.isArray(d) ? d : []);
          })
        ,
          fetch('/api/inspectors', { cache: 'no-store' }).then(r => r.json()).then(d => {
            setInspectors(Array.isArray(d) ? d : []);
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

  const getNewInspectionForm = () => ({
    project_id: "",
    inspector_id: "",
    report_no: "",
    coordinator_name: "",
    vendor_location: "",
    inspection_start_date: todayISO(),
    inspection_end_date: "",
    work_duration: "",
    ot_duration: "",
    duration_tag: "",
    travel_routing: "",
    mileage: "",
    expenses_amount: "",
    ts_filename: "",
    ts_file_verified: false
  });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    if (!formData.inspector_id) {
      setFormError("Please select an inspector before creating an inspection record.");
      return;
    }

    const url = editingItem ? `/api/inspections/${editingItem.id}` : '/api/inspections';
    const method = editingItem ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error || "Failed to save inspection.");
      return;
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialForm);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item?")) {
      await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
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
    { key: "report_no", label: "REPORT NO" },
    { key: "inspection_start_date", label: "INSPECTION START DATE", render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: "vendor_location", label: "VENDOR LOCATION" },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="text-blue-500 hover:text-blue-400 p-1">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-400 p-1">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  const handleBatchDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} inspection(s)?`)) return;
    await Promise.all(ids.map(id => fetch(`/api/inspections/${id}`, { method: 'DELETE' })));
    fetchData();
  };

  const handleBatchCreateProforma = async (ids: string[]) => {
    const res = await fetch('/api/invoices/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: 'proforma',
        inspection_ids: ids 
      })
    });
    if (res.ok) fetchData();
  };

  const batchActions = [
    { label: "Create Proforma", icon: <FileText size={14} />, onClick: handleBatchCreateProforma },
    { label: "Delete", icon: <Trash2 size={14} />, variant: "danger" as const, onClick: handleBatchDelete }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Inspections</h1>
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
                    setFormData(getNewInspectionForm());
                    setIsModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
            >
                <Plus size={18} /> Add Inspection
            </button>
        </div>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="report_no" batchActions={batchActions} />
      )}

      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Edit Inspection" : "New Inspection"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          {formError && (
            <div className="col-span-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {formError}
            </div>
          )}
          
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">PROJECTS</label>
                <select 
                  className="input !bg-[#0f1117]" 
                  value={formData.project_id} 
                  onChange={ev => setFormData({...formData, project_id: ev.target.value})}
                >
                  <option value="">Select project id...</option>
                  {projects.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.project_name || opt.id}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">INSPECTORS</label>
                <select 
                  className="input !bg-[#0f1117]" 
                  value={formData.inspector_id} 
                  onChange={ev => setFormData({...formData, inspector_id: ev.target.value})}
                >
                  <option value="">Select inspector id...</option>
                  {inspectors.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.full_name || opt.id}</option>
                  ))}
                </select>
                {!formData.inspector_id && (
                  <p className="text-xs text-yellow-500 mt-1">No inspector assigned — inspection may not be billable</p>
                )}
              </div>
              
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">REPORT NO</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.report_no} 
                onChange={ev => setFormData({...formData, report_no: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">COORDINATOR NAME</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.coordinator_name} 
                onChange={ev => setFormData({...formData, coordinator_name: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">VENDOR LOCATION</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.vendor_location} 
                onChange={ev => setFormData({...formData, vendor_location: ev.target.value})} 
              />
            </div>
            
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">INSPECTION START DATE</label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.inspection_start_date} 
                  onChange={ev => setFormData({...formData, inspection_start_date: ev.target.value})} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">INSPECTION END DATE</label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.inspection_end_date} 
                  onChange={ev => setFormData({...formData, inspection_end_date: ev.target.value})} 
                />
              </div>
              
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">WORK DURATION</label>
              <input 
                type="number" 
                step="any"
                className="input" 
                value={formData.work_duration} 
                onChange={ev => setFormData({...formData, work_duration: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">OT DURATION</label>
              <input 
                type="number" 
                step="any"
                className="input" 
                value={formData.ot_duration} 
                onChange={ev => setFormData({...formData, ot_duration: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">DURATION TAG</label>
              <input 
                type="number" 
                step="any"
                className="input" 
                value={formData.duration_tag} 
                onChange={ev => setFormData({...formData, duration_tag: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">TRAVEL ROUTING</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.travel_routing} 
                onChange={ev => setFormData({...formData, travel_routing: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">MILEAGE</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.mileage} 
                onChange={ev => setFormData({...formData, mileage: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">EXPENSES AMOUNT</label>
              <input 
                type="number" 
                step="any"
                className="input" 
                value={formData.expenses_amount} 
                onChange={ev => setFormData({...formData, expenses_amount: ev.target.value})} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">TS FILENAME</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.ts_filename} 
                onChange={ev => setFormData({...formData, ts_filename: ev.target.value})} 
              />
            </div>
            
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-300">TS FILE VERIFIED</label>
                     <select className="input" value={String(formData.ts_file_verified)} onChange={ev => setFormData({...formData, ts_file_verified: ev.target.value === 'true'})}>
                       <option value="true">True</option>
                       <option value="false">False</option>
                     </select>
                   </div>
                   

          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#2d2f3d]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </FormModal>

      <EnhancedBatchUploadModal 
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          entityName="Inspection"
          entityType="inspections"
          apiEndpoint="/api/inspections"
          onSuccess={fetchData}
          expectedHeaders={['project_id', 'inspector_id', 'report_no', 'coordinator_name', 'vendor_location', 'inspection_start_date', 'inspection_end_date', 'work_duration', 'ot_duration', 'duration_tag', 'travel_routing', 'mileage', 'expenses_amount', 'ts_filename', 'ts_file_verified']}
      />
    </div>
  );
}
