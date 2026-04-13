"use client";

import { useState } from "react";
import { Play, FileCode, Terminal, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ToolsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runPythonScript = async (scriptName: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/execute-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptName }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Terminal className="text-orange-500" /> System Tools
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <FileCode size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white">Document Merger</h3>
              <p className="text-xs text-gray-500 lowercase font-bold tracking-wider">merge_docs.py</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-400">
            Automatically scan the project directories and merge all associated Timesheets and Invoices into a single PDF package.
          </p>

          <button 
            onClick={() => runPythonScript("merge_docs.py")}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
            {loading ? "Executing Python..." : "Run Merge Script"}
          </button>
        </div>

        {/* Placeholder for more tools */}
        <div className="card border-dashed opacity-50 flex flex-col items-center justify-center py-10">
           <p className="text-gray-500">More Python tools can be added here...</p>
        </div>
      </div>

      {result && (
        <div className={`card animate-in fade-in slide-in-from-top-4 ${result.success ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-4">
            {result.success ? <CheckCircle className="text-green-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
            <h4 className="font-bold text-white">Execution {result.success ? "Success" : "Failed"}</h4>
          </div>
          
          <div className="bg-black/40 rounded-lg p-4 font-mono text-xs overflow-x-auto whitespace-pre">
            {result.success ? (
              <span className="text-green-400">{result.output}</span>
            ) : (
              <span className="text-red-400">{result.error}\n{result.stderr}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
