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
 * Storage is LOCAL-FIRST via IndexedDB (localforage), not server filesystem.
 * All document data persists in the browser's local storage.
 *
 * - kind: 'text' means only textContent is populated
 * - kind: 'file' means fileName, mimeType, fileContent (base64/data URL) are populated
 * - fileContent: Base64-encoded or data URL representation of file for local storage
 * - aiStructuredSummary: AI-generated summary (automatic, server-side)
 * - aiSummaryStatus: 'processing' | 'ready' | 'error'
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
  // File content stored as base64 or data URL (for local-first storage)
  fileContent?: string;
  // Legacy: localPath no longer used (was for filesystem storage)
  localPath?: string;

  // Timestamps (ISO 8601 format)
  createdAt: string;
  updatedAt: string;

  // AI-generated summary fields
  aiStructuredSummary?: string;
  aiSummaryStatus?: "processing" | "ready" | "error";
  aiSummaryGeneratedAt?: string;
  aiSummaryError?: string;

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
