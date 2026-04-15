"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { EnhancedBatchUploadModal } from "@/components/EnhancedBatchUploadModal";
import { Plus, Edit, Trash2, UploadCloud } from "lucide-react";
import { todayISO } from "@/lib/dateUtils";

export default function ProformaPage() {
  const [data, setData] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [itpPos, setItpPos] = useState<any[]>([]);
  const [poRecords, setPoRecords] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  const initialForm = {
    inspection_id: "",
    itp_po_id: "",
    po_no: "",
    sr_so_no: "",
    proforma_inv_no: "",
    proforma_inv_date: "",
    sap_sales_order: "",
    invoice_no: "",
    invoice_date: "",
    conso_invoice_no: "",
    conso_filename: "",
    total_amount: ""
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices', { cache: 'no-store' });
      const d = await res.json();
      // Filter to show only rows that have proforma_inv_no but no invoice_no (proforma stage)
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
        fetch('/api/inspections', { cache: 'no-store' }).then(r => r.json()).then(d => setInspections(Array.isArray(d) ? d : [])),
        fetch('/api/monitoring', { cache: 'no-store' }).then(r => r.json()).then(d => setItpPos(Array.isArray(d) ? d : [])),
        fetch('/api/po_records', { cache: 'no-store' }).then(r => r.json()).then(d => setPoRecords(Array.isArray(d) ? d : []))
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
    inspection_id: "",
    itp_po_id: "",
    po_no: "",
    sr_so_no: "",
    proforma_inv_no: "",
    proforma_inv_date: todayISO(),
    sap_sales_order: "",
    invoice_no: "",
    invoice_date: "",
    conso_invoice_no: "",
    conso_filename: "",
    total_amount: ""
  });

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    if (!formData.inspection_id) {
      setFormError("Please select an inspection before creating a proforma.");
      return;
    }

    const url = editingItem ? `/api/invoices/${editingItem.id}` : '/api/invoices';
    const method = editingItem ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error || "Failed to save proforma.");
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
    { key: "proforma_inv_date", label: "PROFORMA DATE", render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: "po_no", label: "PO NO" },
    { key: "sap_sales_order", label: "SAP SALES ORDER" },
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
    if (!confirm(`Delete ${ids.length} proforma(s)?`)) return;
    await Promise.all(ids.map(id => fetch(`/api/invoices/${id}`, { method: 'DELETE' })));
    fetchData();
  };

  const batchActions = [
    { label: "Delete", icon: <Trash2 size={14} />, variant: "danger" as const, onClick: handleBatchDelete }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Proforma Invoices</h1>
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
                    setFormData(getNewInvoiceForm());
                    setIsModalOpen(true);
                }}
                className="btn-primary flex items-center gap-2"
            >
                <Plus size={18} /> Add Proforma
            </button>
        </div>
      </div>

      {loading ? (
         <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
         <DataTable data={data} columns={columns} searchKey="proforma_inv_no" batchActions={batchActions} />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Proforma" : "New Proforma"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          {formError && (
            <div className="col-span-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {formError}
            </div>
          )}

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-gray-300">INSPECTION (visit_ref)</label>
                <select
                  className="input !bg-[#0f1117]"
                  value={formData.inspection_id}
                  onChange={ev => setFormData({...formData, inspection_id: ev.target.value})}
                >
                  <option value="">Select inspection...</option>
                  {inspections.map((opt: any) => (
                    <option key={opt.visit_ref} value={opt.visit_ref}>{opt.report_no || opt.visit_ref} — {opt.project_name || 'No project'}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
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
                <label className="text-sm font-medium text-gray-300">PO NUMBER</label>
                <select
                  className="input !bg-[#0f1117]"
                  value={formData.po_no}
                  onChange={ev => setFormData({...formData, po_no: ev.target.value})}
                >
                  <option value="">Select PO...</option>
                  {poRecords.map((opt: any) => (
                    <option key={opt.id} value={opt.po_no}>{opt.po_no} - {opt.client_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">SR/SO NO. (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.sr_so_no}
                  onChange={ev => setFormData({...formData, sr_so_no: ev.target.value})}
                />
              </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">PROFORMA INV NO</label>
              <input
                type="text"
                step="any"
                className="input"
                value={formData.proforma_inv_no}
                onChange={ev => setFormData({...formData, proforma_inv_no: ev.target.value})}
              />
            </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">PROFORMA INV DATE</label>
                <input
                  type="date"
                  className="input"
                  value={formData.proforma_inv_date}
                  onChange={ev => setFormData({...formData, proforma_inv_date: ev.target.value})}
                />
              </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">SAP SALES ORDER</label>
              <input
                type="text"
                step="any"
                className="input"
                value={formData.sap_sales_order}
                onChange={ev => setFormData({...formData, sap_sales_order: ev.target.value})}
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


          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#2d2f3d]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </FormModal>

      <EnhancedBatchUploadModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          entityName="Proforma"
          entityType="invoices"
          apiEndpoint="/api/invoices"
          onSuccess={fetchData}
          expectedHeaders={['visit_ref', 'inspection_id', 'itp_po_id', 'po_no', 'sr_so_no', 'proforma_inv_no', 'proforma_inv_date', 'sap_sales_order', 'total_amount']}
      />
    </div>
  );
}
