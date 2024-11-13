// Common types
export type Status = "pending" | "indexed" | "failed";
export type SortOption = "name_asc" | "name_desc" | "date_asc" | "date_desc";

export type SelectedKB = {
  id: string;
  name: string;
  files: string[];
};

export interface KnowledgeBasesProps {
  onKnowledgeBaseSelect: (kb: KnowledgeBaseList) => void;
  onRefresh: () => Promise<void>;
  knowledgeBases: KnowledgeBaseList[];
  isLoading: boolean;
}

export interface FilePickerDialogProps {
  knowledgeBaseId?: string;
  existingFiles?: string[];
  onClose?: () => void;
}

// File/Resource related types
export interface FileNode {
  resource_id: string;
  inode_type: "file" | "directory";
  inode_path: {
    path: string;
  };
  status?: Status;
  created_at: string;
  updated_at: string;
  modified_at?: number;
  size?: number;
  mime_type?: string;
}

export interface KnowledgeBaseResponse {
  admin: KnowledgeBaseList[];
}
// Knowledge Base related types
export interface KnowledgeBaseBase {
  knowledge_base_id: string;
  connection_id: string | null; // Changed to allow null
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  connection_source_ids: string[];
  is_empty: boolean;
  org_id: string;
  org_level_role: string | null;
  cron_job_id: string | null;
  indexing_params: KnowledgeBase["indexing_params"]; // Add this to include indexing_params
}

export interface KnowledgeBase extends KnowledgeBaseBase {
  indexing_params: {
    ocr: boolean;
    unstructured: boolean;
    embedding_params: {
      api: null;
      base_url: null;
      embedding_model: string;
      batch_size: number;
      track_usage: boolean;
      timeout: number;
    };
    chunker_params: {
      chunk_size: number;
      chunk_overlap: number;
      chunker_type: string; // Changed from 'chunker' to 'chunker_type'
    };
  };
}

export interface KnowledgeBaseList extends KnowledgeBase {
  status?: Status;
}

// Request/Response types
export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export interface SyncResponse {
  status?: number;
  message?: string;
  success?: boolean;
  upsert_group_task_id: string;
}

// Create Knowledge Base params
export interface KnowledgeBaseCreateParams {
  connection_id: string;
  connection_source_ids: string[];
  indexing_params: {
    ocr: boolean;
    unstructured: boolean;
    embedding_params: {
      embedding_model: string;
      api_key: null;
    };
    chunker_params: {
      chunk_size: number;
      chunk_overlap: number;
      chunker: string;
    };
  };
  name?: string;
  description?: string;
  org_level_role?: string | null;
  cron_job_id?: string | null;
}

// Update Knowledge Base params
export interface KnowledgeBaseUpdateParams {
  name?: string;
  description?: string;
  indexing_params?: Partial<KnowledgeBase["indexing_params"]>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export type StatusVariant = "default" | "secondary" | "destructive";
