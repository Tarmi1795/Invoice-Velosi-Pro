"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/FormModal";
import { Plus, Edit, Trash2, Settings, Check, Building2, Landmark, PhoneCall } from "lucide-react";

// Master list of ALL possible fields across inspections, invoices, and SES
const ALL_INSPECTION_FIELDS = [
  { key: "coordinator_name", label: "Coordinator Name" },
  { key: "vendor_location", label: "Vendor / Location" },
  { key: "inspection_start_date", label: "Inspection Start Date" },
  { key: "inspection_end_date", label: "Inspection End Date" },
  { key: "report_no", label: "Report No" },
  { key: "work_duration", label: "Work Duration" },
  { key: "ot_duration", label: "OT Duration" },
  { key: "duration_tag", label: "Duration Tag (Hrs/Days)" },
  { key: "travel_routing", label: "Travel Routing" },
  { key: "mileage", label: "Mileage" },
  { key: "expenses_amount", label: "Expenses Amount" },
  { key: "ts_filename", label: "Timesheet Filename" },
  { key: "ts_file_verified", label: "Timesheet Verified" },
];

const ALL_INVOICE_FIELDS = [
  { key: "proforma_inv_no", label: "Proforma Invoice No" },
  { key: "proforma_inv_date", label: "Proforma Invoice Date" },
  { key: "sap_sales_order", label: "SAP Sales Order" },
  { key: "invoice_no", label: "Commercial Invoice No" },
  { key: "invoice_date", label: "Invoice Date" },
  { key: "conso_invoice_no", label: "Consolidated Invoice No" },
  { key: "conso_filename", label: "Conso Filename" },
  { key: "total_amount", label: "Total Amount" },
  { key: "credit_memo_no", label: "Credit Memo No" },
  { key: "credit_memo_amount", label: "Credit Memo Amount" },
  { key: "payment_status", label: "Payment Status" },
];

const ALL_SES_FIELDS = [
  { key: "ses_no", label: "SES Number" },
  { key: "ses_date", label: "SES Date" },
  { key: "ses_value", label: "SES Value" },
  { key: "sap_work_order", label: "SAP Work Order" },
  { key: "status", label: "SES Status" },
];

const WORKFLOW_STEP_OPTIONS = [
  "Timesheet Entry",
  "Proforma Generation",
  "SES Submission",
  "SES Approval",
  "Commercial Invoice",
  "Consolidated Invoice",
  "Credit Memo",
  "Payment Received",
];

