"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill, Plus } from "lucide-react";
import { useApp } from "@/lib/context";
import { MedicationRecord } from "@/lib/types";
import { SourceBadge, LastUpdated } from "@/lib/metadata-badges";

export default function MedicationsPage() {
  const { records, addRecord, updateRecord, deleteRecord } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationRecord | null>(null);

  const medications = records.filter((r) => r.type === "medication") as MedicationRecord[];

  const handleEditMedication = (medication: MedicationRecord) => {
    setEditingMedication(medication);
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
            <h1 className="page-title">Medications</h1>
            <p className="page-subtitle">Your current medications and supplements</p>
          </div>
          <button
            onClick={() => {
              setEditingMedication(null);
              setShowForm(true);
            }}
            className="btn-primary btn-sm whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add Medication</span>
          </button>
        </div>

        {showForm && (
          <MedicationForm
            medication={editingMedication}
            onClose={() => {
              setShowForm(false);
              setEditingMedication(null);
            }}
            onSave={async (data) => {
              if (editingMedication) {
                await updateRecord({
                  ...editingMedication,
                  ...data,
                });
              } else {
                await addRecord(data);
              }
              setShowForm(false);
              setEditingMedication(null);
            }}
          />
        )}

        {medications.length === 0 ? (
          <div className="empty-state">
            <Pill size={36} className="empty-state-icon mx-auto" />
            <p className="text-xl font-semibold text-slate-900 mb-2">No medications recorded</p>
            <p className="empty-state-text">Add your current medications to your health record</p>
          </div>
        ) : (
          <div className="record-list">
            {medications.map((med) => (
              <div key={med.id} className="record-list-item record-item-medication">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="record-list-item-title">{med.name}</h3>
                    <p className="text-sm text-slate-700 font-semibold mt-2 mb-1">
                      {med.dosage} â€¢ {med.frequency}
                    </p>
                    {med.indication && (
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>Reason:</strong> {med.indication}
                      </p>
                    )}
                    {med.notes && (
                      <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                        {med.notes}
                      </p>
                    )}
                    <div className="metadata-line">
                      <SourceBadge source={med.source} />
                      <LastUpdated timestamp={med.updatedAt} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-3 sm:mt-0">
                    <button
                      onClick={() => handleEditMedication(med)}
                      className="btn-secondary btn-sm text-sm whitespace-nowrap flex-shrink-0"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteRecord(med.id)}
                      className="btn-danger btn-sm text-sm whitespace-nowrap flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MedicationForm({
  medication,
  onClose,
  onSave,
}: {
  medication?: MedicationRecord | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState(medication?.name || "");
  const [dosage, setDosage] = useState(medication?.dosage || "");
  const [frequency, setFrequency] = useState(medication?.frequency || "");
  const [indication, setIndication] = useState(medication?.indication || "");
  const [notes, setNotes] = useState(medication?.notes || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim() || !frequency.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...(medication ? { id: medication.id, createdAt: medication.createdAt } : {}),
        type: "medication",
        name,
        dosage,
        frequency,
        indication: indication || undefined,
        source: medication?.source || "self-reported",
        linkedDocumentIds: medication?.linkedDocumentIds,
        notes: notes || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {medication ? "Edit Medication" : "Add Medication"}
        </h2>
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
              {loading ? "Saving..." : medication ? "Update" : "Save"}
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
