import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/documents/:id
 * Note: Documents are stored in wallet, not on server
 * This endpoint is kept for consistency but just returns empty response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Documents are managed client-side in wallet
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to get document:", error);
    return NextResponse.json({ error: "Failed to get document" }, { status: 500 });
  }
}

/**
 * DELETE /api/documents/:id
 * Note: Document deletion happens client-side in wallet
 * This is a no-op endpoint for compatibility
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Deletion handled client-side by context
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete document" },
      { status: 500 }
    );
  }
}
