"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { useApp } from "@/lib/context";
import { ConditionRecord } from "@/lib/types";
import { ConditionCard } from "@/app/components/ConditionCard";

export default function ConditionsPage() {
  const { records, addRecord, updateRecord, deleteRecord, documents } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingCondition, setEditingCondition] = useState<ConditionRecord | null>(null);

  const conditions = records.filter((r) => r.type === "condition") as ConditionRecord[];

  const getLinkedDocuments = (conditionId: string) => {
    return documents.filter((d) => d.linkedConditionIds?.includes(conditionId) || false);
  };

  const handleEditCondition = (condition: ConditionRecord) => {
    setEditingCondition(condition);
    setShowForm(true);
  };

  return (
    <div className="page-container">
      <div className="page-max-width">
        <div className="page-header flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0">
            <Link href="/" className="back-link">
              â† Back to Dashboard
            </Link>
            <h1 className="page-title">Medical Conditions</h1>
            <p className="page-subtitle">Your documented health conditions</p>
          </div>
          <button
            onClick={() => {
              setEditingCondition(null);
              setShowForm(true);
            }}
            className="btn-primary btn-sm whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Condition</span>
          </button>
        </div>

        {showForm && (
          <ConditionForm
            condition={editingCondition}
            onClose={() => {
              setShowForm(false);
              setEditingCondition(null);
            }}
            onSave={async (data) => {
              if (editingCondition) {
                await updateRecord({
                  ...editingCondition,
                  ...data,
                });
              } else {
                await addRecord(data);
              }
              setShowForm(false);
              setEditingCondition(null);
            }}
          />
        )}

        {conditions.length === 0 ? (
          <div className="empty-state">
            <Heart size={36} className="empty-state-icon mx-auto" />
            <p className="text-xl font-semibold text-slate-900 mb-2">No conditions recorded</p>
            <p className="empty-state-text">Document your medical conditions and health status</p>
          </div>
        ) : (
          <div className="record-list">
            {conditions.map((condition) => (
              <ConditionCard
                key={condition.id}
                condition={condition}
                linkedDocuments={getLinkedDocuments(condition.id)}
                onEdit={handleEditCondition}
                onDelete={deleteRecord}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConditionForm({
  condition,
  onClose,
  onSave,
}: {
  condition?: ConditionRecord | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState(condition?.name || "");
  const [status, setStatus] = useState<"active" | "resolved" | "chronic">(
    condition?.status || "active"
  );
  const [onsetDate, setOnsetDate] = useState(condition?.onsetDate || "");
  const [notes, setNotes] = useState(condition?.notes || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...(condition ? { id: condition.id, createdAt: condition.createdAt } : {}),
        type: "condition",
        name,
        status,
        onsetDate: onsetDate || undefined,
        source: condition?.source || "self-reported",
        notes: notes || undefined,
        linkedDocumentIds: condition?.linkedDocumentIds,
        progressSummary: condition?.progressSummary,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {condition ? "Edit Condition" : "Add Condition"}
        </h2>
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
              {loading ? "Saving..." : condition ? "Update" : "Save"}
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
