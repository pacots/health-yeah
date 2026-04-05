"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { Document } from "@/lib/types";
import Link from "next/link";
import { ConfirmDialog } from "@/lib/ConfirmDialog";
import { DocumentSuggestions } from "@/app/components/DocumentSuggestions";
import { Check, Download, FileText, Info, Lightbulb, Loader2, X } from "lucide-react";

export default function DocumentsPage() {
  const { documents, addDocument, deleteDocument } = useApp();
  const [tab, setTab] = useState<"list" | "create">("list");
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [showingSuggestionsFor, setShowingSuggestionsFor] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    textContent: "",
    file: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expandedDoc = documents.find((d) => d.id === expandedDocId);

  /**
   * Validation: XOR - Either text OR file, but not both
   */
  const getValidationError = (): string | null => {
    if (!formData.title.trim()) {
      return "Title is required";
    }

    const hasText = formData.textContent.trim().length > 0;
    const hasFile = formData.file !== null;

    if (!hasText && !hasFile) {
      return "Must provide either text content or a file";
    }

    if (hasText && hasFile) {
      return "Cannot provide both text and file - choose one";
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, file });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDocument({
        title: formData.title.trim(),
        textContent: formData.textContent.trim() || undefined,
        file: formData.file || undefined,
      });

      // Reset form and switch to list tab
      setFormData({ title: "", textContent: "", file: null });
      setTab("list");

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-max-width">
        {/* Header */}
        <div className="page-header flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0">
            <Link href="/" className="back-link">
              ← Back to Dashboard
            </Link>
            <h1 className="page-title">Documents</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setTab("list")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === "list"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === "create"
                ? "text-blue-600 border-blue-600"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            New Document
          </button>
        </div>

        {/* TAB 1: DOCUMENTS LIST */}
        {tab === "list" && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              All Documents ({documents.length})
            </h2>

            {documents.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No documents yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setExpandedDocId(doc.id)}
                    className="card w-full text-left hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-3 mb-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words flex-1 min-w-0">
                        {doc.title}
                      </h3>
                      <span
                        className={`badge text-xs whitespace-nowrap flex-shrink-0 ${
                          doc.kind === "text" ? "badge-blue" : "badge-green"
                        }`}
                      >
                        {doc.kind === "text"
                          ? "Text"
                          : doc.extension?.toUpperCase() || "File"}
                      </span>
                    </div>

                    {doc.kind === "text" && doc.textContent && (
                      <p className="text-gray-600 whitespace-pre-wrap text-xs sm:text-sm mb-2 max-h-16 overflow-hidden line-clamp-3 break-words">
                        {doc.textContent}
                      </p>
                    )}

                    {doc.kind === "file" && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        {doc.fileName}
                        {doc.fileSizeBytes && ` • ${(doc.fileSizeBytes / 1024).toFixed(1)} KB`}
                      </p>
                    )}

                    <p className="text-metadata">
                      {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREATE DOCUMENT */}
        {tab === "create" && (
          <form onSubmit={handleSubmit} className="card max-w-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create Document</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    setError(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., Blood Test Results"
                  disabled={loading}
                />
              </div>

              {/* Text vs File instruction */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 flex items-start gap-2">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  Write text content <strong>or</strong> upload a file, but not both
                </span>
              </div>

              {/* Text Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Content
                </label>
                <textarea
                  value={formData.textContent}
                  onChange={(e) => {
                    setFormData({ ...formData, textContent: e.target.value });
                    setError(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter your document text here..."
                  rows={6}
                  disabled={loading}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="w-full"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, JPG, PNG, WEBP up to 15MB
                  </p>
                  {formData.file && (
                    <p className="text-sm text-gray-700 mt-2 font-medium flex items-center justify-center gap-2">
                      <Check size={16} className="text-emerald-600" />
                      <span>
                        {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn-primary text-sm w-full"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Document"}
              </button>
            </div>
          </form>
        )}

        {/* DOCUMENT DETAIL MODAL */}
        {expandedDoc && (
          <>
            <DocumentDetailModal
              doc={expandedDoc}
              onClose={() => setExpandedDocId(null)}
              onDelete={async () => {
                try {
                  await deleteDocument(expandedDoc.id);
                  setExpandedDocId(null);
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Failed to delete");
                }
              }}
              onShowSuggestions={() => setShowingSuggestionsFor(expandedDoc.id)}
            />

            {/* Show suggestions modal if a document with pending suggestions is selected */}
            {showingSuggestionsFor === expandedDoc.id && expandedDoc.aiConditionSuggestions && 
              expandedDoc.aiConditionSuggestions.some(s => !s.reviewed) && (
              <DocumentSuggestions
                document={expandedDoc}
                onClose={() => setShowingSuggestionsFor(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Modal to view document details
 */
function DocumentDetailModal({
  doc,
  onClose,
  onDelete,
  onShowSuggestions,
}: {
  doc: Document;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onShowSuggestions?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownload = () => {
    if (doc.kind === "file" && doc.fileContent) {
      try {
        // Decode file content from base64
        let blobData: ArrayBuffer;

        if (doc.fileContent.startsWith("data:")) {
          // data URL format - extract base64 part
          const base64Data = doc.fileContent.split(",")[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blobData = bytes.buffer;
        } else {
          // plain base64
          const binaryString = atob(doc.fileContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blobData = bytes.buffer;
        }

        // Create blob and download
        const blob = new Blob([blobData], { type: doc.mimeType || "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.fileName || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to download file:", error);
        alert("Failed to download file");
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">
              {doc.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {new Date(doc.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {doc.kind === "text" ? (
            <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
              {doc.textContent}
            </p>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">File Details</p>
                <dl className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <dt className="font-medium">Name:</dt>
                    <dd>{doc.fileName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Type:</dt>
                    <dd className="uppercase">{doc.extension}</dd>
                  </div>
                  {doc.fileSizeBytes && (
                    <div className="flex justify-between">
                      <dt className="font-medium">Size:</dt>
                      <dd>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Image Preview */}
              {doc.extension &&
                ["jpg", "jpeg", "png", "webp"].includes(
                  doc.extension.toLowerCase()
                ) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Preview
                    </p>
                    <img
                      src={`/api/documents/${doc.id}/file`}
                      alt={doc.title}
                      className="max-w-full max-h-96 rounded border border-gray-200"
                    />
                  </div>
                )}

              {/* PDF Note */}
              {doc.extension?.toLowerCase() === "pdf" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700 flex items-start gap-2">
                  <FileText size={16} className="mt-0.5 flex-shrink-0" />
                  <span>PDF document. Click "Download" to view in full.</span>
                </div>
              )}
            </div>
          )}

          {/* AI Structured Summary Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
              AI Summary
            </h3>

            {doc.aiSummaryStatus === "processing" && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Processing document with AI...
              </div>
            )}

            {doc.aiSummaryStatus === "ready" && doc.aiStructuredSummary && (
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-72 overflow-y-auto">
                  {doc.aiStructuredSummary}
                </div>

                {/* Condition Suggestions Button */}
                {doc.aiConditionSuggestions && doc.aiConditionSuggestions.length > 0 && (
                  <div className="flex gap-2">
                    {doc.aiConditionSuggestions.some(s => !s.reviewed) && (
                      <button
                        onClick={onShowSuggestions}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded hover:bg-blue-200 transition text-sm flex items-center justify-center gap-2"
                      >
                        <Lightbulb size={16} />
                        <span>
                          Review Condition Suggestions ({doc.aiConditionSuggestions.filter(s => !s.reviewed).length})
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {doc.aiSummaryStatus === "error" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <p className="font-medium">Summary generation failed</p>
                {doc.aiSummaryError && (
                  <p className="text-xs mt-1">{doc.aiSummaryError}</p>
                )}
              </div>
            )}

            {!doc.aiSummaryStatus && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                No summary available yet
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 flex flex-col sm:flex-row gap-2">
          {doc.kind === "file" && (
            <button
              onClick={handleDownload}
              className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>Download</span>
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="btn-danger flex-1 text-sm"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary flex-1 text-sm"
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Document"
          message={`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDangerous={true}
          isLoading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
    </div>
  );
}
