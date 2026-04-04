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

export type Document = {
  id: string;
  title: string;
  type: "text" | "file";
  content: string;
  mimeType?: string;
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
