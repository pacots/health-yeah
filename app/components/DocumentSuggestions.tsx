"use client";

import React, { useState } from "react";
import { Document, EntityMatchResult, ConditionRecord, AllergyRecord, MedicationRecord } from "@/lib/types";
import { useApp } from "@/lib/context";

interface DocumentSuggestionsProps {
  document: Document;
  onClose?: () => void;
}

export function DocumentSuggestions({ document, onClose }: DocumentSuggestionsProps) {
  const { records, processEntityMatch } = useApp();
  const [processing, setProcessing] = useState<string | null>(null);

  // Use new unified entity matches, fallback to legacy condition suggestions
  const matches = document.aiEntityMatches || [];
  const pendingMatches = matches.filter((m) => !m.reviewed);

  if (pendingMatches.length === 0) {
    return null;
  }

  // Helper: Get entity name for display
  const getEntityName = (match: EntityMatchResult): string => {
    return match.type.charAt(0).toUpperCase() + match.type.slice(1);
  };

  // Helper: Get existing entity of a type for display
  const getExistingEntity = (id: string, type: string) => {
    if (type === 'condition') {
      return records.find((r) => r.type === 'condition' && r.id === id) as ConditionRecord | undefined;
    } else if (type === 'allergy') {
      return records.find((r) => r.type === 'allergy' && r.id === id) as AllergyRecord | undefined;
    } else {
      return records.find((r) => r.type === 'medication' && r.id === id) as MedicationRecord | undefined;
    }
  };

  // Helper: Get entity display name
  const getEntityDisplayName = (entity: any, type: string): string => {
    if (type === 'condition') return (entity as ConditionRecord).name;
    if (type === 'allergy') return (entity as AllergyRecord).allergen;
    return (entity as MedicationRecord).name;
  };

  const handleAction = async (matchIndex: number, action: 'link' | 'dismiss' | 'create') => {
    try {
      setProcessing(`${matchIndex}-${action}`);
      await processEntityMatch(document.id, matchIndex, action);
    } catch (error) {
      console.error(`Failed to ${action} entity match:`, error);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Entity Matches</h2>
              <p className="text-sm text-gray-600 mt-1">
                Found {pendingMatches.length} entit{pendingMatches.length !== 1 ? "ies" : "y"} in "{document.title}"
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 text-2xl leading-none"
              >
                ×
              </button>
            )}
          </div>

          <div className="space-y-4">
            {pendingMatches.map((match, idx) => {
              const isProcessing = processing === `${idx}-link` || processing === `${idx}-create`;
              const existingEntity = match.action === 'link-existing' && match.matchedId
                ? getExistingEntity(match.matchedId, match.type)
                : null;

              return (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  {/* Entity Type Badge + Title */}
                  <div className="flex items-start gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      match.type === 'condition' ? 'bg-blue-100 text-blue-700' :
                      match.type === 'allergy' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {getEntityName(match)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 break-words">
                        {match.extractedName}
                      </h3>
                      {match.extractedName !== match.finalName && (
                        <p className="text-sm text-gray-500">
                          → <span className="font-medium">{match.finalName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Badge */}
                  {match.action === 'link-existing' && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">
                        Existing: <span className="font-medium">{existingEntity ? getEntityDisplayName(existingEntity, match.type) : match.finalName}</span>
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  {match.reason && (
                    <p className="text-sm text-gray-600 mb-3">
                      {match.reason}
                    </p>
                  )}

                  {/* Confidence Bar */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all"
                        style={{ width: `${Math.round(match.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {Math.round(match.confidence * 100)}%
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {match.action === 'link-existing' ? (
                      <button
                        onClick={() => handleAction(idx, 'link')}
                        disabled={isProcessing}
                        className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessing ? "Linking..." : "Link"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(idx, 'create')}
                        disabled={isProcessing}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessing ? "Creating..." : "Create & Link"}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction(idx, 'dismiss')}
                      disabled={processing === `${idx}-dismiss`}
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