export default function SettingsPage() {
  const [presets, setPresets] = useState<any[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<any>(null);

  // Form state
  // ... (rest of form state)
  const [presetName, setPresetName] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceTemplate, setInvoiceTemplate] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  
  const [selectedInspectionFields, setSelectedInspectionFields] = useState<string[]>([]);
  const [selectedInvoiceFields, setSelectedInvoiceFields] = useState<string[]>([]);
  const [selectedSesFields, setSelectedSesFields] = useState<string[]>([]);
  const [selectedWorkflowSteps, setSelectedWorkflowSteps] = useState<string[]>([]);
  const [defaults, setDefaults] = useState<Record<string, string>>({
    currency: "QAR",
    duration_tag: "Hrs.",
  });

  const fetchData = async () => {
    const [pRes, tRes] = await Promise.all([
      fetch("/api/presets", { cache: "no-store" }),
      fetch("/api/templates", { cache: "no-store" })
    ]);
    const pData = await pRes.json();
    const tData = await tRes.json();
    setPresets(Array.isArray(pData) ? pData : []);
    setTemplates(Array.isArray(tData) ? tData : []);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleField = (list: string[], setter: (v: string[]) => void, key: string) => {
    setter(list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  };

  const resetForm = () => {
    setPresetName("");
    setDescription("");
    setInvoiceTemplate("");
    setCompanyAddress("");
    setCompanyContact("");
    setBankDetails("");
    setSelectedInspectionFields([]);
    setSelectedInvoiceFields([]);
    setSelectedSesFields([]);
    setSelectedWorkflowSteps([]);
    setDefaults({ currency: "QAR", duration_tag: "Hrs." });
    setEditingPreset(null);
  };

  const openEditModal = (preset: any) => {
    setEditingPreset(preset);
    setPresetName(preset.preset_name || "");
    setDescription(preset.description || "");
    setInvoiceTemplate(preset.invoice_template || "");
    setCompanyAddress(preset.company_address || "");
    setCompanyContact(preset.company_contact || "");
    setBankDetails(preset.bank_details || "");
    
    try {
      const visFields = JSON.parse(preset.visible_fields || "{}");
      setSelectedInspectionFields(visFields.inspection || []);
      setSelectedInvoiceFields(visFields.invoice || []);
      setSelectedSesFields(visFields.ses || []);
    } catch { 
      setSelectedInspectionFields([]);
      setSelectedInvoiceFields([]);
      setSelectedSesFields([]);
    }

    try {
      setSelectedWorkflowSteps(JSON.parse(preset.workflow_steps || "[]"));
    } catch { setSelectedWorkflowSteps([]); }
    
    try {
      setDefaults(JSON.parse(preset.default_values || '{"currency":"QAR","duration_tag":"Hrs."}'));
    } catch { setDefaults({ currency: "QAR", duration_tag: "Hrs." }); }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      preset_name: presetName,
      description,
      invoice_template: invoiceTemplate,
      company_address: companyAddress,
      company_contact: companyContact,
      bank_details: bankDetails,
      visible_fields: JSON.stringify({
        inspection: selectedInspectionFields,
        invoice: selectedInvoiceFields,
        ses: selectedSesFields,
      }),
      workflow_steps: JSON.stringify(selectedWorkflowSteps),
      default_values: JSON.stringify(defaults),
    };

    const url = editingPreset ? `/api/presets/${editingPreset.id}` : "/api/presets";
    const method = editingPreset ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this workflow preset?")) {
      await fetch(`/api/presets/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-orange-500" /> Workflow Presets
        </h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> New Preset
        </button>
      </div>

      <p className="text-sm text-gray-400">
        Define contract-type profiles that control document headers, bank details, and visible fields.
      </p>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presets.map((p) => {
          let stepCount = 0;
          let fieldCount = 0;
          try { stepCount = JSON.parse(p.workflow_steps || "[]").length; } catch {}
          try {
            const v = JSON.parse(p.visible_fields || "{}");
            fieldCount = (v.inspection?.length || 0) + (v.invoice?.length || 0) + (v.ses?.length || 0);
          } catch {}

          return (
            <div key={p.id} className="card space-y-3 hover:border-orange-500/30 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{p.preset_name || "Unnamed"}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.description || "No description"}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(p)} className="text-orange-500 hover:text-orange-400 p-1"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-[#374151]">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Building2 size={12} className="text-orange-500" /> 
                  <span className="truncate">{p.company_address || "Default Address"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Landmark size={12} className="text-green-500" />
                  <span className="truncate">{p.bank_details ? "Custom Bank Info Set" : "Standard Bank Info"}</span>
                </div>
              </div>
              <div className="flex gap-4 text-xs pt-2">
                <span className="text-gray-400 font-medium">{fieldCount} fields active</span>
                <span className="text-gray-400 font-medium">{stepCount} steps</span>
              </div>
            </div>
          );
        })}

        {presets.length === 0 && (
          <div className="col-span-full card text-center text-gray-500 py-10">
            No presets created yet.
          </div>
        )}
      </div>

      <FormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingPreset ? "Edit Preset" : "New Preset"}>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
          {/* Section 1: Basic & Identity */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-orange-500 flex items-center gap-2">
                <Settings size={16} /> Basic configuration
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Preset Name</label>
                  <input required className="input" value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="e.g. QP Hourly" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Invoice Template</label>
                  <select 
                    className="input" 
                    value={invoiceTemplate} 
                    onChange={e => setInvoiceTemplate(e.target.value)}
                  >
                    <option value="">Select a template...</option>
                    {templates.map(t => (
                      <option key={t} value={t}>{t.replace('.html', '').replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <input className="input" value={description} onChange={e => setDescription(e.target.value)} />
             </div>
          </div>

          {/* Section 2: Document Header/Footer (New) */}
          <div className="space-y-4 pt-4 border-t border-[#374151]">
             <h3 className="text-sm font-bold text-green-500 flex items-center gap-2">
                <Building2 size={16} /> Document Metadata
             </h3>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                   <Building2 size={14} className="text-gray-500" /> Company Office Address (on invoice)
                </label>
                <textarea className="input min-h-[60px] py-2" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="P.O. Box 24512, Doha, Qatar" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                   <PhoneCall size={14} className="text-gray-500" /> Contact Info
                </label>
                <input className="input" value={companyContact} onChange={e => setCompanyContact(e.target.value)} placeholder="info@velosipro.com / +974 4444 0000" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                   <Landmark size={14} className="text-gray-500" /> Bank Payment Instructions
                </label>
                <textarea className="input min-h-[60px] py-2" value={bankDetails} onChange={e => setBankDetails(e.target.value)} placeholder="Applus Velosi - QNB - Acc: 0000-0000..." />
             </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-2 pt-4 border-t border-[#374151]">
            <label className="text-sm font-bold text-white">Workflow Steps</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {WORKFLOW_STEP_OPTIONS.map(step => (
                <button
                  key={step}
                  type="button"
                  onClick={() => toggleField(selectedWorkflowSteps, setSelectedWorkflowSteps, step)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                    selectedWorkflowSteps.includes(step)
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-[#111827] border-[#374151] text-gray-400 hover:border-gray-500"
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {/* Visible Fields - Inspection */}
          <div className="space-y-2 pt-4 border-t border-[#374151]">
            <label className="text-sm font-bold text-white">Inspection Fields</label>
            <div className="grid grid-cols-2 gap-1">
              {ALL_INSPECTION_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#374151]/30 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedInspectionFields.includes(f.key)} onChange={() => toggleField(selectedInspectionFields, setSelectedInspectionFields, f.key)} className="rounded" />
                  <span className="text-gray-300">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Visible Fields - Invoice */}
          <div className="space-y-2 pt-4 border-t border-[#374151]">
            <label className="text-sm font-bold text-white">Invoice Fields</label>
            <div className="grid grid-cols-2 gap-1">
              {ALL_INVOICE_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#374151]/30 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedInvoiceFields.includes(f.key)} onChange={() => toggleField(selectedInvoiceFields, setSelectedInvoiceFields, f.key)} className="rounded" />
                  <span className="text-gray-300">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Visible Fields - SES */}
          <div className="space-y-2 pt-4 border-t border-[#374151]">
            <label className="text-sm font-bold text-white">SES Fields</label>
            <div className="grid grid-cols-2 gap-1">
              {ALL_SES_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#374151]/30 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedSesFields.includes(f.key)} onChange={() => toggleField(selectedSesFields, setSelectedSesFields, f.key)} className="rounded" />
                  <span className="text-gray-300">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Default Values */}
          <div className="space-y-2 pt-4 border-t border-[#374151]">
            <label className="text-sm font-bold text-white">Default Values</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Default Currency</label>
                <select className="input" value={defaults.currency || "QAR"} onChange={e => setDefaults({...defaults, currency: e.target.value})}>
                  <option value="QAR">QAR</option><option value="USD">USD</option><option value="EUR">EUR</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Default Duration Tag</label>
                <select className="input" value={defaults.duration_tag || "Hrs."} onChange={e => setDefaults({...defaults, duration_tag: e.target.value})}>
                  <option value="Hrs.">Hours</option><option value="Days">Days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[#374151]">
            <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Preset</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
