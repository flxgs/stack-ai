import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const BASE_URL = "https://api.stack-ai.com";

/**
 * GET handler for file operations
 * Lists files and folders from Stack AI's Google Drive integration
 *
 * Required Query Parameters:
 * - connectionId: ID of the Google Drive connection
 * - resourceId: (optional) ID of the folder to list contents from
 *
 * @param request - Contains query parameters for filtering and navigation
 * @returns List of files and folders with their metadata
 */
export async function GET(request: NextRequest) {
  try {
    // Get headers asynchronously
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");
    const resourceId = searchParams.get("resourceId");

    if (!connectionId) {
      return NextResponse.json(
        { error: "Connection ID is required" },
        { status: 400 }
      );
    }

    const queryString = resourceId ? `?resource_id=${resourceId}` : "";
    const url = `${BASE_URL}/connections/${connectionId}/resources/children${queryString}`;

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in files route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
