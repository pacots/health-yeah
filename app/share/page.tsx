"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/context";
import { Share } from "@/lib/types";
import Link from "next/link";
import { ConfirmDialog } from "@/lib/ConfirmDialog";
import { DEFAULT_SHARE_EXPIRATION_MS, SHARE_EXPIRATION_OPTIONS } from "@/lib/share-expiration";

export default function SharePage() {
  const { records, createShare, getAllShares, deleteShare } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; show: boolean }>({ id: "", show: false });
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    const allShares = await getAllShares();
    setShares(allShares);
  };

  const handleDeleteShare = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      await deleteShare(deleteConfirm.id);
      await loadShares();
    } finally {
      setDeleting(false);
      setDeleteConfirm({ id: "", show: false });
    }
  };

  const handleCopyLink = async (shareId: string) => {
    const url = `/share/${shareId}`;
    const fullUrl = window.location.origin + url;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
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
            <h1 className="page-title">Share Health Record</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary btn-sm whitespace-nowrap flex-shrink-0">
            + Generate Share
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <ShareForm
            records={records}
            onClose={() => setShowForm(false)}
            onSave={async (scope, selectedRecordIds, expirationMs) => {
              setLoading(true);
              try {
                const newShare = await createShare(scope, selectedRecordIds, expirationMs);
                setShares([newShare, ...shares]);
                setShowForm(false);
              } finally {
                setLoading(false);
              }
            }}
          />
        )}

        {/* Active Shares */}
        <div className="section-spacing">
          <p className="section-header px-0 mb-3">Active Shares</p>
          {shares.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No shares created yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div key={share.id} className="card">
                  {(() => {
                    const isExpired = !!share.expiresAt && share.expiresAt < Date.now();
                    const status: "active" | "expired" | "revoked" =
                      share.status === "revoked" ? "revoked" : isExpired ? "expired" : "active";

                    return (
                      <div className="mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : status === "expired"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status === "active" ? "Active" : status === "expired" ? "Expired" : "Revoked"}
                        </span>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">
                        {share.scope === "emergency" ? "Emergency" : "Continuity of Care"} Share
                      </h3>
                      <p className="text-xs text-gray-600">
                        Created {new Date(share.createdAt).toLocaleString()}
                      </p>
                      {share.expiresAt && (
                        <p className="text-xs text-gray-600 mt-1">
                          Expires {new Date(share.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ id: share.id, show: true })}
                      className="btn-danger btn-sm text-sm whitespace-nowrap flex-shrink-0"
                      disabled={share.status === "revoked"}
                    >
                      {share.status === "revoked" ? "Revoked" : "Revoke"}
                    </button>
                  </div>

                  <div className="bg-gray-50 p-3 rounded mb-4 text-xs sm:text-sm border border-gray-200">
                    <p className="text-gray-700 mb-2">
                      <strong>{share.recordSnapshots.length}</strong> records shared
                    </p>
                    <p className="text-code break-all">ID: {share.id}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => handleCopyLink(share.id)}
                      className={`btn-secondary flex-1 text-sm transition ${
                        copiedId === share.id
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                          : ""
                      }`}
                    >
                      {copiedId === share.id ? "✓ Copied!" : "📋 Copy Link"}
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

        {/* Confirmation Dialogs */}
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          title="Revoke Share"
          message="Are you sure you want to revoke this share? The provider will no longer have access to the patient's health information."
          confirmLabel="Revoke"
          cancelLabel="Cancel"
          isDangerous={true}
          isLoading={deleting}
          onConfirm={handleDeleteShare}
          onCancel={() => setDeleteConfirm({ id: "", show: false })}
        />
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
  onSave: (
    scope: "emergency" | "continuity",
    selectedIds: string[],
    expirationMs: number
  ) => Promise<void>;
}) {
  const [scope, setScope] = useState<"emergency" | "continuity" | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [expirationMs, setExpirationMs] = useState<number>(DEFAULT_SHARE_EXPIRATION_MS);
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
    if (!scope || selectedRecordIds.length === 0) {
      return;
    }

    setLoading(true);
    try {
      await onSave(scope as "emergency" | "continuity", selectedRecordIds, expirationMs);
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

          {/* Expiration Selection */}
          <div>
            <label className="label">Link Expiration</label>
            <select
              value={expirationMs}
              onChange={(e) => setExpirationMs(Number(e.target.value))}
              className="input"
            >
              {SHARE_EXPIRATION_OPTIONS.map((option) => (
                <option key={option.valueMs} value={option.valueMs}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Links expire automatically after the selected duration.</p>
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
              disabled={loading || !scope || selectedRecordIds.length === 0}
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
