# Data Model: Local-First Health Yeah

## Overview

All data is stored as JSON in IndexedDB (via localforage). The model is normalized and simple, avoiding complex relations.

## Core Types (TypeScript)

```typescript
// ============ PATIENT ============
type Patient = {
  id: string; // UUID
  name: string;
  dateOfBirth: string; // ISO date (YYYY-MM-DD)
  preferredLanguage: string; // "en", "es", "fr", etc.
  emergencyContact: {
    name: string;
    relationship: string; // "spouse", "adult child", "parent", etc.
    phone: string;
  };
  createdAt: number; // timestamp
  updatedAt: number;
};

// ============ RECORDS ============
type AllergyRecord = {
  id: string; // UUID
  type: "allergy";
  allergen: string; // e.g., "Penicillin"
  severity: "mild" | "moderate" | "severe"; // Optional, default: not specified
  reaction?: string; // e.g., "Rash", "Anaphylaxis"
  source: "self-reported" | "document-backed" | "derived";
  sourceDocId?: string; // If document-backed
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

type MedicationRecord = {
  id: string;
  type: "medication";
  name: string; // e.g., "Metformin"
  dosage: string; // e.g., "500mg"
  frequency: string; // e.g., "Twice daily", "As needed"
  indication?: string; // Why it's prescribed
  source: "self-reported" | "document-backed" | "derived";
  sourceDocId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

type ConditionRecord = {
  id: string;
  type: "condition";
  name: string; // e.g., "Type 2 Diabetes"
  status: "active" | "resolved" | "chronic"; // Chronic = ongoing
  onsetDate?: string; // ISO date when diagnosed
  source: "self-reported" | "document-backed" | "derived";
  sourceDocId?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

type Record = AllergyRecord | MedicationRecord | ConditionRecord;

// ============ DOCUMENTS ============
type Document = {
  id: string;
  title: string;
  type: "text" | "file";
  content: string; // For "text": raw text. For "file": base64 encoded
  mimeType?: string; // For files
  createdAt: number;
  updatedAt: number;
};

// ============ SHARES ============
type Share = {
  id: string; // shareId (UUID or short alphanumeric)
  scope: "emergency" | "continuity";
  patientSnapshot: Patient; // Snapshot of patient at share time
  recordSnapshots: Record[]; // Subset of records to share
  documentSnapshots: Document[]; // Subset of documents (if continuity scope)
  createdAt: number;
  expiresAt?: number; // Optional future expiry (not enforced in MVP)
};
```

## Storage Schema (IndexedDB / localforage)

**Keys in localforage**:

```
patient           → { Patient object }
records           → [ Record[] ] (all allergies, medications, conditions)
documents         → [ Document[] ] (all documents)
shares:{shareId}  → { Share object } (one key per share)
```

## Example Patient Data (Demo)

```json
{
  "id": "uuid-1",
  "name": "Sarah Chen",
  "dateOfBirth": "1990-05-15",
  "preferredLanguage": "en",
  "emergencyContact": {
    "name": "Michael Chen",
    "relationship": "spouse",
    "phone": "+1-555-0100"
  },
  "createdAt": 1712160000000,
  "updatedAt": 1712160000000
}
```

## Example Records (Demo)

### Allergy
```json
{
  "id": "uuid-a1",
  "type": "allergy",
  "allergen": "Penicillin",
  "severity": "severe",
  "reaction": "Anaphylaxis",
  "source": "document-backed",
  "sourceDocId": "uuid-doc-1",
  "notes": "Confirmed via allergy testing 2023",
  "createdAt": 1712160000000,
  "updatedAt": 1712160000000
}
```

### Medication
```json
{
  "id": "uuid-m1",
  "type": "medication",
  "name": "Metformin",
  "dosage": "500mg",
  "frequency": "Twice daily with meals",
  "indication": "Type 2 Diabetes management",
  "source": "self-reported",
  "notes": "Taking since 2022",
  "createdAt": 1712160000000,
  "updatedAt": 1712160000000
}
```

### Condition
```json
{
  "id": "uuid-c1",
  "type": "condition",
  "name": "Type 2 Diabetes",
  "status": "active",
  "onsetDate": "2022-01-10",
  "source": "document-backed",
  "sourceDocId": "uuid-doc-2",
  "notes": "Well-controlled with current medication",
  "createdAt": 1712160000000,
  "updatedAt": 1712160000000
}
```

## Constraints & Validation Rules

### Patient
- `name`: Required, non-empty
- `dateOfBirth`: Required, valid ISO date, must be in the past
- `preferredLanguage`: Optional, defaults to "en"
- `emergencyContact.name`: Required if emergency contact provided
- `emergencyContact.phone`: Required if emergency contact provided

### Records
- `allergen`/`name`: Required, non-empty
- `source`: Required (one of the three)
- All timestamps: Set by system, no user input
- IDs: Generated as UUIDs before saving

### Documents
- `title`: Required, non-empty
- `content`: Required, non-empty
- `type`: Required (text or file)

### Shares
- `id`: Generated as short alphanumeric or UUID
- `scope`: Required (emergency or continuity)
- `patientSnapshot`: Full copy at share time
- `recordSnapshots`: User-selected subset
- `documentSnapshots`: Included if continuity scope

## Initialization & First Load

If no patient exists in localforage:
1. Generate demo patient + records + documents
2. Save to localforage
3. Populate React context

On subsequent loads:
- Fetch from localforage
- Populate React context
- Ready for editing

**No migration logic needed for MVP** (single-session app).

## Persistence Layer API

```typescript
// Store and retrieve patient
await storage.setPatient(patient: Patient): Promise<void>
const patient = await storage.getPatient(): Promise<Patient | null>

// Store and retrieve all records
await storage.setRecords(records: Record[]): Promise<void>
const records = await storage.getRecords(): Promise<Record[]>

// Store and retrieve all documents
await storage.setDocuments(documents: Document[]): Promise<void>
const documents = await storage.getDocuments(): Promise<Document[]>

// Manage shares
await storage.setShare(share: Share): Promise<void>
const share = await storage.getShare(shareId: string): Promise<Share | null>
const shares = await storage.getAllShares(): Promise<Share[]>
await storage.deleteShare(shareId: string): Promise<void>

// Initialize with demo data
await storage.initializeWithDemoData(): Promise<{ patient, records, documents }>

// Clear all (for development)
await storage.clear(): Promise<void>
```
