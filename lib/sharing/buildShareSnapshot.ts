import { Patient, Record, Document, Share } from "../types";

/**
 * Build a share snapshot tailored by scope
 * Returns the exact payload that will be stored and shared with providers
 */
export function buildShareSnapshot(
  scope: "emergency" | "continuity",
  patient: Patient,
  selectedRecords: Record[],
  selectedDocuments: Document[]
): Share {
  // For emergency: allergies, medications only (minimal)
  // For continuity: selected records + only explicitly selected documents

  let documentSnapshots: Document[] = [];

  if (scope === "continuity") {
    // Include ALL documents with both AI output and original payload data.
    // Provider view must have access to original content, not only generated summaries.
    documentSnapshots = selectedDocuments.map((doc) => ({
      ...doc,
      // Explicitly preserve original content fields
      fileContent: doc.fileContent,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      extension: doc.extension,
      fileSizeBytes: doc.fileSizeBytes,
      content: doc.content,
      textContent: doc.textContent,

      // Explicitly preserve AI fields
      aiStructuredSummary: doc.aiStructuredSummary,
      aiSummaryStatus: doc.aiSummaryStatus,
      aiSummaryGeneratedAt: doc.aiSummaryGeneratedAt,
      aiSummaryError: doc.aiSummaryError,
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
