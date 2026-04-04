"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { Share } from "@/lib/types";
import Link from "next/link";

export default function ProviderViewPage({ params }: { params: { shareId: string } }) {
  const { getShare } = useApp();
  const [share, setShare] = useState<Share | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadShare();
  }, [params.shareId]);

  const loadShare = async () => {
    try {
      const fetchedShare = await getShare(params.shareId);
      if (fetchedShare) {
        setShare(fetchedShare);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading shared record...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card text-center max-w-md">
          <p className="text-2xl font-bold text-gray-900 mb-2">Share Not Found</p>
          <p className="text-gray-600 mb-4">
            This shared record has been deleted or is no longer available.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!share) {
    return null;
  }

  const allergies = share.recordSnapshots.filter((r) => r.type === "allergy");
  const medications = share.recordSnapshots.filter((r) => r.type === "medication");
  const conditions = share.recordSnapshots.filter((r) => r.type === "condition");

  const scopeLabel =
    share.scope === "emergency" ? "EMERGENCY" : "CONTINUITY OF CARE";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div
          className={`card mb-8 border-l-4 ${
            share.scope === "emergency" ? "border-l-red-600 bg-red-50" : "border-l-blue-600"
          }`}
        >
          <p className="text-sm font-semibold text-gray-600 mb-1">
            {share.scope === "emergency" ? "🆘" : "📋"} {scopeLabel} SHARED RECORD
          </p>
          <p className="text-xs text-gray-500">
            Shared on {new Date(share.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Patient Identity */}
        <div className="card bg-white border-2 border-gray-300 p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {share.patientSnapshot.name}
          </h2>
          <p className="text-gray-600 mb-4">
            <strong>DOB:</strong>{" "}
            {new Date(share.patientSnapshot.dateOfBirth).toLocaleDateString()}
          </p>

          {share.patientSnapshot.emergencyContact && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2">Emergency Contact</p>
              <p className="text-gray-600">
                {share.patientSnapshot.emergencyContact.name} (
                {share.patientSnapshot.emergencyContact.relationship})
              </p>
              <p className="font-mono text-gray-600">
                {share.patientSnapshot.emergencyContact.phone}
              </p>
            </div>
          )}
        </div>

        {/* Allergies */}
        {allergies.length > 0 && (
          <div className="card mb-6 border-l-4 border-l-red-500 bg-red-50">
            <h3 className="text-2xl font-bold text-red-900 mb-4">⚠️ ALLERGIES</h3>
            <div className="space-y-3">
              {allergies.map((a) => (
                <div key={a.id} className="bg-white p-3 rounded border border-red-100">
                  <p className="font-bold text-gray-900">{(a as any).allergen}</p>
                  {(a as any).severity && (
                    <p className="text-sm text-gray-600">
                      <strong>Severity:</strong>{" "}
                      <span
                        className={`font-bold ${
                          (a as any).severity === "severe"
                            ? "text-red-600"
                            : (a as any).severity === "moderate"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {(a as any).severity}
                      </span>
                    </p>
                  )}
                  {(a as any).reaction && (
                    <p className="text-sm text-gray-600">
                      <strong>Reaction:</strong> {(a as any).reaction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {medications.length > 0 && (
          <div className="card mb-6 border-l-4 border-l-blue-500 bg-blue-50">
            <h3 className="text-2xl font-bold text-blue-900 mb-4">💊 MEDICATIONS</h3>
            <div className="space-y-3">
              {medications.map((m) => (
                <div key={m.id} className="bg-white p-3 rounded border border-blue-100">
                  <p className="font-bold text-gray-900">
                    {(m as any).name} {(m as any).dosage}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Frequency:</strong> {(m as any).frequency}
                  </p>
                  {(m as any).indication && (
                    <p className="text-sm text-gray-600">
                      <strong>Indication:</strong> {(m as any).indication}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions */}
        {conditions.length > 0 && (
          <div className="card mb-6 border-l-4 border-l-green-500 bg-green-50">
            <h3 className="text-2xl font-bold text-green-900 mb-4">🏥 CONDITIONS</h3>
            <div className="space-y-3">
              {conditions.map((c) => (
                <div key={c.id} className="bg-white p-3 rounded border border-green-100">
                  <p className="font-bold text-gray-900">{(c as any).name}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong> {(c as any).status}
                  </p>
                  {(c as any).notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Notes:</strong> {(c as any).notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents (if continuity scope) */}
        {share.scope === "continuity" && share.documentSnapshots && share.documentSnapshots.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📄 DOCUMENTS</h3>
            <div className="space-y-3">
              {share.documentSnapshots.map((d) => (
                <div key={d.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-bold text-gray-900">{d.title}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap mt-2 max-h-40 overflow-hidden">
                    {d.content.substring(0, 200)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="card text-center">
          <p className="text-sm text-gray-600 mb-3">
            This is a read-only shared health record. The patient retains control and can revoke
            this share at any time.
          </p>
          <p className="text-xs text-gray-500">
            Share ID: {share.id} | Generated: {new Date(share.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
