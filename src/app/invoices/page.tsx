
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Edit, Trash2, UploadCloud, Info, Printer, FileText } from "lucide-react";

const ALL_FIELDS: { key: string; label: string; type: string }[] = [
  { key: "inspection_id", label: "Inspection (Report)", type: "relation" },
  { key: "proforma_inv_no", label: "Proforma Invoice No", type: "text" },
  { key: "proforma_inv_date", label: "Proforma Invoice Date", type: "date" },
  { key: "sap_sales_order", label: "SAP Sales Order", type: "text" },
  { key: "invoice_no", label: "Commercial Invoice No", type: "text" },
  { key: "invoice_date", label: "Invoice Date", type: "date" },
  { key: "conso_invoice_no", label: "Consolidated Invoice No", type: "text" },
  { key: "conso_filename", label: "Conso Filename", type: "text" },
  { key: "total_amount", label: "Total Amount", type: "number" },
  { key: "credit_memo_no", label: "Credit Memo No", type: "text" },
  { key: "credit_memo_amount", label: "Credit Memo Amount", type: "number" },
  { key: "payment_status", label: "Payment Status", type: "status" },
];

export default function InvoicePage() {
  const [data, setData] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [visibleFields, setVisibleFields] = useState<string[] | null>(null);
  const [presetName, setPresetName] = useState<string | null>(null);

  const initialForm: Record<string, any> = {
    inspection_id: "", proforma_inv_no: "", proforma_inv_date: "",
    sap_sales_order: "", invoice_no: "", invoice_date: "",
    conso_invoice_no: "", conso_filename: "", total_amount: "",
    credit_memo_no: "", credit_memo_amount: "", payment_status: "Pending",
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?_=${Date.now()}`, { cache: 'no-store' });
      console.log('GET /api/invoices status:', res.status);
      const d = await res.json();
      console.log('GET /api/invoices data:', JSON.stringify(d, null, 2));
      setData(Array.isArray(d) ? d : []);
    } catch (err) { console.error('fetchData error:', err); }
    finally { setLoading(false); }
  };

  const fetchRelationships = async () => {
    try {
      const res = await fetch('/api/inspections', { cache: 'no-store' });
      const d = await res.json();
      setInspections(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); fetchRelationships(); }, []);

  // When inspection changes, resolve preset via project chain
  const handleInspectionChange = async (inspectionId: string) => {
    setFormData(prev => ({ ...prev, inspection_id: inspectionId }));
    if (!inspectionId) { setVisibleFields(null); setPresetName(null); return; }
    const inspection = inspections.find(i => i.id === inspectionId);
    if (inspection?.project_id) {
      try {
        const res = await fetch(`/api/resolve-preset?project_id=${inspection.project_id}`, { cache: 'no-store' });
        const result = await res.json();
        if (result.showAll || !result.preset) {
          setVisibleFields(null); setPresetName(null);
        } else {
          setVisibleFields(result.preset.visible_fields.invoice || null);
          setPresetName(result.preset.name);
        }
      } catch { setVisibleFields(null); setPresetName(null); }
    }
  };

  const isFieldVisible = (key: string) => {
    if (key === 'inspection_id') return true;
    if (visibleFields === null) return true;
    return visibleFields.includes(key);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const url = editingItem ? `/api/invoices/${editingItem.id}` : '/api/invoices';
    const method = editingItem ? 'PUT' : 'POST';
    
    const payload = { ...formData };
    if (payload.total_amount) payload.total_amount = Number(payload.total_amount);
    if (payload.credit_memo_amount) payload.credit_memo_amount = Number(payload.credit_memo_amount);
    if (payload.inspection_id === '') payload.inspection_id = null;
    
    console.log('Submitting:', JSON.stringify(payload, null, 2));
    
    const result = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload)
    });
    
    const responseData = await result.json();
    console.log('Response:', result.status, JSON.stringify(responseData, null, 2));
    
    if (!result.ok) {
      alert('Failed to save: ' + (responseData.error || result.statusText));
      return;
    }
    setIsModalOpen(false); setEditingItem(null); setFormData(initialForm);
    setVisibleFields(null); setPresetName(null);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this invoice?")) { await fetch(`/api/invoices/${id}`, { method: 'DELETE' }); fetchData(); }
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
    if (item.inspection_id) handleInspectionChange(item.inspection_id);
  };

  const columns = [
    { key: "invoice_no", label: "INVOICE NO" },
    { key: "proforma_inv_no", label: "PROFORMA NO" },
    { key: "total_amount", label: "AMOUNT", render: (val: any) => val ? `QAR ${Number(val).toLocaleString()}` : '—' },
    { key: "payment_status", label: "STATUS", render: (val: any) => <StatusBadge status={val} /> },
    {
      key: "actions", label: "Actions",
      render: (_: any, row: any) => (
      <div className="flex items-center gap-2">
          <button 
            onClick={() => window.open(`/api/generate-invoice?invoice_id=${row.id}&print=1`, '_blank')}
            className="text-orange-500 hover:text-orange-400 p-1"
            title="Export to PDF"
          >
            <FileText size={18} />
          </button>
          <button 
            onClick={() => window.open(`/api/generate-invoice?invoice_id=${row.id}`, '_blank')}
            className="text-gray-400 hover:text-white p-1"
            title="Preview HTML"
          >
            <Printer size={18} />
          </button>
          <button onClick={() => openEditModal(row)} className="text-orange-500 hover:text-orange-400 p-1"><Edit size={18} /></button>
          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={18} /></button>
        </div>
      )
    }
  ];

  const renderField = (f: { key: string; label: string; type: string }) => {
    if (!isFieldVisible(f.key)) return null;
    if (f.key === 'inspection_id') {
      return (
        <div key={f.key} className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-gray-300">INSPECTION (REPORT)</label>
          <select className="input !bg-[#111827]" value={formData.inspection_id} onChange={ev => handleInspectionChange(ev.target.value)}>
            <option value="">Select inspection...</option>
            {inspections.map((p: any) => <option key={p.id} value={p.id}>{p.report_no || p.id}</option>)}
          </select>
        </div>
      );
    }
    if (f.key === 'payment_status') {
      return (
        <div key={f.key} className="space-y-2">
          <label className="text-sm font-medium text-gray-300">{f.label}</label>
          <select className="input" value={formData.payment_status} onChange={ev => setFormData({...formData, payment_status: ev.target.value})}>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="With Term">With Term</option>
            <option value="Cancelled">Cancelled</option>
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
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <div className="flex gap-3">
          <button onClick={() => setIsBatchModalOpen(true)} className="btn-secondary flex items-center gap-2"><UploadCloud size={18} /> Batch Input</button>
          <button onClick={() => { setEditingItem(null); setFormData(initialForm); setVisibleFields(null); setPresetName(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Invoice</button>
        </div>
      </div>
      {loading ? <div className="card text-center text-gray-400 animate-pulse">Loading data...</div> : <DataTable data={data} columns={columns} searchKey="invoice_no" />}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Invoice" : "New Invoice"}>
        {presetName && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-400">
            <Info size={16} /><span>Active Preset: <strong>{presetName}</strong></span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          {ALL_FIELDS.map(f => renderField(f))}
          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#374151]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Invoice</button>
          </div>
        </form>
      </FormModal>

      <BatchUploadModal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} entityName="Invoice" apiEndpoint="/api/invoices" onSuccess={fetchData} expectedHeaders={ALL_FIELDS.map(f => f.key)} />
    </div>
  );
}
