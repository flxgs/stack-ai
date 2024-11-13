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
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const body = await request.json();
    const {
      connection_id,
      connection_source_ids,
      indexing_params = {
        ocr: false,
        unstructured: true,
        embedding_params: {
          embedding_model: "text-embedding-ada-002",
          api_key: null,
        },
        chunker_params: {
          chunk_size: 1500,
          chunk_overlap: 500,
          chunker: "sentence",
        },
      },
    } = body;

    console.log("[KB Create Route] Request:", {
      connection_id,
      connection_source_ids,
      indexing_params,
    });

    const stackAiUrl = `${BASE_URL}/knowledge_bases`;

    const response = await fetch(stackAiUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        connection_id,
        connection_source_ids,
        indexing_params,
        org_level_role: null,
        cron_job_id: null,
      }),
    });

    const responseText = await response.text();
    console.log("[KB Create Route] Stack AI Response:", {
      status: response.status,
      body: responseText,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Stack AI returned an error",
          details: responseText,
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json(
        {
          error: "Invalid JSON response from Stack AI",
          raw_response: responseText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[KB Create Route] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to create knowledge base",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler to list all knowledge bases
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(`${BASE_URL}/knowledge_bases`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error: "Failed to fetch knowledge bases",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in knowledge base route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
