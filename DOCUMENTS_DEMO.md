# Quick Demo Guide - Documents Feature

## 🚀 Quick Start

The Documents feature is **ready to use** at `http://localhost:3000/documents`

### What You Can Do Right Now

#### 1️⃣ Add a Text Note
1. Go to `/documents`
2. Click the **"Add Text Note"** tab
3. Fill in:
   - **Title**: Any title (e.g., "Lab Results")
   - **Category**: Pick one (e.g., "lab-result")
   - **Description**: Optional
   - **Content**: Your text (e.g., "HbA1c: 6.8%")
4. Click **"Save Note"**
5. Your note appears in the list below

**Demo input:**
```
Title: Blood Lab Results - March 2026
Category: lab-result
Content: 
HbA1c: 6.8% (well-controlled)
Glucose: 118 mg/dL (slightly elevated)
Cholesterol: 195 mg/dL (normal)
```

#### 2️⃣ Upload a Document
1. Click the **"Upload File"** tab
2. Select a file (PDF, JPG, PNG, WEBP)
   - Max 15MB
3. Fill in:
   - **Title**: What is this? (e.g., "MRI Scan Report")
   - **Category**: Optional
   - **Description**: Optional
4. Click **"Upload Document"**
5. File appears in the list with file size and type badge

**Supported formats:**
- 📄 PDF documents
- 🖼️ JPG / JPEG images
- 🖼️ PNG images
- 🖼️ WEBP images

#### 3️⃣ View Any Document
- Click on a document in the list
- **Text documents**: See full text content
- **File documents**: See file details, download button, and:
  - 🖼️ **Image files**: Preview inline in modal
  - 📄 **PDF files**: Download/open in separate app

#### 4️⃣ Download Files
- Open a file document modal
- Click **"📥 Open / Download"** button
- File downloads to your computer

#### 5️⃣ Delete Documents
- Open any document modal
- Click **"Delete Document"**
- Confirm the deletion
- Done! Removed from list and disk

---

## 📊 What's Stored

### Text Documents
Stored in: `data/documents/index.json`
```json
{
  "id": "abc123",
  "kind": "text",
  "title": "My Notes",
  "textContent": "...",
  "category": "doctor-note",
  "createdAt": 1775337588125
}
```

### File Documents
Stored in:
- **Metadata**: `data/documents/index.json`
- **File**: `data/documents/files/{id}_{filename}`

```json
{
  "id": "xyz789",
  "kind": "file",
  "title": "MRI Results",
  "fileName": "mri_scan.pdf",
  "mimeType": "application/pdf",
  "extension": ".pdf",
  "fileSizeBytes": 2048576,
  "localPath": "files/xyz789_mri_scan.pdf",
  "checksumSha256": "3b4a5..."
}
```

---

## 🧪 Testing Checklist

### Frontend Tests
- [ ] Open `/documents` page loads without errors
- [ ] "Add Text Note" tab works - create and save a note
- [ ] Note appears in the documents list immediately
- [ ] "Upload File" tab shows file selector (accept PDF, JPG, PNG, WEBP)
- [ ] Upload a test image
- [ ] File appears in list with file type badge
- [ ] Click text document → see content in modal
- [ ] Click file document → see file details and download button
- [ ] Image file shows preview in modal
- [ ] PDF file shows indicator with download link
- [ ] Delete a document → confirm → goes away from list
- [ ] Error handling: Try uploading wrong file type → see error
- [ ] Error handling: Try uploading >15MB file → see error

### Backend API Tests
All endpoints tested and working:
```bash
# List documents
curl http://localhost:3000/api/documents

# Create text document
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","textContent":"Content"}'

# Upload file
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.pdf" -F "title=Test PDF"

# Get specific document
curl http://localhost:3000/api/documents/{ID}

# Download file
curl http://localhost:3000/api/documents/{ID}/file > downloaded_file.pdf

# Delete document
curl -X DELETE http://localhost:3000/api/documents/{ID}
```

---

## 📁 File Organization

```
scarlethacks-2026/
├── data/
│   └── documents/
│       ├── index.json              # All metadata (encrypted in production)
│       └── files/
│           ├── id_filename1.pdf
│           ├── id_filename2.jpg
│           └── id_filename3.png
├── lib/
│   ├── document-storage.ts         # File/metadata handling
│   ├── types.ts                    # Updated Document type
│   └── context.tsx                 # API integration
├── app/
│   ├── documents/
│   │   └── page.tsx                # UI for documents
│   └── api/
│       └── documents/
│           ├── route.ts            # List & create text
│           ├── upload/route.ts     # File uploads
│           └── [id]/
│               ├── route.ts        # Get & delete
│               └── file/route.ts   # Download file
└── DOCUMENTS_FEATURE.md            # This feature's docs
```

---

## 🎯 Categories Available

When creating or uploading, you can set:
- **lab-result** - Lab tests, blood work
- **prescription** - Medication prescriptions
- **imaging** - X-rays, MRIs, scans
- **insurance** - Insurance documents
- **referral** - Doctor referrals
- **discharge-summary** - Hospital discharge notes
- **doctor-note** - General doctor notes
- **vaccination** - Vaccination records
- **other** - Anything else

---

## ⚙️ Technical Details

### No Extra Dependencies
- Uses Node.js `fs` module for files
- Uses Next.js built-in API routes
- Uses browser's `FormData` for file uploads
- Tailwind CSS for styling (already in project)

### File Validation
- MIME type whitelist: PDF, JPEG, PNG, WEBP
- Max file size: 15MB
- Filename sanitization: Prevents path injection
- SHA256 checksum: Generated on upload

### Storage Model
- **Hierarchical**: Text + files in same metadata
- **JSON-based**: Easy to read/debug during hackathon
- **Filesystem**: Real files on disk, not in database
- **No external services**: Works offline

---

## 🚨 Known Limitations (Hackathon Version)

- No search/filter (demo focused)
- No batch operations
- No OCR or text extraction
- PDF preview via download (not embedded viewer)
- No image compression
- No encryption (local demo only)
- No user authentication (single-user)
- No soft deletes (permanent deletion)

These can all be added in post-hackathon improvements.

---

## 🎓 Learning Resources

If you want to understand the code:

1. **Storage logic**: `lib/document-storage.ts`
   - File operations, validation, cleanup

2. **API Routes**: `app/api/documents/*`
   - REST endpoints implementation

3. **Frontend Form**: `app/documents/page.tsx`
   - Tab interface, form handling, modals

4. **Type System**: `lib/types.ts`
   - Document type definition

5. **Integration**: `lib/context.tsx`
   - Connecting frontend to API

---

## 💾 Data Persistence

Documents are saved to disk immediately:
- Close the browser → refresh → documents still there ✅
- Restart the server → queries still work ✅
- Files survive app restart ✅
- Delete is permanent (no undo) ⚠️

---

## 🎉 You're Ready to Demo!

The feature is production-demo ready. You can:
- ✅ Show text document workflow
- ✅ Show file upload workflow  
- ✅ Show image preview in modal
- ✅ Show PDF download capability
- ✅ Show fully persistent storage

All without a database, all with simple JSON + local filesystem.

---

**Need help?** Check `DOCUMENTS_FEATURE.md` for architecture details.
