"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { MedicalVisitRecord, MedicalDocument } from "@/lib/types";
import Link from "next/link";
import { TimelineExpandedVertical } from "@/lib/components/TimelineExpandedVertical";
import { DocumentUpload } from "@/lib/components/DocumentUpload";
import { DocumentList } from "@/lib/components/DocumentList";
import { ParsedRecordReview } from "@/lib/components/ParsedRecordReview";
import { ingestMedicalDocument } from "@/lib/services/ingestion-workflow";

export default function MedicalHistoryPage() {
  const {
    patient,
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    medicalDocuments,
    addMedicalDocument,
    updateMedicalDocument,
    addStructuredMedicalRecord,
    addMedicalHistoryEntry,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalVisitRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "upload">("history");
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [reviewingRecord, setReviewingRecord] = useState<any>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [processing, setProcessing] = useState(false);

  const medicalRecords = records.filter((r) => r.type === "medical-visit") as MedicalVisitRecord[];

  const handleEdit = (record: MedicalVisitRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleProcessDocument = async (doc: MedicalDocument) => {
    if (!patient) return;

    // Need OpenAI API key - prompt user
    setProcessingDocId(doc.id);
    setShowApiKeyPrompt(true);
  };

  const handleStartProcessing = async () => {
    if (!processingDocId || !apiKeyInput.trim() || !patient) return;

    const doc = medicalDocuments.find((d) => d.id === processingDocId);
    if (!doc) return;

    setProcessing(true);
    setShowApiKeyPrompt(false);

    try {
      // Get the file from metadata
      const base64Content = doc.metadata?.base64Content as string;
      if (!base64Content) {
        alert("Could not find file content");
        return;
      }

      // Convert base64 back to File
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const file = new File([bytes], doc.fileName, { type: doc.mimeType });

      // Run ingestion workflow
      const result = await ingestMedicalDocument(
        file,
        doc,
        apiKeyInput,
        patient.id
      );

      if (result.success && result.structuredRecord && result.historyEntry) {
        // Save all entities
        await updateMedicalDocument(result.medicalDocument!);
        await addStructuredMedicalRecord(result.structuredRecord);
        await addMedicalHistoryEntry(result.historyEntry);

        // Show review modal for approval
        setReviewingRecord(result.structuredRecord);
      } else {
        alert(`Processing failed: ${result.error}`);
      }
    } catch (err) {
      alert(
        `Processing error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setProcessing(false);
      setProcessingDocId(null);
      setApiKeyInput("");
    }
  };

  const handleApproveRecord = async (record: any) => {
    await updateMedicalDocument({
      ...medicalDocuments.find((d) => d.id === record.medicalDocumentId)!,
      linkedRecordId: record.id,
      processingStatus: "parsed",
      updatedAt: Date.now(),
    });
    setReviewingRecord(null);
    setActiveTab("history");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">📜 Medical History</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Add Visit
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-4 font-medium border-b-2 transition ${
              activeTab === "history"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Medical History {medicalRecords.length > 0 && `(${medicalRecords.length})`}
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`pb-4 px-4 font-medium border-b-2 transition ${
              activeTab === "upload"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            Upload Documents {medicalDocuments.length > 0 && `(${medicalDocuments.length})`}
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <MedicalVisitForm
            initialRecord={editingRecord}
            onClose={handleCloseForm}
            onSave={async (data) => {
              if (editingRecord) {
                await updateRecord({ ...editingRecord, ...data, updatedAt: Date.now() });
              } else {
                await addRecord(data);
              }
              handleCloseForm();
            }}
          />
        )}

        {/* Review Modal */}
        {reviewingRecord && (
          <ParsedRecordReview
            record={reviewingRecord}
            onApprove={handleApproveRecord}
            onReject={() => setReviewingRecord(null)}
            onDone={() => setReviewingRecord(null)}
          />
        )}

        {/* API Key Prompt */}
        {showApiKeyPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                OpenAI API Key Required
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                To parse medical documents using AI, please provide your OpenAI API key. It will only be used for this parsing request and not stored.
              </p>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded mb-4 text-sm"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowApiKeyPrompt(false);
                    setProcessingDocId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartProcessing}
                  disabled={!apiKeyInput.trim() || processing}
                  className="btn-primary disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Process Document"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "history" ? (
          // Medical history tab
          <div className="card">
            {medicalRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No medical visits recorded yet</p>
                <p className="text-gray-500 text-sm mt-2">Add your first visit record to get started</p>
              </div>
            ) : (
              <TimelineExpandedVertical
                records={medicalRecords}
                onEditRecord={handleEdit}
                onDeleteRecord={deleteRecord}
              />
            )}
          </div>
        ) : (
          // Upload tab
          <div className="space-y-8">
            {/* Upload section */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📤 Upload Medical Document</h2>
              {patient && (
                <DocumentUpload
                  userId={patient.id}
                  onUploadComplete={(doc) => {
                    addMedicalDocument(doc);
                  }}
                />
              )}
            </div>

            {/* Documents list */}
            {medicalDocuments.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Uploaded Documents</h2>
                <DocumentList
                  documents={medicalDocuments}
                  onProcess={handleProcessDocument}
                  onDelete={() => {}}
                />
              </div>
            )}
          </div>
        )}

        {/* Severity Legend */}
        <div className="card mt-8">
          <h3 className="font-bold text-gray-900 mb-4">Severity Levels</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Critical</p>
                <p className="text-xs text-gray-600">Hospitalizations, major procedures</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Major</p>
                <p className="text-xs text-gray-600">Significant diagnoses, important changes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Moderate</p>
                <p className="text-xs text-gray-600">Routine visits with findings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Routine</p>
                <p className="text-xs text-gray-600">Checkups, preventative care</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicalVisitForm({
  initialRecord,
  onClose,
  onSave,
}: {
  initialRecord?: MedicalVisitRecord | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [visitDate, setVisitDate] = useState(
    initialRecord?.visitDate || new Date().toISOString().split("T")[0]
  );
  const [reasonForVisit, setReasonForVisit] = useState(initialRecord?.reasonForVisit || "");
  const [diagnosis, setDiagnosis] = useState(initialRecord?.diagnosis || "");
  const [treatment, setTreatment] = useState(initialRecord?.treatment || "");
  const [doctorNotes, setDoctorNotes] = useState(initialRecord?.doctorNotes || "");
  const [specialty, setSpecialty] = useState(initialRecord?.specialty || "");
  const [doctorName, setDoctorName] = useState(initialRecord?.doctorName || "");
  const [severity, setSeverity] = useState(initialRecord?.severity || "moderate");
  const [loading, setLoading] = useState(false);

  const specialtyOptions = [
    "General Practice",
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Orthopedics",
    "Psychiatry",
    "Oncology",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitDate.trim() || !reasonForVisit.trim()) return;

    setLoading(true);
    try {
      await onSave({
        type: "medical-visit",
        visitDate,
        reasonForVisit,
        diagnosis: diagnosis || undefined,
        treatment: treatment || undefined,
        doctorNotes: doctorNotes || undefined,
        specialty: specialty || undefined,
        doctorName: doctorName || undefined,
        severity,
        source: "self-reported",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {initialRecord ? "Edit Medical Record" : "Add Medical Visit"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Visit Date *</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">Severity *</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as "critical" | "major" | "moderate" | "routine")}
                className="input"
                required
              >
                <option value="routine">Routine (Regular checkups)</option>
                <option value="moderate">Moderate (Routine with findings)</option>
                <option value="major">Major (Significant diagnoses)</option>
                <option value="critical">Critical (Hospitalizations, procedures)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Medical Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="input"
              >
                <option value="">Select a specialty...</option>
                {specialtyOptions.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Doctor Name</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g., Dr. Jane Smith"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Reason for Visit *</label>
            <input
              type="text"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="e.g., Annual physical, Skin rash evaluation"
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Diagnosis</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g., Type 2 Diabetes - Well controlled"
              className="input"
            />
          </div>

          <div>
            <label className="label">Treatment</label>
            <textarea
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="e.g., Prescribed Metformin 500mg twice daily"
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Doctor Notes</label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Additional notes or observations from the visit"
              className="input"
              rows={4}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? "Saving..." : (initialRecord ? "Update Record" : "Add Record")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
