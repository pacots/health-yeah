"use client";

import React, { useState } from "react";
import { Document, ConditionRecord, DocumentConditionSuggestion } from "@/lib/types";
import { useApp } from "@/lib/context";

interface DocumentSuggestionsProps {
  document: Document;
  onClose?: () => void;
}

export function DocumentSuggestions({ document, onClose }: DocumentSuggestionsProps) {
  const { records, linkDocumentToExistingCondition, createNewConditionFromSuggestion, dismissConditionSuggestion, acceptConditionSuggestionWithManualSelect } = useApp();
  const [processing, setProcessing] = useState<string | null>(null);
  const [manualSelectIndex, setManualSelectIndex] = useState<number | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  const suggestions = document.aiConditionSuggestions || [];
  const pendingSuggestions = suggestions.filter((s) => !s.reviewed);

  if (pendingSuggestions.length === 0) {
    return null;
  }

  // Get existing conditions for matching
  const existingConditions = records.filter(
    (r) => r.type === "condition" && r.status === "active"
  ) as ConditionRecord[];

  // For lookup purposes, include all conditions (not just active)
  const allConditions = records.filter(
    (r) => r.type === "condition"
  ) as ConditionRecord[];

  const handleLinkExisting = async (suggestion: DocumentConditionSuggestion, suggestionIndex: number) => {
    if (!suggestion.matchedConditionId) return;

    try {
      setProcessing(suggestion.conditionName);
      await linkDocumentToExistingCondition(document.id, suggestion.matchedConditionId);
      
      // Mark suggestion as accepted
      const actualIndex = suggestions.indexOf(suggestion);
      await acceptConditionSuggestionWithManualSelect(document.id, actualIndex, suggestion.matchedConditionId);
    } catch (error) {
      console.error("Failed to link condition:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateNew = async (suggestion: DocumentConditionSuggestion) => {
    try {
      setProcessing(suggestion.conditionName);
      await createNewConditionFromSuggestion(suggestion, document.id);
      
      // Mark suggestion as accepted
      const actualIndex = suggestions.indexOf(suggestion);
      const newConditionSuggestions = document.aiConditionSuggestions || [];
      const newConditionId = newConditionSuggestions[actualIndex]?.matchedConditionId;
      
      // The accepts are already handled in the create/link methods, but mark as reviewed
      // by marking the suggestion as accepted in the UI
    } catch (error) {
      console.error("Failed to create condition:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleManualSelect = async (suggestion: DocumentConditionSuggestion, suggestionIndex: number, conditionId: string) => {
    try {
      setProcessing(`${suggestion.conditionName}-manual`);
      const actualIndex = suggestions.indexOf(suggestion);
      await acceptConditionSuggestionWithManualSelect(document.id, actualIndex, conditionId);
      setManualSelectIndex(null);
      setSelectedConditionId(null);
    } catch (error) {
      console.error("Failed to link document to condition:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDismiss = async (suggestion: DocumentConditionSuggestion) => {
    try {
      const actualIndex = suggestions.indexOf(suggestion);
      await dismissConditionSuggestion(document.id, actualIndex);
    } catch (error) {
      console.error("Failed to dismiss suggestion:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Suggestions</h2>
              <p className="text-sm text-gray-600 mt-1">
                Found {pendingSuggestions.length} condition{pendingSuggestions.length !== 1 ? "s" : ""} related to "{document.title}"
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
            {pendingSuggestions.map((suggestion, idx) => {
              const actualIndex = suggestions.indexOf(suggestion);
              const isUnmatched = suggestion.type === "create-new" || !suggestion.matchedConditionId;
              const matchedCondition =
                !isUnmatched && suggestion.matchedConditionId
                  ? allConditions.find((c) => c.id === suggestion.matchedConditionId)
                  : null;
              const isShowingManualSelect = manualSelectIndex === actualIndex;

              return (
                <div
                  key={actualIndex}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {suggestion.conditionName}
                      </h3>
                      {suggestion.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          {suggestion.reason}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all"
                            style={{ width: `${Math.round(suggestion.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Select Dropdown */}
                  {isShowingManualSelect ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-gray-700">Choose a condition:</p>
                      <select
                        value={selectedConditionId || ""}
                        onChange={(e) => setSelectedConditionId(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="">-- Select a condition --</option>
                        {existingConditions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (selectedConditionId) {
                              handleManualSelect(suggestion, actualIndex, selectedConditionId);
                            }
                          }}
                          disabled={!selectedConditionId || processing === `${suggestion.conditionName}-manual`}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Link
                        </button>
                        <button
                          onClick={() => {
                            setManualSelectIndex(null);
                            setSelectedConditionId(null);
                          }}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {isUnmatched ? (
                        <>
                          <button
                            onClick={() => handleCreateNew(suggestion)}
                            disabled={processing === suggestion.conditionName}
                            className="flex-1 min-w-fit px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {processing === suggestion.conditionName ? "Creating..." : "Create & Link"}
                          </button>
                          <button
                            onClick={() => setManualSelectIndex(actualIndex)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                          >
                            Link to existing
                          </button>
                        </>
                      ) : matchedCondition ? (
                        <>
                          <button
                            onClick={() => handleLinkExisting(suggestion, actualIndex)}
                            disabled={processing === suggestion.conditionName}
                            className="flex-1 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {processing === suggestion.conditionName ? "Linking..." : `Link to "${matchedCondition.name}"`}
                          </button>
                          <button
                            onClick={() => setManualSelectIndex(actualIndex)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                            title="Choose a different condition"
                          >
                            Other
                          </button>
                        </>
                      ) : null}

                      <button
                        onClick={() => handleDismiss(suggestion)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
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
