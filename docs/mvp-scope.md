# MVP Scope: Local-First Health Wallet

## What We're Building

A **patient-controlled, device-local health record** that allows patients to:
- Store and manage their own medical information (profile, allergies, medications, conditions)
- Add supporting documents (text or optional file upload)
- Generate emergency-ready summaries
- Share limited, read-only snapshots with providers on the same device

## Core Features

### 1. Patient Profile
- Full name
- Date of birth
- Preferred language
- One emergency contact (name, relationship, phone)
- Edit capability

### 2. Clinical Records
Users can create, view, edit, and delete structured records:
- **Allergies**: With severity (none/mild/moderate/severe)
- **Medications**: With dosage, frequency, and indication
- **Conditions**: With status (active/resolved) and onset date

Each record has:
- Description/name
- Source metadata (self-reported / document-backed / derived)
- Notes
- Creation/update timestamps

### 3. Documents
- Add documents by pasting text (primary)
- Optional file upload (if simple to implement)
- Store locally, no server upload
- Manual organization (no auto-parsing/OCR)

### 4. Emergency Summary
- Auto-generated read-only view of critical info
- Shows: patient name, DOB, allergies, medications, conditions, emergency contact
- One-click export/copy

### 5. Sharing & Provider View
**Same-device prototype sharing via local sessions**:
- Patient generates a "share" (creates a snapshot)
- Snapshot stored in local storage with a share ID
- Provider view accessible via `/share/[shareId]`
- Read-only, minimal scope (emergency or continuity-of-care)

**Scopes**:
- **Emergency**: Allergies + medications + emergency contact
- **Continuity**: Emergency + conditions + relevant documents

### 6. Demo-Friendly Data
- Pre-populated sample patient data on first load
- Allows immediate walkthrough without data entry

## What We're NOT Building

- ❌ Authentication / multi-user
- ❌ Backend database
- ❌ Cloud sync
- ❌ Hospital integrations
- ❌ Standards-based interoperability (FHIR, HL7, etc.)
- ❌ Medical signatures or compliance infrastructure
- ❌ AI pipelines or external processing
- ❌ Complex document parsing or OCR

## Technical Constraints

- **Local-first**: All data stored on device (IndexedDB via localforage)
- **Single-user**: No login, no multi-tenant
- **Privacy**: No external calls with medical data
- **Hackathon realistic**: Simple, robust, demo-ready
- **Sharing limitation**: Same-device only (prototype MVP)

## Success Criteria

- ✅ Patient can view/edit profile
- ✅ Patient can manage allergies, medications, conditions
- ✅ Patient can add documents (text paste)
- ✅ Patient can view emergency summary
- ✅ Patient can generate and view a shared snapshot
- ✅ UI is clean and navigable
- ✅ Demo data loads on first visit
- ✅ All data persists across page refreshes
