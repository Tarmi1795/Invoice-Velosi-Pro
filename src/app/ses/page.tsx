
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Edit, Trash2, UploadCloud, Info } from "lucide-react";

const ALL_FIELDS: { key: string; label: string; type: string }[] = [
  { key: "proforma_inv_id", label: "Invoice (Proforma/Comm.)", type: "relation" },
  { key: "ses_no", label: "SES Number", type: "text" },
  { key: "ses_date", label: "SES Date", type: "date" },
  { key: "ses_value", label: "SES Value", type: "number" },
  { key: "sap_work_order", label: "SAP Work Order", type: "text" },
  { key: "status", label: "SES Status", type: "ses_status" },
];

export default function SESRecordPage() {
  const [data, setData] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [visibleFields, setVisibleFields] = useState<string[] | null>(null);
  const [presetName, setPresetName] = useState<string | null>(null);

  const initialForm: Record<string, any> = {
    proforma_inv_id: "", ses_no: "", ses_date: "",
    ses_value: "", sap_work_order: "", status: "Pending",
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ses', { cache: 'no-store' });
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchRelationships = async () => {
    try {
      const res = await fetch('/api/invoices', { cache: 'no-store' });
      const d = await res.json();
      setInvoices(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); fetchRelationships(); }, []);

  const isFieldVisible = (key: string) => {
    if (key === 'proforma_inv_id') return true;
    if (visibleFields === null) return true;
    return visibleFields.includes(key);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const url = editingItem ? `/api/ses/${editingItem.id}` : '/api/ses';
    const method = editingItem ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setIsModalOpen(false); setEditingItem(null); setFormData(initialForm);
    setVisibleFields(null); setPresetName(null);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this SES record?")) { await fetch(`/api/ses/${id}`, { method: 'DELETE' }); fetchData(); }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    const fd: any = {};
    Object.keys(initialForm).forEach(k => {
      if (k.includes('date') && item[k]) fd[k] = new Date(item[k]).toISOString().split('T')[0];
      else fd[k] = item[k] !== null && item[k] !== undefined ? item[k] : "";
    });
    setFormData(fd);
    setIsModalOpen(true);
  };

  const columns = [
    { key: "ses_no", label: "SES NO" },
    { key: "ses_value", label: "SES VALUE", render: (val: any) => val ? `QAR ${Number(val).toLocaleString()}` : '—' },
    { key: "status", label: "STATUS", render: (val: any) => <StatusBadge status={val} /> },
    {
      key: "actions", label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="text-orange-500 hover:text-orange-400 p-1"><Edit size={18} /></button>
          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={18} /></button>
        </div>
      )
    }
  ];

  const renderField = (f: { key: string; label: string; type: string }) => {
    if (!isFieldVisible(f.key)) return null;
    if (f.key === 'proforma_inv_id') {
      return (
        <div key={f.key} className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-gray-300">LINKED INVOICE</label>
          <select className="input !bg-[#111827]" value={formData.proforma_inv_id} onChange={ev => setFormData({...formData, proforma_inv_id: ev.target.value})}>
            <option value="">Select invoice...</option>
            {invoices.map((p: any) => <option key={p.id} value={p.id}>{p.invoice_no || p.proforma_inv_no || p.id}</option>)}
          </select>
        </div>
      );
    }
    if (f.key === 'status') {
      return (
        <div key={f.key} className="space-y-2">
          <label className="text-sm font-medium text-gray-300">{f.label}</label>
          <select className="input" value={formData.status} onChange={ev => setFormData({...formData, status: ev.target.value})}>
            <option value="Pending">Pending</option>
            <option value="Received">Received</option>
            <option value="Returned for Revision">Returned for Revision</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      );
    }
    return (
      <div key={f.key} className="space-y-2">
        <label className="text-sm font-medium text-gray-300">{f.label}</label>
        <input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} step="any" className="input"
          value={formData[f.key] || ""} onChange={ev => setFormData({...formData, [f.key]: ev.target.value})} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">SES Tracking</h1>
        <div className="flex gap-3">
          <button onClick={() => setIsBatchModalOpen(true)} className="btn-secondary flex items-center gap-2"><UploadCloud size={18} /> Batch Input</button>
          <button onClick={() => { setEditingItem(null); setFormData(initialForm); setVisibleFields(null); setPresetName(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add SES Record</button>
        </div>
      </div>
      {loading ? <div className="card text-center text-gray-400 animate-pulse">Loading data...</div> : <DataTable data={data} columns={columns} searchKey="ses_no" />}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit SES Record" : "New SES Record"}>
        {presetName && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-400">
            <Info size={16} /><span>Active Preset: <strong>{presetName}</strong></span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          {ALL_FIELDS.map(f => renderField(f))}
          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#374151]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save SES Record</button>
          </div>
        </form>
      </FormModal>

      <BatchUploadModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} entityName="SES Record" apiEndpoint="/api/ses" onSuccess={fetchData} expectedHeaders={ALL_FIELDS.map(f => f.key)} />
    </div>
  );
}
