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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Health Wallet</h1>
            <p className="text-gray-600">Your portable health record</p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="text-sm btn-secondary"
            title="Reset wallet to demo data (for testing)"
          >
            {resetting ? "Resetting..." : "🔄 Reset"}
          </button>
        </div>

        {/* Patient Info */}
        <div className="card mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
              <p className="text-gray-600">
                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <Link href="/profile" className="btn-secondary">
              Edit Profile
            </Link>
          </div>

          {patient.emergencyContact && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm font-semibold text-gray-700">Emergency Contact</p>
              <p className="text-gray-600">
                {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
              </p>
              <p className="text-gray-600">{patient.emergencyContact.phone}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-3xl font-bold text-red-600">{allergies.length}</p>
            <p className="text-gray-600">Allergies</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-blue-600">{medications.length}</p>
            <p className="text-gray-600">Medications</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-green-600">{conditions.length}</p>
            <p className="text-gray-600">Conditions</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/records/allergies" className="card text-center hover:shadow-lg transition">
            <p className="text-lg font-bold text-gray-900 mb-2">🚨 Allergies</p>
            <p className="text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/records/medications" className="card text-center hover:shadow-lg transition">
            <p className="text-lg font-bold text-gray-900 mb-2">💊 Medications</p>
            <p className="text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/records/conditions" className="card text-center hover:shadow-lg transition">
            <p className="text-lg font-bold text-gray-900 mb-2">🏥 Conditions</p>
            <p className="text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/documents" className="card text-center hover:shadow-lg transition">
            <p className="text-lg font-bold text-gray-900 mb-2">📄 Documents</p>
            <p className="text-sm text-gray-600">View & manage</p>
          </Link>
        </div>

        {/* Emergency & Share */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/summary/emergency" className="btn-primary text-center block">
            🆘 Emergency Summary
          </Link>
          <Link href="/share" className="btn-primary text-center block">
            📤 Share Health Record
          </Link>
        </div>
      </div>
    </div>
  );
}
