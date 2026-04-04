"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { MedicationRecord } from "@/lib/types";
import Link from "next/link";

export default function MedicationsPage() {
  const { records, addRecord, deleteRecord } = useApp();
  const [showForm, setShowForm] = useState(false);

  const medications = records.filter((r) => r.type === "medication") as MedicationRecord[];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">💊 Medications</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Add Medication
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <MedicationForm
            onClose={() => setShowForm(false)}
            onSave={async (data) => {
              await addRecord(data);
              setShowForm(false);
            }}
          />
        )}

        {/* List */}
        {medications.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-600">No medications recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((med) => (
              <div key={med.id} className="card flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                  <p className="text-gray-600">
                    <strong>Dosage:</strong> {med.dosage}
                  </p>
                  <p className="text-gray-600">
                    <strong>Frequency:</strong> {med.frequency}
                  </p>
                  {med.indication && (
                    <p className="text-gray-600">
                      <strong>Indication:</strong> {med.indication}
                    </p>
                  )}
                  {med.notes && (
                    <p className="text-gray-600 text-sm mt-2">
                      <strong>Notes:</strong> {med.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Source: {med.source}
                  </p>
                </div>
                <button
                  onClick={() => deleteRecord(med.id)}
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

function MedicationForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [indication, setIndication] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !frequency.trim()) return;

    setLoading(true);
    try {
      await onSave({
        type: "medication",
        name,
        dosage,
        frequency,
        indication: indication || undefined,
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Medication</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Medication Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Metformin"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Dosage *</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 500mg"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Frequency *</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="e.g., Twice daily with meals"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Indication</label>
            <input
              type="text"
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              placeholder="Why it's prescribed"
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
