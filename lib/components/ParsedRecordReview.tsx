"use client";

import React, { useState } from "react";
import { StructuredMedicalRecord } from "@/lib/types";

interface ParsedRecordReviewProps {
  record: StructuredMedicalRecord;
  sourceFileName?: string;
  onApprove: (record: StructuredMedicalRecord) => void;
  onReject: () => void;
  onDone?: () => void;
}

export function ParsedRecordReview({
  record,
  sourceFileName,
  onApprove,
  onReject,
  onDone,
}: ParsedRecordReviewProps) {
  const [editedRecord, setEditedRecord] = useState<StructuredMedicalRecord>(record);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleFieldChange = (field: keyof StructuredMedicalRecord, value: unknown) => {
    setEditedRecord({
      ...editedRecord,
      [field]: value,
      updatedAt: Date.now(),
    });
  };

  const handleApprove = () => {
    const updatedRecord = {
      ...editedRecord,
      reviewStatus: "reviewed" as const,
      updatedAt: Date.now(),
    };
    onApprove(updatedRecord);
    onDone?.();
  };

  const isCriticalFieldMissing =
    !editedRecord.title ||
    (!editedRecord.dateOfService &&
      !editedRecord.summary &&
      !editedRecord.diagnoses?.length);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
        {/* Header */}
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold text-gray-900">Review Parsed Record</h2>
          {sourceFileName && (
            <p className="text-sm text-gray-600 mt-2">From: {sourceFileName}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Warnings */}
          {(editedRecord.warnings?.length || 0) > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-yellow-900 mb-2">⚠️ Processing Notes</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                {editedRecord.warnings?.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Core fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Record Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Record Type *
              </label>
              <select
                value={editedRecord.recordType}
                onChange={(e) =>
                  handleFieldChange("recordType", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="visit">Medical Visit</option>
                <option value="lab">Lab Result</option>
                <option value="imaging">Imaging Report</option>
                <option value="prescription">Prescription</option>
                <option value="procedure">Procedure</option>
                <option value="diagnosis">Diagnosis</option>
                <option value="allergy">Allergy</option>
                <option value="note">Note</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={editedRecord.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Date of Service */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Date of Service
              </label>
              <input
                type="date"
                value={editedRecord.dateOfService?.split("T")[0] || ""}
                onChange={(e) => handleFieldChange("dateOfService", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Provider Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Provider Name
              </label>
              <input
                type="text"
                value={editedRecord.providerName || ""}
                onChange={(e) =>
                  handleFieldChange("providerName", e.target.value || null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Organization */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Organization / Facility
              </label>
              <input
                type="text"
                value={editedRecord.organizationName || ""}
                onChange={(e) =>
                  handleFieldChange("organizationName", e.target.value || null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Specialty */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Specialty
              </label>
              <input
                type="text"
                value={editedRecord.specialty || ""}
                onChange={(e) =>
                  handleFieldChange("specialty", e.target.value || null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Severity
              </label>
              <select
                value={editedRecord.severity || "routine"}
                onChange={(e) =>
                  handleFieldChange("severity", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Not specified</option>
                <option value="routine">Routine</option>
                <option value="moderate">Moderate</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Summary (full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Summary
              </label>
              <textarea
                value={editedRecord.summary || ""}
                onChange={(e) =>
                  handleFieldChange("summary", e.target.value || null)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* Raw JSON toggle */}
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {showRawJson ? "Hide" : "Show"} raw parser output
          </button>
          {showRawJson && (
            <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
              <pre>{JSON.stringify(editedRecord.rawParserOutput, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Metadata */}
        {editedRecord.confidence !== undefined && (
          <div className="px-6 py-2 bg-gray-50 border-t text-xs text-gray-600">
            Parser confidence: {(editedRecord.confidence * 100).toFixed(0)}% •
            Status: {editedRecord.reviewStatus}
          </div>
        )}

        {/* Actions */}
        <div className="border-t p-6 flex gap-3 justify-end">
          <button
            onClick={onReject}
            className="btn-secondary"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={isCriticalFieldMissing}
            className="btn-primary disabled:opacity-50"
            title={
              isCriticalFieldMissing
                ? "Please fill in critical fields (title, date, or summary)"
                : "Approve and save this record"
            }
          >
            Approve & Save
          </button>
        </div>

        {isCriticalFieldMissing && (
          <div className="px-6 pb-4 text-sm text-red-600">
            ⚠️ Please fill in at least a title or date or summary
          </div>
        )}
      </div>
    </div>
  );
}
