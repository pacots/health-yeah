# Implementation Plan: 24-Hour MVP Build

## Phase Breakdown

### Phase 1: Planning & Documentation (20 min) ✅ DONE
- [ ] Finalize product scope
- [ ] Document architecture decisions
- [ ] Define data model
- [ ] Plan routes & navigation
- [ ] Identify tradeoffs
- [ ] Get user approval

**Deliverables**: `docs/mvp-scope.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/routes.md`, `docs/tradeoffs.md`, `docs/plan.md`

---

### Phase 2: Project Setup & Core Types (30 min)

**Goal**: Get project structure ready with TypeScript types and storage layer.

**Tasks**:
- [ ] Init Next.js project (App Router, TypeScript, Tailwind)
- [ ] Install dependencies: `localforage`
- [ ] Create `lib/types.ts` with all TypeScript interfaces
- [ ] Create `lib/storage.ts` with localforage wrapper
- [ ] Create `lib/demo-data.ts` with sample patient/records/documents
- [ ] Create `lib/context.ts` with React context for global state

**Output**:
```
app/
  layout.tsx              (global layout)
  page.tsx               (placeholder)
lib/
  types.ts              (Patient, Record, Document, Share types)
  storage.ts            (localforage API)
  demo-data.ts          (sample data)
  context.ts            (React context + hooks)
```

**Estimate**: 30 min

---

### Phase 3: Local Persistence Layer (20 min)

**Goal**: Make sure data persists and loads correctly.

**Tasks**:
- [ ] Implement `storage.ts` with localforage methods
- [ ] Add context initialization (load on app start)
- [ ] Test: Create patient → refresh page → data persists
- [ ] Test: Create record → refresh page → data persists
- [ ] Create placeholder pages to verify navigation

**Output**:
- Working storage API
- Global context wired to app
- Data persists across page refreshes

**Estimate**: 20 min

---

### Phase 4: Dashboard & Record Management (60 min)

**Goal**: Core CRUD for patient profile and records.

**Tasks**:
- [ ] Dashboard page (`/`) with overview
- [ ] Profile page (`/profile`) with edit form
- [ ] Record list pages for allergies, medications, conditions
- [ ] Record form (create/edit) modal
- [ ] Delete confirmation modal
- [ ] Wire up CRUD actions to storage

**Output**:
- Patient can view and edit profile
- Patient can create/read/update/delete allergies
- Patient can create/read/update/delete medications
- Patient can create/read/update/delete conditions
- All data persists

**Estimate**: 60 min

---

### Phase 5: Emergency Summary (20 min)

**Goal**: Generate and display emergency summary.

**Tasks**:
- [ ] Create `/summary/emergency` page
- [ ] Display: Name, DOB, allergies, medications, conditions, emergency contact
- [ ] Add "Copy to clipboard" button
- [ ] Style as clean, minimal report

**Output**:
- Patient can view emergency summary
- Can copy summary text

**Estimate**: 20 min

---

### Phase 6: Sharing Flow & Provider View (30 min)

**Goal**: Allow patient to generate shares and view them.

**Tasks**:
- [ ] Create `/share` page (manage shares)
- [ ] Share creation modal:
  - [ ] Select scope (Emergency or Continuity)
  - [ ] Select which records to include (checkboxes)
  - [ ] Generate share button (creates Share in localforage)
- [ ] Display list of existing shares with revoke button
- [ ] Create `/share/[shareId]` dynamic page (provider view)
- [ ] Provider view fetches and displays share snapshot (read-only)
- [ ] Handle missing shareId gracefully

**Output**:
- Patient can generate share with selected records
- Patient can view share link
- Provider can open share link and view read-only snapshot
- Patient can revoke shares

**Estimate**: 30 min

---

### Phase 7: Polish & Demo Prep (30 min)

**Goal**: Clean up UI, improve demo flow, ensure everything works end-to-end.

**Tasks**:
- [ ] Add navigation header/sidebar
- [ ] Ensure responsive design (mobile-friendly)
- [ ] Add loading states / error handling
- [ ] Test full flow: Load → Create data → Share → View share
- [ ] Polish styling (colors, spacing, typography)
- [ ] Add document page (*if time permits*)
- [ ] Create demo script / walkthrough guide
- [ ] Update README with build/run instructions

**Output**:
- Clean, demo-ready app
- Works end-to-end
- Looks polished
- Ready for 24-hour demo

**Estimate**: 30 min

---

## Total Time Estimate

| Phase | Task | Est. |
|-------|------|------|
| 1 | Planning & Docs | 20 min ✅ |
| 2 | Setup & Types | 30 min |
| 3 | Storage Layer | 20 min |
| 4 | Dashboard & CRUD | 60 min |
| 5 | Emergency Summary | 20 min |
| 6 | Sharing | 30 min |
| 7 | Polish & Demo | 30 min |
| | **TOTAL** | **210 min (3.5 hrs)** |

**Remaining buffer for hackathon**: ~20.5 hours (plenty for iteration, debugging, and polish)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| React context causes re-renders | Performance | Accept for MVP; optimize later if needed |
| localforage quirks | Data loss | Test thoroughly in Phase 3 |
| Browser storage limits | Data overflow | Won't hit limits with demo data |
| Responsive design gaps | Mobile demo fails | Test on multiple screens during Phase 7 |
| Share URL not accessible | Demo breaks | Ensure same-device sharing works in Phase 6 |
| Time overrun | Features incomplete | Drop document features if needed; demo core flows |

---

## Success Criteria (End of Phase 7)

- ✅ Patient can view/edit profile
- ✅ Patient can create/manage allergies, medications, conditions
- ✅ Patient can view emergency summary
- ✅ Patient can generate and view shares
- ✅ All data persists across refreshes
- ✅ UI is clean and navigable
- ✅ Demo runs smoothly without errors
- ✅ Document sharing story is clear (even if incomplete)

---

## Post-Hackathon Priorities

If you want to continue beyond 24 hours:
1. Add document upload/viewing
2. Add backend API for true URL-based sharing
3. Add encryption + PIN lock
4. Add multi-language support
5. Add audit trail / history
6. Real FHIR/HL7 integration
7. User testing with patients
