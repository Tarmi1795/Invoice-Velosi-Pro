import { useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle2, AlertTriangle, X } from "lucide-react";

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  apiEndpoint: string;
  onSuccess: () => void;
  expectedHeaders: string[]; // Provide user with expected headers
}

export function BatchUploadModal({ isOpen, onClose, entityName, apiEndpoint, onSuccess, expectedHeaders }: BatchUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState<number | null>(null);
  const [rowsCount, setRowsCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setUploading(true);
    setSuccessCount(null);
    setErrorCount(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        setRowsCount(rows.length);

        if(rows.length === 0) {
            alert("The uploaded excel sheet is empty.");
            setUploading(false);
            return;
        }

        let sCount = 0;
        let eCount = 0;

        // Perform sequential or parallel POST. 
        // Sequential is safer to not blast the poor database with 1000 requests instantly and crash prisma.
        const BATCH_SIZE = 5;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (row: any) => {
                try {
                     const res = await fetch(apiEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(row)
                     });
                     if (res.ok) sCount++;
                     else eCount++;
                } catch(err) {
                    eCount++;
                }
            }));
        }

        setSuccessCount(sCount);
        setErrorCount(eCount);
        onSuccess();
      } catch (err) {
        console.error(err);
        alert("Failed to parse the file. Ensure it is a valid .xlsx or .xls file.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetState = () => {
      setFile(null);
      setUploading(false);
      setSuccessCount(null);
      setErrorCount(null);
      setRowsCount(null);
      onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1f2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center border-b border-[#374151] pb-4 mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UploadCloud className="text-orange-500" /> Upload {entityName}
            </h2>
            <button onClick={resetState} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {successCount === null ? (
            <div className="space-y-4">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 text-sm text-gray-300">
                    <p className="font-medium text-white mb-2">Instructions:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-3">
                        <li>Ensure exact column names match database keys.</li>
                        <li>Foreign keys (like <code className="bg-[#374151] px-1 rounded text-gray-100">project_id</code>) must use actual system IDs, not names.</li>
                    </ul>
                    <p className="font-medium text-white mb-1">Expected Columns:</p>
                    <div className="flex flex-wrap gap-1">
                        {expectedHeaders.map(h => (
                            <span key={h} className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded">
                                {h}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-400">Select XLSX File</label>
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileUpload} 
                        className="py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 cursor-pointer"
                    />
                </div>

                <button 
                  onClick={processFile} 
                  disabled={!file || uploading}
                  className="w-full btn-primary mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                    ) : (
                        "Start Batch Upload"
                    )}
                </button>
            </div>
        ) : (
            <div className="space-y-4 text-center py-6">
                <div className="flex justify-center mb-4">
                    {errorCount === 0 ? (
                        <CheckCircle2 size={64} className="text-green-500" />
                    ) : (
                        <AlertTriangle size={64} className="text-yellow-500" />
                    )}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">Upload Complete!</h3>
                <p className="text-gray-300">
                    Processed <span className="text-white font-medium">{rowsCount}</span> rows.
                </p>
                <div className="flex justify-center gap-4 mt-2">
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-2 rounded-lg">
                        <span className="block text-2xl font-bold">{successCount}</span>
                        <span className="text-xs uppercase tracking-wider">Success</span>
                    </div>
                    {errorCount ? (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg">
                          <span className="block text-2xl font-bold">{errorCount}</span>
                          <span className="text-xs uppercase tracking-wider">Failed</span>
                      </div>
                    ) : null}
                </div>

                <button onClick={resetState} className="w-full btn-secondary mt-6 border-[#374151]">
                    Close
                </button>
            </div>
        )}
        
      </div>
    </div>
  );
}
