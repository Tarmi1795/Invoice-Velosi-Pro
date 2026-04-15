
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { EnhancedBatchUploadModal } from "@/components/EnhancedBatchUploadModal";
import { Plus, Edit, Trash2, UploadCloud } from "lucide-react";
import { todayISO } from "@/lib/dateUtils";

export default function SESRecordPage() {
  const [data, setData] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [itpPos, setItpPos] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  const initialForm = {
    proforma_inv_id: "",
    itp_po_id: "",
    ses_no: "",
    ses_date: "",
    ses_value: "",
    po_no: "",
    status: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ses', { cache: 'no-store' });
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
        fetch('/api/invoices', { cache: 'no-store' }).then(r => r.json()).then(d => setInvoices(Array.isArray(d) ? d : [])),
        fetch('/api/monitoring', { cache: 'no-store' }).then(r => r.json()).then(d => setItpPos(Array.isArray(d) ? d : []))
      ]);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRelationships();
  }, []);

  const getNewSesForm = () => ({
    proforma_inv_id: "",
    itp_po_id: "",
    ses_no: "",
    ses_date: todayISO(),
    ses_value: "",
    po_no: "",
    status: ""
  });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    if (!formData.proforma_inv_id) {
      setFormError("Please select a proforma before creating an SES record.");
      return;
    }

    const url = editingItem ? `/api/ses/${editingItem.id}` : '/api/ses';
    const method = editingItem ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error || "Failed to save SES record.");
      return;
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialForm);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item?")) {
      await fetch(`/api/ses/${id}`, { method: 'DELETE' });
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
    { key: "ses_no", label: "SES NO" },
    { key: "ses_date", label: "SES DATE", render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: "itp_po_number", label: "ITP/PO NO", render: (val: any, row: any) => row.itp_pos?.itp_po_number || <span className="text-gray-500">—</span> },
    { key: "itp_project_name", label: "ITP PROJECT", render: (val: any, row: any) => row.itp_pos?.project_name || <span className="text-gray-500">—</span> },
    { key: "ses_value", label: "SES VALUE" },
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">SES Records</h1>
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
                    setFormData(getNewSesForm());
                    setIsModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
            >
                <Plus size={18} /> Add SES Record
            </button>
        </div>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="ses_no" />
      )}

      <FormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "Edit SES Record" : "New SES Record"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          {formError && (
            <div className="col-span-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {formError}
            </div>
          )}
          
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">INVOICES</label>
                <select 
                  className="input !bg-[#0f1117]" 
                  value={formData.proforma_inv_id} 
                  onChange={ev => setFormData({...formData, proforma_inv_id: ev.target.value})}
                >
                  <option value="">Select proforma inv id...</option>
                  {invoices.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.invoice_no || opt.id}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">ITP/PO (Optional)</label>
                <select 
                  className="input !bg-[#0f1117]" 
                  value={formData.itp_po_id} 
                  onChange={ev => setFormData({...formData, itp_po_id: ev.target.value})}
                >
                  <option value="">Select ITP/PO...</option>
                  {itpPos.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>{opt.itp_po_number} - {opt.project_name}</option>
                  ))}
                </select>
              </div>
              
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">SES NO</label>
              <input 
                type="text" 
                step="any"
                className="input" 
                value={formData.ses_no} 
                onChange={ev => setFormData({...formData, ses_no: ev.target.value})} 
              />
            </div>
            
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">SES DATE</label>
                <input 
                  type="date" 
                  className="input" 
                  value={formData.ses_date} 
                  onChange={ev => setFormData({...formData, ses_date: ev.target.value})} 
                />
              </div>
              
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">SES VALUE</label>
              <input 
                type="number" 
                step="any"
                className="input" 
                value={formData.ses_value} 
                onChange={ev => setFormData({...formData, ses_value: ev.target.value})} 
              />
            </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">SES STATUS</label>
                   <select className="input" value={formData.status} onChange={ev => setFormData({...formData, status: ev.target.value})}>
                     <option value="Pending">Pending</option>
                     <option value="Received">Received</option>
                     <option value="Returned for Revision">Returned for Revision</option>
                     <option value="Approved">Approved</option>
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
          entityName="SES Record"
          entityType="ses"
          apiEndpoint="/api/ses"
          onSuccess={fetchData}
          expectedHeaders={['proforma_inv_id', 'itp_po_id', 'ses_no', 'ses_date', 'ses_value', 'status']}
        />
    </div>
  );
}
