import { Document } from "./types";
import { generateDocumentSummary, generateImageSummary } from "./openai";
import { documentStorage } from "./document-local-storage";
// @ts-ignore - pdf-parse doesn't have TypeScript definitions
import pdfParse from "pdf-parse";

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("Failed to extract text from PDF:", error);
    return "[PDF extraction failed]";
  }
}

/**
 * Trigger AI processing for a document
 * This is called asynchronously after document creation
 *
 * Reads document content from local storage (IndexedDB)
 * Processes with OpenAI
 * Writes result back to local storage
 */
export async function triggerAIProcessing(document: Document): Promise<void> {
  try {
    let contentToProcess = "";

    // Extract content based on document type
    if (document.kind === "text") {
      contentToProcess = document.textContent || "";
    } else if (document.kind === "file" && document.fileContent) {
      // fileContent is base64-encoded or data URL
      let buffer: Buffer;

      if (document.fileContent.startsWith("data:")) {
        // data URL format - extract base64 part
        const base64Data = document.fileContent.split(",")[1];
        buffer = Buffer.from(base64Data, "base64");
      } else {
        // plain base64
        buffer = Buffer.from(document.fileContent, "base64");
      }

      if (document.mimeType === "application/pdf") {
        // Extract text from PDF
        contentToProcess = await extractTextFromPDF(buffer);
      } else if (document.mimeType?.startsWith("image/")) {
        // Handle images with vision API
        // For images, send base64 directly
        const base64Image = document.fileContent.includes(",")
          ? document.fileContent.split(",")[1]
          : document.fileContent;

        const summary = await generateImageSummary(base64Image, document.title);

        if (summary) {
          await documentStorage.updateDocumentWithAISummary(
            document.id,
            summary,
            "ready"
          );
        } else {
          await documentStorage.updateDocumentWithAISummary(
            document.id,
            null,
            "error",
            "Failed to generate image summary"
          );
        }
        return;
      }
    }

    // Generate summary from text content
    if (contentToProcess) {
      const summary = await generateDocumentSummary(
        contentToProcess,
        document.title,
        document.mimeType
      );

      if (summary) {
        await documentStorage.updateDocumentWithAISummary(
          document.id,
          summary,
          "ready"
        );
      } else {
        await documentStorage.updateDocumentWithAISummary(
          document.id,
          null,
          "error",
          "Failed to generate summary"
        );
      }
    } else {
      await documentStorage.updateDocumentWithAISummary(
        document.id,
        null,
        "error",
        "No content to summarize"
      );
    }
  } catch (error) {
    console.error("Error processing document for AI summary:", error);
    await documentStorage.updateDocumentWithAISummary(
      document.id,
      null,
      "error",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

