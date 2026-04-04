# Health Wallet MVP

A **local-first, patient-controlled health wallet** for managing and sharing essential medical information.

## Features

✅ **Patient Profile** — Full name, DOB, emergency contact  
✅ **Clinical Records** — Allergies, medications, conditions (CRUD)  
✅ **Documents** — Paste and store medical documents  
✅ **Emergency Summary** — One-click access to critical health info  
✅ **Health Sharing** — Share limited snapshots with providers  
✅ **Local-First** — All data stored on device, no backend required  
✅ **Demo Data** — Pre-populated with realistic sample data  

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
- **State**: React Context

## How to Use

1. **Dashboard** — View health overview, quick stats
2. **Profile** — Edit patient information
3. **Records** — Manage allergies, medications, conditions
4. **Documents** — Add medical documents (text paste)
5. **Emergency Summary** — View critical info, copy to clipboard
6. **Share** — Generate and manage shared health snapshots

## Sharing (MVP Explanation)

⚠️ **Note**: In this MVP, sharing is a **local-session prototype**:
- Create a share → data stored locally + generates a share ID
- Share ID is used to create a URL like `/share/abc123`
- Open on **same device** to view the shared record
- Perfect for demos on a single browser; production would use a backend API

## Demo Data

The app loads with realistic demo patient data on first visit:
- Patient: Sarah Chen
- Allergies: Penicillin (severe), Sulfonamides (moderate)
- Medications: Metformin, Lisinopril
- Conditions: Type 2 Diabetes, Hypertension
- Documents: Lab results, allergy test report

Reset and reload to start fresh.

## Data Privacy

✅ All data stays on your device
✅ No external API calls
✅ No cloud upload
✅ Browser provides isolation (future: add encryption)

## Future Enhancements

- Real backend for cross-device sharing
- End-to-end encryption with PIN lock
- File upload for documents
- OCR for document scanning
- FHIR/HL7 interoperability
- Multi-language support
- Audit trail & versioning

## Development Notes

- Demo data resets on browser cache clear
- Share snapshots stored in IndexedDB (same device only)
- No authentication (single-user device model)
- Minimal dependencies (localforage only extra library)

## License

MIT
