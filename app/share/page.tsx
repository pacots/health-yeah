"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { Share } from "@/lib/types";
import Link from "next/link";

export default function SharePage() {
  const { records, createShare, getAllShares, deleteShare } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    const allShares = await getAllShares();
    setShares(allShares);
  };

  const handleDeleteShare = async (shareId: string) => {
    if (confirm("Delete this share?")) {
      await deleteShare(shareId);
      setShares(shares.filter((s) => s.id !== shareId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block text-sm">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">📤 Share Health Record</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap flex-shrink-0">
            + Generate Share
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <ShareForm
            records={records}
            onClose={() => setShowForm(false)}
            onSave={async (scope, selectedRecordIds) => {
              setLoading(true);
              try {
                const newShare = await createShare(scope, selectedRecordIds);
                setShares([newShare, ...shares]);
                setShowForm(false);
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {/* Active Shares */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4">Active Shares</h2>
          {shares.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600 text-sm">No shares created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div key={share.id} className="card">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">
                        {share.scope === "emergency" ? "🆘" : "📋"} {share.scope === "emergency" ? "Emergency" : "Continuity of Care"}{" "}
                        Share
                      </h3>
                      <p className="text-xs text-gray-600">
                        Created: {new Date(share.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteShare(share.id)}
                      className="btn-danger text-sm whitespace-nowrap flex-shrink-0"
                    >
                      Revoke
                    </button>
                  </div>

                  <div className="bg-gray-50 p-3 rounded mb-3 text-xs sm:text-sm">
                    <p className="text-gray-600 mb-2">
                      <strong>Records:</strong> {share.recordSnapshots.length}
                    </p>
                    <p className="font-mono text-gray-500 break-all">ID: {share.id}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => {
                        const url = `/share/${share.id}`;
                        navigator.clipboard.writeText(window.location.origin + url);
                        alert("Share link copied!");
                      }}
                      className="btn-secondary flex-1 text-sm"
                    >
                      📋 Copy Link
                    </button>
                    <Link href={`/share/${share.id}`} className="btn-primary flex-1 text-center text-sm">
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareForm({
  records,
  onClose,
  onSave,
}: {
  records: any[];
  onClose: () => void;
  onSave: (scope: "emergency" | "continuity", selectedIds: string[]) => Promise<void>;
}) {
  const [scope, setScope] = useState<"emergency" | "continuity">("emergency");
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggleRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectScope = (selectedScope: "emergency" | "continuity") => {
    setScope(selectedScope);
    if (selectedScope === "emergency") {
      const emergencyRecords = records
        .filter((r) => r.type === "allergy" || r.type === "medication")
        .map((r) => r.id);
      setSelectedRecordIds(emergencyRecords);
    } else {
      setSelectedRecordIds(records.map((r) => r.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) {
      alert("Please select at least one record to share");
      return;
    }

    setLoading(true);
    try {
      await onSave(scope, selectedRecordIds);
    } finally {
      setLoading(false);
    }
  };

  const allergies = records.filter((r) => r.type === "allergy");
  const medications = records.filter((r) => r.type === "medication");
  const conditions = records.filter((r) => r.type === "condition");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Generate Share</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Scope Selection */}
          <div>
            <label className="label">Share Scope</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectScope("emergency")}
                className={`p-3 border-2 rounded text-sm transition ${
                  scope === "emergency"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <p className="font-bold mb-1">🆘 Emergency</p>
                <p className="text-xs text-gray-600">Allergies & meds</p>
              </button>
              <button
                type="button"
                onClick={() => handleSelectScope("continuity")}
                className={`p-3 border-2 rounded text-sm transition ${
                  scope === "continuity"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <p className="font-bold mb-1">📋 Continuity</p>
                <p className="text-xs text-gray-600">All records</p>
              </button>
            </div>
          </div>

          {/* Record Selection */}
          <div>
            <label className="label">Records to Share</label>

            {allergies.length > 0 && (
              <div className="mb-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Allergies</p>
                <div className="space-y-2 pl-3 border-l-2 border-gray-200">
                  {allergies.map((r) => (
                    <label key={r.id} className="flex items-center cursor-pointer text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(r.id)}
                        onChange={() => handleToggleRecord(r.id)}
                        className="mr-2"
                      />
                      <span className="text-gray-700 break-words">
                        {(r as any).allergen}
                        {(r as any).severity && (
                          <span className="text-xs text-gray-600 ml-1">
                            ({(r as any).severity})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {medications.length > 0 && (
              <div className="mb-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Medications</p>
                <div className="space-y-2 pl-3 border-l-2 border-gray-200">
                  {medications.map((r) => (
                    <label key={r.id} className="flex items-center cursor-pointer text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(r.id)}
                        onChange={() => handleToggleRecord(r.id)}
                        className="mr-2"
                      />
                      <span className="text-gray-700 break-words">
                        {(r as any).name} {(r as any).dosage}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {conditions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Conditions</p>
                <div className="space-y-2 pl-3 border-l-2 border-gray-200">
                  {conditions.map((r) => (
                    <label key={r.id} className="flex items-center cursor-pointer text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={selectedRecordIds.includes(r.id)}
                        onChange={() => handleToggleRecord(r.id)}
                        className="mr-2"
                      />
                      <span className="text-gray-700 break-words">{(r as any).name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || selectedRecordIds.length === 0}
              className="btn-primary flex-1 text-sm"
            >
              {loading ? "Generating..." : "Generate Share"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
