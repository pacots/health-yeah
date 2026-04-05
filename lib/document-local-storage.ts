import localforage from "localforage";
import { Document } from "./types";

// Use the same localforage instance as wallet storage
// Store documents in a separate key but same database
const DOCUMENTS_KEY = "documents";

/**
 * Local-first document storage using IndexedDB (via localforage)
 * All documents are persisted to the browser's local storage, not server filesystem
 */
export const documentStorage = {
  /**
   * Get all documents from local storage
   */
  async getAllDocuments(): Promise<Document[]> {
    try {
      const docs = await localforage.getItem<Document[]>(DOCUMENTS_KEY);
      return docs || [];
    } catch (error) {
      console.error("Failed to retrieve documents from local storage:", error);
      return [];
    }
  },

  /**
   * Get a single document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    try {
      const docs = await this.getAllDocuments();
      return docs.find((d) => d.id === id) || null;
    } catch (error) {
      console.error("Failed to retrieve document:", error);
      return null;
    }
  },

  /**
   * Save all documents to local storage
   */
  async saveDocuments(documents: Document[]): Promise<void> {
    try {
      await localforage.setItem(DOCUMENTS_KEY, documents);
    } catch (error) {
      console.error("Failed to save documents to local storage:", error);
      throw error;
    }
  },

  /**
   * Create a new document
   * Handles both text and file documents (files stored as base64 or blob)
   */
  async createDocument(params: {
    id: string;
    title: string;
    kind: "text" | "file";
    textContent?: string;
    fileName?: string;
    mimeType?: string;
    fileBuffer?: Buffer | Uint8Array | Blob;
    description?: string;
    category?: string;
  }): Promise<Document> {
    const {
      id,
      title,
      kind,
      textContent,
      fileName,
      mimeType,
      fileBuffer,
      description,
      category,
    } = params;

    // Validation: title required
    if (!title || !title.trim()) {
      throw new Error("Title is required");
    }

    // Validation: XOR - must have exactly one of textContent or file
    const hasText = kind === "text" && !!textContent && textContent.trim().length > 0;
    const hasFile = kind === "file" && !!fileName && !!mimeType && !!fileBuffer;

    if (!hasText && !hasFile) {
      throw new Error("Document must have either text content or a file");
    }

    if (hasText && hasFile) {
      throw new Error("Document cannot have both text and file content");
    }

    const now = new Date().toISOString();

    let doc: Document;

    if (hasText) {
      // Text document - store directly
      doc = {
        id,
        title: title.trim(),
        kind: "text",
        textContent: textContent!.trim(),
        description,
        category: category as any,
        createdAt: now,
        updatedAt: now,
        aiSummaryStatus: "processing",
      };
    } else {
      // File document - encode file content for storage
      // Convert Buffer/Uint8Array to base64 string for JSON serialization
      let fileContent: string;

      if (fileBuffer instanceof Blob) {
        // Convert Blob to base64
        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileBuffer);
        });
      } else if (Buffer.isBuffer(fileBuffer) || fileBuffer instanceof Uint8Array) {
        // Convert Buffer/Uint8Array to base64
        const buffer = Buffer.isBuffer(fileBuffer)
          ? fileBuffer
          : Buffer.from(fileBuffer);
        fileContent = buffer.toString("base64");
      } else {
        throw new Error("Invalid file content");
      }

      // Get file extension
      const extension = getFileExtension(mimeType || "");

      const fileSize = fileBuffer instanceof Blob
        ? fileBuffer.size
        : Buffer.isBuffer(fileBuffer)
          ? fileBuffer.length
          : fileBuffer.byteLength;

      doc = {
        id,
        title: title.trim(),
        kind: "file",
        fileName,
        mimeType,
        extension,
        fileSizeBytes: fileSize,
        // Store file content as base64/data URL in document
        fileContent,
        description,
        category: category as any,
        createdAt: now,
        updatedAt: now,
        aiSummaryStatus: "processing",
      };
    }

    // Save to local storage
    const docs = await this.getAllDocuments();
    docs.push(doc);
    await this.saveDocuments(docs);

    return doc;
  },

  /**
   * Update document with AI summary results
   */
  async updateDocumentWithAISummary(
    id: string,
    summary: string | null,
    status: "ready" | "error",
    error?: string
  ): Promise<Document | null> {
    try {
      const docs = await this.getAllDocuments();
      const docIndex = docs.findIndex((d) => d.id === id);

      if (docIndex === -1) {
        return null;
      }

      const updatedDoc: Document = {
        ...docs[docIndex],
        aiStructuredSummary: summary || undefined,
        aiSummaryStatus: status,
        aiSummaryGeneratedAt: new Date().toISOString(),
        aiSummaryError: error,
        updatedAt: new Date().toISOString(),
      };

      docs[docIndex] = updatedDoc;
      await this.saveDocuments(docs);

      return updatedDoc;
    } catch (error) {
      console.error("Failed to update document with AI summary:", error);
      throw error;
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const docs = await this.getAllDocuments();
      const filtered = docs.filter((d) => d.id !== id);
      await this.saveDocuments(filtered);
    } catch (error) {
      console.error("Failed to delete document:", error);
      throw error;
    }
  },

  /**
   * Clear all documents (for testing/reset)
   */
  async clearAllDocuments(): Promise<void> {
    try {
      await localforage.removeItem(DOCUMENTS_KEY);
    } catch (error) {
      console.error("Failed to clear documents:", error);
      throw error;
    }
  },
};

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const mimeMap: { [key: string]: string } = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
  };
  return mimeMap[mimeType] || ".bin";
}
