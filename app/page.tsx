"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const { patient, records, documents, loading, resetToDemo } = useApp();
  const [resetting, setResetting] = useState(false);

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
    if (confirm("Reset wallet to demo data? This will clear all your data.")) {
      setResetting(true);
      try {
        await resetToDemo();
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-max-width">
        {/* Header Section */}
        <div className="page-header flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-widest mb-2">Welcome</p>
            <h1 className="page-title">Health Wallet</h1>
            <p className="page-subtitle">Your complete health in one place</p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="btn-secondary btn-sm whitespace-nowrap flex-shrink-0"
            title="Reset wallet to demo data"
          >
            {resetting ? "Resetting..." : "🔄 Reset"}
          </button>
        </div>

        {/* Patient Card - Premium */}
        <div className="card-premium section-spacing-narrow">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="flex-1 min-w-0">
              <p className="section-header mb-2">Patient Identity</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 break-words">{patient.name}</h2>
              <p className="text-sm text-slate-600 mt-2">
                Born {new Date(patient.dateOfBirth).toLocaleDateString()}
              </p>
              {patient.emergencyContact && (
                <div className="mt-4 p-3 bg-white/80 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Emergency Contact</p>
                  <p className="font-semibold text-slate-900">{patient.emergencyContact.name}</p>
                  <p className="text-sm text-slate-600">{patient.emergencyContact.relationship}</p>
                  <p className="text-base font-mono font-bold text-teal-700 mt-1">{patient.emergencyContact.phone}</p>
                </div>
              )}
            </div>
            <Link href="/profile" className="btn-secondary btn-sm whitespace-nowrap flex-shrink-0 self-start sm:self-auto">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Health Summary Stats */}
        <div className="section-spacing">
          <p className="section-header">Health Summary</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-block">
              <p className="stat-value text-rose-600">{allergies.length}</p>
              <p className="stat-label">Allergies</p>
            </div>
            <div className="stat-block">
              <p className="stat-value text-sky-600">{medications.length}</p>
              <p className="stat-label">Active Meds</p>
            </div>
            <div className="stat-block">
              <p className="stat-value text-emerald-600">{conditions.length}</p>
              <p className="stat-label">Conditions</p>
            </div>
          </div>
        </div>

        {/* Medical Records Grid */}
        <div className="section-spacing">
          <p className="section-header">Medical Records</p>
          <div className="dashboard-grid">
            <Link href="/records/allergies" className="dashboard-card card-accent-rose">
              <div className="dashboard-card-icon">🚨</div>
              <p className="dashboard-card-title">Allergies</p>
              <p className="dashboard-card-desc">{allergies.length} recorded</p>
            </Link>
            <Link href="/records/medications" className="dashboard-card card-accent-sky">
              <div className="dashboard-card-icon">💊</div>
              <p className="dashboard-card-title">Medications</p>
              <p className="dashboard-card-desc">{medications.length} active</p>
            </Link>
            <Link href="/records/conditions" className="dashboard-card card-accent-emerald">
              <div className="dashboard-card-icon">🏥</div>
              <p className="dashboard-card-title">Conditions</p>
              <p className="dashboard-card-desc">{conditions.length} documented</p>
            </Link>
            <Link href="/documents" className="dashboard-card card-accent-amber">
              <div className="dashboard-card-icon">📄</div>
              <p className="dashboard-card-title">Documents</p>
              <p className="dashboard-card-desc">{documents.length} files</p>
            </Link>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/summary/emergency" className="btn-primary w-full text-center py-3.5 text-lg font-bold shadow-lg">
            🆘 Emergency Summary
          </Link>
          <Link href="/share" className="btn-secondary w-full text-center py-3.5 text-lg font-bold">
            📤 Share Record
          </Link>
        </div>
      </div>
    </div>
  );
}
