"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/FormModal";
import { Plus, Edit, Trash2, Settings, Check, Building2, Landmark, PhoneCall, Image as ImageIcon } from "lucide-react";

// Types
interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  contact: string;
  bank_details: string;
}

interface WorkflowPreset {
  id: string;
  preset_name: string;
  description: string;
  invoice_template: string;
  company_profile_id: string;
  company_profile?: CompanyProfile;
}

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
  const [presets, setPresets] = useState<WorkflowPreset[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  const [editingPreset, setEditingPreset] = useState<any>(null);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  // Preset Form State
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetTemplate, setPresetTemplate] = useState("");
  const [presetCompanyId, setPresetCompanyId] = useState("");
  const [selectedInspectionFields, setSelectedInspectionFields] = useState<string[]>([]);
  const [selectedInvoiceFields, setSelectedInvoiceFields] = useState<string[]>([]);
  const [selectedSesFields, setSelectedSesFields] = useState<string[]>([]);
  const [selectedWorkflowSteps, setSelectedWorkflowSteps] = useState<string[]>([]);
  const [presetDefaults, setPresetDefaults] = useState({ currency: "QAR", duration_tag: "Hrs." });

  // Company Form State
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [companyBank, setCompanyBank] = useState("");

  const fetchData = async () => {
    const [pRes, cRes, tRes] = await Promise.all([
      fetch("/api/presets"),
      fetch("/api/companies"),
      fetch("/api/templates")
    ]);
    const [p, c, t] = await Promise.all([pRes.json(), cRes.json(), tRes.json()]);
    setPresets(p);
    setCompanies(c);
    setTemplates(t);
  };

  useEffect(() => { fetchData(); }, []);

  const resetPresetForm = () => {
    setEditingPreset(null);
    setPresetName("");
    setPresetDescription("");
    setPresetTemplate("");
    setPresetCompanyId("");
    setSelectedInspectionFields([]);
    setSelectedInvoiceFields([]);
    setSelectedSesFields([]);
    setSelectedWorkflowSteps([]);
    setPresetDefaults({ currency: "QAR", duration_tag: "Hrs." });
  };

  const resetCompanyForm = () => {
    setEditingCompany(null);
    setCompanyName("");
    setCompanyAddress("");
    setCompanyContact("");
    setCompanyBank("");
  };

  const openEditPreset = (p: any) => {
    setEditingPreset(p);
    setPresetName(p.preset_name);
    setPresetDescription(p.description || "");
    setPresetTemplate(p.invoice_template || "");
    setPresetCompanyId(p.company_profile_id || "");
    try {
      const vis = JSON.parse(p.visible_fields || "{}");
      setSelectedInspectionFields(vis.inspection || []);
      setSelectedInvoiceFields(vis.invoice || []);
      setSelectedSesFields(vis.ses || []);
      setSelectedWorkflowSteps(JSON.parse(p.workflow_steps || "[]"));
      setPresetDefaults(JSON.parse(p.default_values || '{"currency":"QAR","duration_tag":"Hrs."}'));
    } catch { }
    setIsPresetModalOpen(true);
  };

  const openEditCompany = (c: any) => {
    setEditingCompany(c);
    setCompanyName(c.name);
    setCompanyAddress(c.address || "");
    setCompanyContact(c.contact || "");
    setCompanyBank(c.bank_details || "");
    setIsCompanyModalOpen(true);
  };

  const savePreset = async (e: any) => {
    e.preventDefault();
    const payload = {
      preset_name: presetName,
      description: presetDescription,
      invoice_template: presetTemplate,
      company_profile_id: presetCompanyId,
      visible_fields: JSON.stringify({ inspection: selectedInspectionFields, invoice: selectedInvoiceFields, ses: selectedSesFields }),
      workflow_steps: JSON.stringify(selectedWorkflowSteps),
      default_values: JSON.stringify(presetDefaults)
    };
    await fetch(editingPreset ? `/api/presets/${editingPreset.id}` : "/api/presets", {
      method: editingPreset ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    setIsPresetModalOpen(false);
    fetchData();
  };

  const deletePreset = async (id: string) => {
    if (confirm("Delete this workflow preset?")) {
      await fetch(`/api/presets/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const deleteCompany = async (id: string) => {
    if (confirm("Delete this company identity?")) {
      await fetch(`/api/companies/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const saveCompany = async (e: any) => {
    e.preventDefault();
    const payload = { name: companyName, address: companyAddress, contact: companyContact, bank_details: companyBank };
    await fetch(editingCompany ? `/api/companies/${editingCompany.id}` : "/api/companies", {
      method: editingCompany ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    setIsCompanyModalOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="text-orange-500" /> Platform Configuration
        </h1>
      </div>

      {/* 1. Global Identity Settings */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="text-green-500" /> Company Info
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage letterheads and bank details for your different business entities.</p>
          </div>
          <button onClick={() => { resetCompanyForm(); setIsCompanyModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Identity
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(c => (
            <div key={c.id} className="card hover:border-green-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Building2 size={24} /></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditCompany(c)} className="text-blue-500 p-1 hover:bg-blue-500/10 rounded"><Edit size={16} /></button>
                  <button onClick={() => deleteCompany(c.id)} className="text-red-500 p-1 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-white">{c.name}</h3>
              <div className="mt-3 space-y-2 text-sm text-gray-400">
                <p className="flex items-start gap-2 pt-1"><Landmark className="text-gray-500 shrink-0" size={14} /> <span className="line-clamp-2">{c.address}</span></p>
                <p className="text-xs text-green-500 font-medium pt-1">Bank details configured</p>
              </div>
            </div>
          ))}
          {companies.length === 0 && <p className="col-span-full py-10 text-center text-gray-500 card border-dashed">No company identities defined. Add one to set up your letterhead.</p>}
        </div>
      </section>

      {/* 2. Workflow Presets */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="text-orange-500" /> Workflow Presets
            </h2>
            <p className="text-sm text-gray-500 mt-1">Define which fields and steps each contract format should follow.</p>
          </div>
          <button onClick={() => { resetPresetForm(); setIsPresetModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Preset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map(p => (
            <div key={p.id} className="card hover:border-orange-500/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-white">{p.preset_name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditPreset(p)} className="text-blue-500 p-1 hover:bg-blue-500/10 rounded"><Edit size={16} /></button>
                  <button onClick={() => deletePreset(p.id)} className="text-red-500 p-1 hover:bg-red-500/10 rounded"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">{p.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded">
                  Identity: {p.company_profile?.name || "None"}
                </span>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
                  Template: {p.invoice_template || "Default"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Company Modal */}
      <FormModal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} title="Company Identity">
        <form onSubmit={saveCompany} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Entity Name</label>
            <input required className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Applus Velosi Qatar" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Office Address (on invoice)</label>
            <textarea className="input min-h-[80px] py-3" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Contact Details</label>
            <input className="input" value={companyContact} onChange={e => setCompanyContact(e.target.value)} placeholder="Email / Phone" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Bank Instructions</label>
            <textarea className="input min-h-[100px] py-3" value={companyBank} onChange={e => setCompanyBank(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={() => setIsCompanyModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Identity</button>
          </div>
        </form>
      </FormModal>

      {/* Preset Modal */}
      <FormModal isOpen={isPresetModalOpen} onClose={() => setIsPresetModalOpen(false)} title="Workflow Preset">
        <form onSubmit={savePreset} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Preset Name</label>
              <input required className="input" value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="e.g. Call-Off Standard" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Linked Identity</label>
              <select required className="input" value={presetCompanyId} onChange={e => setPresetCompanyId(e.target.value)}>
                <option value="">Select identity...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Invoice Template</label>
            <select className="input" value={presetTemplate} onChange={e => setPresetTemplate(e.target.value)}>
              <option value="">Standard (Default)</option>
              {templates.map(t => <option key={t} value={t}>{t.replace('.html', '')}</option>)}
            </select>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-800">
            <label className="text-sm font-bold text-white">Workflow Steps</label>
            <div className="flex flex-wrap gap-2">
              {WORKFLOW_STEP_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => setSelectedWorkflowSteps(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold border transition-all ${selectedWorkflowSteps.includes(s) ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-4 border-t border-gray-800">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white">Inspection Fields</label>
              {ALL_INSPECTION_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={selectedInspectionFields.includes(f.key)} onChange={() => setSelectedInspectionFields(prev => prev.includes(f.key) ? prev.filter(x => x !== f.key) : [...prev, f.key])} />
                  {f.label}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white">Invoice Fields</label>
              {ALL_INVOICE_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={selectedInvoiceFields.includes(f.key)} onChange={() => setSelectedInvoiceFields(prev => prev.includes(f.key) ? prev.filter(x => x !== f.key) : [...prev, f.key])} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
            <button type="button" onClick={() => setIsPresetModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Preset</button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
