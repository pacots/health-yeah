"use client";

import { useApp } from "@/lib/context";
import Link from "next/link";
import { useState } from "react";
import { MedicalHistorySummaryStrip } from "@/lib/components/MedicalHistorySummaryStrip";
import { TimelineExpandedVertical } from "@/lib/components/TimelineExpandedVertical";
import { MedicalVisitRecord } from "@/lib/types";

export default function Home() {
  const { patient, records, documents, loading, resetToDemo } = useApp();
  const [resetting, setResetting] = useState(false);
  const [showExpandedTimeline, setShowExpandedTimeline] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<MedicalVisitRecord | null>(null);

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
  const medicalVisits = records.filter((r) => r.type === "medical-visit") as MedicalVisitRecord[];

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
        <div className="grid grid-cols-4 gap-4 mb-8">
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
          <div className="card text-center">
            <p className="text-3xl font-bold text-purple-600">{medicalVisits.length}</p>
            <p className="text-gray-600">Medical Visits</p>
          </div>
        </div>

        {/* Medical History Timeline */}
        {medicalVisits.length > 0 && (
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📜 Medical History</h2>
              <button
                onClick={() => setShowExpandedTimeline(true)}
                className="btn-secondary text-sm"
              >
                Expand Timeline
              </button>
            </div>
            <MedicalHistorySummaryStrip records={medicalVisits} />
          </div>
        )}

        {/* Main Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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
          <Link href="/records/medical" className="card text-center hover:shadow-lg transition">
            <p className="text-lg font-bold text-gray-900 mb-2">📜 Medical History</p>
            <p className="text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/documents" className="card text-center hover:shadow-lg transition">
            <p className="text-lg font-bold text-gray-900 mb-2">📄 Documents</p>
            <p className="text-sm text-gray-600">View & manage</p>
          </Link>
          <Link href="/summary/emergency" className="card text-center hover:shadow-lg transition">
            <p className="text-lg font-bold text-gray-900 mb-2">🆘 Emergency Summary</p>
            <p className="text-sm text-gray-600">View & share</p>
          </Link>
        </div>

        {/* Share */}
        <div className="grid grid-cols-1 gap-4">
          <Link href="/share" className="btn-primary text-center block">
            📤 Share Health Record
          </Link>
        </div>
      </div>

      {/* Quick Visit Preview Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {new Date(selectedVisit.visitDate + "T00:00:00").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
                <p className="text-sm text-gray-600">{selectedVisit.reasonForVisit}</p>
              </div>
              <button
                onClick={() => setSelectedVisit(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {selectedVisit.specialty && (
                <div>
                  <p className="text-xs font-semibold text-gray-600">SPECIALTY</p>
                  <p className="text-gray-900">{selectedVisit.specialty}</p>
                </div>
              )}
              {selectedVisit.diagnosis && (
                <div>
                  <p className="text-xs font-semibold text-gray-600">DIAGNOSIS</p>
                  <p className="text-gray-900">{selectedVisit.diagnosis}</p>
                </div>
              )}
              {selectedVisit.doctorName && (
                <div>
                  <p className="text-xs font-semibold text-gray-600">DOCTOR</p>
                  <p className="text-gray-900">{selectedVisit.doctorName}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedVisit(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              <Link
                href="/records/medical"
                className="btn-primary flex-1 text-center"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Timeline Modal */}
      {showExpandedTimeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Complete Medical History</h2>
              <button
                onClick={() => setShowExpandedTimeline(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <TimelineExpandedVertical records={medicalVisits} />
            </div>
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowExpandedTimeline(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
