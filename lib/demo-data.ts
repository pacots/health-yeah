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
    bloodType: "O+",
    emergencyContact: {
      name: "Michael Chen",
      relationship: "Spouse",
      phone: "+1-555-0100",
    },
    allergies: "Penicillin (anaphylaxis - confirmed via allergy testing 2023)\nSulfonamides (rash)",
    currentMedications: "Metformin 500mg twice daily with meals (Type 2 Diabetes management)\nLisinopril 10mg once daily in morning (Hypertension)",
    currentConditions: "Type 2 Diabetes (active, well-controlled, HbA1c 6.8%)\nHypertension (active, managed)",
    majorFamilyHistory: "Father - Type 2 Diabetes, diagnosed 1995\nMother - Hypertension, diagnosed 2005",
    primaryPhysicianName: "Dr. Emily Rodriguez, MD",
    primaryPhysicianPhone: "+1-555-0200",
    primaryClinic: "City Medical Center",
    insuranceCompany: "Blue Cross Blue Shield",
    insuranceNumber: "#12345678",
    height: "5'6\"",
    weight: "165 lbs",
    importantNotes: "Patient manages diabetes well with current medication. No known medical devices. Prefers morning appointments when possible.",
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
  ];

  const documents: Document[] = [
    {
      id: generateId(),
      title: "2023 Allergy Test Report",
      kind: "text",
      textContent:
        "ALLERGY TEST RESULTS - 2023\n\nPatient: Sarah Chen\nDate: September 15, 2023\n\nConfirmed Allergies:\n- Penicillin: SEVERE (Anaphylaxis risk)\n- Sulfonamides: MODERATE (Rash)\n\nRecommendations:\n- Avoid all penicillin-based antibiotics\n- Alternative antibiotics available (fluoroquinolones, macrolides)\n- Carry epinephrine auto-injector at all times",
      category: "lab-result",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      llmSummary: null,
    },
    {
      id: generateId(),
      title: "Recent Lab Results - March 2026",
      kind: "text",
      textContent:
        "LAB RESULTS - MARCH 2026\n\nPatient: Sarah Chen\nDate Collected: March 20, 2026\n\nHematology:\n- WBC: 7.2 K/uL (normal)\n- Hemoglobin: 13.5 g/dL (normal)\n- Platelets: 245 K/uL (normal)\n\nMetabolic Panel:\n- Glucose (fasting): 118 mg/dL (slightly elevated)\n- HbA1c: 6.8% (well-controlled diabetes)\n- Creatinine: 0.95 mg/dL (normal)\n- BUN: 18 mg/dL (normal)\n\nLipid Panel:\n- Total Cholesterol: 195 mg/dL\n- LDL: 115 mg/dL (slightly elevated)\n- HDL: 52 mg/dL (normal)\n- Triglycerides: 110 mg/dL (normal)",
      category: "lab-result",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      llmSummary: null,
    },
  ];

  return { patient, records, documents };
}
