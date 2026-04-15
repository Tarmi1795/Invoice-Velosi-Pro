"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit, Trash2, Brain, Search, RefreshCw } from "lucide-react";

const ENTITY_TYPES = ["clients", "projects", "inspections", "invoices", "ses", "inspectors"];

const AVAILABLE_FIELDS: Record<string, string[]> = {
  clients: ["client_name", "contract_no", "currency", "original_contract_value", "running_balance", "description", "contract_start_date", "contract_end_date", "preset_id"],
  projects: ["contract_no", "project_name", "po_no", "itp_code", "focal_name", "focal_email", "active_status"],
  inspections: ["project_name", "employee_no", "report_no", "coordinator_name", "vendor_location", "inspection_start_date", "inspection_end_date", "work_duration", "ot_duration", "duration_tag", "travel_routing", "mileage", "expenses_amount", "ts_filename", "ts_file_verified"],
  invoices: ["inspection_id", "proforma_inv_no", "proforma_inv_date", "sap_sales_order", "invoice_no", "invoice_date", "conso_invoice_no", "conso_filename", "total_amount", "credit_memo_no", "credit_memo_amount", "payment_status"],
  ses: ["proforma_inv_id", "ses_no", "ses_date", "ses_value", "sap_work_order", "status"],
  inspectors: ["full_name", "job_title", "base_location"],
};

interface TrainingData {
  id: string;
  entity_type: string;
  excel_header: string;
  db_field: string;
  instruction: string | null;
  use_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export default function ColumnMappingsPage() {
  const [data, setData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TrainingData | null>(null);
  const [formData, setFormData] = useState({
    entity_type: "",
    excel_header: "",
    db_field: "",
    instruction: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = entityFilter ? `/api/training-data?entityType=${entityFilter}` : "/api/training-data";
      const res = await fetch(url);
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entityFilter]);

  const filteredData = data.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.excel_header.toLowerCase().includes(s) ||
      item.db_field.toLowerCase().includes(s) ||
      (item.instruction && item.instruction.toLowerCase().includes(s))
    );
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ entity_type: "invoices", excel_header: "", db_field: "", instruction: "" });
    setShowModal(true);
  };

  const openEditModal = (item: TrainingData) => {
    setEditingItem(item);
    setFormData({
      entity_type: item.entity_type,
      excel_header: item.excel_header,
      db_field: item.db_field,
      instruction: item.instruction || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await fetch("/api/training-data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...formData }),
        });
      } else {
        await fetch("/api/training-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this training mapping?")) return;
    try {
      await fetch(`/api/training-data?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "training": return "🏷️";
      case "rules": return "📋";
      case "llm": return "🤖";
      case "user": return "👤";
      default: return "❓";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Brain className="text-orange-500" size={28} />
          <h1 className="text-2xl font-bold text-white">Column Mapping Training Data</h1>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Mapping Rule
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-[#374151] flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search headers, fields, instructions..."
              className="input !pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input !w-48"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="">All Entity Types</option>
            {ENTITY_TYPES.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 animate-pulse">Loading...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Brain size={48} className="mx-auto mb-3 opacity-50" />
            <p>No training data found.</p>
            <p className="text-sm mt-1">Add mapping rules to teach the AI how to map Excel columns to database fields.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#111827]/50 border-b border-[#374151]">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Entity</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Excel Header</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Maps To</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Instruction</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Uses</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374151]">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-[#374151]/30">
                    <td className="px-4 py-3">
                      <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded">
                        {item.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-mono text-sm">{item.excel_header}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-400 font-mono text-sm">{item.db_field}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm max-w-[200px] truncate" title={item.instruction || ""}>
                      {item.instruction || <span className="text-gray-600 italic">No instruction</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-[#374151] px-2 py-1 rounded text-sm text-white">{item.use_count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(item)} className="text-orange-500 hover:text-orange-400 p-1">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center">
        Training data is automatically saved when you correct column mappings during AI batch uploads.
      </p>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1f2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center border-b border-[#374151] pb-4 mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Brain className="text-orange-500" size={20} />
                {editingItem ? "Edit Mapping Rule" : "Add Mapping Rule"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Entity Type</label>
                <select
                  className="input"
                  value={formData.entity_type}
                  onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                  required
                >
                  {ENTITY_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Excel Header (normalized)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., invoice_no, po_no, amount"
                  value={formData.excel_header}
                  onChange={(e) => setFormData({ ...formData, excel_header: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                  required
                />
                <p className="text-xs text-gray-500">Only lowercase letters, numbers, and underscores</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Maps To Database Field</label>
                <select
                  className="input"
                  value={formData.db_field}
                  onChange={(e) => setFormData({ ...formData, db_field: e.target.value })}
                  required
                >
                  <option value="">Select field...</option>
                  {(AVAILABLE_FIELDS[formData.entity_type] || []).map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Instruction (optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., PO always means ITP code"
                  value={formData.instruction}
                  onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Helpful context for future AI mappings. This is shown when the AI is unsure.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#374151]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}