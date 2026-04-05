"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { useState, useRef } from "react";
import { AlertTriangle, Pill, Heart, Copy, Share2, Phone, Calendar, X, Download, FileText } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function EmergencySummaryPage() {
  const { patient, records, createShare } = useApp();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareCreated, setShareCreated] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

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

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `health-wallet-share-${shareCreated}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
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

      // Generate share URL
      const url = `${window.location.origin}/share/${share.id}`;
      setShareUrl(url);
      setShowShareModal(true);

      // Copy link to clipboard automatically (with fallback)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = url;
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
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Emergency Health Card</h1>
          <p className="text-slate-500">Complete health information for emergency responders</p>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: BASIC INFORMATION
            ═══════════════════════════════════════════════════════════ */}
        <div className="mb-8">
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
                    <p className="text-base text-slate-900 font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Age: {Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  </div>

                  {patient.emergencyContact && (
                    <div className="pt-3 mt-4 border-t border-blue-200/50">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <Phone size={14} className="text-blue-600" /> Emergency Contact
                      </p>
                      <p className="font-semibold text-slate-900">{patient.emergencyContact.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{patient.emergencyContact.relationship}</p>
                      <p className="text-sm font-mono font-semibold text-blue-700 mt-2">{patient.emergencyContact.phone}</p>
                    </div>
                  )}

                  <div className="pt-3 mt-4 border-t border-blue-200/50">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Updated</p>
                    <p className="text-xs text-slate-600 mt-1">{new Date(patient.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: CRITICAL ALERTS
            ═══════════════════════════════════════════════════════════ */}
        {severeAllergies.length > 0 && (
          <div className="mb-8">
            <div className="emergency-alert">
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
                      <p className="text-sm text-red-800 mt-1 font-medium">→ {(a as any).reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile Allergies from Patient data */}
        {patient.allergies && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-600" />
              <p className="section-header mb-0">Documented Allergies</p>
            </div>
            <div className="card border-l-4 border-l-red-500 bg-white rounded-lg p-5 sm:p-6 whitespace-pre-wrap text-sm text-slate-700">
              {patient.allergies}
            </div>
          </div>
        )}

        {/* Profile Medications from Patient data */}
        {patient.currentMedications && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Pill size={18} className="text-blue-600" />
              <p className="section-header mb-0">Current Medications</p>
            </div>
            <div className="card border-l-4 border-l-blue-500 bg-white rounded-lg p-5 sm:p-6 whitespace-pre-wrap text-sm text-slate-700">
              {patient.currentMedications}
            </div>
          </div>
        )}

        {/* Profile Conditions from Patient data */}
        {patient.currentConditions && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={18} className="text-emerald-600" />
              <p className="section-header mb-0">Active Conditions</p>
            </div>
            <div className="card border-l-4 border-l-emerald-500 bg-white rounded-lg p-5 sm:p-6 whitespace-pre-wrap text-sm text-slate-700">
              {patient.currentConditions}
            </div>
          </div>
        )}

        {/* Profile Family History from Patient data */}
        {patient.majorFamilyHistory && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-purple-600" />
              <p className="section-header mb-0">Major Family History</p>
            </div>
            <div className="card border-l-4 border-l-purple-500 bg-white rounded-lg p-5 sm:p-6 whitespace-pre-wrap text-sm text-slate-700">
              {patient.majorFamilyHistory}
            </div>
          </div>
        )}

        {/* Profile Primary Physician */}
        {(patient.primaryPhysicianName || patient.primaryPhysicianPhone || patient.primaryClinic || patient.insuranceCompany || patient.insuranceNumber) && (
          <div className="mb-8">
            <p className="section-header">Healthcare Provider Information</p>
            <div className="card bg-white rounded-lg p-5 sm:p-6 space-y-3 text-sm text-slate-700">
              {(patient.primaryPhysicianName || patient.primaryPhysicianPhone) && (
                <div>
                  <p className="section-label">Primary Physician</p>
                  <p className="text-slate-900">
                    {patient.primaryPhysicianName && <span>{patient.primaryPhysicianName}</span>}
                    {patient.primaryPhysicianPhone && <span> • {patient.primaryPhysicianPhone}</span>}
                  </p>
                </div>
              )}
              {patient.primaryClinic && (
                <div>
                  <p className="section-label">Clinic</p>
                  <p className="text-slate-900">{patient.primaryClinic}</p>
                </div>
              )}
              {(patient.insuranceCompany || patient.insuranceNumber) && (
                <div>
                  <p className="section-label">Insurance</p>
                  <p className="text-slate-900">
                    {patient.insuranceCompany && <span>{patient.insuranceCompany}</span>}
                    {patient.insuranceCompany && patient.insuranceNumber && <span> • </span>}
                    {patient.insuranceNumber && <span>{patient.insuranceNumber}</span>}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Height and Weight from Home Page Card */}
        {(patient.height || patient.weight) && (
          <div className="mb-8">
            <p className="section-header">Physical Measurements</p>
            <div className="card bg-white rounded-lg p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-6">
                {patient.height && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Height</p>
                    <p className="text-base text-slate-700 font-medium">{patient.height}</p>
                  </div>
                )}
                {patient.weight && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Weight</p>
                    <p className="text-base text-slate-700 font-medium">{patient.weight}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Other Notes */}
        {patient.importantNotes && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-600" />
              <p className="section-header mb-0">Other Notes</p>
            </div>
            <div className="card border-l-4 border-l-amber-500 bg-white rounded-lg p-5 sm:p-6 whitespace-pre-wrap text-sm text-slate-700">
              {patient.importantNotes}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3: MEDICAL RISKS
            ═══════════════════════════════════════════════════════════ */}
        
        {/* Allergies */}
        {allergies.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-600" />
              <p className="section-header mb-0">All Documented Allergies</p>
            </div>
            <div className="record-item record-item-allergy">
              <div className="space-y-4">
                {allergies.map((a) => (
                  <div key={a.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 break-words text-base">{(a as any).allergen}</p>
                      </div>
                      {(a as any).severity && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                          (a as any).severity === "severe"
                            ? "bg-red-100 text-red-800"
                            : (a as any).severity === "moderate"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {(a as any).severity}
                        </span>
                      )}
                    </div>
                    {(a as any).reaction && (
                      <p className="text-xs text-slate-600 mt-2">Reaction: {(a as any).reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Medications */}
        {medications.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Pill size={18} className="text-blue-600" />
              <p className="section-header mb-0">Current Medications</p>
            </div>
            <div className="record-item record-item-medication">
              <div className="space-y-4">
                {medications.map((m) => (
                  <div key={m.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 break-words text-base">{(m as any).name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 text-sm">
                      <span className="text-slate-700 font-medium">{(m as any).dosage}</span>
                      <span className="hidden sm:block text-slate-300">•</span>
                      <span className="text-slate-600">{(m as any).frequency}</span>
                    </div>
                    {(m as any).indication && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">Reason: {(m as any).indication}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conditions */}
        {conditions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={18} className="text-emerald-600" />
              <p className="section-header mb-0">Active Health Conditions</p>
            </div>
            <div className="record-item record-item-condition">
              <div className="space-y-4">
                {conditions.map((c) => (
                  <div key={c.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 break-words text-base">{(c as any).name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        (c as any).status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : (c as any).status === "chronic"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {(c as any).status}
                      </span>
                      {(c as any).onsetDate && (
                        <span className="text-xs text-slate-500">Since {new Date((c as any).onsetDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {(c as any).notes && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{(c as any).notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Medical Records Alert */}
        {allergies.length === 0 && medications.length === 0 && conditions.length === 0 && (
          <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <p className="text-sm text-slate-600">No medical records added yet. Add allergies, medications, and conditions to complete your health profile.</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 5: ACTIONS
            ═══════════════════════════════════════════════════════════ */}
        <div className="action-group mt-8">
          <button
            onClick={handleCreateEmergencyShare}
            disabled={sharing}
            className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
          >
            <Share2 size={18} />
            {sharing ? "Generating..." : showShareModal ? "✓ Share Created" : "Generate Share Link"}
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition ${
              copied
                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                : "btn-secondary"
            }`}
          >
            <Copy size={18} />
          </button>
        </div>

        {/* Share Modal - QR Code Display */}
        {showShareModal && shareUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[calc(100vh-1.5rem)] flex flex-col animate-in fade-in">
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Share Emergency Record</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4">
                {/* QR Code */}
                <div className="bg-slate-50 p-4 rounded-lg flex justify-center">
                  <div ref={qrRef}>
                    <QRCodeSVG
                      value={shareUrl}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                {/* Scan Instructions */}
                <p className="text-xs sm:text-sm text-slate-600 text-center">
                  Scan this QR code with a smartphone camera or QR scanner to instantly access the provider view.
                </p>

                {/* Share URL Display */}
                <div className="bg-slate-50 p-3 rounded-lg break-all">
                  <p className="text-xs text-slate-500 mb-1 font-semibold">SHARE LINK:</p>
                  <p className="text-xs font-mono text-slate-700 line-clamp-2">{shareUrl}</p>
                </div>

                {/* Footer Note */}
                <p className="text-xs text-slate-500 text-center border-t border-slate-200 pt-3">
                  Share link valid only during this session. Perfect for emergency scenarios and demos.
                </p>
              </div>

              {/* Actions - Fixed */}
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
                  {urlCopied ? "✓ Copied" : "Copy Link"}
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
