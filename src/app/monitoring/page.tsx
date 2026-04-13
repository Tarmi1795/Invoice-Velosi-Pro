"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Calculator, AlertTriangle, CheckCircle } from "lucide-react";

export default function MonitoringPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/monitoring', { cache: 'no-store' });
      const d = await res.json();
      setData(Array.isArray(d) ? d : []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { key: "project_name", label: "Project Name" },
    { key: "po_no", label: "PO NO" },
    { key: "itp_code", label: "ITP CODE" },
    { 
      key: "budget", 
      label: "ITP/PO BUDGET",
      render: (val: any) => <span className="font-semibold text-white">QAR {Number(val).toLocaleString()}</span>
    },
    { 
      key: "total_invoiced", 
      label: "INVOICED AMT",
      render: (val: any) => <span className="text-gray-400">QAR {Number(val).toLocaleString()}</span>
    },
    { 
      key: "running_balance", 
      label: "RUNNING BALANCE",
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
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calculator className="text-orange-500" /> ITP/PO Budget Monitoring
        </h1>
        <button onClick={fetchData} className="btn-secondary text-sm">Refresh Data</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card flex items-center gap-4 border-l-4 border-l-orange-500">
              <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500"><Calculator size={24} /></div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total PO Budget</p>
                  <p className="text-xl font-bold">QAR {data.reduce((acc, curr) => acc + (curr.budget || 0), 0).toLocaleString()}</p>
              </div>
          </div>
          <div className="card flex items-center gap-4 border-l-4 border-l-red-500">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><AlertTriangle size={24} /></div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Over Budget Projects</p>
                  <p className="text-xl font-bold text-red-500">{data.filter(d => d.running_balance < 0).length}</p>
              </div>
          </div>
          <div className="card flex items-center gap-4 border-l-4 border-l-green-500">
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><CheckCircle size={24} /></div>
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Remaining Balance</p>
                  <p className="text-xl font-bold text-green-500">QAR {data.reduce((acc, curr) => acc + (curr.running_balance || 0), 0).toLocaleString()}</p>
              </div>
          </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 animate-pulse text-gray-500">Calculating budgets...</div>
      ) : (
        <DataTable data={data} columns={columns} searchKey="project_name" />
      )}
    </div>
  );
}
