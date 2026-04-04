import { Patient, Record, Document, Share } from "../types";

/**
 * Build a share snapshot tailored by scope
 * Returns the exact payload that will be stored and shared with providers
 */
export function buildShareSnapshot(
  scope: "emergency" | "continuity",
  patient: Patient,
  selectedRecords: Record[],
  allDocuments: Document[]
): Share {
  // For emergency: allergies, medications only (minimal)
  // For continuity: all selected records + full documents with content

  let documentSnapshots: Document[] = [];

  if (scope === "continuity") {
    // Include ALL documents with full content
    // This ensures document text is not truncated for provider access
    documentSnapshots = allDocuments.map((doc) => ({
      ...doc,
      // Explicitly preserve full content
      content: doc.content,
    }));
  }

  // Emergency scope: documents omitted entirely

  const share: Share = {
    id: "", // Will be set by caller
    scope,
    patientSnapshot: patient,
    recordSnapshots: selectedRecords,
    documentSnapshots,
    createdAt: Date.now(),
  };

  return share;
}
