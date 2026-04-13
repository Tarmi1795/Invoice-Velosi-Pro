"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, Briefcase, FileText, DollarSign, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );

  const stats = data?.stats || { clientsCount: 0, activeProjects: 0, pendingInvoices: 0, totalRevenue: 0 };
  const recentInvoices = data?.recentInvoices || [];

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
      render: (val: any) => <span className="font-medium">${Number(val).toLocaleString()}</span>
    },
    { 
      key: "status", 
      label: "Status",
      render: (val: any) => <StatusBadge status={val} />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/20">
          <AlertCircle size={16} />
          Wait for Data API connection
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Clients" value={stats.clientsCount} icon={Users} colorClass="text-orange-500" />
        <StatCard title="Active Projects" value={stats.activeProjects} icon={Briefcase} colorClass="text-purple-500" />
        <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon={FileText} colorClass="text-yellow-500" />
        <StatCard title="Total Revenue" value={`QAR ${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} colorClass="text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
          <DataTable data={recentInvoices} columns={columns} searchKey="invoice_no" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Budget Alerts</h2>
          <div className="card space-y-4">
            <p className="text-sm text-gray-400">Track contracts running low on budget.</p>
            {/* Can be fetched from /api/reports/budget-balances */}
            <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-white font-medium">Shell Call-Off</span>
                <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded">87% Depleted</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full w-[87%]"></div>
              </div>
            </div>
            <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-white font-medium">QP Framework</span>
                <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">65% Depleted</span>
              </div>
              <div className="w-full bg-[#374151] rounded-full h-1.5">
                <div className="bg-yellow-500 h-1.5 rounded-full w-[65%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
