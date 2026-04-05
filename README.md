# Health Wallet MVP

A **local-first, patient-controlled health wallet** for managing and sharing essential medical information.

## Features

✅ **Patient Profile** — Full name, DOB, emergency contact  
✅ **Clinical Records** — Allergies, medications, conditions (CRUD)  
✅ **Documents** — Paste and store medical documents  
✅ **Emergency Summary** — One-click access to critical health info  
✅ **Health Sharing** — Share limited snapshots with providers  
✅ **Local-First** — Wallet data stored on device by default  
✅ **First-Run Onboarding** — Start from scratch or import an existing wallet  

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Architecture

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB (via localforage)
- **Optional Remote Sharing**: Supabase (for cross-device share links)
- **State**: React Context

## Environment Variables

Optional for remote sharing:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

If these are not set, the app still works locally and share links are limited to local storage behavior.

## How to Use

1. **Dashboard** — View health overview, quick stats
2. **Profile** — Edit patient information
3. **Records** — Manage allergies, medications, conditions
4. **Documents** — Add medical documents (text paste)
5. **Emergency Summary** — View critical info, copy to clipboard
6. **Share** — Generate and manage shared health snapshots

## Sharing (MVP Explanation)

Sharing supports two modes:
- **With Supabase configured**: share snapshots are stored remotely and accessible across devices via `/share/{id}`.
- **Without Supabase configured**: local fallback behavior applies, primarily useful for same-browser testing.

Each share is a snapshot and can be revoked.

## First-Run Behavior

On a fresh browser with no saved local wallet, the app opens in an empty onboarding state:
- Create profile from scratch
- Import existing profile backup

No demo profile or seeded records are created automatically.

## Data Privacy

✅ All data stays on your device  
✅ Remote storage is optional and only used for sharing snapshots  
✅ Browser provides isolation (future: add encryption)  

## Future Enhancements

- Stronger encryption for local wallet backups
- End-to-end encryption with PIN lock
- File upload for documents
- OCR for document scanning
- FHIR/HL7 interoperability
- Multi-language support
- Audit trail & versioning

## Development Notes

- Wallet data persists in browser storage until cleared by the user
- Empty-wallet first run is the default (no demo data seeding)
- IndexedDB operations include timeout/fallback handling to avoid startup hangs
- No authentication (single-user device model)
- Remote sharing requires valid Supabase credentials

## License
MIT
