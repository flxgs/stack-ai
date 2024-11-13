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

    if (!knowledgeBaseId || !orgId) {
      return NextResponse.json(
        { error: "knowledgeBaseId and orgId are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BASE_URL}/knowledge_bases/sync/trigger/${knowledgeBaseId}/${orgId}`,
      {
        headers: {
          Authorization: authHeader || "",
          "Content-Type": "application/json",
        },
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
      { error: "Failed to sync knowledge base" },
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
