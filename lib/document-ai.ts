import { Document } from "./types";
import { generateDocumentSummary, generateImageSummary } from "./openai";
import { updateDocumentWithAISummary, readFile } from "./document-storage";
import fs from "fs";
import path from "path";
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
 * Convert image file to base64
 */
function fileToBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

/**
 * Trigger AI processing for a document
 * This is called asynchronously after document creation
 */
export async function triggerAIProcessing(document: Document): Promise<void> {
  try {
    let contentToProcess = "";

    // Extract content based on document type
    if (document.kind === "text") {
      contentToProcess = document.textContent || "";
    } else if (document.kind === "file" && document.localPath) {
      // Read file from disk
      const fileBuffer = readFile(document.id);
      if (!fileBuffer) {
        throw new Error("File not found or unable to read");
      }

      if (document.mimeType === "application/pdf") {
        // Extract text from PDF
        contentToProcess = await extractTextFromPDF(fileBuffer);
      } else if (
        document.mimeType?.startsWith("image/")
      ) {
        // Handle images with vision API
        const base64Image = fileToBase64(fileBuffer);
        const summary = await generateImageSummary(base64Image, document.title);

        if (summary) {
          updateDocumentWithAISummary(document.id, summary, "ready");
        } else {
          updateDocumentWithAISummary(
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
        updateDocumentWithAISummary(document.id, summary, "ready");
      } else {
        updateDocumentWithAISummary(
          document.id,
          null,
          "error",
          "Failed to generate summary"
        );
      }
    } else {
      updateDocumentWithAISummary(
        document.id,
        null,
        "error",
        "No content to summarize"
      );
    }
  } catch (error) {
    console.error("Error processing document for AI summary:", error);
    updateDocumentWithAISummary(
      document.id,
      null,
      "error",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
