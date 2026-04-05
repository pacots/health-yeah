import { NextRequest, NextResponse } from "next/server";
import { Document } from "@/lib/types";

/**
 * GET /api/documents
 * Returns empty list - documents are stored client-side in wallet
 */
export async function GET() {
  try {
    // Documents are loaded from wallet, not from server
    // This endpoint is kept for consistency but returns empty
    return NextResponse.json([]);
  } catch (error) {
    console.error("Failed to get documents:", error);
    return NextResponse.json({ error: "Failed to get documents" }, { status: 500 });
  }
}

/**
 * POST /api/documents
 * Create a document (text or file)
 *
 * For text documents, send JSON:
 * { "title": "...", "textContent": "...", "description": "...", "category": "..." }
 *
 * For file documents, send multipart/form-data:
 * - file: <binary>
 * - title: "..."
 *
 * Response: Document object with file content encoded as base64
 *
 * Process:
 * 1. API processes and converts file to base64
 * 2. Returns document object
 * 3. Client context persists entire document to wallet
 * 4. AI processing triggered asynchronously (non-blocking)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const id = Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();

    let document: Document;

    if (contentType.includes("application/json")) {
      // Text document via JSON
      const body = await request.json();
      const { title, textContent, description, category } = body;

      if (!title?.trim()) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 }
        );
      }

      if (!textContent?.trim()) {
        return NextResponse.json(
          { error: "Text content is required" },
          { status: 400 }
        );
      }

      document = {
        id,
        title: title.trim(),
        kind: "text",
        textContent: textContent.trim(),
        description,
        category: category as any,
        createdAt: now,
        updatedAt: now,
        aiSummaryStatus: "processing",
      };
    } else if (contentType.includes("multipart/form-data")) {
      // File document via multipart
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const title = (formData.get("title") as string)?.trim();

      if (!title) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 }
        );
      }

      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: "File is required" },
          { status: 400 }
        );
      }

      // Convert file to base64 for client-side storage
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileContent = buffer.toString("base64");

      // Extract file extension
      const mimeType = file.type;
      const extensions: { [key: string]: string } = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/heic": ".heic",
      };
      const extension = extensions[mimeType] || ".bin";

      document = {
        id,
        title,
        kind: "file",
        fileName: file.name,
        mimeType,
        extension,
        fileSizeBytes: buffer.length,
        fileContent, // Base64-encoded file content
        createdAt: now,
        updatedAt: now,
        aiSummaryStatus: "processing",
      };
    } else {
      return NextResponse.json(
        { error: "Content-Type must be application/json or multipart/form-data" },
        { status: 400 }
      );
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create document" },
      { status: 500 }
    );
  }
}

