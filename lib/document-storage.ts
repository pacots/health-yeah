import fs from "fs";
import path from "path";
import { Document } from "./types";

const DOCUMENTS_DIR = path.join(process.cwd(), "data", "documents");
const FILES_DIR = path.join(DOCUMENTS_DIR, "files");
const INDEX_FILE = path.join(DOCUMENTS_DIR, "index.json");

// Allowed MIME types and extensions for hackathon demo
const ALLOWED_TYPES = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Initialize directories if they don't exist
 */
export function ensureDocumentsDir(): void {
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }
}

/**
 * Initialize index.json if it doesn't exist
 */
export function ensureIndexFile(): void {
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify([], null, 2));
  }
}

/**
 * Get current timestamp as ISO 8601 string
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Read all documents from index.json
 */
export function getAllDocuments(): Document[] {
  ensureIndexFile();
  try {
    const data = fs.readFileSync(INDEX_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read documents index:", error);
    return [];
  }
}

/**
 * Get a single document by ID
 */
export function getDocumentById(id: string): Document | null {
  const docs = getAllDocuments();
  return docs.find((d) => d.id === id) || null;
}

/**
 * Save updated documents array to index.json
 */
export function updateDocumentsIndex(documents: Document[]): void {
  ensureDocumentsDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(documents, null, 2));
}

/**
 * Sanitize filename to prevent directory traversal attacks
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .substring(0, 200);
}

/**
 * Generate a safe filename for storage
 */
function generateStorageFilename(docId: string, originalFilename: string, extension: string): string {
  const sanitized = sanitizeFilename(originalFilename.replace(extension, ""));
  return `${docId}_${sanitized}${extension}`;
}

/**
 * Validate file type and size
 */
export function validateFile(buffer: Buffer, mimeType: string, filename: string): {
  valid: boolean;
  error?: string;
  extension?: string;
} {
  if (!ALLOWED_TYPES[mimeType as keyof typeof ALLOWED_TYPES]) {
    return {
      valid: false,
      error: `File type not supported. Allowed: PDF, JPEG, PNG, WEBP`,
    };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  const extension = ALLOWED_TYPES[mimeType as keyof typeof ALLOWED_TYPES];
  return { valid: true, extension };
}

/**
 * Create a document with unified validation
 *
 * Rules:
 * - title is required
 * - Either textContent OR file must be provided (XOR validation)
 * - Both cannot be provided together
 * - Timestamps are generated automatically
 * - llmSummary is initialized as null
 */
export function createDocument(params: {
  id: string;
  title: string;
  textContent?: string;
  fileName?: string;
  mimeType?: string;
  fileBuffer?: Buffer;
  category?: string;
  description?: string;
}): Document {
  const { id, title, textContent, fileName, mimeType, fileBuffer, category, description } = params;

  // Validation: title required
  if (!title || !title.trim()) {
    throw new Error("Title is required");
  }

  // Validation: XOR - must have exactly one of textContent or file
  const hasText = !!textContent && textContent.trim().length > 0;
  const hasFile = !!fileName && !!mimeType && !!fileBuffer;

  if (!hasText && !hasFile) {
    throw new Error("Must provide either text content or a file");
  }

  if (hasText && hasFile) {
    throw new Error("Cannot provide both text and file - choose one");
  }

  const now = getCurrentTimestamp();
  let doc: Document;

  if (hasText) {
    // Text document
    doc = {
      id,
      title: title.trim(),
      kind: "text",
      textContent: textContent!.trim(),
      description,
      category: category as any,
      createdAt: now,
      updatedAt: now,
      llmSummary: null,
      aiSummaryStatus: "processing",
    };
  } else {
    // File document
    if (!mimeType || !fileBuffer || !fileName) {
      throw new Error("Invalid file parameters");
    }

    const validation = validateFile(fileBuffer, mimeType, fileName);
    if (!validation.valid) {
      throw new Error(validation.error || "File validation failed");
    }

    ensureDocumentsDir();

    const extension = validation.extension!;
    const storageFilename = generateStorageFilename(id, fileName, extension);
    const storageFilePath = path.join(FILES_DIR, storageFilename);

    fs.writeFileSync(storageFilePath, fileBuffer);

    doc = {
      id,
      title: title.trim(),
      kind: "file",
      fileName,
      mimeType,
      extension,
      fileSizeBytes: fileBuffer.length,
      localPath: `files/${storageFilename}`,
      description,
      category: category as any,
      createdAt: now,
      updatedAt: now,
      llmSummary: null,
      aiSummaryStatus: "processing",
    };
  }

  // Save to index
  const docs = getAllDocuments();
  docs.push(doc);
  updateDocumentsIndex(docs);

  return doc;
}

/**
 * Update a document with AI summary results
 */
export function updateDocumentWithAISummary(
  id: string,
  summary: string | null,
  status: "ready" | "error",
  error?: string
): Document | null {
  const docs = getAllDocuments();
  const doc = docs.find((d) => d.id === id);

  if (!doc) {
    return null;
  }

  const updatedDoc: Document = {
    ...doc,
    aiStructuredSummary: summary || undefined,
    aiSummaryStatus: status,
    aiSummaryGeneratedAt: new Date().toISOString(),
    aiSummaryError: error,
    updatedAt: new Date().toISOString(),
  };

  const updatedDocs = docs.map((d) => (d.id === id ? updatedDoc : d));
  updateDocumentsIndex(updatedDocs);

  return updatedDoc;
}

/**
 * Delete a document and its associated file if applicable
 */
export function deleteDocument(id: string): void {
  const docs = getAllDocuments();
  const doc = docs.find((d) => d.id === id);

  if (!doc) {
    throw new Error("Document not found");
  }

  if (doc.kind === "file" && doc.localPath) {
    const filePath = path.join(DOCUMENTS_DIR, doc.localPath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error);
      }
    }
  }

  const updatedDocs = docs.filter((d) => d.id !== id);
  updateDocumentsIndex(updatedDocs);
}

/**
 * Get file path for a document
 */
export function getFilePath(id: string): string | null {
  const doc = getDocumentById(id);
  if (!doc || doc.kind !== "file" || !doc.localPath) {
    return null;
  }
  return path.join(DOCUMENTS_DIR, doc.localPath);
}

/**
 * Read file content for streaming/download
 */
export function readFile(id: string): Buffer | null {
  const filePath = getFilePath(id);
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath);
}

// Initialize on module load
ensureDocumentsDir();
ensureIndexFile();

