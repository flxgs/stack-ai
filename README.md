# Stack AI File Picker

A robust👀 File Picker implementation for Stack AI's Google Drive integration, built with Next.js 14+ App Router. This component enables seamless file selection, knowledge base creation, and indexing management.

## 🔧 Development

### Local Development

```bash
npm run dev
# Visit http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

## 🛠 Installation

1. **Prerequisites**

   ```bash
   Node.js >= 18.0.0
   Next.js >= 14.0.0
   ```

2. **Environment Setup**

   ```env
   NEXT_PUBLIC_API_URL=https://api.stack-ai.com
   NEXT_PUBLIC_AUTH_URL=https://sb.stack-ai.com/auth/v1/token
   ```

3. **Required Dependencies**
   ```bash
   npm i
   ```

## 💻 Usage

### Basic Implementation

```typescript
import { FilePicker } from "@/components/file-picker";
import { useApiClient } from "@/lib/api-context";

export default function KnowledgeBasePage() {
  const handleSelect = async (files: string[]) => {
    const kb = await apiClient.createKnowledgeBase(files);
    await apiClient.syncKnowledgeBase(kb.id, files);
  };

  return (
    <FilePicker
      onSelect={handleSelect}
      maxSelection={10}
      allowedTypes={["pdf", "doc", "txt"]}
    />
  );
}
```

### Advanced Configuration

```typescript
<FilePicker
  initialPath="/documents"
  selectionMode="multiple"
  showStatus={true}
  onError={(error) => console.error(error)}
  customStyles={{
    height: "600px",
    width: "100%",
  }}
/>
```

## 📡 API Reference

### Authentication

```typescript
POST /api/auth
Content-Type: application/json

// Request
{
  "email": string,
  "password": string
}

// Response
{
  "access_token": string,
  "expires_in": number
}
```

### File Operations

```typescript
GET /api/files?connectionId=string&resourceId=string

// Response
{
  "items": [
    {
      "resource_id": string,
      "inode_type": "file" | "directory",
      "inode_path": { "path": string },
      "status": "pending" | "indexed" | "failed"
    }
  ]
}
```

### Knowledge Base Operations

```typescript
POST /api/knowledge-bases
Content-Type: application/json

// Request
{
  "connection_id": string,
  "connection_source_ids": string[],
  "indexing_params": {
    "ocr": boolean,
    "unstructured": boolean,
    "embedding_params": {...},
    "chunker_params": {...}
  }
}
```

## 🧩 Component Reference

### FilePicker Props

```typescript
interface FilePickerProps {
  onSelect?: (files: string[]) => void;
  onError?: (error: Error) => void;
  maxSelection?: number;
  allowedTypes?: string[];
  selectionMode?: "single" | "multiple";
  showStatus?: boolean;
  initialPath?: string;
  customStyles?: React.CSSProperties;
}
```

### ApiClient Methods

```typescript
interface ApiClient {
  login(email: string, password: string): Promise<void>;
  listFiles(parentId?: string): Promise<FileNode[]>;
  createKnowledgeBase(fileIds: string[]): Promise<KnowledgeBase>;
  syncKnowledgeBase(kbId: string, resourceIds: string[]): Promise<SyncResponse>;
}
```

### Key Technologies

- Next.js 14+ (App Router)
- ShadcnUI Components
- TypeScript
- Stack AI API Integration

---
