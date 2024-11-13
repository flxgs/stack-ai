export interface FileNode {
  resource_id: string;
  inode_type: "file" | "directory";
  inode_path: {
    path: string;
  };
  status?: "pending" | "indexed" | "failed";
  created_at: string;
  updated_at: string;
  modified_at?: number;
}

export interface KnowledgeBase {
  knowledge_base_id: string;
  connection_id: string;
  connection_source_ids: string[];
}

export interface ApiError {
  message: string;
  status: number;
}

export interface SyncResponse {
  status: number;
  message?: string;
  success?: boolean;
}

export type SortOption = "name_asc" | "name_desc" | "date_asc" | "date_desc";
