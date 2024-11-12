import { FileNode, KnowledgeBase, ApiError } from "@/types/api";

/**
 * API Client for Stack AI
 * Handles authentication, file operations, and knowledge base management
 */
export class ApiClient {
  private accessToken: string | null = null;
  private connectionId: string | null = null;
  private orgId: string | null = null;

  private async fetchOrgId(): Promise<void> {
    try {
      const response = await this.fetch("/organizations/me/current");
      const data = await response.json();
      this.orgId = data.org_id;
    } catch (error) {
      throw new Error(
        "Failed to fetch organization ID: " + (error as Error).message
      );
    }
  }

  private async fetchConnectionId(): Promise<void> {
    try {
      const response = await this.fetch(
        "/connections?connection_provider=gdrive&limit=1"
      );
      const connections = await response.json();

      if (!connections || connections.length === 0) {
        throw new Error("No Google Drive connection found");
      }

      this.connectionId = connections[0].connection_id;
    } catch (error) {
      throw new Error(
        "Failed to fetch connection ID: " + (error as Error).message
      );
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      this.accessToken = data.access_token;

      // Set up required IDs for API operations
      await this.fetchOrgId();
      await this.fetchConnectionId();
    } catch (error) {
      console.error("Login error:", error);
      throw new Error("Login failed: " + (error as Error).message);
    }
  }

  private async fetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    if (!this.accessToken) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    return response;
  }

  async listFiles(parentId?: string): Promise<FileNode[]> {
    if (!this.connectionId) {
      throw new Error("No connection ID available");
    }

    const queryParams = new URLSearchParams({
      connectionId: this.connectionId,
      ...(parentId && { resourceId: parentId }),
    });

    const response = await this.fetch(`/files?${queryParams}`);
    return response.json();
  }

  async createKnowledgeBase(resourceIds: string[]): Promise<KnowledgeBase> {
    if (!this.connectionId) {
      throw new Error("No connection ID available");
    }

    const response = await this.fetch("/knowledge-base", {
      method: "POST",
      body: JSON.stringify({
        connection_id: this.connectionId,
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
  }

  async syncKnowledgeBase(knowledgeBaseId: string): Promise<void> {
    if (!this.orgId) {
      throw new Error("No organization ID available");
    }

    const queryParams = new URLSearchParams({
      knowledgeBaseId,
      orgId: this.orgId,
    });

    await this.fetch(`/knowledge-base/sync?${queryParams}`, {
      method: "POST",
    });
  }

  async deleteFromKnowledgeBase(
    knowledgeBaseId: string,
    resourcePath: string
  ): Promise<void> {
    await this.fetch(
      `/knowledge-base/${knowledgeBaseId}?resourcePath=${encodeURIComponent(
        resourcePath
      )}`,
      {
        method: "DELETE",
      }
    );
  }
}
