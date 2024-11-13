import { FileNode, KnowledgeBase } from "@/types/api";

interface ApiClient {
  login(email: string, password: string): Promise<void>;
  listFiles(parentId?: string): Promise<FileNode[]>;
  createKnowledgeBase(resourceIds: string[]): Promise<KnowledgeBase>;
  syncKnowledgeBase(knowledgeBaseId: string): Promise<void>;
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

    if (!response.ok) throw new Error("API request failed");

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
    resourceIds: string[]
  ): Promise<KnowledgeBase> => {
    if (!connectionId) throw new Error("No connection ID available");

    const response = await fetchWithAuth("/knowledge-base", {
      method: "POST",
      body: JSON.stringify({
        connection_id: connectionId,
        connection_source_ids: resourceIds,
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
    return response.json();
  };

  const syncKnowledgeBase = async (knowledgeBaseId: string): Promise<void> => {
    if (!orgId) throw new Error("No organization ID available");

    await fetchWithAuth(
      `/knowledge-base/sync?knowledgeBaseId=${knowledgeBaseId}&orgId=${orgId}`,
      { method: "POST" }
    );
  };

  return {
    login,
    listFiles,
    createKnowledgeBase,
    syncKnowledgeBase,
  };
};

export const apiClient = createApiClient();
