// Core types for the Health Wallet app

export type Patient = {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date (YYYY-MM-DD)
  preferredLanguage: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: number;
  updatedAt: number;
};

export type AllergyRecord = {
  id: string;
  type: "allergy";
  allergen: string;
  severity?: "mild" | "moderate" | "severe";
  reaction?: string;
  source: "self-reported" | "document-backed" | "derived";
  sourceDocId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type MedicationRecord = {
  id: string;
  type: "medication";
  name: string;
  dosage: string;
  frequency: string;
  indication?: string;
  source: "self-reported" | "document-backed" | "derived";
  sourceDocId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type ConditionRecord = {
  id: string;
  type: "condition";
  name: string;
  status: "active" | "resolved" | "chronic";
  onsetDate?: string;
  source: "self-reported" | "document-backed" | "derived";
  sourceDocId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type Record = AllergyRecord | MedicationRecord | ConditionRecord;

/**
 * Document record - supports both text and file documents
 *
 * Designed to support future linking with medical history entries.
 * linkedMedicalHistoryIds allows associating documents with specific medical records.
 *
 * - kind: 'text' means only textContent is populated
 * - kind: 'file' means fileName, mimeType, extension, fileSizeBytes, localPath are populated
 * - llmSummary: Reserved for future LLM-generated summaries (not shown in UI yet)
 */
export type Document = {
  // Identity
  id: string;
  title: string; // Required

  // Type & Content
  kind: "text" | "file"; // Mutually exclusive: either text or file
  textContent?: string; // Only for kind === 'text'

  // File metadata (only for kind === 'file')
  fileName?: string;
  mimeType?: string;
  extension?: string;
  fileSizeBytes?: number;
  localPath?: string;

  // Timestamps (ISO 8601 format)
  createdAt: string;
  updatedAt: string;

  // Reserved for future features
  /** LLM-generated summary (hidden in current UI, for future use) */
  llmSummary?: string | null;

  /** IDs of associated medical history entries (supports future linking) */
  linkedMedicalHistoryIds?: string[];

  // Legacy fields (deprecated, kept for compatibility)
  category?: "lab-result" | "prescription" | "imaging" | "insurance" | "referral" | "discharge-summary" | "doctor-note" | "vaccination" | "other";
  description?: string;
  patientId?: string;
  content?: string;
};

export type Share = {
  id: string;
  scope: "emergency" | "continuity";
  patientSnapshot: Patient;
  recordSnapshots: Record[];
  documentSnapshots?: Document[];
  createdAt: number;
  expiresAt?: number;
};

// Single wallet object for atomic persistence
export type Wallet = {
  patient: Patient;
  records: Record[];
  documents: Document[];
  shares: { [shareId: string]: Share };
};
