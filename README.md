# Health Wallet MVP

A **local-first, patient-controlled health wallet** for managing and sharing essential medical information.

## Live App

Production version: https://healthyeah.vercel.app/

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

## Easy User Tutorial

Use this quick walkthrough if this is your first time using Health Wallet:

1. **Open the app**
	- Go to https://healthyeah.vercel.app/
	- On first use, choose **Create New Profile** or **Import Profile**

2. **Create your profile**
	- Add your name, date of birth, emergency contact, and optional details like blood type
	- Tap **Save Profile**

3. **Add your medical records**
	- Open **Allergies**, **Medications**, and **Conditions** from the home dashboard
	- Add entries one by one and keep them updated

4. **Store important documents**
	- Go to **Documents**
	- Add medical notes/reports so they are available with your wallet

5. **Use Emergency Health Card**
	- From home, open **Emergency Health Card**
	- Review key information quickly
	- Copy the summary when needed

6. **Share with a provider or family member**
	- Go to **Share** and create a share snapshot
	- Send the generated link
	- Revoke access later if needed

7. **Back up your wallet**
	- Open **Profile**
	- Use **Export Wallet** to save a backup file
	- Use **Import Wallet** to restore on another browser/device

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
