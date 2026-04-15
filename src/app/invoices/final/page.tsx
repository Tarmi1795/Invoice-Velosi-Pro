"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { todayISO } from "@/lib/dateUtils";

interface Proforma {
  id: string;
  inspection_id: string | null;
  proforma_inv_no: string | null;
  proforma_inv_date: string | null;
  sap_sales_order: string | null;
  total_amount: number | null;
  payment_status: string | null;
  created_at: string | null;
  // joined data
  inspections_summary?: {
    project_name: string | null;
    projects?: {
      project_name: string | null;
      clients_and_contracts?: {
        preset_id: string | null;
        workflow_presets?: {
          workflow_steps: string | null;
        };
      };
    };
  };
}

export default function FinalInvoicePage() {
  const [data, setData] = useState<any[]>([]);
  const [proformas, setProformas] = useState<any[]>([]);
  const [sesRecords, setSesRecords] = useState<any[]>([]);
  const [workflowPresets, setWorkflowPresets] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  const initialForm = {
    proforma_inv_id: "",
    invoice_no: "",
    invoice_date: "",
    conso_invoice_no: "",
    conso_filename: "",
    total_amount: "",
    payment_status: "Pending"
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices', { cache: 'no-store' });
      const d = await res.json();
      // Filter to show only rows that have invoice_no (final invoice stage)
      setData(Array.isArray(d) ? d.filter((item: any) => item.invoice_no) : []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationships = async () => {
    try {
      await Promise.all([
        // Fetch all proformas for the dropdown
        fetch('/api/invoices', { cache: 'no-store' })
          .then(r => r.json())
          .then(d => setProformas(Array.isArray(d) ? d.filter((item: any) => item.proforma_inv_no && !item.invoice_no) : [])),
        // Fetch SES records
        fetch('/api/ses', { cache: 'no-store' })
          .then(r => r.json())
          .then(d => setSesRecords(Array.isArray(d) ? d : [])),
        // Fetch workflow presets
        fetch('/api/presets', { cache: 'no-store' })
          .then(r => r.json())
          .then(d => setWorkflowPresets(Array.isArray(d) ? d : []))
      ]);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRelationships();
  }, []);

  const getNewInvoiceForm = () => ({
    proforma_inv_id: "",
    invoice_no: "",
    invoice_date: todayISO(),
    conso_invoice_no: "",
    conso_filename: "",
    total_amount: "",
    payment_status: "Pending"
  });

  const checkSesRequired = (proformaId: string): { required: boolean; message: string } => {
    const proforma = proformas.find((p: any) => p.id === proformaId);
    if (!proforma) return { required: false, message: "" };

    // Get inspection to find project
    const inspectionId = proforma.inspection_id;
    // For now, check if any SES record exists for this proforma
    const sesForProforma = sesRecords.filter((s: any) => s.proforma_inv_id === proformaId);

    // TODO: implement full workflow check via workflow_presets
    // For now, just check if SES exists - user can override if not required
    if (sesForProforma.length === 0) {
      return {
        required: true,
        message: "SES approval required for this client workflow. Create SES first."
      };
    }

    return { required: false, message: "" };
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    if (!formData.proforma_inv_id) {
      setFormError("Please select a Proforma Invoice before creating a Final Invoice.");
      return;
    }

    // Check SES requirement
    const sesCheck = checkSesRequired(formData.proforma_inv_id);
    if (sesCheck.required) {
      setFormError(sesCheck.message);
      return;
    }

    // Find the proforma to get related data
    const proforma = proformas.find((p: any) => p.id === formData.proforma_inv_id);
    if (!proforma) {
      setFormError("Selected proforma not found.");
      return;
    }

    const submitData = {
      inspection_id: proforma.inspection_id,
      proforma_inv_no: proforma.proforma_inv_no,
      proforma_inv_date: proforma.proforma_inv_date,
      invoice_no: formData.invoice_no,
      invoice_date: formData.invoice_date || null,
      conso_invoice_no: formData.conso_invoice_no,
      conso_filename: formData.conso_filename,
      total_amount: formData.total_amount ? Number(formData.total_amount) : null,
      payment_status: formData.payment_status
    };

    const url = editingItem ? `/api/invoices/${editingItem.id}` : '/api/invoices';
    const method = editingItem ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData)
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error || "Failed to save final invoice.");
      return;
    }

    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialForm);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item?")) {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
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
    { key: "proforma_inv_no", label: "PROFORMA NO" },
    { key: "invoice_no", label: "INVOICE NO" },
    { key: "invoice_date", label: "INVOICE DATE", render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: "total_amount", label: "TOTAL AMOUNT" },
    { key: "payment_status", label: "STATUS" },
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
    if (!confirm(`Delete ${ids.length} final invoice(s)?`)) return;
    await Promise.all(ids.map(id => fetch(`/api/invoices/${id}`, { method: 'DELETE' })));
    fetchData();
  };

  const batchActions = [
    { label: "Delete", icon: <Trash2 size={14} />, variant: "danger" as const, onClick: handleBatchDelete }
  ];

  const sesCheck = formData.proforma_inv_id ? checkSesRequired(formData.proforma_inv_id) : { required: false, message: "" };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Final Invoices</h1>
        <button
            onClick={() => {
                setEditingItem(null);
                setFormData(getNewInvoiceForm());
                setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
        >
            <Plus size={18} /> Add Final Invoice
        </button>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="invoice_no" batchActions={batchActions} />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Final Invoice" : "New Final Invoice"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          {formError && (
            <div className="col-span-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              {formError}
            </div>
          )}

          {sesCheck.required && (
            <div className="col-span-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              {sesCheck.message}
            </div>
          )}

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">PROFORMA INVOICE</label>
                <select
                  className="input !bg-[#0f1117]"
                  value={formData.proforma_inv_id}
                  onChange={ev => setFormData({...formData, proforma_inv_id: ev.target.value})}
                  disabled={!!editingItem}
                >
                  <option value="">Select Proforma Invoice...</option>
                  {proformas.map((opt: any) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.proforma_inv_no} — {opt.total_amount ? `QAR ${opt.total_amount.toLocaleString()}` : 'No amount'} — {opt.sap_sales_order || 'No SO'}
                    </option>
                  ))}
                </select>
              </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">INVOICE NO</label>
              <input
                type="text"
                step="any"
                className="input"
                value={formData.invoice_no}
                onChange={ev => setFormData({...formData, invoice_no: ev.target.value})}
              />
            </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">INVOICE DATE</label>
                <input
                  type="date"
                  className="input"
                  value={formData.invoice_date}
                  onChange={ev => setFormData({...formData, invoice_date: ev.target.value})}
                />
              </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">CONSO INVOICE NO</label>
              <input
                type="text"
                step="any"
                className="input"
                value={formData.conso_invoice_no}
                onChange={ev => setFormData({...formData, conso_invoice_no: ev.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">CONSO FILENAME</label>
              <input
                type="text"
                step="any"
                className="input"
                value={formData.conso_filename}
                onChange={ev => setFormData({...formData, conso_filename: ev.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">TOTAL AMOUNT</label>
              <input
                type="number"
                step="any"
                className="input"
                value={formData.total_amount}
                onChange={ev => setFormData({...formData, total_amount: ev.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">PAYMENT STATUS</label>
              <select
                className="input"
                value={formData.payment_status}
                onChange={ev => setFormData({...formData, payment_status: ev.target.value})}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>


          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#2d2f3d]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
