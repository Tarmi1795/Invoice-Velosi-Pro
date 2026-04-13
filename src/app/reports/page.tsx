"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/DataTable";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("budget-balances");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "budget-balances", label: "Budget Balances" },
    { id: "invoice-pipeline", label: "Invoice Pipeline" },
    { id: "conso-invoice-detail", label: "Consolidated Detail" }
  ];

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/${activeTab}`);
        const d = await res.json();
        setData(Array.isArray(d) ? d : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [activeTab]);

  const generateColumns = (tab: string) => {
    switch (tab) {
      case "budget-balances":
        return [
          { key: "client_name", label: "Client" },
          { key: "contract_no", label: "Contract No" },
          { key: "currency", label: "Currency" },
          { 
            key: "original_contract_value", 
            label: "Orig Value",
            render: (val: any) => val ? Number(val).toLocaleString() : '0' 
          },
          { 
            key: "total_invoiced", 
            label: "Total Invoiced",
            render: (val: any) => val ? Number(val).toLocaleString() : '0' 
          },
          { 
            key: "pct_depleted", 
            label: "Depleted (%)",
            render: (val: any) => val ? `${Number(val).toFixed(2)}%` : '0%' 
          },
          { 
            key: "remaining", 
            label: "Remaining",
            render: (val: any) => val ? Number(val).toLocaleString() : '0' 
          },
          { key: "budget_status", label: "Status" },
        ];
      case "invoice-pipeline":
        return [
          { key: "client_name", label: "Client" },
          { key: "project_name", label: "Project" },
          { key: "invoice_no", label: "Invoice No" },
          { 
            key: "total_amount", 
            label: "Amount",
            render: (val: any) => val ? Number(val).toLocaleString() : '0' 
          },
          { key: "payment_status", label: "Status" },
          { key: "ses_no", label: "SES No" },
          { key: "ses_status", label: "SES Status" },
        ];
      case "conso-invoice-detail":
        return [
          { key: "conso_invoice_no", label: "Conso Inv No" },
          { key: "client_name", label: "Client" },
          { key: "inspection_count", label: "Inspections" },
          { 
            key: "total_amount", 
            label: "Amount",
            render: (val: any) => val ? Number(val).toLocaleString() : '0' 
          },
          { key: "payment_status", label: "Status" },
          { key: "report_numbers", label: "Reports" },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reports</h1>
      
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#374151] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-gray-400 hover:text-white hover:border-[#374151]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
      ) : (
        <DataTable data={data} columns={generateColumns(activeTab)} searchKey="client_name" />
      )}
    </div>
  );
}
