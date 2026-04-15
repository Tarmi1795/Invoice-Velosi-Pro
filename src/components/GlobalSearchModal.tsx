"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";

const ENTITY_LABELS: Record<string, string> = {
  invoices: "Invoices",
  clients: "Clients",
  projects: "Projects",
  ses: "SES Records",
  inspections: "Inspections",
  inspectors: "Inspectors",
  po_records: "PO Records",
  service_orders: "Service Orders",
};

const ENTITY_PATHS: Record<string, string> = {
  invoices: "/invoices",
  clients: "/clients",
  projects: "/projects",
  ses: "/ses",
  inspections: "/inspections",
  inspectors: "/inspectors",
  po_records: "/po_records",
  service_orders: "/service_orders",
};

const DEFAULT_ENTITIES = ["invoices", "clients", "projects", "ses", "inspections"];

interface SearchResult {
  id: string;
  mainText: string;
  subText: string;
  type: string;
  created_at?: string | null;
}

export function GlobalSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entities, setEntities] = useState<string[]>(DEFAULT_ENTITIES);
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults({});
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2 || entities.length === 0) {
      if (query.length < 2) setResults({});
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, entities }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, entities]);

  if (!open) return null;

  const toggleEntity = (key: string) => {
    setEntities(prev =>
      prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]
    );
  };

  const handleResultClick = (result: SearchResult) => {
    const path = ENTITY_PATHS[result.type] || `/${result.type}`;
    router.push(`${path}?highlight=${result.id}`);
    setOpen(false);
  };

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-[700px] max-h-[80vh] overflow-y-auto table-scrollbar bg-[#1f2937] border border-[#374151] rounded-xl shadow-2xl">
        {/* Search Header */}
        <div className="sticky top-0 z-10 bg-[#1f2937] border-b border-[#374151] p-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search across all records..."
              className="w-full bg-[#111827] border border-[#374151] rounded-lg pl-12 pr-10 py-3 text-base text-[#f3f4f6] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press ESC to close</p>
        </div>

        {/* Entity Filters */}
        <div className="p-4 border-b border-[#374151]">
          <div className="flex flex-wrap gap-3">
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entities.includes(key)}
                  onChange={() => toggleEntity(key)}
                  className="w-4 h-4 rounded border-gray-500 text-orange-500 focus:ring-orange-500 bg-[#111827]"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="p-4">
          {query.length < 2 ? (
            <p className="text-center text-gray-500 py-8">Type at least 2 characters to search</p>
          ) : loading ? (
            <p className="text-center text-gray-500 py-8 animate-pulse">Searching...</p>
          ) : !hasResults ? (
            <p className="text-center text-gray-500 py-8">No results found for &quot;{query}&quot;</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(results).map(([type, items]) => {
                if (!items || items.length === 0) return null;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                        {ENTITY_LABELS[type] || type}
                      </span>
                      <span className="bg-[#374151] text-gray-300 text-xs px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {items.map((result: SearchResult) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#374151]/30 hover:border-l-2 hover:border-l-[#f97316] border-l-2 border-l-transparent transition-colors"
                        >
                          <div className="font-medium text-[#f3f4f6]">{result.mainText}</div>
                          {result.subText && (
                            <div className="text-sm text-gray-400 mt-0.5">{result.subText}</div>
                          )}
                          {result.created_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(result.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
