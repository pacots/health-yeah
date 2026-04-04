import { Patient, Record, Document } from "./types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateDemoData(): {
  patient: Patient;
  records: Record[];
  documents: Document[];
} {
  const now = Date.now();

  const patient: Patient = {
    id: generateId(),
    name: "Sarah Chen",
    dateOfBirth: "1990-05-15",
    preferredLanguage: "en",
    emergencyContact: {
      name: "Michael Chen",
      relationship: "Spouse",
      phone: "+1-555-0100",
    },
    createdAt: now,
    updatedAt: now,
  };

  const records: Record[] = [
    {
      id: generateId(),
      type: "allergy",
      allergen: "Penicillin",
      severity: "severe",
      reaction: "Anaphylaxis",
      source: "document-backed",
      notes: "Confirmed via allergy testing 2023",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "allergy",
      allergen: "Sulfonamides",
      severity: "moderate",
      reaction: "Rash",
      source: "self-reported",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "medication",
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily with meals",
      indication: "Type 2 Diabetes management",
      source: "self-reported",
      notes: "Taking since 2022, well tolerated",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "medication",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily in morning",
      indication: "Hypertension",
      source: "document-backed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "condition",
      name: "Type 2 Diabetes",
      status: "active",
      onsetDate: "2022-01-10",
      source: "document-backed",
      notes: "Well-controlled with current medication, last HbA1c 6.8%",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "condition",
      name: "Hypertension",
      status: "active",
      onsetDate: "2019-06-15",
      source: "self-reported",
      notes: "Controlled with medication, regular monitoring",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "medical-visit",
      visitDate: "2026-03-20",
      reasonForVisit: "Quarterly diabetes check-up",
      diagnosis: "Type 2 Diabetes - Well controlled",
      treatment: "Continue current medication regimen",
      doctorNotes: "HbA1c improved to 6.8%. Patient compliant with diet and exercise. Continue Metformin 500mg twice daily.",
      specialty: "Endocrinology",
      doctorName: "Dr. James Mitchell",
      severity: "major",
      source: "self-reported",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "medical-visit",
      visitDate: "2026-02-14",
      reasonForVisit: "Skin rash evaluation",
      diagnosis: "Contact dermatitis - benign",
      treatment: "Prescribed topical steroid cream and antihistamine",
      doctorNotes: "Likely reaction to new laundry detergent. Advised to switch back to hypoallergenic brand. Follow up if symptoms persist beyond 1 week.",
      specialty: "Dermatology",
      doctorName: "Dr. Sarah Bennett",
      severity: "moderate",
      source: "self-reported",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      type: "medical-visit",
      visitDate: "2026-01-10",
      reasonForVisit: "Annual physical examination",
      diagnosis: "No significant findings",
      treatment: "Routine preventative care",
      doctorNotes: "Blood pressure well-controlled at 128/82. Weight stable. Patient in good overall health. Flu vaccine administered. Recommended annual mammogram and bone density screening.",
      specialty: "General Practice",
      doctorName: "Dr. Michael Rodriguez",
      severity: "routine",
      source: "self-reported",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const documents: Document[] = [
    {
      id: generateId(),
      title: "2023 Allergy Test Report",
      type: "text",
      content:
        "ALLERGY TEST RESULTS - 2023\n\nPatient: Sarah Chen\nDate: September 15, 2023\n\nConfirmed Allergies:\n- Penicillin: SEVERE (Anaphylaxis risk)\n- Sulfonamides: MODERATE (Rash)\n\nRecommendations:\n- Avoid all penicillin-based antibiotics\n- Alternative antibiotics available (fluoroquinolones, macrolides)\n- Carry epinephrine auto-injector at all times",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: "Recent Lab Results - March 2026",
      type: "text",
      content:
        "LAB RESULTS - MARCH 2026\n\nPatient: Sarah Chen\nDate Collected: March 20, 2026\n\nHematology:\n- WBC: 7.2 K/uL (normal)\n- Hemoglobin: 13.5 g/dL (normal)\n- Platelets: 245 K/uL (normal)\n\nMetabolic Panel:\n- Glucose (fasting): 118 mg/dL (slightly elevated)\n- HbA1c: 6.8% (well-controlled diabetes)\n- Creatinine: 0.95 mg/dL (normal)\n- BUN: 18 mg/dL (normal)\n\nLipid Panel:\n- Total Cholesterol: 195 mg/dL\n- LDL: 115 mg/dL (slightly elevated)\n- HDL: 52 mg/dL (normal)\n- Triglycerides: 110 mg/dL (normal)",
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { patient, records, documents };
}
