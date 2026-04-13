
"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Edit, Trash2, UploadCloud, Info } from "lucide-react";

// Master field definitions
const ALL_FIELDS: { key: string; label: string; type: string }[] = [
  { key: "project_id", label: "Project", type: "relation" },
  { key: "inspector_id", label: "Inspector", type: "relation" },
  { key: "report_no", label: "Report No", type: "text" },
  { key: "coordinator_name", label: "Coordinator Name", type: "text" },
  { key: "vendor_location", label: "Vendor / Location", type: "text" },
  { key: "inspection_start_date", label: "Inspection Start Date", type: "date" },
  { key: "inspection_end_date", label: "Inspection End Date", type: "date" },
  { key: "work_duration", label: "Work Duration", type: "number" },
  { key: "ot_duration", label: "OT Duration", type: "number" },
  { key: "duration_tag", label: "Duration Tag", type: "select" },
  { key: "travel_routing", label: "Travel Routing", type: "text" },
  { key: "mileage", label: "Mileage", type: "number" },
  { key: "expenses_amount", label: "Expenses Amount", type: "number" },
  { key: "ts_filename", label: "Timesheet Filename", type: "text" },
  { key: "ts_file_verified", label: "TS Verified", type: "boolean" },
];

export default function InspectionPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Preset-aware state
  const [visibleFields, setVisibleFields] = useState<string[] | null>(null); // null = show all
  const [presetName, setPresetName] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});

  const initialForm: Record<string, any> = {
    project_id: "", inspector_id: "", report_no: "", coordinator_name: "",
    vendor_location: "", inspection_start_date: "", inspection_end_date: "",
    work_duration: "", ot_duration: "", duration_tag: "Hrs.",
    travel_routing: "", mileage: "", expenses_amount: "",
    ts_filename: "", ts_file_verified: false,
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inspections', { cache: 'no-store' });
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const fetchRelationships = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/projects', { cache: 'no-store' }),
        fetch('/api/inspectors', { cache: 'no-store' }),
      ]);
      const pData = await pRes.json();
      const iData = await iRes.json();
      setProjects(Array.isArray(pData) ? pData : []);
      setInspectors(Array.isArray(iData) ? iData : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); fetchRelationships(); }, []);

  // When user changes the project dropdown, resolve the preset
  const handleProjectChange = async (projectId: string) => {
    setFormData(prev => ({ ...prev, project_id: projectId }));
    if (!projectId) {
      setVisibleFields(null);
      setPresetName(null);
      setDefaultValues({});
      return;
    }
    try {
      const res = await fetch(`/api/resolve-preset?project_id=${projectId}`, { cache: 'no-store' });
      const result = await res.json();
      if (result.showAll || !result.preset) {
        setVisibleFields(null);
        setPresetName(null);
        setDefaultValues({});
      } else {
        setVisibleFields(result.preset.visible_fields.inspection || null);
        setPresetName(result.preset.name);
        // Apply defaults
        const dv = result.preset.default_values || {};
        setDefaultValues(dv);
        setFormData(prev => ({
          ...prev,
          duration_tag: dv.duration_tag || prev.duration_tag,
        }));
      }
    } catch (err) {
      console.error(err);
      setVisibleFields(null);
      setPresetName(null);
    }
  };

  const isFieldVisible = (fieldKey: string) => {
    // Always show project_id and inspector_id
    if (fieldKey === 'project_id' || fieldKey === 'inspector_id') return true;
    if (visibleFields === null) return true; // show all
    return visibleFields.includes(fieldKey);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const url = editingItem ? `/api/inspections/${editingItem.id}` : '/api/inspections';
    const method = editingItem ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialForm);
    setVisibleFields(null);
    setPresetName(null);
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this inspection?")) {
      await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    const fd: any = {};
    Object.keys(initialForm).forEach(k => {
      if (k.includes('date') && item[k]) {
        fd[k] = new Date(item[k]).toISOString().split('T')[0];
      } else {
        fd[k] = item[k] !== null && item[k] !== undefined ? item[k] : "";
      }
    });
    setFormData(fd);
    setIsModalOpen(true);
    // Resolve preset for this item's project
    if (item.project_id) handleProjectChange(item.project_id);
  };

  const columns = [
    { key: "report_no", label: "REPORT NO" },
    { key: "coordinator_name", label: "COORDINATOR" },
    { key: "vendor_location", label: "LOCATION" },
    { key: "inspection_start_date", label: "START DATE", render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: "inspection_end_date", label: "END DATE", render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: "work_duration", label: "DURATION", render: (val: any, row: any) => val ? `${val} ${row.duration_tag || 'Hrs.'}` : '—' },
    { key: "ot_duration", label: "OT", render: (val: any) => val ? String(val) : '—' },
    { key: "travel_routing", label: "TRAVEL" },
    { key: "mileage", label: "MILEAGE", render: (val: any) => val ? Number(val).toLocaleString() : '—' },
    { key: "expenses_amount", label: "EXPENSES", render: (val: any) => val ? Number(val).toLocaleString() : '—' },
    { key: "ts_filename", label: "TIMESHEET" },
    { key: "ts_file_verified", label: "VERIFIED", render: (val: any) => val ? '✓' : '✗' },
    { key: "created_at", label: "CREATED", render: (val: any) => val ? new Date(val).toLocaleDateString() : '—' },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(row)} className="text-orange-500 hover:text-orange-400 p-1"><Edit size={18} /></button>
          <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={18} /></button>
        </div>
      )
    }
  ];

  // Render a single form field
  const renderField = (f: { key: string; label: string; type: string }) => {
    if (!isFieldVisible(f.key)) return null;

    if (f.key === 'project_id') {
      return (
        <div key={f.key} className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-gray-300">PROJECT</label>
          <select className="input !bg-[#111827]" value={formData.project_id} onChange={ev => handleProjectChange(ev.target.value)}>
            <option value="">Select project...</option>
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_name || p.id}</option>)}
          </select>
        </div>
      );
    }
    if (f.key === 'inspector_id') {
      return (
        <div key={f.key} className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-gray-300">INSPECTOR</label>
          <select className="input !bg-[#111827]" value={formData.inspector_id} onChange={ev => setFormData({...formData, inspector_id: ev.target.value})}>
            <option value="">Select inspector...</option>
            {inspectors.map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.id}</option>)}
          </select>
        </div>
      );
    }
    if (f.key === 'duration_tag') {
      return (
        <div key={f.key} className="space-y-2">
          <label className="text-sm font-medium text-gray-300">{f.label}</label>
          <select className="input" value={formData.duration_tag} onChange={ev => setFormData({...formData, duration_tag: ev.target.value})}>
            <option value="Hrs.">Hours</option>
            <option value="Days">Days</option>
          </select>
        </div>
      );
    }
    if (f.key === 'ts_file_verified') {
      return (
        <div key={f.key} className="space-y-2">
          <label className="text-sm font-medium text-gray-300">{f.label}</label>
          <select className="input" value={String(formData.ts_file_verified)} onChange={ev => setFormData({...formData, ts_file_verified: ev.target.value === 'true'})}>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </div>
      );
    }

    return (
      <div key={f.key} className="space-y-2">
        <label className="text-sm font-medium text-gray-300">{f.label}</label>
        <input
          type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
          step="any"
          className="input"
          value={formData[f.key] || ""}
          onChange={ev => setFormData({...formData, [f.key]: ev.target.value})}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Inspections</h1>
        <div className="flex gap-3">
          <button onClick={() => setIsBatchModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <UploadCloud size={18} /> Batch Input
          </button>
          <button onClick={() => { setEditingItem(null); setFormData(initialForm); setVisibleFields(null); setPresetName(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Inspection
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card text-center text-gray-400 animate-pulse">Loading data...</div>
      ) : (
        <DataTable data={data} columns={columns} searchKey="report_no" />
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Edit Inspection" : "New Inspection"}>
        {presetName && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-400">
            <Info size={16} />
            <span>Active Preset: <strong>{presetName}</strong> — Only relevant fields are shown.</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-4">
          {ALL_FIELDS.map(f => renderField(f))}
          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-[#374151]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Inspection</button>
          </div>
        </form>
      </FormModal>

      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        entityName="Inspection"
        apiEndpoint="/api/inspections"
        onSuccess={fetchData}
        expectedHeaders={ALL_FIELDS.map(f => f.key)}
      />
    </div>
  );
}
