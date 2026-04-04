# Routes & Navigation

## Page Structure

### Patient Dashboard
- **Route**: `/` (root)
- **Purpose**: Overview of health wallet, quick access to main features
- **Content**:
  - Patient name and DOB
  - Quick summary: # allergies, # medications, # conditions
  - Emergency contact info
  - Large buttons: View Profile, Manage Records, View Emergency Summary, Generate Share
  - List of recent updates (or snapshot of latest records)
- **Actions**: Navigate to other sections

### Profile
- **Route**: `/profile`
- **Purpose**: View and edit patient profile
- **Content**:
  - Edit form with fields: name, DOB, language, emergency contact (name, relationship, phone)
  - Save button
- **Actions**: Update profile, persist to localforage

### Records Management

#### Allergies
- **Route**: `/records/allergies`
- **Purpose**: Manage allergy records
- **Content**:
  - List of all allergies with allergen, severity, reaction
  - Add button → Modal/form to create new
  - Each allergy card has: Edit, Delete buttons
- **Actions**: Create, read, update, delete allergies

#### Medications
- **Route**: `/records/medications`
- **Purpose**: Manage medication records
- **Content**:
  - List of all medications with name, dosage, frequency
  - Add button → Modal/form to create new
  - Each medication card has: Edit, Delete buttons
- **Actions**: Create, read, update, delete medications

#### Conditions
- **Route**: `/records/conditions`
- **Purpose**: Manage condition records
- **Content**:
  - List of all conditions with name, status, onset date
  - Add button → Modal/form to create new
  - Each condition card has: Edit, Delete buttons
- **Actions**: Create, read, update, delete conditions

### Documents
- **Route**: `/documents`
- **Purpose**: Add and view supporting documents
- **Content**:
  - Tabs or sections: "Add Document" and "Document List"
  - Add: Text paste input with title + submit
  - List: Document cards with title, creation date, snippet of content, Delete button
- **Actions**: Create (text paste), view, delete documents

### Emergency Summary
- **Route**: `/summary/emergency`
- **Purpose**: View emergency-ready health summary
- **Content** (read-only):
  - Patient name, DOB
  - **Allergies**: All allergies with severity
  - **Medications**: All medications with dosage/frequency
  - **Key Conditions**: All active/chronic conditions
  - **Emergency Contact**: Name, relationship, phone
  - Copy button (copy as text or export)
- **Actions**: Copy, back to dashboard

### Sharing

#### Share Management
- **Route**: `/share`
- **Purpose**: Create and manage shares
- **Content**:
  - "Generate New Share" button
  - Modal/form:
    - Radio buttons: Emergency scope | Continuity scope
    - Checkboxes: Select which allergies, medications, conditions to include
    - Generate button
  - List of existing shares (shareId, scope, created date, revoke button)
- **Actions**: Create share, revoke share, copy share link

#### Provider View (Read-Only)
- **Route**: `/share/[shareId]`
- **Purpose**: Recipient (provider) views shared snapshot
- **Content** (read-only):
  - "Shared Health Record" header
  - Patient name, DOB
  - Scope label (Emergency or Continuity)
  - Shared allergies, medications, conditions
  - Shared documents (if continuity)
  - Emergency contact (if included in scope)
  - "Back" or "Close" button
  - Note: "This snapshot was generated on [date]"
- **Actions**: Read only (no editing)

## Navigation Flow

```
Dashboard (/)
├── Profile (/profile)
├── Records
│   ├── Allergies (/records/allergies)
│   ├── Medications (/records/medications)
│   └── Conditions (/records/conditions)
├── Documents (/documents)
├── Emergency Summary (/summary/emergency)
└── Share
    ├── Manage (/share)
    └── View (/share/[shareId])
```

## Shared Components & Modals

- **Header**: Logo, current page title, back/home button
- **RecordForm Modal**: Reusable form for creating/editing allergies, medications, conditions
- **ConfirmDelete Modal**: "Are you sure?" before deletion
- **ShareModal**: Generate share with scope + record selection
- **DocumentPicker Modal**: Text paste for document upload
- **Navigation Sidebar** (optional): Quick links to main sections

## URL Parameters & Query Strings

- `/share/[shareId]`: Dynamic route for viewing specific share (shareId is UUID or short code)
- Future: Add `?edit=true` for edit mode, `?print=true` for print view

## Deep Link Behavior

- Direct link to `/share/[shareId]` works even if no authentication (public read-only)
- Shares are stored in localforage keyed by `shares:{shareId}`
- If shareId not found, show "Share not found or expired"
