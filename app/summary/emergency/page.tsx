"use client";

import { useApp } from "@/lib/context";
import { SourceBadge } from "@/lib/metadata-badges";
import Link from "next/link";
import { useState } from "react";

export default function EmergencySummaryPage() {
  const { patient, records, createShare } = useApp();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareCreated, setShareCreated] = useState<string | null>(null);

  if (!patient) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const allergies = records.filter((r) => r.type === "allergy");
  const medications = records.filter((r) => r.type === "medication");
  const conditions = records.filter((r) => r.type === "condition");
  const severeAllergies = allergies.filter((a) => (a as any).severity === "severe");

  const textContent = `
EMERGENCY HEALTH CARD
=====================
${new Date().toLocaleString()}

PATIENT: ${patient.name}
DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}

EMERGENCY CONTACT: ${patient.emergencyContact?.name || "N/A"}
${patient.emergencyContact?.phone || ""}

CRITICAL ALLERGIES:
${
  allergies.length === 0
    ? "None documented"
    : allergies.map((a) => `• ${(a as any).allergen} (${(a as any).severity || "unknown"})`).join("\n")
}

CURRENT MEDICATIONS:
${
  medications.length === 0
    ? "None"
    : medications.map((m) => `• ${(m as any).name} ${(m as any).dosage}`).join("\n")
}

CONDITIONS:
${conditions.length === 0 ? "None" : conditions.map((c) => `• ${(c as any).name}`).join("\n")}
`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = textContent;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleCreateEmergencyShare = async () => {
    if (!patient) return;
    setSharing(true);
    try {
      // Create an emergency share with allergies and medications
      const emergencyRecordIds = [
        ...allergies.map((r) => r.id),
        ...medications.map((r) => r.id),
      ];

      const share = await createShare("emergency", emergencyRecordIds);
      setShareCreated(share.id);

      // Copy link to clipboard automatically (with fallback)
      const shareUrl = `${window.location.origin}/share/${share.id}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = shareUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
      } catch (clipboardError) {
        console.warn("Could not copy share link to clipboard:", clipboardError);
        // Still continue - share was created successfully
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-gray-50 py-6 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm inline-block">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Emergency Card Header */}
        <div className="card bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">🆘 EMERGENCY CARD</h1>
          <p className="text-xs sm:text-sm text-red-100">
            Keep this information accessible. Last updated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* CRITICAL ALERTS SECTION - Only if severe allergies exist */}
        {severeAllergies.length > 0 && (
          <div className="card bg-red-100 border-2 border-red-600 p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
              ⚠️ SEVERE ALLERGIES - CRITICAL ALERT
            </h2>
            <div className="space-y-3">
              {severeAllergies.map((a) => (
                <div key={a.id} className="bg-white p-3 rounded border-l-4 border-red-600">
                  <p className="font-bold text-lg text-red-900 break-words">{(a as any).allergen}</p>
                  {(a as any).reaction && (
                    <p className="text-sm text-red-700 mt-1">
                      <strong>Reaction:</strong> {(a as any).reaction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient Identity Block */}
        <div className="card bg-white border-2 border-red-300 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="mb-4">
            <p className="text-xs sm:text-sm font-semibold text-red-700 uppercase tracking-wider mb-1">
              Patient
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight break-words">
              {patient.name}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-600 uppercase">Date of Birth</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {new Date(patient.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase">Age</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact Block */}
        {patient.emergencyContact && (
          <div className="card bg-blue-50 border-2 border-blue-300 p-4 sm:p-6 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider mb-3">
              🚨 Emergency Contact
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-600">Name</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                  {patient.emergencyContact.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Relationship</p>
                <p className="text-sm text-gray-900">{patient.emergencyContact.relationship}</p>
              </div>
              <div className="pt-2 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Phone</p>
                <p className="text-base sm:text-lg font-mono font-bold text-blue-700 break-all">
                  {patient.emergencyContact.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Allergies */}
        {allergies.length > 0 && (
          <div className="card bg-white border-l-4 border-red-500 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-red-700 mb-3">⚠️ ALLERGIES</h3>
            <div className="space-y-2">
              {allergies.map((a) => (
                <div
                  key={a.id}
                  className={`p-2 rounded text-sm ${
                    (a as any).severity === "severe"
                      ? "bg-red-50 border border-red-200"
                      : (a as any).severity === "moderate"
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <p className="font-bold text-gray-900 break-words">{(a as any).allergen}</p>
                  <div className="flex items-start justify-between gap-2 text-xs text-gray-600 mt-1">
                    <div className="flex items-center gap-2">
                      {(a as any).severity && (
                        <span
                          className={`font-bold px-2 py-0.5 rounded ${
                            (a as any).severity === "severe"
                              ? "bg-red-200 text-red-800"
                              : (a as any).severity === "moderate"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-blue-200 text-blue-800"
                          }`}
                        >
                          {(a as any).severity}
                        </span>
                      )}
                      {(a as any).reaction && <span>{(a as any).reaction}</span>}
                    </div>
                    <SourceBadge source={(a as any).source} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {medications.length > 0 && (
          <div className="card bg-white border-l-4 border-blue-500 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-blue-700 mb-3">💊 MEDICATIONS</h3>
            <div className="space-y-2">
              {medications.map((m) => (
                <div key={m.id} className="p-2 rounded bg-blue-50 border border-blue-200 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 break-words">{(m as any).name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {(m as any).dosage} • {(m as any).frequency}
                      </p>
                    </div>
                    <SourceBadge source={(m as any).source} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions */}
        {conditions.length > 0 && (
          <div className="card bg-white border-l-4 border-green-500 p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-green-700 mb-3">🏥 CONDITIONS</h3>
            <div className="space-y-2">
              {conditions.map((c) => (
                <div key={c.id} className="p-2 rounded bg-green-50 border border-green-200 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 break-words">{(c as any).name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Status: {(c as any).status}</p>
                    </div>
                    <SourceBadge source={(c as any).source} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action: Generate Emergency Share */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={handleCreateEmergencyShare}
            disabled={sharing}
            className="w-full bg-red-600 text-white py-3 sx:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-red-700 disabled:opacity-50 transition shadow-lg"
          >
            {sharing
              ? "Generating Share..."
              : shareCreated
              ? "✓ Share Link Copied!"
              : "🆘 Generate Emergency Share"}
          </button>
          {shareCreated && (
            <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
              Emergency share created and link copied to clipboard
            </p>
          )}
        </div>

        {/* Secondary Action: Copy Summary */}
        <button
          onClick={handleCopy}
          className={`w-full py-2 sm:py-3 rounded-lg font-medium transition text-sm sm:text-base border ${
            copied
              ? "bg-green-100 text-green-700 border-green-300"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {copied ? "✓ Copied to Clipboard" : "📋 Copy Summary"}
        </button>
      </div>
    </div>
  );
}
