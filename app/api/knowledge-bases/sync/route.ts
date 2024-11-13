import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const BASE_URL = "https://api.stack-ai.com";

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");
    const orgId = searchParams.get("orgId");

    console.log("Received sync request:", {
      knowledgeBaseId,
      orgId,
      hasAuth: !!authHeader,
    });

    if (!knowledgeBaseId || !orgId) {
      return NextResponse.json(
        { error: "knowledgeBaseId and orgId are required" },
        { status: 400 }
      );
    }

    // Construct the Stack AI URL
    const stackAiUrl = `${BASE_URL}/knowledge_bases/sync/trigger/${knowledgeBaseId}/${orgId}`;

    console.log("Making request to Stack AI:", {
      url: stackAiUrl,
      method: "GET",
      headers: {
        Authorization: authHeader ? "Bearer [redacted]" : "missing",
        "Content-Type": "application/json",
      },
    });

    const response = await fetch(stackAiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    console.log("Stack AI Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      body: responseText,
    });

    // Try to parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Stack AI response:", e);
      return NextResponse.json(
        {
          error: "Invalid response from Stack AI",
          details: responseText,
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("Stack AI error response:", data);
      return NextResponse.json(
        {
          error: data.message || "Failed to sync knowledge base",
          details: data,
        },
        { status: response.status }
      );
    }

    const result = {
      success: true,
      upsert_group_task_id: data.upsert_group_task_id,
      ...data,
    };

    console.log("Sending successful response:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected error in sync route:", error);
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
