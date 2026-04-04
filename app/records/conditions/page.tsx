"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { ConditionRecord } from "@/lib/types";
import { SourceBadge, LastUpdated } from "@/lib/metadata-badges";
import Link from "next/link";

export default function ConditionsPage() {
  const { records, addRecord, deleteRecord } = useApp();
  const [showForm, setShowForm] = useState(false);

  const conditions = records.filter((r) => r.type === "condition") as ConditionRecord[];

  return (
    <div className="page-container">
      <div className="page-max-width">
        {/* Header */}
        <div className="page-header flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0">
            <Link href="/" className="back-link">
              ← Back to Dashboard
            </Link>
            <h1 className="page-title">Medical Conditions</h1>
            <p className="page-subtitle">Your documented health conditions</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary btn-sm whitespace-nowrap flex-shrink-0">
            + Add Condition
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <ConditionForm
            onClose={() => setShowForm(false)}
            onSave={async (data) => {
              await addRecord(data);
              setShowForm(false);
            }}
          />
        )}

        {/* List */}
        {conditions.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">🏥</p>
            <p className="text-xl font-semibold text-slate-900 mb-2">No conditions recorded</p>
            <p className="empty-state-text">Document your medical conditions and health status</p>
          </div>
        ) : (
          <div className="record-list">
            {conditions.map((condition) => (
              <div key={condition.id} className="record-list-item record-item-condition">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="record-list-item-title">{condition.name}</h3>

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
                      <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                        {condition.notes}
                      </p>
                    )}

                    <div className="metadata-line">
                      <SourceBadge source={condition.source} />
                      <LastUpdated timestamp={condition.updatedAt} />
                    </div>
                  </div>

                  <button
                    onClick={() => deleteRecord(condition.id)}
                    className="btn-danger btn-sm text-sm whitespace-nowrap flex-shrink-0 mt-3 sm:mt-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "resolved" | "chronic">(
    "active"
  );
  const [onsetDate, setOnsetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        type: "condition",
        name,
        status,
        onsetDate: onsetDate || undefined,
        source: "self-reported",
        notes: notes || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Condition</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Condition Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Type 2 Diabetes"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="input"
            >
              <option value="active">Active</option>
              <option value="chronic">Chronic</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="label">Onset Date</label>
            <input
              type="date"
              value={onsetDate}
              onChange={(e) => setOnsetDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional information..."
              className="input"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? "Saving..." : "Save"}
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
