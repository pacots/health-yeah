/**
 * Text extraction service for medical documents.
 * Abstracts multiple extraction strategies (PDF text, OCR, manual).
 */

export type ExtractionMethod = "pdf_text" | "ocr" | "manual" | "api";

export interface ExtractionResult {
  text: string;
  method: ExtractionMethod;
  confidenceScore?: number;
  charCount: number;
  error?: string;
}

/**
 * Extract text from a PDF by reading text layer.
 * Currently a stub - would use pdf.js in production.
 */
async function extractFromPdfText(fileBuffer: ArrayBuffer): Promise<ExtractionResult> {
  // TODO: Integrate pdf.js or similar for client-side PDF text extraction
  // For now, return a placeholder
  return {
    text: "[PDF text extraction not yet implemented - use OCR or manual extraction]",
    method: "pdf_text",
    confidenceScore: 0,
    charCount: 0,
    error: "PDF text extraction requires pdf.js integration",
  };
}

/**
 * Placeholder for OCR extraction (would use Tesseract.js or API).
 */
async function extractFromOcr(fileBuffer: ArrayBuffer): Promise<ExtractionResult> {
  // TODO: Integrate Tesseract.js or call external OCR API
  return {
    text: "[OCR extraction not yet implemented]",
    method: "ocr",
    confidenceScore: 0,
    charCount: 0,
    error: "OCR requires Tesseract.js or external service",
  };
}

/**
 * Extract text from a file by attempting to read as plain text.
 * Works for .txt files; fallback for others.
 */
async function extractFromPlainText(fileBuffer: ArrayBuffer): Promise<ExtractionResult> {
  try {
    const decoder = new TextDecoder();
    const text = decoder.decode(fileBuffer);
    
    // Check if result is valid UTF-8
    if (!text || text.length === 0) {
      return {
        text: "",
        method: "manual",
        charCount: 0,
        error: "File could not be decoded as text",
      };
    }
    
    return {
      text,
      method: "manual",
      charCount: text.length,
    };
  } catch (err) {
    return {
      text: "",
      method: "manual",
      charCount: 0,
      error: `Failed to decode file: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Main extraction function - routes to appropriate extraction method.
 * @param file - File object from upload
 * @param preferredMethod - Extraction method to attempt first
 */
export async function extractMedicalDocumentText(
  file: File,
  preferredMethod: ExtractionMethod = "pdf_text"
): Promise<ExtractionResult> {
  try {
    const buffer = await file.arrayBuffer();
    
    // Route based on MIME type and preferred method
    if (file.type === "application/pdf") {
      if (preferredMethod === "ocr") {
        return await extractFromOcr(buffer);
      }
      // Default to text extraction for PDFs
      return await extractFromPdfText(buffer);
    } else if (file.type.startsWith("image/")) {
      // Images require OCR
      return await extractFromOcr(buffer);
    } else if (
      file.type === "text/plain" ||
      file.type === "text/html" ||
      file.type === ""
    ) {
      // Plain text files
      return await extractFromPlainText(buffer);
    } else {
      // Try as plain text as fallback
      const result = await extractFromPlainText(buffer);
      if (!result.error || result.charCount > 0) {
        return result;
      }
      return {
        text: "",
        method: "manual",
        charCount: 0,
        error: `Unsupported file type: ${file.type}. Supported: PDF, images (with OCR), plain text.`,
      };
    }
  } catch (err) {
    return {
      text: "",
      method: "manual",
      charCount: 0,
      error: `Extraction failed: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Validate that extracted text is sufficient for parsing.
 */
export function isExtractionValid(result: ExtractionResult): boolean {
  return !result.error && result.charCount > 50; // Minimum 50 chars for meaningful parsing
}
