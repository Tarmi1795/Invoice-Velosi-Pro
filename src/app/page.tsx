"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, Briefcase, FileText, Banknote, AlertCircle, RefreshCw, TrendingUp } from "lucide-react";

interface BudgetAlert {
  contract_name: string;
  depletion_pct: number;
  running_balance: number;
  currency: string;
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, monitorRes] = await Promise.all([
        fetch('/api/dashboard', { cache: 'no-store' }),
        fetch('/api/monitoring', { cache: 'no-store' })
      ]);
      const [dashData, monitorData] = await Promise.all([dashRes.json(), monitorRes.json()]);
      setData(dashData);
      setApiHealthy(true);
      
      if (Array.isArray(monitorData)) {
        const alerts = monitorData
          .filter((item: any) => item.running_balance && item.budget)
          .map((item: any) => ({
            contract_name: item.contract_no || item.project_name || 'Unknown',
            depletion_pct: Math.round((item.invoiced / item.budget) * 100),
            running_balance: item.running_balance,
            currency: item.currency || 'QAR'
          }))
          .sort((a: BudgetAlert, b: BudgetAlert) => b.depletion_pct - a.depletion_pct)
          .slice(0, 5);
        setBudgetAlerts(alerts);
      }
    } catch {
      setApiHealthy(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );

  const stats = data?.stats || { clientsCount: 0, activeProjects: 0, pendingInvoices: 0, totalRevenue: 0 };
  const recentInvoices = data?.recentInvoices || [];
  const defaultCurrency = 'QAR';

  const columns = [
    { key: "invoice_no", label: "Invoice No" },
    { key: "client", label: "Client" },
    { 
      key: "date", 
      label: "Date",
      render: (val: any) => val ? new Date(val).toLocaleDateString() : 'N/A'
    },
    { 
      key: "amount", 
      label: "Amount",
      render: (val: any, row: any) => (
        <span className="font-medium">
          {row.currency || defaultCurrency} {Number(val).toLocaleString()}
        </span>
      )
    },
    { 
      key: "status", 
      label: "Status",
      render: (val: any) => <StatusBadge status={val} />
    }
  ];

  const getDepletionColor = (pct: number) => {
    if (pct >= 85) return { text: 'text-red-500', bg: 'bg-red-500/10', bar: 'bg-red-500' };
    if (pct >= 60) return { text: 'text-yellow-500', bg: 'bg-yellow-500/10', bar: 'bg-yellow-500' };
    return { text: 'text-green-500', bg: 'bg-green-500/10', bar: 'bg-green-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border ${
            apiHealthy 
              ? 'text-green-500 bg-green-500/10 border-green-500/20' 
              : 'text-red-500 bg-red-500/10 border-red-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${apiHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
            {apiHealthy ? 'System Online' : 'API Unavailable'}
          </div>
          <button 
            onClick={fetchDashboard} 
            className="p-2 rounded-lg border border-[#374151] text-gray-400 hover:text-white hover:bg-[#374151] transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Clients" value={stats.clientsCount} icon={Users} colorClass="text-orange-500" />
        <StatCard title="Active Projects" value={stats.activeProjects} icon={Briefcase} colorClass="text-purple-500" />
        <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon={FileText} colorClass="text-yellow-500" />
        <StatCard title="Total Revenue" value={`${defaultCurrency} ${stats.totalRevenue.toLocaleString()}`} icon={Banknote} colorClass="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
          <DataTable data={recentInvoices} columns={columns} searchKey="invoice_no" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="text-orange-500" size={18} /> Budget Alerts
          </h2>
          <div className="card space-y-4">
            <p className="text-sm text-gray-400">Top contracts by budget depletion.</p>
            {budgetAlerts.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No budget alerts found.</p>
            ) : (
              budgetAlerts.map((alert, idx) => {
                const colors = getDepletionColor(alert.depletion_pct);
                return (
                  <div key={idx} className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white font-medium truncate">{alert.contract_name}</span>
                      <span className={`text-xs ${colors.text} ${colors.bg} px-2 py-0.5 rounded`}>
                        {alert.depletion_pct}% Depleted
                      </span>
                    </div>
                    <div className="w-full bg-[#374151] rounded-full h-1.5">
                      <div className={`${colors.bar} h-1.5 rounded-full`} style={{ width: `${Math.min(alert.depletion_pct, 100)}%` }} />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-gray-500">Balance: {alert.currency} {alert.running_balance.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
