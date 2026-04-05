"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AlertTriangle, Pill, Heart, FileText, Share2, CheckCircle, Plus, Phone, ArrowRight } from "lucide-react";
import { ConfirmDialog } from "@/lib/ConfirmDialog";

export default function Home() {
  const { patient, records, documents, loading, resetToDemo } = useApp();
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Check for saved parameter from profile redirect
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  
  // Use effect to check URL params and show message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('saved')) {
      setShowSavedMessage(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Hide message after 3 seconds
      const timer = setTimeout(() => setShowSavedMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Wallet</h1>
          <p className="text-gray-600">Loading your health information...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Wallet</h1>
          <p className="text-gray-600">No patient data found</p>
        </div>
      </div>
    );
  }

  const allergies = records.filter((r) => r.type === "allergy");
  const medications = records.filter((r) => r.type === "medication");
  const conditions = records.filter((r) => r.type === "condition");

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetToDemo();
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-max-width">
        {/* Header Section */}
        <div className="page-header flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-2">Welcome Back</p>
            <h1 className="page-title">Health Wallet</h1>
            <p className="page-subtitle">Your complete health information, always accessible</p>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting}
            className="btn-tertiary btn-sm whitespace-nowrap flex-shrink-0"
            title="Reset wallet to demo data"
          >
            {resetting ? "Resetting..." : "Reset Demo"}
          </button>
        </div>

        {/* Success Message */}
        {showSavedMessage && (
          <div className="alert-success mb-6 text-sm">
            ✓ Profile saved successfully
          </div>
        )}

        {/* Patient Card - Premium */}
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
            <Link href="/profile" className="btn-secondary btn-sm whitespace-nowrap flex-shrink-0 self-start sm:self-auto">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Health Summary Stats */}
        <div className="section-spacing">
          <p className="section-header">Health Overview</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="stat-label">Allergies Recorded</p>
              <p className="stat-value text-red-600">{allergies.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Active Medications</p>
              <p className="stat-value text-blue-600">{medications.length}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Health Conditions</p>
              <p className="stat-value text-emerald-600">{conditions.length}</p>
            </div>
          </div>
        </div>

        {/* Medical Records Grid */}
        <div className="section-spacing">
          <p className="section-header">Medical Records</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/records/allergies" className="record-item record-item-allergy hover:border-red-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    <p className="text-lg font-semibold text-slate-900">Allergies</p>
                  </div>
                  <p className="text-sm text-slate-600">{allergies.length} {allergies.length === 1 ? "allergy" : "allergies"} recorded</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-red-600 transition-colors" />
              </div>
            </Link>

            <Link href="/records/medications" className="record-item record-item-medication hover:border-blue-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Pill size={20} className="text-blue-600" />
                    <p className="text-lg font-semibold text-slate-900">Medications</p>
                  </div>
                  <p className="text-sm text-slate-600">{medications.length} {medications.length === 1 ? "medication" : "medications"} active</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>

            <Link href="/records/conditions" className="record-item record-item-condition hover:border-emerald-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Heart size={20} className="text-emerald-600" />
                    <p className="text-lg font-semibold text-slate-900">Conditions</p>
                  </div>
                  <p className="text-sm text-slate-600">{conditions.length} {conditions.length === 1 ? "condition" : "conditions"} documented</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Link>

            <Link href="/documents" className="record-item hover:border-amber-500 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText size={20} className="text-amber-600" />
                    <p className="text-lg font-semibold text-slate-900">Documents</p>
                  </div>
                  <p className="text-sm text-slate-600">{documents.length} {documents.length === 1 ? "file" : "files"} stored</p>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="action-group mt-8">
          <Link href="/summary/emergency" className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
            <AlertTriangle size={18} />
            <span>Emergency Health Card</span>
          </Link>
          <Link href="/share" className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3">
            <Share2 size={18} />
            <span>Share Record</span>
          </Link>
        </div>

        {/* Confirmation Dialogs */}
        <ConfirmDialog
          isOpen={showResetConfirm}
          title="Reset Wallet"
          message="Are you sure? This will reset all data to the demo dataset. This action cannot be undone."
          confirmLabel="Reset"
          cancelLabel="Cancel"
          isDangerous={true}
          isLoading={resetting}
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      </div>
    </div>
  );
}
