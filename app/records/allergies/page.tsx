"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { AllergyRecord } from "@/lib/types";
import Link from "next/link";
import { AlertTriangle, Trash2, Plus } from "lucide-react";
import { SourceBadge, LastUpdated } from "@/lib/metadata-badges";

export default function AllergiesPage() {
  const { records, addRecord, deleteRecord } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const allergies = records.filter((r) => r.type === "allergy") as AllergyRecord[];

  return (
    <div className="page-container">
      <div className="page-max-width">
        {/* Header */}
        <div className="page-header flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <Link href="/" className="back-link mb-4">
              ← Back to Dashboard
            </Link>
            <div className="flex items-start gap-3">
              <AlertTriangle size={28} className="text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h1 className="page-title">Allergies & Sensitivities</h1>
                <p className="page-subtitle">Manage your documented allergies</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary btn-sm whitespace-nowrap flex-shrink-0 flex items-center gap-2">
            <Plus size={16} /> Add Allergy
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <AllergyForm
            onClose={() => {
              setShowForm(false);
            }}
            onSave={async (data) => {
              await addRecord(data);
              setShowForm(false);
            }}
          />
        )}

        {/* List */}
        {allergies.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={36} className="empty-state-icon mx-auto" />
            <p className="text-xl font-semibold text-slate-900 mb-2">No allergies recorded</p>
            <p className="empty-state-text">Add your known allergies to your health record</p>
          </div>
        ) : (
          <div className="record-list">
            {allergies.map((allergy) => (
              <div key={allergy.id} className="record-list-item record-item-allergy">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="record-list-item-title">{allergy.allergen}</h3>

                    {allergy.severity && (
                      <div className="flex items-center gap-2 mt-3 mb-2">
                        <span className="text-xs font-bold text-slate-600 uppercase">Severity:</span>
                        <span
                          className={`text-sm font-bold ${
                            allergy.severity === "severe"
                              ? "text-rose-700"
                              : allergy.severity === "moderate"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {allergy.severity}
                        </span>
                      </div>
                    )}

                    {allergy.reaction && (
                      <p className="text-sm text-slate-700 mb-2">
                        <strong>Reaction:</strong> {allergy.reaction}
                      </p>
                    )}

                    {allergy.notes && (
                      <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                        {allergy.notes}
                      </p>
                    )}

                    <div className="metadata-line">
                      <SourceBadge source={allergy.source} />
                      <LastUpdated timestamp={allergy.updatedAt} />
                    </div>
                  </div>

                  <button
                    onClick={() => deleteRecord(allergy.id)}
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

function AllergyForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [allergen, setAllergen] = useState("");
  const [severity, setSeverity] = useState<"mild" | "moderate" | "severe" | "">(
    ""
  );
  const [reaction, setReaction] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergen.trim()) return;

    setLoading(true);
    try {
      await onSave({
        type: "allergy",
        allergen,
        severity: severity || undefined,
        reaction: reaction || undefined,
        source: "self-reported",
        notes: notes || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Add Allergy</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Allergen *</label>
            <input
              type="text"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="e.g., Penicillin"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="input"
            >
              <option value="">Not specified</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="label">Reaction</label>
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="e.g., Rash, Anaphylaxis"
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

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
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
