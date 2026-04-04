"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { AllergyRecord } from "@/lib/types";
import Link from "next/link";

export default function AllergiesPage() {
  const { records, addRecord, deleteRecord } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const allergies = records.filter((r) => r.type === "allergy") as AllergyRecord[];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">🚨 Allergies</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Add Allergy
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <AllergyForm
            onClose={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            onSave={async (data) => {
              await addRecord(data);
              setShowForm(false);
            }}
          />
        )}

        {/* List */}
        {allergies.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No allergies recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allergies.map((allergy) => (
              <div key={allergy.id} className="card flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{allergy.allergen}</h3>
                  {allergy.severity && (
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                      Severity:{" "}
                      <span
                        className={`${
                          allergy.severity === "severe"
                            ? "text-red-600"
                            : allergy.severity === "moderate"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {allergy.severity}
                      </span>
                    </p>
                  )}
                  {allergy.reaction && (
                    <p className="text-gray-600">
                      <strong>Reaction:</strong> {allergy.reaction}
                    </p>
                  )}
                  {allergy.notes && (
                    <p className="text-gray-600 text-sm mt-2">
                      <strong>Notes:</strong> {allergy.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Source: {allergy.source}
                  </p>
                </div>
                <button
                  onClick={() => deleteRecord(allergy.id)}
                  className="btn-danger text-sm"
                >
                  Delete
                </button>
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
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Allergy</h2>
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
