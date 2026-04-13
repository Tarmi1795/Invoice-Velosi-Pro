"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchKey?: string;
  onRowClick?: (row: any) => void;
}

export function DataTable({ data, columns, searchKey, onRowClick }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const safeData = Array.isArray(data) ? data : [];

  const filteredData = safeData.filter((row) => {
    if (!search) return true;
    if (searchKey && row[searchKey]) {
      return String(row[searchKey]).toLowerCase().includes(search.toLowerCase());
    }
    return Object.values(row).some((val) => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="card !p-0 overflow-hidden flex flex-col min-w-0">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-[#374151] flex items-center justify-between bg-[#1f2937] flex-shrink-0">
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="input !pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="text-sm font-medium text-gray-400">
          Total: {filteredData.length} records
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#111827]/50 border-b border-[#374151]">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  style={{ minWidth: '140px' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  className={`hover:bg-[#374151]/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => (
                    <td 
                      key={col.key} 
                      className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap"
                      style={{ minWidth: '140px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={String(row[col.key] ?? '')}
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-[#374151] flex items-center justify-between bg-[#1f2937] mt-auto flex-shrink-0">
        <span className="text-sm text-gray-400">
          Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages || 1}</span>
        </span>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-md border border-[#374151] text-gray-400 hover:text-white hover:bg-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            className="p-2 rounded-md border border-[#374151] text-gray-400 hover:text-white hover:bg-[#374151] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
