import { NextRequest, NextResponse } from "next/server";
import { getAllDocuments, createDocument } from "@/lib/document-storage";

/**
 * GET /api/documents
 * List all documents
 */
export async function GET() {
  try {
    const documents = getAllDocuments();
    return NextResponse.json(documents);
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
 * - description: "..." (optional)
 * - category: "..." (optional)
 *
 * Rules:
 * - title is required
 * - Either textContent OR file must be provided (XOR)
 * - Not both
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let id = Math.random().toString(36).substring(2, 11);
    let title: string;
    let textContent: string | undefined;
    let fileName: string | undefined;
    let mimeType: string | undefined;
    let fileBuffer: Buffer | undefined;
    let description: string | undefined;
    let category: string | undefined;

    if (contentType.includes("application/json")) {
      // Text document via JSON
      const body = await request.json();
      title = body.title;
      textContent = body.textContent;
      description = body.description;
      category = body.category;
    } else if (contentType.includes("multipart/form-data")) {
      // File document via multipart
      const formData = await request.formData();
      const file = formData.get("file") as File;
      title = (formData.get("title") as string) || "";
      description = (formData.get("description") as string) || undefined;
      category = (formData.get("category") as string) || undefined;

      if (file && file.size > 0) {
        fileName = file.name;
        mimeType = file.type;
        fileBuffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      return NextResponse.json(
        { error: "Content-Type must be application/json or multipart/form-data" },
        { status: 400 }
      );
    }

    // Create document with unified validation
    const doc = createDocument({
      id,
      title,
      textContent,
      fileName,
      mimeType,
      fileBuffer,
      description,
      category,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create document" },
      { status: 500 }
    );
  }
}
