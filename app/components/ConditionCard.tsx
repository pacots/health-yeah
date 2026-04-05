"use client";

import React, { useState } from "react";
import { ConditionRecord, Document } from "@/lib/types";
import { useApp } from "@/lib/context";
import { SourceBadge, LastUpdated } from "@/lib/metadata-badges";

interface ConditionCardProps {
  condition: ConditionRecord;
  linkedDocuments: Document[];
  onDelete: (id: string) => Promise<void>;
}

export function ConditionCard({ condition, linkedDocuments, onDelete }: ConditionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkingDocumentId, setLinkingDocumentId] = useState<string | null>(null);
  const { documents, unlinkDocumentFromCondition } = useApp();

  const availableDocuments = documents.filter(
    (d) => !linkedDocuments.find((ld) => ld.id === d.id)
  );

  const handleLinkDocument = async (documentId: string) => {
    // TODO: Implement linking - this could be done in context or here
    // For now, just close the picker
    setLinkingDocumentId(null);
  };

  const handleUnlinkDocument = async (documentId: string) => {
    try {
      await unlinkDocumentFromCondition(documentId, condition.id);
    } catch (error) {
      console.error("Failed to unlink document:", error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(condition.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="record-list-item record-item-condition border-2 border-transparent hover:border-blue-200 transition-colors">
      {/* Collapsed Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left focus:outline-none"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <h3 className="record-list-item-title">{condition.name}</h3>
              <span className="text-lg text-gray-400">{isExpanded ? "▼" : "▶"}</span>
            </div>

            <div className="flex items-center gap-2 mt-3 mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Status:</span>
              <span
                className={`text-sm font-bold ${
                  condition.status === "active"
                    ? "text-orange-700"
                    : condition.status === "chronic"
                    ? "text-rose-700"
                    : "text-emerald-700"
                }`}
              >
                {condition.status}
              </span>
            </div>

            {condition.onsetDate && (
              <p className="text-sm text-slate-600 mb-2">
                <strong>Onset:</strong> {new Date(condition.onsetDate).toLocaleDateString()}
              </p>
            )}

            {condition.notes && (
              <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200 line-clamp-2">
                {condition.notes}
              </p>
            )}

            <div className="metadata-line">
              <SourceBadge source={condition.source} />
              <LastUpdated timestamp={condition.updatedAt} />
              {linkedDocuments.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  📎 {linkedDocuments.length} document{linkedDocuments.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="btn-danger btn-sm text-sm whitespace-nowrap flex-shrink-0 mt-3 sm:mt-0"
          >
            Delete
          </button>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Progress Summary */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
              Progress Summary
            </h4>
            {condition.progressSummary ? (
              <p className="text-sm text-gray-700 bg-slate-50 p-3 rounded border border-slate-200">
                {condition.progressSummary}
              </p>
            ) : (
              <p className="text-sm text-gray-500 italic">No progress summary yet</p>
            )}
          </div>

          {/* Linked Documents */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
              Linked Documents ({linkedDocuments.length})
            </h4>
            {linkedDocuments.length === 0 ? (
              <p className="text-sm text-gray-500 italic mb-3">No linked documents</p>
            ) : (
              <div className="space-y-2 mb-3">
                {linkedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded border border-gray-200 group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {doc.kind === "text" ? "Text" : doc.extension?.toUpperCase() || "File"}
                        {" • "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlinkDocument(doc.id)}
                      className="flex-shrink-0 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Unlink document"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link Document Picker */}
            {linkingDocumentId ? (
              <div className="space-y-2 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs font-medium text-blue-700">Linking document...</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLinkingDocumentId(null)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : availableDocuments.length > 0 ? (
              <button
                onClick={() => setLinkingDocumentId("picking")}
                className="text-sm px-3 py-2 bg-blue-100 text-blue-700 font-medium rounded hover:bg-blue-200 transition-colors"
              >
                + Link Document
              </button>
            ) : null}
          </div>

          {/* Full Details */}
          <div className="pt-2 border-t border-gray-200">
            <dl className="space-y-2 text-sm">
              {condition.onsetDate && (
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-700">Onset:</dt>
                  <dd className="text-gray-600">{new Date(condition.onsetDate).toLocaleDateString()}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Source:</dt>
                <dd className="text-gray-600 capitalize">{condition.source || "unknown"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-700">Updated:</dt>
                <dd className="text-gray-600">{new Date(condition.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Condition</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{condition.name}"? This will also remove all linked document associations.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
