import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const BASE_URL = "https://api.stack-ai.com";

/**
 * Interface for Knowledge Base resource operations
 */
interface KnowledgeBaseResource {
  resource_id: string;
  inode_type: "file" | "directory";
  inode_path: {
    path: string;
  };
  status?: "pending" | "indexed" | "failed";
}

/**
 * GET handler for knowledge base details and resources
 * Retrieves information about a specific knowledge base and its contents
 *
 * @param request - The request object
 * @param params - Contains the knowledge base ID
 * @returns Knowledge base details and resources
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const { searchParams } = new URL(request.url);

    // Get resource path from query params (for listing specific folders)
    const resourcePath = searchParams.get("resourcePath") || "/";

    const url = `${BASE_URL}/knowledge_bases/${
      params.id
    }/resources/children?resource_path=${encodeURIComponent(resourcePath)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch knowledge base resources" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching knowledge base resources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing resources from knowledge base
 * Note: This doesn't delete the file from Google Drive
 *
 * @param request - The request object
 * @param params - Contains the knowledge base ID
 * @returns Success status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const { searchParams } = new URL(request.url);
    const resourcePath = searchParams.get("resourcePath");

    // Validate required parameters
    if (!resourcePath) {
      return NextResponse.json(
        { error: "Resource path is required" },
        { status: 400 }
      );
    }

    const url = `${BASE_URL}/knowledge_bases/${
      params.id
    }/resources?resource_path=${encodeURIComponent(resourcePath)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        {
          error: "Failed to delete resource from knowledge base",
          details: errorData,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${resourcePath} from knowledge base`,
    });
  } catch (error) {
    console.error("Error deleting resource from knowledge base:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating knowledge base resources
 * Can be used to update indexing parameters or other settings
 *
 * @param request - The request object
 * @param params - Contains the knowledge base ID
 * @returns Updated knowledge base details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const body = await request.json();

    const url = `${BASE_URL}/knowledge_bases/${params.id}`;

    const response = await fetch(url, {
      method: "PATCH",
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
          error: "Failed to update knowledge base",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data,
      message: "Knowledge base updated successfully",
    });
  } catch (error) {
    console.error("Error updating knowledge base:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
