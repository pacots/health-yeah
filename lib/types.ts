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

export type MedicalVisitRecord = {
  id: string;
  type: "medical-visit";
  visitDate: string; // ISO date (YYYY-MM-DD)
  reasonForVisit: string;
  diagnosis?: string;
  treatment?: string;
  doctorNotes?: string;
  specialty?: string; // e.g., "Dermatology", "Cardiology", "General Practice"
  doctorName?: string;
  severity: "critical" | "major" | "moderate" | "routine"; // Critical = hospitalization/major procedures, Major = significant diagnoses, Moderate = routine with findings, Routine = checkups
  source: "self-reported" | "document-backed" | "derived";
  sourceDocId?: string;
  createdAt: number;
  updatedAt: number;
};

export type Record = AllergyRecord | MedicationRecord | ConditionRecord | MedicalVisitRecord;

export type Document = {
  id: string;
  title: string;
  type: "text" | "file";
  content: string;
  mimeType?: string;
  createdAt: number;
  updatedAt: number;
};

// ============ MEDICAL DOCUMENT INGESTION PIPELINE ============

/**
 * Represents an uploaded medical document (source file).
 * This is the raw uploaded file with metadata and processing status.
 */
export type MedicalDocument = {
  id: string;
  userId: string; // For multi-user future-proofing
  fileName: string;
  mimeType: string;
  storageKey: string; // Path where file is stored (in IndexedDB as base64)
  uploadedAt: number;
  documentType?: string; // Initial guess: "visit", "lab", "imaging", "prescription", etc.
  sourceType: "upload" | "manual" | "provider_sync";
  processingStatus: "uploaded" | "extracting" | "extracted" | "parsing" | "parsed" | "failed";
  errorMessage?: string;
  linkedRecordId?: string; // FK to StructuredMedicalRecord (once parsing succeeds)
  metadata?: { [key: string]: unknown };
  createdAt: number;
  updatedAt: number;
};

/**
 * Represents extracted text/content from a medical document.
 * Separates the extraction step from parsing.
 */
export type DocumentExtraction = {
  id: string;
  medicalDocumentId: string;
  extractedText: string;
  extractionMethod: "pdf_text" | "ocr" | "manual" | "api";
  confidenceScore?: number; // 0-1 scale
  charCount: number;
  createdAt: number;
};

/**
 * Represents a normalized, structured medical record parsed from a document.
 * This is the validated output from the LLM parser.
 */
export type StructuredMedicalRecord = {
  id: string;
  userId: string;
  medicalDocumentId: string;
  
  // Classification
  recordType: "visit" | "lab" | "imaging" | "prescription" | "procedure" | "diagnosis" | "allergy" | "note" | "unknown";
  title: string;
  
  // Date and location
  dateOfService?: string; // ISO date, nullable if not found
  providerName?: string;
  organizationName?: string;
  specialty?: string;
  facility?: string;
  
  // Medical content (all nullable - parser should not invent values)
  summary?: string;
  chiefComplaint?: string;
  diagnoses?: string[];
  medications?: string[];
  vitals?: { [key: string]: unknown }; // e.g., { BP: "120/80", HR: 72 }
  labs?: string[];
  procedures?: string[];
  recommendations?: string[];
  followUpInstructions?: string[];
  severity?: "critical" | "major" | "moderate" | "routine";
  tags?: string[];
  
  // QA and provenance
  rawParserOutput: { [key: string]: unknown }; // Preserve full LLM output for debugging
  parserVersion: string; // e.g., "gpt-4-turbo@20240101"
  parserModel: string; // e.g., "gpt-4-turbo"
  reviewStatus: "auto_parsed" | "needs_review" | "reviewed" | "rejected";
  reviewNotes?: string;
  confidence?: number; // 0-1, from parser
  missingFields?: string[]; // Fields parser couldn't extract
  warnings?: string[]; // Uncertainty markers from parser
  
  createdAt: number;
  updatedAt: number;
};

/**
 * UI-facing medical history entry derived from StructuredMedicalRecord.
 * Used for display in the medical history timeline.
 */
export type MedicalHistoryEntry = {
  id: string;
  userId: string;
  structuredRecordId: string;
  title: string;
  date: string; // ISO date
  severity: "critical" | "major" | "moderate" | "routine";
  category: string;
  provider?: string;
  summary: string;
  important: boolean;
  displayMetadata?: { [key: string]: unknown };
  createdAt: number;
  updatedAt: number;
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
  medicalDocuments?: MedicalDocument[]; // Uploaded source files
  documentExtractions?: DocumentExtraction[]; // Extracted text
  structuredMedicalRecords?: StructuredMedicalRecord[]; // Parsed records
  medicalHistoryEntries?: MedicalHistoryEntry[]; // UI entries
  shares: { [shareId: string]: Share };
};
