# Tradeoffs & Design Decisions

## 1. Local Storage Over Backend Database

**Decision**: Use browser local storage (IndexedDB) instead of backend.

**Why**:
- ✅ No server infrastructure needed
- ✅ No authentication complexity
- ✅ Privacy: data never leaves the device
- ✅ Fast local access
- ❌ Data is per-device (not cloud-synced)
- ❌ Data lost if browser cleared
- ❌ Not shareable across devices without workaround

**MVP Trade-off**: Perfect for a single-patient hackathon demo. For production, would add cloud backup.

---

## 2. Local Share Sessions Over URL Encoding

**Decision**: Store shares in localforage keyed by shareId instead of encoding medical data in URL.

**Why Local Sessions**:
- ✅ Avoids sending base64-encoded medical data in URLs
- ✅ Cleaner, more performant URLs
- ✅ No browser history leakage of medical data
- ❌ Only works on same device / same browser
- ❌ Shares lost if localforage cleared
- ❌ Not a true network share

**Why Not URL Encoding**:
- Medical data in URLs = worse privacy (history, clipboard, links)
- Hard to revoke
- No way to enforce expiry

**MVP Trade-off**: Same-device sharing is acceptable for hackathon demo. Document as "MVP limitation" to be replaced with backend API later.

---

## 3. react Hooks + Context Over Redux or Zustand

**Decision**: Use React hooks + simple context for global state instead of Redux/Zustand.

**Why**:
- ✅ No external dependency for MVP
- ✅ Simple to understand and debug
- ✅ Sufficient for single-patient app
- ❌ Potential re-render inefficiencies at scale
- ❌ Less structured for large state trees

**MVP Trade-off**: Context is fine for a small, focused app. Can refactor to Zustand/Redux if state grows.

---

## 4. No Encryption

**Decision**: Medical data stored in plaintext in IndexedDB (browser's native isolation).

**Why**:
- ✅ Simpler implementation, less complexity
- ✅ No key management needed
- ✅ Sufficient for MVP demo (not production)
- ❌ Shared device = anyone can access
- ❌ No protection against browser theft

**MVP Trade-off**: Acceptable for hackathon. Production would add AES encryption with PIN/password.

---

## 5. Text Paste > File Upload

**Decision**: Primary document input is text paste. Optional file upload if trivial to add.

**Why**:
- ✅ Simpler UX (no file picker)
- ✅ Works with copypaste from emails, PDFs (manual)
- ✅ No file-size concerns
- ❌ Requires manual transcription for physical docs
- ❌ No OCR

**MVP Trade-off**: Text paste is sufficient. Future: Add file upload + basic OCR if needed.

---

## 6. No Audit Trail / History

**Decision**: Records have createdAt/updatedAt but no version history.

**Why**:
- ✅ Simpler data model
- ✅ Faster implementation
- ❌ Patient can't see what changed
- ❌ No rollback capability

**MVP Trade-off**: Fine for MVP. Could add timestamps per edit, but not critical for demo.

---

## 7. No Expiry Enforcement

**Decision**: Shares have optional expiresAt field but no automatic deletion.

**Why**:
- ✅ Simpler implementation
- ✅ Patient can manually revoke anytime
- ❌ Old shares stick around indefinitely
- ❌ No automatic cleanup

**MVP Trade-off**: Manual revoke is sufficient. Could add background cleanup job later.

---

## 8. Preferred Language Field (Not Implemented)

**Decision**: Store preferred language in profile but app stays English-only for MVP.

**Why**:
- ✅ Future-proofs data model
- ✅ No multi-language complexity for hackathon
- ❌ Field unused in MVP

**MVP Trade-off**: Accept it as a nice-to-have for future localization.

---

## 9. No Medical Data Validation

**Decision**: Minimal validation (required fields, basic format). No medical logic.

**Why**:
- ✅ Faster implementation
- ✅ No complex business rules
- ❌ No conflict detection (e.g., drug-drug interactions)
- ❌ User can enter nonsense

**MVP Trade-off**: Fine for demo. Production would add medical data sources/APIs.

---

## 10. Single Component Library vs. Headless + Tailwind

**Decision**: Use Tailwind CSS directly for components instead of UI library (shadcn, Material).

**Why**:
- ✅ Smaller bundle
- ✅ Full control over styling
- ✅ No dependency bloat
- ❌ Need to build more components from scratch
- ❌ Less polish

**MVP Trade-off**: Acceptable. Build core components manually; can add shadcn later if needed.

---

## Summary: Hackathon Realism

All tradeoffs prioritize:
1. **Speed**: Get to working MVP in 24 hours
2. **Privacy**: Medical data never leaves device
3. **Simplicity**: Avoid complex infrastructure
4. **Demo Quality**: Works, feels good, tells a story

For production, revisit these and invest in:
- Real backend + sync
- Encryption + authentication
- Medical data standards (FHIR, HL7)
- Interoperability with real EHRs
- Compliance (HIPAA, GDPR)
- Proper audit trails
- User testing with patients
