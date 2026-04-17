"use client";

import { useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Square, CheckSquare, MinusSquare, Trash2, ChevronUp, ChevronDown, Download } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (val: any, row: any) => React.ReactNode;
}

interface BatchAction {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  onClick: (selectedIds: string[]) => void;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchKey?: string;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  batchActions?: BatchAction[];
  highlightedId?: string;
  rowKey?: string;
}

export function DataTable({
  data,
  columns,
  searchKey,
  onRowClick,
  selectable = true,
  selectedIds = [],
  onSelectionChange,
  batchActions,
  highlightedId: externalHighlightedId,
  rowKey: externalRowKey
}: DataTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const [internalHighlighted, setInternalHighlighted] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const highlightedId = externalHighlightedId ?? internalHighlighted;

  const safeData = Array.isArray(data) ? data : [];

  // Robustly find a unique ID for each row if not provided
  const getRowId = useCallback((row: any, index: number) => {
    if (externalRowKey && row[externalRowKey]) return String(row[externalRowKey]);
    if (row.id) return String(row.id);
    if (row.visit_ref) return String(row.visit_ref);
    if (row.contract_no) return String(row.contract_no);
    if (row.conso_invoice_no) return String(row.conso_invoice_no);
    if (row.invoice_no) return String(row.invoice_no);
    return `row-${index}`;
  }, [externalRowKey]);
  
  const activeSelection = selectedIds.length > 0 || onSelectionChange ? selectedIds : internalSelected;
  const setActiveSelection = onSelectionChange || setInternalSelected;

  const filteredData = safeData.filter((row) => {
    if (!search) return true;
    if (searchKey && row[searchKey]) {
      return String(row[searchKey]).toLowerCase().includes(search.toLowerCase());
    }
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir('asc'); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getPageIds = useCallback(() => {
    return paginatedData.map((row, i) => getRowId(row, (page - 1) * rowsPerPage + i));
  }, [paginatedData, getRowId, page, rowsPerPage]);

  const pageIds = getPageIds();
  const allPageSelected = paginatedData.length > 0 && pageIds.every(id => activeSelection.includes(id));
  const somePageSelected = pageIds.some(id => activeSelection.includes(id));

  const toggleSelectAll = useCallback(() => {
    const ids = getPageIds();
    if (allPageSelected) {
      setActiveSelection(activeSelection.filter(id => !ids.includes(id)));
    } else {
      const newSelection = [...new Set([...activeSelection, ...ids])];
      setActiveSelection(newSelection);
    }
  }, [allPageSelected, getPageIds, activeSelection, setActiveSelection]);

  const toggleSelectRow = useCallback((id: string) => {
    if (activeSelection.includes(id)) {
      setActiveSelection(activeSelection.filter(i => i !== id));
    } else {
      setActiveSelection([...activeSelection, id]);
    }
  }, [activeSelection, setActiveSelection]);

  const getSelectAllIcon = () => {
    if (allPageSelected) return <CheckSquare size={16} className="text-orange-500" />;
    if (somePageSelected) return <MinusSquare size={16} className="text-orange-500" />;
    return <Square size={16} className="text-gray-500" />;
  };

  const handleRowClick = (row: any, index: number) => {
    const id = getRowId(row, index);
    if (selectable) {
      toggleSelectRow(id);
    }
    setInternalHighlighted(id);
    if (onRowClick) onRowClick(row);
  };

  const handleBatchAction = (action: BatchAction) => {
    if (activeSelection.length === 0) return;
    if (confirm(`Apply "${action.label}" to ${activeSelection.length} selected item(s)?`)) {
      action.onClick(activeSelection);
    }
  };

  const handleExportCSV = () => {
    const headers = columns.map(c => c.label);
    const rows = filteredData.map(row => columns.map(c => {
      const val = row[c.key];
      if (val == null) return '';
      const str = String(typeof val === 'object' && val !== null ? JSON.stringify(val) : val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const selectColumn: Column = { key: "_select", label: "" };

  return (
    <div className="card !p-0 overflow-hidden flex flex-col min-w-0">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-[#374151] flex items-center justify-between bg-[#1f2937] flex-shrink-0">
        <div className="flex items-center gap-4">
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
          {activeSelection.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">{activeSelection.length} selected</span>
              <button
                onClick={() => setActiveSelection([])}
                className="text-orange-500 hover:text-orange-400 text-xs"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {activeSelection.length > 0 && batchActions && (
            <div className="flex items-center gap-2">
              {batchActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBatchAction(action)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    action.variant === "danger" 
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20" 
                      : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20"
                  }`}
                >
                  {action.icon || <Trash2 size={14} />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
          <div className="text-sm font-medium text-gray-400">
            Total: {filteredData.length} records
          </div>
          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-1.5 text-xs"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-auto w-full table-scrollbar max-h-[calc(100vh-280px)]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-[#111827]">
            <tr className="border-b border-[#374151]">
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <button onClick={toggleSelectAll} className="hover:opacity-80 transition-opacity">
                    {getSelectAllIcon()}
                  </button>
                </th>
              )}
              {columns.map((col) => {
                const isSortActive = sortKey === col.key;
                return (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                  style={{ minWidth: '140px' }}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {isSortActive ? (
                      sortDir === 'asc' ? (
                        <ChevronUp size={12} className="text-orange-500" />
                      ) : (
                        <ChevronDown size={12} className="text-orange-500" />
                      )
                    ) : (
                      <ChevronUp size={12} className="text-gray-600" />
                    )}
                  </span>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#374151]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => {
                const actualIndex = (page - 1) * rowsPerPage + i;
                const rowId = getRowId(row, actualIndex);
                const isSelected = activeSelection.includes(rowId);
                const isHighlighted = highlightedId === rowId;
                return (
                  <tr 
                    key={rowId} 
                    className={`transition-colors ${isHighlighted ? 'bg-orange-500/10' : isSelected ? 'bg-orange-500/5' : 'hover:bg-[#374151]/30'}`}
                    onClick={() => handleRowClick(row, actualIndex)}
                  >
                    {selectable && (
                      <td className="px-4 py-3 w-12" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowId)}
                          className="w-4 h-4 rounded border-gray-500 text-orange-500 focus:ring-orange-500 bg-[#111827]"
                        />
                      </td>
                    )}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-[#374151] flex items-center justify-between bg-[#1f2937] mt-auto flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Rows per page:</span>
          <select
            className="input !py-1 !px-2 !bg-[#111827]"
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-400 ml-4">
            Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages || 1}</span>
          </span>
        </div>
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
