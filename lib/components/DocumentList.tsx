"use client";

import React from "react";
import { MedicalDocument } from "@/lib/types";
import { useApp } from "@/lib/context";

interface DocumentListProps {
  documents: MedicalDocument[];
  onProcess?: (doc: MedicalDocument) => void;
  onDelete?: (id: string) => void;
}

function getStatusIcon(status: string): string {
  switch (status) {
    case "uploaded":
      return "📤";
    case "extracting":
      return "🔄";
    case "extracted":
      return "✅";
    case "parsing":
      return "🤖";
    case "parsed":
      return "✅";
    case "failed":
      return "❌";
    default:
      return "📄";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "uploaded":
      return "bg-gray-50 border-gray-200";
    case "extracting":
      return "bg-blue-50 border-blue-200";
    case "extracted":
      return "bg-blue-50 border-blue-200";
    case "parsing":
      return "bg-purple-50 border-purple-200";
    case "parsed":
      return "bg-green-50 border-green-200";
    case "failed":
      return "bg-red-50 border-red-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "parsed":
      return "bg-green-100 text-green-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "needs_review":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function DocumentList({
  documents,
  onProcess,
  onDelete,
}: DocumentListProps) {
  const { deleteMedicalDocument } = useApp();

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p className="text-lg">No documents uploaded yet</p>
        <p className="text-sm">Upload a medical document to get started</p>
      </div>
    );
  }

  // Sort by date, newest first
  const sorted = [...documents].sort((a, b) => b.uploadedAt - a.uploadedAt);

  return (
    <div className="space-y-4">
      {sorted.map((doc) => (
        <div
          key={doc.id}
          className={`border rounded-lg p-4 ${getStatusColor(doc.processingStatus)}`}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: icon and details */}
            <div className="flex-1 flex gap-3">
              <div className="text-2xl">{getStatusIcon(doc.processingStatus)}</div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 break-words">
                  {doc.fileName}
                </h3>
                <p className="text-sm text-gray-600">
                  Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                </p>
                {doc.documentType && (
                  <p className="text-xs text-gray-500 mt-1">
                    Type: <span className="font-medium">{doc.documentType}</span>
                  </p>
                )}
                {doc.errorMessage && (
                  <p className="text-sm text-red-700 mt-2">Error: {doc.errorMessage}</p>
                )}
              </div>
            </div>

            {/* Right: status badge and actions */}
            <div className="flex flex-col gap-2 items-end">
              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(doc.processingStatus)}`}>
                {doc.processingStatus}
              </span>

              <div className="flex gap-2">
                {doc.processingStatus === "uploaded" && onProcess && (
                  <button
                    onClick={() => onProcess(doc)}
                    className="text-sm btn-secondary"
                    title="Start parsing this document"
                  >
                    Process
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Delete this document?")) {
                      deleteMedicalDocument(doc.id);
                      onDelete?.(doc.id);
                    }
                  }}
                  className="text-sm btn-secondary text-red-600 hover:bg-red-50"
                  title="Delete this document"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Progress indicator for processing states */}
          {["extracting", "parsing"].includes(doc.processingStatus) && (
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full w-1/2 animate-pulse"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
