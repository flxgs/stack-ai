// src/app/api/knowledge-base/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const BASE_URL = "https://api.stack-ai.com";

/**
 * POST handler for knowledge base creation
 * Creates a new knowledge base from selected files and folders
 *
 * Request Body:
 * - connection_id: ID of the Google Drive connection
 * - connection_source_ids: Array of file/folder IDs to include
 * - indexing_params: Configuration for text extraction and embedding
 *
 * @param request - Contains knowledge base configuration in body
 * @returns Created knowledge base details
 */
export async function POST(request: NextRequest) {
  try {
    // Get headers asynchronously
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    // Parse the request body
    const body = await request.json();

    // Validate required fields
    if (!body.connection_id || !body.connection_source_ids) {
      return NextResponse.json(
        { error: "connection_id and connection_source_ids are required" },
        { status: 400 }
      );
    }

    // Make request to Stack AI API
    const response = await fetch(`${BASE_URL}/knowledge_bases`, {
      method: "POST",
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error: "Failed to create knowledge base",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in knowledge-base creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
