"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react";

export interface ValidationIssue {
  row: number;
  field: string;
  originalValue: string;
  suggestedValue: string | null;
  suggestionData?: any;
  type: string;
}

interface DataValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: ValidationIssue[];
  onConfirm: (approvedIssues: ValidationIssue[]) => void;
  onProceedAnyway: () => void;
}

export function DataValidationModal({ isOpen, onClose, issues, onConfirm, onProceedAnyway }: DataValidationModalProps) {
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(() => {
    // Automatically approve issues that have a suggestion
    const initial = new Set<number>();
    issues.forEach((issue, index) => {
      if (issue.suggestedValue) {
        initial.add(index);
      }
    });
    return initial;
  });

  if (!isOpen) return null;

  const toggleApproval = (index: number) => {
    if (!issues[index].suggestedValue) return; // Can't approve if no suggestion
    const next = new Set(approvedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setApprovedIndices(next);
  };

  const handleApplyFixes = () => {
    const approvedIssues = issues.filter((_, i) => approvedIndices.has(i));
    onConfirm(approvedIssues);
  };

  const hasSuggestions = issues.some(i => i.suggestedValue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1f2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-center p-6 border-b border-[#374151]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">Validation & Auto-Correction</h2>
              <p className="text-sm text-gray-400">We found unrecognized names in your data. Review AI suggestions.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {issues.map((issue, index) => {
              const hasSuggestion = Boolean(issue.suggestedValue);
              const isApproved = approvedIndices.has(index);

              return (
                <div 
                  key={`${issue.row}-${issue.field}-${index}`}
                  className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${
                    !hasSuggestion ? "bg-red-500/10 border-red-500/30" :
                    isApproved ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-[#374151] text-gray-300 px-2 py-0.5 rounded">Row {issue.row}</span>
                      <span className="text-sm font-medium text-gray-400 capitalize">{issue.field.replace(/_/g, " ")}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2">
                       <div className="text-white relative line-through text-opacity-50">
                          {issue.originalValue || "(blank)"}
                       </div>
                       
                       {hasSuggestion ? (
                          <>
                            <span className="text-gray-500">→</span>
                            <div className={`font-bold ${isApproved ? "text-green-400" : "text-yellow-400"}`}>
                              {issue.suggestedValue}
                            </div>
                          </>
                       ) : (
                          <div className="flex items-center gap-2 text-red-400 font-bold ml-4">
                            <AlertOctagon size={16} /> No match found. This may cause an error.
                          </div>
                       )}
                    </div>
                  </div>

                  {hasSuggestion && (
                    <button 
                      onClick={() => toggleApproval(index)}
                      className={`ml-4 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                        isApproved 
                          ? "bg-green-500 text-white" 
                          : "bg-[#374151] text-gray-400 hover:bg-[#4b5563]"
                      }`}
                    >
                      {isApproved ? <CheckCircle2 size={16} /> : null}
                      {isApproved ? "Fixed" : "Apply Fix"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-[#374151] bg-[#111827]">
          <div className="text-sm text-gray-400">
            {approvedIndices.size} of {issues.filter(i => i.suggestedValue).length} suggestions accepted.
            {issues.length - issues.filter(i => i.suggestedValue).length > 0 && (
              <span className="text-red-400 ml-2">
                ({issues.length - issues.filter(i => i.suggestedValue).length} unresolvable issues)
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onProceedAnyway} className="btn-secondary text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40">
              Ignore Issues & Import
            </button>
            <button 
              onClick={handleApplyFixes} 
              disabled={approvedIndices.size === 0 && hasSuggestions}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> Apply Fixes & Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
