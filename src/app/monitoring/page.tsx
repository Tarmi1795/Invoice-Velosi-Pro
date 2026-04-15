"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { FormModal } from "@/components/FormModal";
import { EnhancedBatchUploadModal } from "@/components/EnhancedBatchUploadModal";
import {
  Calculator,
  AlertTriangle,
  CheckCircle,
  Plus,
  UploadCloud,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Receipt,
  ClipboardList
} from "lucide-react";
import { todayISO } from "@/lib/dateUtils";

type AccordionSection = "itp" | "po" | "srso" | null;

export default function MonitoringPage() {
  const [openSection, setOpenSection] = useState<AccordionSection>(null);

  const [itpData, setItpData] = useState<any[]>([]);
  const [poData, setPoData] = useState<any[]>([]);
  const [srsoData, setSrsoData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isITPModalOpen, setIsITPModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSRSOModalOpen, setIsSRSOModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchEntity, setBatchEntity] = useState<"itp_pos" | "po_records" | "service_orders">("itp_pos");
  const [selectedITP, setSelectedITP] = useState<any>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [itpNo, setItpNo] = useState("");
  const [poNo, setPoNo] = useState("");
  const [location, setLocation] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [expiryDate, setExpiryDate] = useState(todayISO());
  const [designation, setDesignation] = useState("");
  const [rates, setRates] = useState("");
  const [originalBudget, setOriginalBudget] = useState("");
  const [formError, setFormError] = useState("");

  const [budgetAdjustment, setBudgetAdjustment] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [srSoNo, setSrSoNo] = useState("");
  const [srSoClient, setSrSoClient] = useState("");
  const [srSoProject, setSrSoProject] = useState("");
  const [srSoAmount, setSrSoAmount] = useState("");
  const [srSoStatus, setSrSoStatus] = useState("Pending");

  const [poClientName, setPoClientName] = useState("");
  const [poProjectName, setPoProjectName] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [poStatus, setPoStatus] = useState("Active");

  const fetchITPData = async () => {
    try {
      const res = await fetch('/api/monitoring', { cache: 'no-store' });
      const d = await res.json();
      setItpData(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); }
  };

  const fetchPOData = async () => {
    try {
      const res = await fetch('/api/po_records', { cache: 'no-store' });
      const d = await res.json();
      setPoData(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); }
  };

  const fetchSRSOData = async () => {
    try {
      const res = await fetch('/api/service_orders', { cache: 'no-store' });
      const d = await res.json();
      setSrsoData(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); }
  };

  const fetchRelationships = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/inspectors')
      ]);
      const [p, i] = await Promise.all([pRes.json(), iRes.json()]);
      setProjects(Array.isArray(p) ? p : []);
      setInspectors(Array.isArray(i) ? i : []);
    } catch (err) { console.error(err); }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchITPData(), fetchPOData(), fetchSRSOData(), fetchRelationships()]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleSection = (section: AccordionSection) => {
    setOpenSection(openSection === section ? null : section);
  };

  const openBatchModal = (entity: "itp_pos" | "po_records" | "service_orders") => {
    setBatchEntity(entity);
    setIsBatchModalOpen(true);
  };

  const handleAddITP = async (e: any) => {
    e.preventDefault();
    setFormError("");
    if (!inspectorId) { setFormError("Please select an inspector."); return; }
    const res = await fetch('/api/monitoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, itp_po_number: itpNo, po_no: poNo, location, inspector_id: inspectorId, expiry_date: expiryDate, designation, rates, original_budget: originalBudget })
    });
    if (!res.ok) { const err = await res.json(); setFormError(err.error || "Failed to create ITP/PO."); return; }
    setIsITPModalOpen(false);
    fetchITPData();
  };

  const handleAddPO = async (e: any) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch('/api/po_records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ po_no: poNo, client_name: poClientName, project_name: poProjectName, amount: poAmount ? Number(poAmount) : null, status: poStatus })
    });
    if (!res.ok) { const err = await res.json(); setFormError(err.error || "Failed to create PO record."); return; }
    setIsPOModalOpen(false);
    fetchPOData();
  };

  const handleAddSRSO = async (e: any) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch('/api/service_orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sr_so_no: srSoNo, po_no: poNo || null, client_name: srSoClient, project_name: srSoProject, amount: srSoAmount ? Number(srSoAmount) : null, status: srSoStatus })
    });
    if (!res.ok) { const err = await res.json(); setFormError(err.error || "Failed to create SR/SO."); return; }
    setIsSRSOModalOpen(false);
    fetchSRSOData();
  };

  const handleAddRevision = async (e: any) => {
    e.preventDefault();
    await fetch('/api/monitoring/revisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itp_po_id: selectedITP.id, budget_adjustment: budgetAdjustment, new_expiry_date: newExpiryDate, remarks })
    });
    setIsRevisionModalOpen(false);
    setSelectedITP(null);
    fetchITPData();
  };

  const handleBatchDeleteITP = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} ITP/PO record(s)?`)) return;
    await Promise.all(ids.map(id => fetch(`/api/monitoring/${id}`, { method: 'DELETE' })));
    fetchITPData();
  };

  const handleBatchDeletePO = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} PO record(s)?`)) return;
    await Promise.all(ids.map(id => fetch(`/api/po_records/${id}`, { method: 'DELETE' })));
    fetchPOData();
  };

  const handleBatchDeleteSRSO = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} SR/SO record(s)?`)) return;
    await Promise.all(ids.map(id => fetch(`/api/service_orders/${id}`, { method: 'DELETE' })));
    fetchSRSOData();
  };

  const itpColumns = [
    { key: "itp_po_number", label: "ITP/PO NO." },
    { key: "contract_no", label: "CONTRACT NO." },
    { key: "project_name", label: "PROJECT" },
    { key: "location", label: "LOCATION" },
    { key: "inspector", label: "INSPECTOR" },
    { key: "expiry_date", label: "EXPIRY", render: (val: any) => val ? new Date(val).toLocaleDateString() : "—" },
    { key: "budget", label: "BUDGET", render: (val: any) => `QAR ${Number(val || 0).toLocaleString()}` },
    { key: "status", label: "STATUS", render: (val: any) => <StatusBadge status={val} /> },
    {
      key: "actions", label: "History", render: (_: any, item: any) => (
        <button onClick={() => { setSelectedITP(item); setIsRevisionModalOpen(true); }} className="p-1.5 bg-orange-500/10 text-orange-500 rounded-md hover:bg-orange-500 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold">
          <ClipboardList size={12} /> REVISE ({item.revision_count})
        </button>
      )
    }
  ];

  const poColumns = [
    { key: "po_no", label: "PO NUMBER" },
    { key: "client_name", label: "CLIENT" },
    { key: "project_name", label: "PROJECT" },
    { key: "contract_no", label: "CONTRACT" },
    { key: "amount", label: "AMOUNT", render: (val: any) => val ? `QAR ${Number(val).toLocaleString()}` : "—" },
    { key: "status", label: "STATUS", render: (val: any) => <StatusBadge status={val} /> },
  ];

  const srsoColumns = [
    { key: "sr_so_no", label: "SR/SO NO." },
    { key: "po_no", label: "PO NUMBER" },
    { key: "client_name", label: "CLIENT" },
    { key: "project_name", label: "PROJECT" },
    { key: "amount", label: "AMOUNT", render: (val: any) => val ? `QAR ${Number(val).toLocaleString()}` : "—" },
    { key: "status", label: "STATUS", render: (val: any) => <StatusBadge status={val} /> },
  ];

  const itpBatchActions = [{ label: "Delete", icon: <Trash2 size={14} />, variant: "danger" as const, onClick: handleBatchDeleteITP }];
  const poBatchActions = [{ label: "Delete", icon: <Trash2 size={14} />, variant: "danger" as const, onClick: handleBatchDeletePO }];
  const srsoBatchActions = [{ label: "Delete", icon: <Trash2 size={14} />, variant: "danger" as const, onClick: handleBatchDeleteSRSO }];

  const SectionHeader = ({ title, icon: Icon, count, section }: { title: string; icon: any; count: number; section: AccordionSection }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-[#1f2937] hover:bg-[#253041] transition-colors border-b border-[#374151]"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-orange-500" />
        <span className="text-white font-semibold">{title}</span>
        <span className="text-xs text-gray-400 bg-[#374151] px-2 py-0.5 rounded-full">{count} records</span>
      </div>
      {openSection === section ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-orange-500" /> Work Orders
          </h1>
          <p className="text-xs text-gray-500 font-medium">ITP / PO / SR-SO management across all clients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4 border-l-4 border-l-orange-500">
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500"><ClipboardList size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">ITP/PO Records</p>
            <p className="text-xl font-bold">{itpData.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><FileText size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">PO Records</p>
            <p className="text-xl font-bold">{poData.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Receipt size={24} /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">SR/SO Records</p>
            <p className="text-xl font-bold">{srsoData.length}</p>
          </div>
        </div>
      </div>

      <div className="border border-[#374151] rounded-xl overflow-hidden">
        <SectionHeader title="ITP / PO" icon={ClipboardList} count={itpData.length} section="itp" />
        {openSection === "itp" && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end gap-2">
              <button onClick={() => openBatchModal("itp_pos")} className="btn-secondary flex items-center gap-2 text-xs"><UploadCloud size={14} /> Batch Upload</button>
              <button onClick={() => { setPoNo(""); setProjectId(""); setItpNo(""); setLocation(""); setInspectorId(""); setExpiryDate(todayISO()); setDesignation(""); setRates(""); setOriginalBudget(""); setFormError(""); setIsITPModalOpen(true); }} className="btn-primary flex items-center gap-2 text-xs"><Plus size={14} /> Add ITP/PO</button>
            </div>
            <DataTable data={itpData} columns={itpColumns} searchKey="itp_po_number" batchActions={itpBatchActions} />
          </div>
        )}

        <SectionHeader title="PO Records" icon={FileText} count={poData.length} section="po" />
        {openSection === "po" && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end gap-2">
              <button onClick={() => openBatchModal("po_records")} className="btn-secondary flex items-center gap-2 text-xs"><UploadCloud size={14} /> Batch Upload</button>
              <button onClick={() => { setPoNo(""); setPoClientName(""); setPoProjectName(""); setPoAmount(""); setPoStatus("Active"); setFormError(""); setIsPOModalOpen(true); }} className="btn-primary flex items-center gap-2 text-xs"><Plus size={14} /> Add PO</button>
            </div>
            <DataTable data={poData} columns={poColumns} searchKey="po_no" batchActions={poBatchActions} />
          </div>
        )}

        <SectionHeader title="SR / SO" icon={Receipt} count={srsoData.length} section="srso" />
        {openSection === "srso" && (
          <div className="p-4 space-y-4">
            <div className="flex justify-end gap-2">
              <button onClick={() => openBatchModal("service_orders")} className="btn-secondary flex items-center gap-2 text-xs"><UploadCloud size={14} /> Batch Upload</button>
              <button onClick={() => { setSrSoNo(""); setPoNo(""); setSrSoClient(""); setSrSoProject(""); setSrSoAmount(""); setSrSoStatus("Pending"); setFormError(""); setIsSRSOModalOpen(true); }} className="btn-primary flex items-center gap-2 text-xs"><Plus size={14} /> Add SR/SO</button>
            </div>
            <DataTable data={srsoData} columns={srsoColumns} searchKey="sr_so_no" batchActions={srsoBatchActions} />
          </div>
        )}
      </div>

      {/* ITP Form Modal */}
      <FormModal isOpen={isITPModalOpen} onClose={() => setIsITPModalOpen(false)} title="New ITP / PO">
        <form onSubmit={handleAddITP} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{formError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Parent Project</label><select className="input" value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">Select Project...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}</select></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">ITP/PO Number</label><input className="input" value={itpNo} onChange={e => setItpNo(e.target.value)} placeholder="e.g. ITP-2024-001" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">PO Number (Optional)</label><input className="input" value={poNo} onChange={e => setPoNo(e.target.value)} placeholder="Link to PO record" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Location</label><input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="RLIC / Mesaieed" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Assigned Inspector</label><select className="input" value={inspectorId} onChange={e => setInspectorId(e.target.value)}><option value="">Select Inspector...</option>{inspectors.map(i => <option key={i.id} value={i.id}>{i.full_name}</option>)}</select></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Expiry Date</label><input type="date" className="input" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Designation</label><input className="input" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Senior Q/A" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Rates (QAR)</label><input type="number" className="input" value={rates} onChange={e => setRates(e.target.value)} placeholder="1500" /></div>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Original Budget (QAR)</label><input type="number" required className="input" value={originalBudget} onChange={e => setOriginalBudget(e.target.value)} placeholder="50000" /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={() => setIsITPModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </FormModal>

      {/* PO Form Modal */}
      <FormModal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} title="New PO Record">
        <form onSubmit={handleAddPO} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{formError}</div>}
          <div className="space-y-2"><label className="text-xs font-bold text-gray-400">PO Number</label><input required className="input" value={poNo} onChange={e => setPoNo(e.target.value)} placeholder="e.g. PO-2024-SHELL-01" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Client Name</label><input className="input" value={poClientName} onChange={e => setPoClientName(e.target.value)} placeholder="Client name" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Project Name</label><input className="input" value={poProjectName} onChange={e => setPoProjectName(e.target.value)} placeholder="Project name" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Amount (QAR)</label><input type="number" className="input" value={poAmount} onChange={e => setPoAmount(e.target.value)} placeholder="0.00" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Status</label><select className="input" value={poStatus} onChange={e => setPoStatus(e.target.value)}><option value="Active">Active</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={() => setIsPOModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </FormModal>

      {/* SR/SO Form Modal */}
      <FormModal isOpen={isSRSOModalOpen} onClose={() => setIsSRSOModalOpen(false)} title="New SR / SO">
        <form onSubmit={handleAddSRSO} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{formError}</div>}
          <div className="space-y-2"><label className="text-xs font-bold text-gray-400">SR/SO Number</label><input required className="input" value={srSoNo} onChange={e => setSrSoNo(e.target.value)} placeholder="e.g. SR-2024-001" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">PO Number (Optional)</label><input className="input" value={poNo} onChange={e => setPoNo(e.target.value)} placeholder="Link to PO" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Client Name</label><input className="input" value={srSoClient} onChange={e => setSrSoClient(e.target.value)} placeholder="Client name" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Project Name</label><input className="input" value={srSoProject} onChange={e => setSrSoProject(e.target.value)} placeholder="Project name" /></div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Amount (QAR)</label><input type="number" className="input" value={srSoAmount} onChange={e => setSrSoAmount(e.target.value)} placeholder="0.00" /></div>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Status</label><select className="input" value={srSoStatus} onChange={e => setSrSoStatus(e.target.value)}><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Invoiced">Invoiced</option><option value="Cancelled">Cancelled</option></select></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={() => setIsSRSOModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>
      </FormModal>

      {/* Revision Modal */}
      <FormModal isOpen={isRevisionModalOpen} onClose={() => setIsRevisionModalOpen(false)} title={`Add Revision: ${selectedITP?.itp_po_number}`}>
        <form onSubmit={handleAddRevision} className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs leading-relaxed">
            Current Budget: <span className="font-bold text-white">QAR {Number(selectedITP?.budget || 0).toLocaleString()}</span><br />
            Current Expiry: <span className="font-bold text-white">{selectedITP?.expiry_date ? new Date(selectedITP.expiry_date).toLocaleDateString() : 'None'}</span>
          </div>
          <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Budget Adjustment (Use negative for deduction)</label><input type="number" required className="input" value={budgetAdjustment} onChange={e => setBudgetAdjustment(e.target.value)} placeholder="+5000 or -2000" /></div>
          <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Update Expiry Date (Optional)</label><input type="date" className="input" value={newExpiryDate} onChange={e => setNewExpiryDate(e.target.value)} /></div>
          <div className="space-y-2"><label className="text-xs font-bold text-gray-400">Revision Remarks / Reason</label><textarea required className="input py-3 min-h-[80px]" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Extension of contract or budget increase..." /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={() => setIsRevisionModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Post Revision</button>
          </div>
        </form>
      </FormModal>

      <EnhancedBatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        entityName={batchEntity === "itp_pos" ? "ITP/PO" : batchEntity === "po_records" ? "PO Record" : "SR/SO"}
        entityType={batchEntity}
        apiEndpoint={batchEntity === "itp_pos" ? "/api/monitoring" : `/api/${batchEntity}`}
        onSuccess={fetchAll}
        expectedHeaders={batchEntity === "itp_pos" ? ["project_name", "itp_po_number", "po_no", "location", "inspector_name", "expiry_date", "designation", "rates", "budget"] : batchEntity === "po_records" ? ["po_no", "client_name", "project_name", "contract_no", "amount", "status"] : ["sr_so_no", "po_no", "client_name", "project_name", "amount", "status"]}
      />
    </div>
  );
}
