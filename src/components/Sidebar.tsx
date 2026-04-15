"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Users,
  Briefcase,
  UserCircle,
  ClipboardList,
  FileText,
  CheckSquare,
  PieChart,
  Calculator,
  Terminal,
  Settings,
  Brain,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import Image from "next/image";

export function Sidebar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith("/settings"));

  const mainNavItems = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Clients & Contracts", href: "/clients", icon: Users },
    { name: "Projects", href: "/projects", icon: Briefcase },
    { name: "Inspectors", href: "/inspectors", icon: UserCircle },
    { name: "Inspections", href: "/inspections", icon: ClipboardList },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "ITP/PO Monitoring", href: "/monitoring", icon: Calculator },
    { name: "SES Tracking", href: "/ses", icon: CheckSquare },
    { name: "System Tools", href: "/tools", icon: Terminal },
    { name: "Reports", href: "/reports", icon: PieChart },
  ];

  const settingsNavItems = [
    { name: "Workflow Settings", href: "/settings", icon: Settings },
    { name: "Column Mapping AI", href: "/settings/column-mappings", icon: Brain },
  ];

  const isSettingsActive = pathname.startsWith("/settings");

  return (
    <div className="w-64 h-screen bg-[#1f2937] border-r border-[#374151] flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-[#374151]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 relative">
            <Image src="/logos/velosi_logo.png" alt="Velosi Logo" fill className="object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white">Smart VelosInvoice</h1>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-1">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-orange-500/10 text-orange-500 font-medium"
                  : "text-gray-400 hover:text-white hover:bg-[#374151]/50"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-orange-500" : "text-gray-400"} />
              {item.name}
            </Link>
          );
        })}

        {/* Settings Collapsible */}
        <div>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors ${
              isSettingsActive
                ? "bg-orange-500/10 text-orange-500 font-medium"
                : "text-gray-400 hover:text-white hover:bg-[#374151]/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings size={20} className={isSettingsActive ? "text-orange-500" : "text-gray-400"} />
              <span>Settings</span>
            </div>
            {settingsOpen ? (
              <ChevronDown size={16} className="text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-400" />
            )}
          </button>

          {settingsOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-[#374151] pl-3">
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? "bg-orange-500/10 text-orange-500 font-medium"
                        : "text-gray-400 hover:text-white hover:bg-[#374151]/50"
                    }`}
                  >
                    <item.icon size={16} className={isActive ? "text-orange-500" : "text-gray-400"} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 text-xs text-center text-gray-500 border-t border-[#374151]">
        Invoice Velosi Pro v1.0
      </div>
    </div>
  );
}