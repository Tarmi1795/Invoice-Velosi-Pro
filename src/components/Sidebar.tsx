"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
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
    { name: "Workflow Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-[#1f2937] border-r border-[#374151] flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-[#374151]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black">
            V
          </div>
          Velosi Pro
        </h1>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-1">
        {navItems.map((item) => {
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
      </div>
      
      <div className="p-4 text-xs text-center text-gray-500 border-t border-[#374151]">
        Invoice Velosi Pro v1.0
      </div>
    </div>
  );
}
