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
  // For continuity: all selected records + full documents with AI summaries and content

  let documentSnapshots: Document[] = [];

  if (scope === "continuity") {
    // Include ALL documents with full content and AI summaries
    // This ensures document text and AI summaries are preserved for provider access
    documentSnapshots = allDocuments.map((doc) => ({
      ...doc,
      // Explicitly preserve all content and AI fields
      content: doc.content,
      textContent: doc.textContent,
      aiStructuredSummary: doc.aiStructuredSummary,
      aiSummaryStatus: doc.aiSummaryStatus,
      aiSummaryGeneratedAt: doc.aiSummaryGeneratedAt,
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
