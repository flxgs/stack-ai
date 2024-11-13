// src/app/api/knowledge-base/sync/route.ts
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

    console.log(
      "Syncing KB:",
      `${BASE_URL}/knowledge_bases/sync/trigger/${knowledgeBaseId}/${orgId}`
    );

    const response = await fetch(
      `${BASE_URL}/knowledge_bases/sync/trigger/${knowledgeBaseId}/${orgId}`,
      {
        headers: {
          Authorization: authHeader || "",
          "Content-Type": "application/json",
        },
      }
    );

    // Get response as text first
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
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
