# Architecture: Local-First Health Wallet

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: localforage (IndexedDB wrapper, fallback to localStorage)
- **State**: React hooks + custom context (minimal overhead)
- **UI Components**: Headless + Tailwind (no heavy UI library)

## Design Principles

1. **Local-First**: All data lives in the browser, no backend required
2. **Single-User**: Device is owned by the patient; no multi-tenant auth
3. **Privacy-Preserving**: Zero external API calls with medical data
4. **Simplicity**: Straightforward component structure, minimal abstractions
5. **Demo-Ready**: Works out-of-the-box with sample data

## Data Storage Strategy

### Storage Layer
- **Primary**: IndexedDB (via localforage)
- **Fallback**: localStorage
- **Structure**: Single document per entity type (patient, records, documents, shares)

### Data Persistence Flow
```
User Action → Update React State → Save to localforage → Success
                                         ↓
                                  Async, no blocking
```

### Initialization
1. App loads
2. Check localforage for existing patient data
3. If none found, initialize with demo data
4. Restore to React state
5. Ready for interaction

## Application Architecture

### Pages
```
app/
├── page.tsx              → Dashboard (home)
├── profile/
│   └── page.tsx          → Profile editor
├── records/
│   ├── allergies/page.tsx
│   ├── medications/page.tsx
│   └── conditions/page.tsx
├── documents/
│   └── page.tsx          → Document manager
├── summary/
│   └── emergency/page.tsx → Emergency summary view
├── share/
│   ├── page.tsx          → Manage shares
│   └── [shareId]/page.tsx → Provider view (read-only)
└── components/           → Shared UI components
```

### State Management
- **Global**: Patient profile + all records (React context + localforage)
- **Local**: Form state, modals, UI toggles (React hooks)
- **Sharing**: Share sessions stored in localforage, keyed by shareId

### Components (Flat, Reusable)
- `PatientForm` — Profile editor
- `RecordForm` — Generic record editor (allergies/meds/conditions)
- `RecordList` — Display records with edit/delete
- `DocumentPicker` — Text paste + optional file input
- `SummaryView` — Emergency summary display
- `ShareModal` — Generate share
- `ProviderView` — Read-only shared snapshot

## Sharing Flow (Prototype)

### How Sharing Works
1. Patient on dashboard clicks "Generate Share"
2. App creates a **shareId** (UUID)
3. App takes a snapshot of selected records + patient info
4. Snapshot stored in localforage under key `share:${shareId}`
5. Patient can copy `/share/shareId` link
6. Provider opens link on **same device** (or any device with access to the browser)
7. App loads snapshot from localforage and renders read-only view

### Limitations (Documented as MVP Tradeoff)
- ✅ Works on same device / shared browser
- ❌ Not a true network share (data not transferred externally)
- ❌ Shares are stored locally (if browser cleared, shares are lost)
- **Future**: Could be replaced with backend API for true URL-based sharing

**Rationale**: For a 24-hour hackathon MVP, this avoids backend complexity while still demonstrating the sharing concept clearly.

## Data Lifecycle

### Create
- User fills form → Validation → Save to state + localforage → UI update

### Read
- App loads → Fetch from localforage → Populate React state → Render

### Update
- User edits → Validation → Update state + localforage → UI update

### Delete
- User confirms → Remove from state + localforage → UI update

### Archive/Export
- Emergency summary is read-only (no export button in MVP, but easy to add)
- Shares are snapshots (immutable once created)

## Security & Privacy Notes

- ✅ All data stays on device
- ✅ No network calls with medical information
- ✅ Sharing is same-device (no external data transmission in MVP)
- ✅ Patient controls all data (no third parties)
- ⚠️ Not encrypted (MVP uses browser's native storage isolation)
- ⚠️ If browser is shared, anyone with access can see data
- 📝 **Future consideration**: Add local encryption (e.g., AES) if needed

## File & Dependency Philosophy

- Minimize external deps (localforage only requirement)
- Keep component files small (~200-400 lines max)
- Use TypeScript for type safety, skip heavy validation libraries
- Avoid framework abstractions; use Next.js patterns directly
- Use Tailwind utility classes for styling (no separate CSS)

## Deployment & Demo

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Deploy**: Vercel, Netlify, or GitHub Pages (static export possible)
- **Demo**: Works offline once loaded; no network required after initial JS load
