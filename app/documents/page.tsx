"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import Link from "next/link";

export default function DocumentsPage() {
  const { documents, addDocument, deleteDocument } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const expandedDoc = documents.find((d) => d.id === expandedDocId);

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
          <button onClick={() => setShowForm(true)} className="btn-primary btn-sm whitespace-nowrap flex-shrink-0">
            + Add Document
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <DocumentForm
            onClose={() => setShowForm(false)}
            onSave={async (data) => {
              await addDocument(data);
              setShowForm(false);
            }}
          />
        )}

        {/* Document Detail Modal */}
        {expandedDoc && (
          <DocumentDetailModal
            doc={expandedDoc}
            onClose={() => setExpandedDocId(null)}
            onDelete={async () => {
              await deleteDocument(expandedDoc.id);
              setExpandedDocId(null);
            }}
          />
        )}

        {/* List */}
        {documents.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">No documents added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setExpandedDocId(doc.id)}
                className="card w-full text-left hover:shadow-md transition cursor-pointer"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words flex-1 min-w-0">
                    {doc.title}
                  </h3>
                  <span className="badge badge-blue whitespace-nowrap flex-shrink-0">View</span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap text-xs sm:text-sm mb-3 max-h-24 overflow-hidden line-clamp-4 break-words">
                  {doc.content}
                </p>
                <p className="text-metadata">
                  Added {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentDetailModal({
  doc,
  onClose,
  onDelete,
}: {
  doc: any;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Delete "${doc.title}"? This action cannot be undone.`)) {
      setDeleting(true);
      try {
        await onDelete();
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{doc.title}</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Added: {new Date(doc.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
            {doc.content}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger flex-1 text-sm"
          >
            {deleting ? "Deleting..." : "Delete Document"}
          </button>
          <button
            onClick={onClose}
            className="btn-secondary flex-1 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await onSave({
        type: "text",
        title,
        content,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Add Document</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Document Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lab Results - March 2026"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste document content here..."
              className="input"
              rows={6}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Saving..." : "Save Document"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
