"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import Link from "next/link";

export default function DocumentsPage() {
  const { documents, addDocument, deleteDocument } = useApp();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">📄 Documents</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
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

        {/* List */}
        {documents.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No documents added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="btn-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap text-sm mb-3 max-h-32 overflow-hidden">
                  {doc.content}
                </p>
                <p className="text-xs text-gray-500">
                  Added: {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
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
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Document</h2>
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
              rows={10}
              required
            />
          </div>

          <div className="flex gap-2">
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
