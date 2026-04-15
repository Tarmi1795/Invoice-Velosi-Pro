"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle2, AlertTriangle, X, Download, Brain } from "lucide-react";
import { downloadTemplate } from "@/lib/templateGenerator";
import { MappingReviewModal } from "./MappingReviewModal";

interface ColumnMapping {
  excelHeader: string;
  normalizedHeader: string;
  dbField: string | null;
  confidence: "high" | "medium" | "low" | "unknown";
  source: "training" | "rules" | "llm" | "user";
  sampleValues: string[];
  instruction?: string;
}

interface EnhancedBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityType: string;
  apiEndpoint: string;
  onSuccess: () => void;
  expectedHeaders: string[];
}

export function EnhancedBatchUploadModal({ 
  isOpen, 
  onClose, 
  entityName, 
  entityType,
  apiEndpoint, 
  onSuccess, 
  expectedHeaders 
}: EnhancedBatchUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState<number | null>(null);
  const [rowsCount, setRowsCount] = useState<number | null>(null);
  const [showMappingReview, setShowMappingReview] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ row: number; reason: string }[]>([]);
  const [errorSummary, setErrorSummary] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.name.match(/\.(xlsx|xls)$/i)) {
        setFile(droppedFile);
      } else {
        alert("Please drop a valid .xlsx or .xls file.");
      }
    }
  };

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const filename = `${entityName.toLowerCase().replace(/ /g, "_")}_template.xlsx`;
    downloadTemplate(expectedHeaders, filename);
  };

  const analyzeFile = async () => {
    if (!file) return;
    setAnalyzing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (!rows || rows.length === 0) {
          alert("The uploaded excel sheet is empty.");
          setAnalyzing(false);
          return;
        }

        const headerRow = rows[0].map((h: any) => String(h || ""));
        const sampleRows = rows.slice(1, 4).map(row => headerRow.map((_, i) => String(row[i] || "")));
        
        console.log("[EnhancedBatchUpload] Analyzing file:", { entityType, headerCount: headerRow.length, sampleRowCount: sampleRows.length });
        setHeaders(headerRow);
        setParsedData(rows.slice(1));

        const response = await fetch("/api/batch-ai-map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType,
            headers: headerRow,
            sampleRows,
          }),
        });

        console.log("[EnhancedBatchUpload] Response status:", response.status);

        if (!response.ok) {
          const text = await response.text();
          console.error("[EnhancedBatchUpload] API error response:", text);
          throw new Error("AI analysis failed: " + text);
        }

        const result = await response.json();
        console.log("[EnhancedBatchUpload] Analysis result:", { mappingsCount: result.mappings?.length, unmappedCount: result.unmappedHeaders?.length });

        if (!result.mappings || !Array.isArray(result.mappings)) {
          throw new Error("Invalid response from server - missing mappings");
        }

        setMappings(result.mappings);
        setAvailableFields(result.availableFields || []);
        setRowsCount(rows.length - 1);
        setShowMappingReview(true);
        setAnalyzing(false);
      } catch (err) {
        console.error("[EnhancedBatchUpload] Error:", err);
        alert("Failed to analyze the file: " + (err instanceof Error ? err.message : String(err)));
        setAnalyzing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingConfirm = async (confirmedMappings: ColumnMapping[], trainingData: { header: string; field: string; instruction?: string }[]) => {
    setShowMappingReview(false);
    setUploading(true);

    try {
      if (trainingData && trainingData.length > 0) {
        await fetch("/api/batch-ai-map", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType,
            mappings: confirmedMappings,
            trainingData,
          }),
        });
      }

      const mappingIndexMap = new Map<string, number>();
      confirmedMappings.forEach((m, idx) => {
        mappingIndexMap.set(m.excelHeader, idx);
      });

      const headerToField = new Map<string, string>();
      confirmedMappings.forEach(m => {
        if (m.dbField && m.dbField !== "__N/A__") {
          headerToField.set(m.excelHeader, m.dbField);
        }
      });

      const transformedRows = parsedData.map(row => {
        const newRow: any = {};
        headers.forEach((h, i) => {
          const field = headerToField.get(h);
          if (field) {
            const raw = row[i];
            // Skip blank, "NA", "N/A", or empty-whitespace values — treat as absent/not applicable
            if (raw === null || raw === undefined || raw === "" ||
                String(raw).trim().toUpperCase() === "NA" ||
                String(raw).trim().toUpperCase() === "N/A") {
              return; // don't include this field in the row
            }
            newRow[field] = raw;
          }
        });
        return newRow;
      }).filter(row => Object.keys(row).length > 0);

      const batchEndpoint = apiEndpoint + "/batch";
      const res = await fetch(batchEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: transformedRows }),
      });

      const result = await res.json();

      if (!res.ok) {
        const errMsg = result.error || "Batch upload failed";
        const failedRows: { row: number; reason: string }[] = result.failedRows || [];
        setSuccessCount(0);
        setErrorCount(failedRows.length > 0 ? failedRows.length : (rowsCount || 1));
        setErrorSummary(errMsg);
        setErrorDetails(failedRows.length > 0 ? failedRows : (result.errors || []).map((e: string, i: number) => ({ row: i + 1, reason: e })));
        setShowErrorDetails(true);
        setUploading(false);
        return;
      }

      setSuccessCount(result.success || 0);
      setErrorCount(result.failed || 0);
      setErrorDetails(result.errors ? result.errors.map((e: string, i: number) => ({ row: i + 1, reason: e })) : []);
      if (result.failed > 0 && result.errors && result.errors.length > 0) {
        setErrorSummary(`${result.failed} row(s) failed to insert. See details below for specific errors and suggested fixes.`);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setSuccessCount(0);
      setErrorCount(rowsCount || 1);
      setErrorSummary("Upload request failed: " + msg);
      setErrorDetails([{ row: 0, reason: msg }]);
      setShowErrorDetails(true);
      setUploading(false);
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setAnalyzing(false);
    setUploading(false);
    setSuccessCount(null);
    setErrorCount(null);
    setRowsCount(null);
    setShowMappingReview(false);
    setParsedData([]);
    setHeaders([]);
    setMappings([]);
    setShowErrorDetails(false);
    setErrorDetails([]);
    setErrorSummary("");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[#1f2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="flex justify-between items-center border-b border-[#374151] pb-4 mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="text-orange-500" /> AI Batch Upload {entityName}
            </h2>
            <button onClick={resetState} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {successCount === null ? (
            <div className="space-y-4">
              <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 text-sm text-gray-300">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-white">AI-Powered Column Mapping</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload your Excel file and let AI analyze column headers to automatically map them to database fields.
                    </p>
                  </div>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-400 text-xs font-medium"
                  >
                    <Download size={14} /> Template
                  </button>
                </div>
                <ul className="list-disc pl-5 space-y-1 mt-3 text-xs text-gray-400">
                  <li>AI will analyze headers and sample data</li>
                  <li>Review and confirm mappings before import</li>
                  <li>Add instructions to train for future uploads</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Select XLSX File</label>
                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-[#374151] hover:border-orange-500/50"
                  }`}
                >
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud
                    size={32}
                    className={`mx-auto mb-2 ${isDragging ? "text-orange-500" : "text-gray-400"}`}
                  />
                  <p className="text-sm text-gray-300">
                    {file ? (
                      <span className="text-green-400 font-medium">{file.name}</span>
                    ) : (
                      <>
                        <span className="text-white">Drag & drop your file here</span>
                        <br />
                        <span className="text-gray-500">or click to browse</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button 
                onClick={analyzeFile}
                disabled={!file || analyzing}
                className="w-full btn-primary mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Brain size={18} />
                    Analyze & Map Columns
                  </>
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
                {errorCount !== null && errorCount > 0 ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg">
                    <span className="block text-2xl font-bold">{errorCount}</span>
                    <span className="text-xs uppercase tracking-wider">Failed</span>
                  </div>
                ) : null}
              </div>

              {errorSummary && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300 text-left">
                  <p className="font-medium text-red-400 mb-1">What went wrong:</p>
                  <p>{errorSummary}</p>
                </div>
              )}

              {errorCount !== null && errorCount > 0 && errorDetails.length > 0 && (
                <div className="text-left">
                  <button
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="text-orange-500 hover:text-orange-400 text-sm font-medium flex items-center gap-1 mx-auto mb-2"
                  >
                    {showErrorDetails ? "Hide" : "Show"} failure details ({errorDetails.length})
                  </button>
                  {showErrorDetails && (
                    <div className="bg-[#111827] border border-[#374151] rounded-lg p-3 max-h-48 overflow-y-auto text-left">
                      {errorDetails.map((err, i) => (
                        <div key={i} className="text-sm text-red-300 py-1 border-b border-[#2d2f3d] last:border-0">
                          <span className="text-red-400 font-mono text-xs mr-2">
                            {err.row > 0 ? `Row ${err.row}:` : 'Error:'}
                          </span>
                          {err.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={resetState} className="w-full btn-secondary mt-6 border-[#374151]">
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {showMappingReview && (
        <MappingReviewModal
          isOpen={showMappingReview}
          onClose={() => setShowMappingReview(false)}
          mappings={mappings}
          availableFields={availableFields}
          entityName={entityName}
          onConfirm={handleMappingConfirm}
        />
      )}
    </>
  );
}