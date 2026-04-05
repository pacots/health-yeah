"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Pill,
  Heart,
  Copy,
  Share2,
  Phone,
  X,
  Download,
  FileText,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "@/lib/context";

function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toISOString().split("T")[0];
  } catch {
    return dateString;
  }
}

function toMultilineList(value?: string): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function EmergencySummaryPage() {
  const { patient, records, loading, createShare } = useApp();

  const [isHydrated, setIsHydrated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareCreated, setShareCreated] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Health Card</h1>
          <p className="text-gray-600">Loading critical health information...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <AlertTriangle size={40} className="mx-auto mb-4 text-amber-600" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Health Card</h1>
          <p className="text-gray-600 mb-4">No patient data available</p>
        </div>
      </div>
    );
  }

  const allergies = records.filter((r) => r.type === "allergy");
  const medications = records.filter((r) => r.type === "medication");
  const conditions = records.filter((r) => r.type === "condition");
  const severeAllergies = allergies.filter((a) => (a as any).severity === "severe");

  const profileAllergies = toMultilineList(patient.allergies);
  const profileMedications = toMultilineList(patient.currentMedications);
  const profileConditions = toMultilineList(patient.currentConditions);

  const hasStructuredRecords = allergies.length > 0 || medications.length > 0 || conditions.length > 0;

  const generateTextContent = () => {
    const profileAllergyText =
      profileAllergies.length > 0 ? profileAllergies.map((item) => `- ${item}`).join("\n") : "Not provided";
    const profileMedicationText =
      profileMedications.length > 0 ? profileMedications.map((item) => `- ${item}`).join("\n") : "Not provided";
    const profileConditionText =
      profileConditions.length > 0 ? profileConditions.map((item) => `- ${item}`).join("\n") : "Not provided";

    return `
EMERGENCY HEALTH SUMMARY
========================

PATIENT IDENTITY
${patient.name}
Date of Birth: ${formatDateForDisplay(patient.dateOfBirth)}
${patient.bloodType ? `Blood Type: ${patient.bloodType}` : ""}

EMERGENCY CONTACT
${patient.emergencyContact?.name || "N/A"}
Relationship: ${patient.emergencyContact?.relationship || "N/A"}
Phone: ${patient.emergencyContact?.phone || "N/A"}

ALLERGIES (STRUCTURED RECORDS)
${
  allergies.length === 0
    ? "No known allergies"
    : allergies
        .map(
          (a) =>
            `- ${(a as any).allergen} (${(a as any).severity || "severity not specified"})${
              (a as any).reaction ? ` - Reaction: ${(a as any).reaction}` : ""
            }`
        )
        .join("\n")
}

ALLERGIES (PROFILE NOTES)
${profileAllergyText}

ACTIVE MEDICATIONS (STRUCTURED RECORDS)
${
  medications.length === 0
    ? "No current medications"
    : medications
        .map(
          (m) =>
            `- ${(m as any).name} ${(m as any).dosage} - ${(m as any).frequency}${
              (m as any).indication ? ` (${(m as any).indication})` : ""
            }`
        )
        .join("\n")
}

ACTIVE MEDICATIONS (PROFILE NOTES)
${profileMedicationText}

ACTIVE CONDITIONS (STRUCTURED RECORDS)
${
  conditions.length === 0
    ? "No chronic conditions"
    : conditions.map((c) => `- ${(c as any).name} (${(c as any).status})`).join("\n")
}

ACTIVE CONDITIONS (PROFILE NOTES)
${profileConditionText}

HEALTHCARE CONTACTS
Primary Physician: ${patient.primaryPhysicianName || "N/A"}
Physician Phone: ${patient.primaryPhysicianPhone || "N/A"}
Clinic: ${patient.primaryClinic || "N/A"}
Insurance: ${patient.insuranceCompany || "N/A"}
Policy Number: ${patient.insuranceNumber || "N/A"}

OTHER NOTES
${patient.importantNotes || "Not provided"}
`.trim();
  };

  const copyToClipboard = async (value: string): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }

      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch (error) {
      console.error("Copy failed:", error);
      return false;
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(generateTextContent());
    if (!success) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateEmergencyShare = async () => {
    setSharing(true);
    try {
      const emergencyRecordIds = [...allergies.map((r) => r.id), ...medications.map((r) => r.id)];
      const share = await createShare("emergency", emergencyRecordIds);
      const url = `${window.location.origin}/share/${share.id}`;

      setShareCreated(share.id);
      setShareUrl(url);
      setShowShareModal(true);

      await copyToClipboard(url);
    } catch (error) {
      console.error("Failed to create emergency share:", error);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    const success = await copyToClipboard(shareUrl);
    if (!success) return;
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current || !shareCreated) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `health-wallet-share-${shareCreated}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="page-container">
      <div className="page-max-width">
        <div className="page-header">
          <Link href="/" className="back-link">
            {"<- Back to Dashboard"}
          </Link>
          <h1 className="page-title">Emergency Health Card</h1>
          <p className="page-subtitle">Complete health information for emergency responders</p>
        </div>

        <div className="action-group mb-6">
          <button
            onClick={handleCreateEmergencyShare}
            disabled={sharing}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
            {sharing ? "Generating..." : showShareModal ? "Share Created" : "Generate Share Link"}
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg font-semibold transition ${
              copied
                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                : "btn-secondary"
            }`}
          >
            <Copy size={18} />
            {copied ? "Copied" : "Copy Summary"}
          </button>
        </div>

        <div className="card-premium section-spacing-narrow">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="flex-1 min-w-0">
              <p className="section-header mb-2">Patient Profile</p>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-3 mb-4">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 break-words">{patient.name}</h2>
                {patient.bloodType && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                    {patient.bloodType}
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Date of Birth</p>
                  <p className="text-base text-slate-900 font-medium">{formatDateForDisplay(patient.dateOfBirth)}</p>
                </div>

                <div className="pt-3 mt-4 border-t border-blue-200/50">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Phone size={14} className="text-blue-600" /> Emergency Contact
                  </p>
                  <p className="font-semibold text-slate-900">{patient.emergencyContact?.name || "N/A"}</p>
                  <p className="text-xs text-slate-500 mt-1">{patient.emergencyContact?.relationship || "N/A"}</p>
                  <p className="text-sm font-mono font-semibold text-blue-700 mt-2">
                    {patient.emergencyContact?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {severeAllergies.length > 0 && (
          <div className="section-spacing-narrow emergency-alert">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={22} className="text-red-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="emergency-alert-title mb-0">Severe Allergies Present</p>
                <p className="text-sm text-red-700 mt-1 font-medium">Immediate medical attention required if exposed</p>
              </div>
            </div>
            <div className="space-y-2">
              {severeAllergies.map((a) => (
                <div key={a.id} className="bg-white/70 p-3 rounded border border-red-300">
                  <p className="font-semibold text-slate-900 text-base break-words">{(a as any).allergen}</p>
                  {(a as any).reaction && (
                    <p className="text-sm text-red-800 mt-1 font-medium">{(a as any).reaction}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section-spacing">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-600" />
            <p className="section-header mb-0">Allergies</p>
          </div>
          <div className="record-item record-item-allergy">
            {allergies.length === 0 ? (
              <p className="text-sm text-slate-600">No structured allergy records.</p>
            ) : (
              <div className="space-y-4">
                {allergies.map((a) => (
                  <div key={a.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900 break-words text-base">{(a as any).allergen}</p>
                      {(a as any).severity && (
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                            (a as any).severity === "severe"
                              ? "bg-red-100 text-red-800"
                              : (a as any).severity === "moderate"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {(a as any).severity}
                        </span>
                      )}
                    </div>
                    {(a as any).reaction && <p className="text-xs text-slate-600 mt-2">Reaction: {(a as any).reaction}</p>}
                  </div>
                ))}
              </div>
            )}

            {profileAllergies.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Profile Notes</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {profileAllergies.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="section-spacing">
          <div className="flex items-center gap-2 mb-4">
            <Pill size={18} className="text-blue-600" />
            <p className="section-header mb-0">Current Medications</p>
          </div>
          <div className="record-item record-item-medication">
            {medications.length === 0 ? (
              <p className="text-sm text-slate-600">No structured medication records.</p>
            ) : (
              <div className="space-y-4">
                {medications.map((m) => (
                  <div key={m.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 break-words text-base">{(m as any).name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 text-sm">
                      <span className="text-slate-700 font-medium">{(m as any).dosage}</span>
                      <span className="hidden sm:block text-slate-300">.</span>
                      <span className="text-slate-600">{(m as any).frequency}</span>
                    </div>
                    {(m as any).indication && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">Reason: {(m as any).indication}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {profileMedications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Profile Notes</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {profileMedications.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="section-spacing">
          <div className="flex items-center gap-2 mb-4">
            <Heart size={18} className="text-emerald-600" />
            <p className="section-header mb-0">Active Conditions</p>
          </div>
          <div className="record-item record-item-condition">
            {conditions.length === 0 ? (
              <p className="text-sm text-slate-600">No structured condition records.</p>
            ) : (
              <div className="space-y-4">
                {conditions.map((c) => (
                  <div key={c.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 break-words text-base">{(c as any).name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          (c as any).status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : (c as any).status === "chronic"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {(c as any).status}
                      </span>
                      {(c as any).onsetDate && (
                        <span className="text-xs text-slate-500">Since {formatDateForDisplay((c as any).onsetDate)}</span>
                      )}
                    </div>
                    {(c as any).notes && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{(c as any).notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {profileConditions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Profile Notes</p>
                <ul className="space-y-1 text-sm text-slate-700">
                  {profileConditions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {(patient.majorFamilyHistory || patient.primaryPhysicianName || patient.primaryClinic || patient.insuranceCompany || patient.importantNotes || patient.height || patient.weight) && (
          <div className="section-spacing">
            <p className="section-header">Additional Profile Information</p>
            <div className="card space-y-4 text-sm text-slate-700">
              {(patient.height || patient.weight) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Height</p>
                    <p className="text-slate-900">{patient.height || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Weight</p>
                    <p className="text-slate-900">{patient.weight || "N/A"}</p>
                  </div>
                </div>
              )}

              {(patient.primaryPhysicianName || patient.primaryPhysicianPhone || patient.primaryClinic) && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Healthcare Provider</p>
                  <p className="text-slate-900">{patient.primaryPhysicianName || "N/A"}</p>
                  {patient.primaryPhysicianPhone && <p className="text-slate-700">{patient.primaryPhysicianPhone}</p>}
                  {patient.primaryClinic && <p className="text-slate-700">{patient.primaryClinic}</p>}
                </div>
              )}

              {(patient.insuranceCompany || patient.insuranceNumber) && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Insurance</p>
                  <p className="text-slate-900">{patient.insuranceCompany || "N/A"}</p>
                  {patient.insuranceNumber && <p className="text-slate-700">Policy: {patient.insuranceNumber}</p>}
                </div>
              )}

              {patient.majorFamilyHistory && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={16} className="text-purple-600" />
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Major Family History</p>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{patient.majorFamilyHistory}</p>
                </div>
              )}

              {patient.importantNotes && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Other Notes</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{patient.importantNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasStructuredRecords && profileAllergies.length === 0 && profileMedications.length === 0 && profileConditions.length === 0 && (
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <p className="text-sm text-slate-600">No medical records added yet. Add allergies, medications, or conditions to complete the emergency card.</p>
          </div>
        )}

        <div className="action-group mt-8">
          <Link href="/share" className="btn-secondary flex-1 text-center">
            Manage Shares
          </Link>
          <Link href="/" className="btn-secondary flex-1 text-center">
            Back to Dashboard
          </Link>
        </div>

        {showShareModal && shareUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[calc(100vh-1.5rem)] flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Emergency Share Link</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg flex justify-center">
                  <div ref={qrRef}>
                    <QRCodeSVG value={shareUrl} size={180} level="H" includeMargin={true} />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 text-center">
                  Scan this QR code with a smartphone to open the provider view instantly.
                </p>

                <div className="bg-slate-50 p-3 rounded-lg break-all">
                  <p className="text-xs text-slate-500 mb-1 font-semibold">SHARE LINK</p>
                  <p className="text-xs font-mono text-slate-700">{shareUrl}</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 space-y-2.5 flex-shrink-0">
                <button
                  onClick={handleCopyShareUrl}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition ${
                    urlCopied
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <Copy size={16} />
                  {urlCopied ? "Copied" : "Copy Link"}
                </button>

                <button
                  onClick={handleDownloadQR}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition"
                >
                  <Download size={16} />
                  Download QR
                </button>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
