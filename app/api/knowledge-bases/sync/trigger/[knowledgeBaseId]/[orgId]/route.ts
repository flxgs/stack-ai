import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const BASE_URL = "https://api.stack-ai.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ knowledgeBaseId: string; orgId: string }> }
) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const { knowledgeBaseId, orgId } = await params;

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

    return NextResponse.json({
      success: true,
      data: responseText,
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
