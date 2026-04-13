"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { FormModal } from "@/components/FormModal";
import { BatchUploadModal } from "@/components/BatchUploadModal";
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  History, 
  Plus, 
  Calendar,
  MapPin,
  User,
  History as RevisionIcon,
  UploadCloud
} from "lucide-react";

export default function MonitoringPage() {
  const [data, setData] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isITPModalOpen, setIsITPModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedITP, setSelectedITP] = useState<any>(null);

  // Form States (ITP)
  const [projectId, setProjectId] = useState("");
  const [itpNo, setItpNo] = useState("");
  const [location, setLocation] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [designation, setDesignation] = useState("");
  const [rates, setRates] = useState("");
  const [originalBudget, setOriginalBudget] = useState("");

  // Form States (Revision)
  const [budgetAdjustment, setBudgetAdjustment] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes, iRes] = await Promise.all([
        fetch('/api/monitoring', { cache: 'no-store' }),
        fetch('/api/projects'),
        fetch('/api/inspectors')
      ]);
      const [m, p, i] = await Promise.all([mRes.json(), pRes.json(), iRes.json()]);
      setData(Array.isArray(m) ? m : []);
      setProjects(Array.isArray(p) ? p : []);
      setInspectors(Array.isArray(i) ? i : []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddITP = async (e: any) => {
    e.preventDefault();
    await fetch('/api/monitoring', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId, itp_po_number: itpNo, location, inspector_id: inspectorId,
        expiry_date: expiryDate, designation, rates, original_budget: originalBudget
      })
    });
    setIsITPModalOpen(false);
    fetchData();
  };

  const handleAddRevision = async (e: any) => {
    e.preventDefault();
    await fetch('/api/monitoring/revisions', {
      method: 'POST',
      body: JSON.stringify({
        itp_po_id: selectedITP.id,
        budget_adjustment: budgetAdjustment,
        new_expiry_date: newExpiryDate,
        remarks
      })
    });
    setIsRevisionModalOpen(false);
    setSelectedITP(null);
    fetchData();
  };

  const columns = [
    { key: "itp_po_number", label: "ITP/PO NO." },
    { key: "contract_no", label: "CONTRACT NO." },
    { key: "project_name", label: "PROJECT" },
    { key: "location", label: "LOCATION" },
    { key: "inspector", label: "INSPECTOR" },
    { 
      key: "expiry_date", 
      label: "EXPIRY",
      render: (val: any) => {
        if (!val) return "—";
        const date = new Date(val);
        const isPast = date < new Date();
        return <span className={isPast ? "text-red-500 font-bold" : "text-gray-300"}>{date.toLocaleDateString()}</span>
      }
    },
    { 
      key: "budget", 
      label: "TOTAL BUDGET",
      render: (val: any) => <span className="font-semibold text-white">QAR {Number(val).toLocaleString()}</span>
    },
    { 
      key: "invoiced", 
      label: "INVOICED",
      render: (val: any) => <span className="text-gray-400">QAR {Number(val).toLocaleString()}</span>
    },
    { 
      key: "running_balance", 
      label: "BALANCE",
      render: (val: any) => (
        <span className={`font-bold ${Number(val) < 0 ? 'text-red-500' : 'text-green-500'}`}>
          QAR {Number(val).toLocaleString()}
        </span>
      )
    },
    { 
      key: "status", 
      label: "STATUS",
      render: (val: any) => <StatusBadge status={val} />
    },
    { 
      key: "latest_revision_date", 
      label: "LATEST REVISION",
      render: (val: any, item: any) => (
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase font-bold">{val ? new Date(val).toLocaleDateString() : 'Original'}</span>
          <span className="text-xs text-gray-500 truncate max-w-[120px]" title={item.latest_remarks}>{item.latest_remarks}</span>
        </div>
      )
    },
    {
      key: "actions",
      label: "History",
      render: (_: any, item: any) => (
        <button 
          onClick={() => { setSelectedITP(item); setIsRevisionModalOpen(true); }}
          className="p-1.5 bg-orange-500/10 text-orange-500 rounded-md hover:bg-orange-500 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold"
        >
          <RevisionIcon size={12} /> REVISE ({item.revision_count})
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-orange-500" /> Contract Budget Monitoring
          </h1>
          <p className="text-xs text-gray-500 font-medium">Aggregated budget control and ITP/PO tracking across multi-client framework agreements.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsBatchModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <UploadCloud size={18} /> Batch Upload
          </button>
          <button onClick={() => setIsITPModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New ITP/PO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card flex items-center gap-4 border-l-4 border-l-orange-500">
              <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500"><Calculator size={24} /></div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Contract Budget</p>
                  <p className="text-xl font-bold">QAR {data.reduce((acc, curr) => acc + (curr.budget || 0), 0).toLocaleString()}</p>
              </div>
          </div>
          <div className="card flex items-center gap-4 border-l-4 border-l-red-500">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={24} /></div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Expiring / Over Budget</p>
                  <p className="text-xl font-bold text-red-500">{data.filter(d => d.status === 'Expired' || d.status === 'Over Budget').length}</p>
              </div>
          </div>
          <div className="card flex items-center gap-4 border-l-4 border-l-green-500">
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><CheckCircle size={24} /></div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Contract Liquidity</p>
                  <p className="text-xl font-bold text-green-500">QAR {data.reduce((acc, curr) => acc + (curr.running_balance || 0), 0).toLocaleString()}</p>
              </div>
          </div>
      </div>

      <div className="card p-0 overflow-hidden border-none shadow-2xl">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-gray-500">Deep search in ITP database...</div>
        ) : (
          <DataTable data={data} columns={columns} searchKey="itp_po_number" />
        )}
      </div>

      {/* New ITP Modal */}
      <FormModal isOpen={isITPModalOpen} onClose={() => setIsITPModalOpen(false)} title="New ITP / PO Monitoring Entry">
        <form onSubmit={handleAddITP} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Parent Project</label>
              <select required className="input" value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">Select Project...</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">ITP/PO Number</label>
              <input required className="input" value={itpNo} onChange={e => setItpNo(e.target.value)} placeholder="e.g. PO-2024-SHELL-01" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Location</label>
              <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="RLIC / Mesaieed" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Assigned Inspector</label>
              <select className="input" value={inspectorId} onChange={e => setInspectorId(e.target.value)}>
                <option value="">Select Inspector...</option>
                {inspectors.map(i => <option key={i.id} value={i.id}>{i.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Expiry Date</label>
              <input type="date" className="input" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Designation</label>
              <input className="input" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Senior Q/A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Rates (QAR)</label>
              <input type="number" className="input" value={rates} onChange={e => setRates(e.target.value)} placeholder="1500" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">Original Budget (QAR)</label>
              <input type="number" required className="input" value={originalBudget} onChange={e => setOriginalBudget(e.target.value)} placeholder="50000" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
             <button type="button" onClick={() => setIsITPModalOpen(false)} className="btn-secondary">Cancel</button>
             <button type="submit" className="btn-primary">Create Monitor</button>
          </div>
        </form>
      </FormModal>

      {/* Revision Modal */}
      <FormModal isOpen={isRevisionModalOpen} onClose={() => setIsRevisionModalOpen(false)} title={`Add Revision: ${selectedITP?.itp_po_number}`}>
        <form onSubmit={handleAddRevision} className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs leading-relaxed">
            Current Budget: <span className="font-bold text-white">QAR {Number(selectedITP?.budget).toLocaleString()}</span><br/>
            Current Expiry: <span className="font-bold text-white">{selectedITP?.expiry_date ? new Date(selectedITP.expiry_date).toLocaleDateString() : 'None'}</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400">Budget Adjustment (Use negative for deduction)</label>
            <input type="number" required className="input" value={budgetAdjustment} onChange={e => setBudgetAdjustment(e.target.value)} placeholder="+5000 or -2000" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400">Update Expiry Date (Optional)</label>
            <input type="date" className="input" value={newExpiryDate} onChange={e => setNewExpiryDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400">Revision Remarks / Reason</label>
            <textarea required className="input py-3 min-h-[80px]" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Extension of contract or budget increase..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
             <button type="button" onClick={() => setIsRevisionModalOpen(false)} className="btn-secondary">Cancel</button>
             <button type="submit" className="btn-primary">Post Revision</button>
          </div>
        </form>
      </FormModal>

      <BatchUploadModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        entityName="ITP/PO Monitoring"
        apiEndpoint="/api/monitoring/batch"
        onSuccess={fetchData}
        expectedHeaders={["project_name", "itp_po_number", "location", "inspector_name", "expiry_date", "designation", "rates", "budget"]}
      />
    </div>
  );
}
