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
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 break-words">Health Wallet</h1>
            <p className="text-sm sm:text-base text-gray-600">Your portable health record</p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="text-xs sm:text-sm btn-secondary whitespace-nowrap flex-shrink-0"
            title="Reset wallet to demo data (for testing)"
          >
            {resetting ? "Resetting..." : "🔄 Reset"}
          </button>
        </div>

        {/* Patient Info */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{patient.name}</h2>
              <p className="text-sm text-gray-600">
                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <Link href="/profile" className="btn-secondary whitespace-nowrap flex-shrink-0">
              Edit Profile
            </Link>
          </div>

          {patient.emergencyContact && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
              <p className="text-xs font-semibold text-gray-700 uppercase">Emergency Contact</p>
              <p className="text-gray-600">
                {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
              </p>
              <p className="text-gray-600 break-all">{patient.emergencyContact.phone}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 sm:mb-8">
          <div className="card text-center p-4">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{allergies.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">Allergies</p>
          </div>
          <div className="card text-center p-4">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{medications.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">Medications</p>
          </div>
          <div className="card text-center p-4">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{conditions.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">Conditions</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8">
          <Link href="/records/allergies" className="card text-center hover:shadow-lg transition p-4 sm:p-6">
            <p className="text-base sm:text-lg font-bold text-gray-900 mb-1">🚨 Allergies</p>
            <p className="text-xs sm:text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/records/medications" className="card text-center hover:shadow-lg transition p-4 sm:p-6">
            <p className="text-base sm:text-lg font-bold text-gray-900 mb-1">💊 Medications</p>
            <p className="text-xs sm:text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/records/conditions" className="card text-center hover:shadow-lg transition p-4 sm:p-6">
            <p className="text-base sm:text-lg font-bold text-gray-900 mb-1">🏥 Conditions</p>
            <p className="text-xs sm:text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/documents" className="card text-center hover:shadow-lg transition p-4 sm:p-6">
            <p className="text-base sm:text-lg font-bold text-gray-900 mb-1">📄 Documents</p>
            <p className="text-xs sm:text-sm text-gray-600">View & manage</p>
          </Link>
        </div>

        {/* Emergency & Share */}
        <div className="grid grid-cols-1 gap-3">
          <Link href="/summary/emergency" className="btn-primary text-center block py-3 w-full">
            🆘 Emergency Summary
          </Link>
          <Link href="/share" className="btn-primary text-center block py-3 w-full">
            📤 Share Health Record
          </Link>
        </div>
      </div>
    </div>
  );
}
