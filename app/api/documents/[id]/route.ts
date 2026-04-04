import { NextRequest, NextResponse } from "next/server";
import { getDocumentById, deleteDocument } from "@/lib/document-storage";

/**
 * GET /api/documents/:id
 * Get a single document metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = getDocumentById(id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Failed to get document:", error);
    return NextResponse.json({ error: "Failed to get document" }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/:id
 * Delete a document and its file if applicable
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete document" },
      { status: 500 }
    );
  }
}
