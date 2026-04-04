"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { useState } from "react";

export default function EmergencySummaryPage() {
  const { patient, records } = useApp();
  const [copied, setCopied] = useState(false);

  if (!patient) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const allergies = records.filter((r) => r.type === "allergy");
  const medications = records.filter((r) => r.type === "medication");
  const conditions = records.filter((r) => r.type === "condition");

  const textContent = `
EMERGENCY HEALTH SUMMARY
========================
Generated: ${new Date().toLocaleString()}

PATIENT IDENTITY
${patient.name}
Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}

EMERGENCY CONTACT
${patient.emergencyContact?.name || "N/A"}
Relationship: ${patient.emergencyContact?.relationship || "N/A"}
Phone: ${patient.emergencyContact?.phone || "N/A"}

ALLERGIES (CRITICAL)
${
  allergies.length === 0
    ? "No known allergies"
    : allergies
        .map(
          (a) =>
            `- ${(a as any).allergen} (${(a as any).severity || "severity not specified"})${(a as any).reaction ? ` - Reaction: ${(a as any).reaction}` : ""}`
        )
        .join("\n")
}

ACTIVE MEDICATIONS
${
  medications.length === 0
    ? "No current medications"
    : medications
        .map(
          (m) =>
            `- ${(m as any).name} ${(m as any).dosage} - ${(m as any).frequency}${(m as any).indication ? ` (${(m as any).indication})` : ""}`
        )
        .join("\n")
}

ACTIVE CONDITIONS
${
  conditions.length === 0
    ? "No chronic conditions"
    : conditions
        .map((c) => `- ${(c as any).name} (${(c as any).status})`)
        .join("\n")
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">🆘 Emergency Summary</h1>
          <p className="text-sm text-gray-600 mt-2">Share this information in emergencies</p>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`mb-6 px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base ${
            copied
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {copied ? "✓ Copied to Clipboard!" : "📋 Copy Summary"}
        </button>

        {/* Summary Card */}
        <div className="card bg-red-50 border-2 border-red-200 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 mb-4">🚨 CRITICAL INFORMATION</h2>

          {/* Patient ID */}
          <div className="mb-4 p-4 bg-white rounded border-2 border-red-300">
            <p className="text-xs font-semibold text-gray-600 uppercase">Patient</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{patient.name}</p>
            <p className="text-sm text-gray-600">
              DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
            </p>
          </div>

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <div className="mb-4 p-4 bg-white rounded">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Emergency Contact</p>
              <p className="font-bold text-base sm:text-lg text-gray-900 break-words">
                {patient.emergencyContact.name}
              </p>
              <p className="text-sm text-gray-600">{patient.emergencyContact.relationship}</p>
              <p className="text-sm text-gray-600 font-mono break-all">{patient.emergencyContact.phone}</p>
            </div>
          )}

          {/* Allergies */}
          <div className="mb-4 p-4 bg-white rounded border-l-4 border-red-600">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">⚠️ Allergies</p>
            {allergies.length === 0 ? (
              <p className="text-sm text-gray-600">No known allergies</p>
            ) : (
              <ul className="space-y-2">
                {allergies.map((a) => (
                  <li key={a.id} className="text-sm text-gray-900">
                    <strong className="break-words">{(a as any).allergen}</strong>
                    {(a as any).severity && (
                      <span
                        className={`ml-2 text-xs font-bold ${
                          (a as any).severity === "severe"
                            ? "text-red-600"
                            : (a as any).severity === "moderate"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        ({(a as any).severity})
                      </span>
                    )}
                    {(a as any).reaction && (
                      <p className="text-xs text-gray-600">Reaction: {(a as any).reaction}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Medications */}
          <div className="mb-4 p-4 bg-white rounded border-l-4 border-blue-600">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">💊 Medications</p>
            {medications.length === 0 ? (
              <p className="text-sm text-gray-600">No current medications</p>
            ) : (
              <ul className="space-y-2">
                {medications.map((m) => (
                  <li key={m.id} className="text-sm text-gray-900">
                    <strong className="break-words">{(m as any).name}</strong>
                    <p className="text-xs text-gray-600">
                      {(m as any).dosage} - {(m as any).frequency}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Conditions */}
          <div className="p-4 bg-white rounded border-l-4 border-green-600">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">🏥 Active Conditions</p>
            {conditions.length === 0 ? (
              <p className="text-sm text-gray-600">No chronic conditions reported</p>
            ) : (
              <ul className="space-y-2">
                {conditions.map((c) => (
                  <li key={c.id} className="text-sm text-gray-900">
                    <strong className="break-words">{(c as any).name}</strong>
                    <p className="text-xs text-gray-600">Status: {(c as any).status}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 sm:mt-8 flex flex-col gap-3">
          <Link href="/" className="btn-secondary text-center block">
            Back to Dashboard
          </Link>
          <Link href="/share" className="btn-primary text-center block">
            Share This Record
          </Link>
        </div>
      </div>
    </div>
  );
}
