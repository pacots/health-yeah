"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { useState, useRef } from "react";
import { AlertTriangle, Pill, Heart, Copy, Share2, Phone, Calendar, X, Download } from "lucide-react";
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
          <p className="text-slate-500">Critical health information at your fingertips</p>
        </div>

        {/* Patient Identity */}
        <div className="card-premium section-spacing-narrow">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Patient Information</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 break-words">{patient.name}</h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar size={14} /> Born {new Date(patient.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
          </div>

          {patient.emergencyContact && (
            <div className="pt-6 border-t border-blue-200/50">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Phone size={14} className="text-red-600" /> Emergency Contact
              </p>
              <p className="text-lg font-semibold text-slate-900">{patient.emergencyContact.name}</p>
              <p className="text-sm text-slate-600 mt-1">{patient.emergencyContact.relationship}</p>
              <p className="text-base font-mono font-semibold text-red-600 mt-3">{patient.emergencyContact.phone}</p>
            </div>
          )}
        </div>

        {/* CRITICAL ALERT - Only if severe allergies */}
        {severeAllergies.length > 0 && (
          <div className="mb-8">
            <div className="emergency-alert">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle size={20} className="text-red-700 flex-shrink-0 mt-0.5" />
                <p className="emergency-alert-title mb-0">Severe Allergies Present</p>
              </div>
              <div className="space-y-3">
                {severeAllergies.map((a) => (
                  <div key={a.id} className="bg-white/60 p-3 rounded border border-red-200">
                    <p className="font-semibold text-slate-900 text-base break-words">{(a as any).allergen}</p>
                    {(a as any).reaction && (
                      <p className="text-sm text-red-700 mt-2 font-medium">Reaction: {(a as any).reaction}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Allergies */}
        {allergies.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-600" />
              <p className="section-header mb-0">Allergies</p>
            </div>
            <div className="record-item record-item-allergy">
              <div className="space-y-4">
                {allergies.map((a) => (
                  <div key={a.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 break-words text-base">{(a as any).allergen}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {(a as any).severity && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          (a as any).severity === "severe"
                            ? "bg-red-100 text-red-800"
                            : (a as any).severity === "moderate"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {(a as any).severity}
                        </span>
                      )}
                      {(a as any).reaction && (
                        <span className="text-xs text-slate-600">Reaction: {(a as any).reaction}</span>
                      )}
                    </div>
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
              <p className="section-header mb-0">Medications</p>
            </div>
            <div className="record-item record-item-medication">
              <div className="space-y-4">
                {medications.map((m) => (
                  <div key={m.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 break-words text-base">{(m as any).name}</p>
                    <p className="text-sm text-slate-700 mt-2 font-medium">{(m as any).dosage} • {(m as any).frequency}</p>
                    {(m as any).indication && (
                      <p className="text-xs text-slate-600 mt-2">Reason: {(m as any).indication}</p>
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
              <p className="section-header mb-0">Health Conditions</p>
            </div>
            <div className="record-item record-item-condition">
              <div className="space-y-4">
                {conditions.map((c) => (
                  <div key={c.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                    <p className="font-semibold text-slate-900 break-words text-base">{(c as any).name}</p>
                    <p className="text-xs text-slate-600 mt-2 font-medium">Status: {(c as any).status}</p>
                    {(c as any).notes && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded">{(c as any).notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
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
