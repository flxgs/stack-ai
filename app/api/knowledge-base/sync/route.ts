import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const BASE_URL = "https://api.stack-ai.com";

/**
 * POST handler for knowledge base synchronization
 * Triggers the indexing process for a knowledge base
 *
 * Required Query Parameters:
 * - knowledgeBaseId: ID of the knowledge base to sync
 * - orgId: Organization ID
 *
 * @param request - Contains IDs needed for sync in query parameters
 * @returns Success status or error message
 */
export async function POST(request: NextRequest) {
  try {
    // Get headers asynchronously
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");
    const orgId = searchParams.get("orgId");

    // Validate required parameters
    if (!knowledgeBaseId || !orgId) {
      return NextResponse.json(
        { error: "knowledgeBaseId and orgId are required query parameters" },
        { status: 400 }
      );
    }

    // Make sync request to Stack AI API
    const response = await fetch(
      `${BASE_URL}/knowledge_bases/sync/trigger/${knowledgeBaseId}/${orgId}`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader || "",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // Attempt to get detailed error information
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error: "Failed to sync knowledge base",
          details: errorData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Knowledge base sync triggered successfully",
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error in knowledge base sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
