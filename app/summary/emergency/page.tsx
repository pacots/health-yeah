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
    <div className="page-container">
      <div className="page-max-width">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Emergency Header */}
        <div className="mb-8 sm:mb-12">
          <p className="text-teal-600 font-bold uppercase tracking-widest text-xs mb-2">Emergency Access</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2">Health Card</h1>
          <p className="text-slate-600">Quick access to your critical health information</p>
        </div>

        {/* Patient Identity - Premium */}
        <div className="card-premium section-spacing-narrow">
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Patient</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 break-words">{patient.name}</h2>
            <p className="text-slate-600 mt-2">Born {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
          </div>

          {patient.emergencyContact && (
            <div className="mt-6 pt-6 border-t-2 border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">🚨 Emergency Contact</p>
              <p className="text-lg font-bold text-slate-900">{patient.emergencyContact.name}</p>
              <p className="text-sm text-slate-600">{patient.emergencyContact.relationship}</p>
              <p className="text-2xl font-mono font-bold text-teal-700 mt-2 break-all">{patient.emergencyContact.phone}</p>
            </div>
          )}
        </div>

        {/* CRITICAL ALERT - Only if severe allergies */}
        {severeAllergies.length > 0 && (
          <div className="section-spacing">
            <div className="emergency-alert">
              <p className="emergency-alert-title">⚠ CRITICAL: SEVERE ALLERGIES</p>
              <div className="space-y-2">
                {severeAllergies.map((a) => (
                  <div key={a.id} className="bg-white/80 p-2 rounded">
                    <p className="font-bold text-slate-900 break-words">{(a as any).allergen}</p>
                    {(a as any).reaction && (
                      <p className="text-sm text-rose-800 mt-1">Reaction: {(a as any).reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Allergies - Clean */}
        {allergies.length > 0 && (
          <div className="section-spacing">
            <p className="section-header">⚠ Allergies</p>
            <div className="card card-accent-rose">
              <div className="space-y-3">
                {allergies.map((a) => (
                  <div key={a.id} className="pb-3 border-b border-slate-100 last:border-b-0">
                    <p className="font-bold text-slate-900 break-words">{(a as any).allergen}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(a as any).severity && (
                        <span
                          className={`text-xs font-bold ${
                            (a as any).severity === "severe"
                              ? "text-rose-700"
                              : (a as any).severity === "moderate"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {(a as any).severity}
                        </span>
                      )}
                      {(a as any).reaction && (
                        <span className="text-xs text-slate-600">→ {(a as any).reaction}</span>
                      )}
                    </div>
                    <SourceBadge source={(a as any).source} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Medications - Clean */}
        {medications.length > 0 && (
          <div className="section-spacing">
            <p className="section-header">💊 Medications</p>
            <div className="card card-accent-sky">
              <div className="space-y-3">
                {medications.map((m) => (
                  <div key={m.id} className="pb-3 border-b border-slate-100 last:border-b-0">
                    <p className="font-bold text-slate-900 break-words">{(m as any).name}</p>
                    <p className="text-sm text-slate-700 mt-1">{(m as any).dosage} • {(m as any).frequency}</p>
                    {(m as any).indication && (
                      <p className="text-xs text-slate-600 mt-1">Indication: {(m as any).indication}</p>
                    )}
                    <div className="mt-2">
                      <SourceBadge source={(m as any).source} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conditions - Clean */}
        {conditions.length > 0 && (
          <div className="section-spacing">
            <p className="section-header">🏥 Conditions</p>
            <div className="card card-accent-emerald">
              <div className="space-y-3">
                {conditions.map((c) => (
                  <div key={c.id} className="pb-3 border-b border-slate-100 last:border-b-0">
                    <p className="font-bold text-slate-900 break-words">{(c as any).name}</p>
                    <p className="text-xs text-slate-600 mt-1 font-semibold">Status: {(c as any).status}</p>
                    {(c as any).notes && (
                      <p className="text-xs text-slate-600 mt-1">{(c as any).notes}</p>
                    )}
                    <div className="mt-2">
                      <SourceBadge source={(c as any).source} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleCreateEmergencyShare}
            disabled={sharing}
            className="btn-primary w-full py-3 text-lg font-bold"
          >
            {sharing ? "Generating..." : shareCreated ? "✓ Share Link Copied!" : "Generate Emergency Share"}
          </button>
          <button
            onClick={handleCopy}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              copied
                ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-300"
                : "btn-secondary"
            }`}
          >
            {copied ? "✓ Copied to Clipboard" : "Copy Summary"}
          </button>
        </div>
      </div>
    </div>
  );
}
