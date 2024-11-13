// src/lib/api-client.ts
import {
  FileNode,
  KnowledgeBase,
  KnowledgeBaseList,
  KnowledgeBaseResponse,
  SyncResponse,
} from "@/types/api";

export interface ApiClient {
  login(email: string, password: string): Promise<void>;
  listFiles(parentId?: string): Promise<FileNode[]>;
  listKnowledgeBases(): Promise<KnowledgeBaseResponse>;
  createKnowledgeBase(fileIds: string[]): Promise<KnowledgeBase>; // Keep original signature
  syncKnowledgeBase(kbId: string, resourceIds: string[]): Promise<SyncResponse>;
  getKnowledgeBaseResources(
    knowledgeBaseId: string,
    resourcePath?: string
  ): Promise<FileNode[]>;
  updateKnowledgeBase(
    knowledgeBaseId: string,
    fileIds: string[]
  ): Promise<KnowledgeBase>;
}

export const createApiClient = (): ApiClient => {
  let accessToken: string | null = null;
  let connectionId: string | null = null;
  let orgId: string | null = null;

  const fetchWithAuth = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!accessToken) throw new Error("Not authenticated");

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If error response is not JSON, use default message
      }
      throw new Error(errorMessage);
    }

    return response;
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Authentication failed");

    const data = await response.json();
    accessToken = data.access_token;

    // Fetch org and connection IDs after authentication
    await fetchOrgId();
    await fetchConnectionId();
  };

  const fetchOrgId = async (): Promise<void> => {
    const response = await fetchWithAuth("/organizations/me/current");
    const data = await response.json();
    orgId = data.org_id;
  };

  const fetchConnectionId = async (): Promise<void> => {
    const response = await fetchWithAuth(
      "/connections?connection_provider=gdrive&limit=1"
    );
    const connections = await response.json();

    if (!connections || connections.length === 0) {
      throw new Error("No Google Drive connection found");
    }

    connectionId = connections[0].connection_id;
  };

  const listFiles = async (parentId?: string): Promise<FileNode[]> => {
    if (!connectionId) throw new Error("No connection ID available");

    const queryParams = new URLSearchParams({
      connectionId,
      ...(parentId && { resourceId: parentId }),
    });

    const response = await fetchWithAuth(`/files?${queryParams}`);
    return response.json();
  };

  const createKnowledgeBase = async (
    fileIds: string[]
  ): Promise<KnowledgeBase> => {
    try {
      if (!connectionId) {
        throw new Error("No connection ID available");
      }

      const response = await fetchWithAuth(`/knowledge-bases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connection_id: connectionId,
          connection_source_ids: fileIds,
          indexing_params: {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to create knowledge base"
        );
      }

      return data;
    } catch (error) {
      throw new Error(
        `Failed to create knowledge base: ${(error as Error).message}`
      );
    }
  };

  const syncKnowledgeBase = async (
    knowledgeBaseId: string,
    resourceIds: string[]
  ): Promise<SyncResponse> => {
    try {
      console.log("[Client] Starting sync:", {
        knowledgeBaseId,
        resourceIds,
      });

      if (!orgId) {
        const orgResponse = await fetchWithAuth("/organizations/me/current");
        const data = await orgResponse.json();
        orgId = data.org_id;
      }

      // Trigger the sync
      const response = await fetchWithAuth(
        `/knowledge-bases/sync/trigger/${knowledgeBaseId}/${orgId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || responseData.message || "Internal Server Error"
        );
      }

      // Parse the data string if it's a string
      let parsedData;
      if (typeof responseData.data === "string") {
        try {
          parsedData = JSON.parse(responseData.data);
        } catch (e) {
          console.warn(
            "Could not parse sync response data:",
            responseData.data
          );
          parsedData = responseData.data;
        }
      } else {
        parsedData = responseData.data;
      }

      return {
        success: true,
        upsert_group_task_id: parsedData?.upsert_group_task_id,
      };
    } catch (error) {
      console.error("[Client] Sync error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  const updateKnowledgeBase = async (
    knowledgeBaseId: string,
    resourceIds: string[]
  ): Promise<KnowledgeBase> => {
    try {
      const response = await fetchWithAuth(
        `/knowledge-bases/${knowledgeBaseId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            connection_source_ids: resourceIds,
          }),
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(
        `Failed to update knowledge base: ${(error as Error).message}`
      );
    }
  };

  const listKnowledgeBases = async (): Promise<KnowledgeBaseResponse> => {
    try {
      console.log("Fetching knowledge bases...");
      const response = await fetchWithAuth("/knowledge-bases");
      const data = await response.json();
      console.log("Raw KB response:", data);

      // Transform the data if needed
      const transformedData: KnowledgeBaseResponse = {
        admin: Array.isArray(data.admin) ? data.admin : [],
      };

      console.log("Transformed KB data:", transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error fetching knowledge bases:", error);
      throw new Error(
        `Failed to fetch knowledge bases: ${(error as Error).message}`
      );
    }
  };

  const getKnowledgeBaseResources = async (
    knowledgeBaseId: string,
    resourcePath: string = "/"
  ): Promise<FileNode[]> => {
    const queryParams = new URLSearchParams({ resource_path: resourcePath });
    const response = await fetchWithAuth(
      `/knowledge-bases/${knowledgeBaseId}/resources/children?${queryParams}`
    );
    return response.json();
  };

  return {
    login,
    listFiles,
    createKnowledgeBase,
    syncKnowledgeBase,
    getKnowledgeBaseResources,
    listKnowledgeBases,
    updateKnowledgeBase,
  };
};

export const apiClient = createApiClient();
