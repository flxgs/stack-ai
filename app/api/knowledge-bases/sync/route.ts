import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const BASE_URL = "https://api.stack-ai.com";

export async function GET(
  request: NextRequest,
  { params }: { params: { knowledgeBaseId: string; orgId: string } }
) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const { knowledgeBaseId, orgId } = params;

    console.log("[Sync Route] Request params:", { knowledgeBaseId, orgId });

    // Using exact URL structure from notebook
    const stackAiUrl = `${BASE_URL}/knowledge_bases/sync/trigger/${knowledgeBaseId}/${orgId}`;

    console.log("[Sync Route] Stack AI URL:", stackAiUrl);

    const response = await fetch(stackAiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader || "",
      },
    });

    const responseText = await response.text();
    console.log("[Sync Route] Stack AI Response:", {
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

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("[Sync Route] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync knowledge base",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const body = await request.json();
    const { knowledge_base_id, resource_ids } = body;

    console.log("Syncing KB with resources:", {
      knowledge_base_id,
      resource_ids,
      url: `${BASE_URL}/knowledge_bases/sync/trigger/${knowledge_base_id}`,
    });

    const response = await fetch(
      `${BASE_URL}/knowledge_bases/sync/trigger/${knowledge_base_id}`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resource_ids,
        }),
      }
    );

    const responseText = await response.text();
    console.log("Sync response:", response.status, responseText);

    return new Response(responseText, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in sync route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync knowledge base",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Changed to POST
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const body = await request.json();
    const { knowledgeBaseId, orgId, resourceIds } = body;

    console.log("[Sync Route] Request data:", {
      knowledgeBaseId,
      orgId,
      resourceIds,
    });

    if (!knowledgeBaseId || !orgId || !resourceIds) {
      return NextResponse.json(
        { error: "knowledgeBaseId, orgId, and resourceIds are required" },
        { status: 400 }
      );
    }

    // Using the notebook's endpoint structure
    const stackAiUrl = `${BASE_URL}/knowledge_bases/${knowledgeBaseId}/sync`;

    console.log("[Sync Route] Stack AI URL:", stackAiUrl);

    const response = await fetch(stackAiUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        org_id: orgId,
        resource_ids: resourceIds,
      }),
    });

    const responseText = await response.text();
    console.log("[Sync Route] Stack AI Response:", {
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

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("[Sync Route] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to sync knowledge base",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
