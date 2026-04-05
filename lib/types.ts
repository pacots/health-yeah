// Core types for the Health Yeah app

export type Patient = {
  id: string;
  name: string;
  dateOfBirth: string; // ISO date (YYYY-MM-DD)
  preferredLanguage: string;
  
  // Medical Information
  bloodType?: string; // e.g., "O+", "B-"
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Emergency Health Card Fields
  allergies?: string; // Comma-separated or formatted list
  currentMedications?: string; // Comma-separated or formatted list
  currentConditions?: string; // Comma-separated or formatted list
  majorFamilyHistory?: string; // Text field for family medical history
  primaryPhysicianName?: string; // Physician name
  primaryPhysicianPhone?: string; // Physician phone number
  primaryClinic?: string; // Clinic name and/or location
  insuranceCompany?: string; // Insurance company name
  insuranceNumber?: string; // Insurance policy number
  height?: string; // e.g., "5'10\" or "178 cm"
  weight?: string; // e.g., "180 lbs" or "82 kg"
  importantNotes?: string; // Special considerations, alerts, etc.
  
  // Metadata
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
  linkedDocumentIds?: string[]; // Documents linked to this allergy
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
  linkedDocumentIds?: string[]; // Documents linked to this medication
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
  source: "self-reported" | "document-backed" | "derived" | "ai-suggested";
  sourceDocId?: string;
  linkedDocumentIds?: string[]; // Documents linked to this condition
  progressSummary?: string | null;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type Record = AllergyRecord | MedicationRecord | ConditionRecord;

/**
 * Unified medical entity types across the system
 */
export type MedicalEntityType = 'condition' | 'allergy' | 'medication';

/**
 * Extracted medical entities from a document summary (without IDs, just names)
 */
export type ExtractedEntity = {
  type: MedicalEntityType;
  name: string;
};

/**
 * Existing patient medical entities (with IDs for matching)
 */
export type ExistingEntity = {
  id: string;
  type: MedicalEntityType;
  name: string;
};

/**
 * Unified result from AI entity matching pipeline
 * Replaces the old condition-only DocumentConditionSuggestion
 */
export type EntityMatchResult = {
  type: MedicalEntityType;
  extractedName: string;
  finalName: string;
  action: 'link-existing' | 'create-new';
  matchedId?: string; // Only for action === 'link-existing'
  confidence: number; // 0.0 to 1.0
  reason?: string;
  reviewed?: boolean;
  accepted?: boolean;
};

/**
 * AI-generated suggestion for linking a document to a condition (legacy)
 */
export type DocumentConditionSuggestion = {
  type: "link-existing" | "create-new";
  conditionName: string;
  matchedConditionId?: string; // Only for type === 'link-existing'
  confidence: number; // 0-1 score
  reason?: string;
  reviewed?: boolean;
  accepted?: boolean;
};

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

  // Unified entity matching (NEW)
  /** Extracted medical entities from document summary (all types) */
  extractedEntities?: ExtractedEntity[];
  
  /** AI entity match results from unified matching pipeline (all types) */
  aiEntityMatches?: EntityMatchResult[];

  // Reserved for future features
  /** LLM-generated summary (hidden in current UI, for future use) */
  llmSummary?: string | null;

  /** IDs of associated medical history entries (supports future linking) */
  linkedMedicalHistoryIds?: string[];
  
  /** IDs of linked conditions (document-backed) */
  linkedConditionIds?: string[];
  
  /** IDs of linked allergies (document-backed) */
  linkedAllergyIds?: string[];
  
  /** IDs of linked medications (document-backed) */
  linkedMedicationIds?: string[];
  
  /** AI-generated suggestions for linking to conditions (legacy - use aiEntityMatches) */
  aiConditionSuggestions?: DocumentConditionSuggestion[];

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
  status?: "active" | "revoked";
};

// Single wallet object for atomic persistence
export type Wallet = {
  patient: Patient | null;
  records: Record[];
  documents: Document[];
  shares: { [shareId: string]: Share };
  preferences: { [key: string]: unknown };
};
