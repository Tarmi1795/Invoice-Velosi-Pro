"use client";

import { useState } from "react";
import { X, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Brain } from "lucide-react";

interface ColumnMapping {
  excelHeader: string;
  normalizedHeader: string;
  dbField: string | null;
  confidence: "high" | "medium" | "low" | "unknown";
  source: "training" | "rules" | "llm" | "user";
  sampleValues: string[];
  instruction?: string;
}

interface MappingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: ColumnMapping[];
  availableFields: string[];
  entityName: string;
  onConfirm: (mappings: ColumnMapping[], trainingData: { header: string; field: string; instruction?: string }[]) => void;
}

export function MappingReviewModal({
  isOpen,
  onClose,
  mappings,
  availableFields,
  entityName,
  onConfirm,
}: MappingReviewModalProps) {
  const [localMappings, setLocalMappings] = useState<ColumnMapping[]>(() => {
    return mappings.map(m => {
      if (m.dbField) return m;
      if (m.confidence === "high" || m.confidence === "medium") {
        const suggestedField = availableFields.find(f => 
          f.toLowerCase().includes(m.normalizedHeader) ||
          m.normalizedHeader.includes(f.toLowerCase().replace(/_/g, ""))
        );
        if (suggestedField) {
          return { ...m, dbField: suggestedField };
        }
      }
      return m;
    });
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [instructionInput, setInstructionInput] = useState("");
  const [trainingUpdates, setTrainingUpdates] = useState<{ header: string; field: string; instruction?: string }[]>([]);

  if (!isOpen) return null;

  const handleFieldChange = (index: number, newField: string) => {
    const updated = [...localMappings];
    const oldMapping = updated[index];

    updated[index] = {
      ...oldMapping,
      dbField: newField || null,
      confidence: newField && newField !== "__N/A__" ? "high" : "unknown",
      source: "user" as const,
    };

    setLocalMappings(updated);
    
    const existingUpdate = trainingUpdates.find(u => u.header === oldMapping.excelHeader);
    if (existingUpdate) {
      existingUpdate.field = newField;
    } else {
      trainingUpdates.push({ 
        header: oldMapping.excelHeader, 
        field: newField,
        instruction: localMappings[index].instruction 
      });
    }
  };

  const handleInstructionSave = (index: number, instruction: string) => {
    const updated = [...localMappings];
    updated[index] = { ...updated[index], instruction };
    setLocalMappings(updated);
    
    const existingUpdate = trainingUpdates.find(u => u.header === updated[index].excelHeader);
    if (existingUpdate) {
      existingUpdate.instruction = instruction;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "training": return "🏷️";
      case "rules": return "📋";
      case "llm": return "🤖";
      case "user": return "👤";
      default: return "❓";
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case "high": return <CheckCircle2 size={16} className="text-green-500" />;
      case "medium": return <AlertTriangle size={16} className="text-yellow-500" />;
      case "low": return <AlertTriangle size={16} className="text-orange-500" />;
      default: return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  const handleConfirm = () => {
    onConfirm(localMappings, trainingUpdates);
    onClose();
  };

  const allFieldsMapped = localMappings.every(m => m.dbField && m.dbField !== "__N/A__");

  const getRowClass = (mapping: ColumnMapping) => {
    if (mapping.dbField === "__N/A__") return "bg-gray-500/5 border-gray-500/20";
    if (!mapping.dbField) return "bg-red-500/5 border-red-500/20";
    if (mapping.confidence === "high") return "bg-green-500/5 border-green-500/20";
    return "bg-yellow-500/5 border-yellow-500/20";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1f2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-center p-6 border-b border-[#374151]">
          <div className="flex items-center gap-3">
            <Brain className="text-orange-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">AI Mapping Review</h2>
              <p className="text-sm text-gray-400">{entityName} - Review column mappings before import</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {localMappings.map((mapping, index) => (
              <div 
                key={mapping.excelHeader} 
                className={`border rounded-lg p-4 ${getRowClass(mapping)}`}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{mapping.excelHeader}</span>
                      <span className="text-gray-500">→</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Sample: {mapping.sampleValues.slice(0, 3).join(", ")}
                      {mapping.sampleValues.length > 3 && ` (+${mapping.sampleValues.length - 3} more)`}
                    </div>
                  </div>

                  {mapping.dbField ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={mapping.dbField}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        className="input !w-48"
                      >
                        <option value="">-- Select Field --</option>
                        <option value="__N/A__">N/A — Skip this field</option>
                        {availableFields.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => handleFieldChange(index, e.target.value)}
                      className="input !w-48"
                    >
                      <option value="">-- Select Field --</option>
                      <option value="__N/A__">N/A — Skip this field</option>
                      {availableFields.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    {getSourceIcon(mapping.source)}
                    <span className="text-gray-400 capitalize">{mapping.source}</span>
                    {getConfidenceIcon(mapping.confidence)}
                    <span className={`text-xs ${
                      mapping.confidence === "high" ? "text-green-500" :
                      mapping.confidence === "medium" ? "text-yellow-500" :
                      mapping.confidence === "low" ? "text-orange-500" : "text-gray-500"
                    }`}>
                      {mapping.confidence.toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                  >
                    {mapping.instruction ? "✏️ Edit" : "+ Add"} Instruction
                    {mapping.instruction ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {editingIndex === index && (
                  <div className="mt-3 pt-3 border-t border-[#374151]">
                    <label className="text-xs text-gray-400 mb-1 block">
                      Instruction for future mappings (optional):
                    </label>
                    <input
                      type="text"
                      className="input !w-full"
                      placeholder="e.g., PO always means ITP code in our system"
                      value={mapping.instruction || ""}
                      onChange={(e) => handleInstructionSave(index, e.target.value)}
                    />
                    {mapping.instruction && (
                      <p className="text-xs text-orange-400 mt-1">
                        ✓ This instruction will be saved and used for future mappings
                      </p>
                    )}
                  </div>
                )}

                {mapping.instruction && editingIndex !== index && (
                  <div className="mt-2 text-xs text-orange-400 italic">
                    📝 Rule: {mapping.instruction}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-[#374151] bg-[#111827]">
          <div className="text-sm text-gray-400">
            {localMappings.filter(m => m.dbField).length} of {localMappings.length} columns mapped
            {trainingUpdates.length > 0 && (
              <span className="text-orange-400 ml-2">
                • {trainingUpdates.length} will be saved as training data
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button 
              onClick={handleConfirm} 
              disabled={!allFieldsMapped}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}