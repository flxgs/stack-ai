# Stack AI File Picker

A robust File Picker implementation for Stack AI's Google Drive integration, built with Next.js 14+ App Router. This component enables seamless file selection, knowledge base creation, and indexing management.

## 📚 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Reference](#-api-reference)
- [Component Reference](#-component-reference)
- [Architecture](#-architecture)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

## 🚀 Features

### Core Features

- **Google Drive Integration**
  - Seamless browsing with nested navigation
  - Real-time file/folder status updates
  - Multi-select capability

### Knowledge Base Management

- **Creation & Indexing**
  - One-click knowledge base creation
  - Automatic file indexing
  - Progress tracking

### User Experience

- **Modern Interface**
  - Responsive design
  - Drag-and-drop support
  - Loading states & error handling

### Security

- **Built-in Protection**
  - API route protection
  - Token-based authentication
  - Secure data handling

## 🏃 Quick Start

```bash
# Install dependencies
npm install @stack-ai/file-picker

# Add to your Next.js project
import { FilePicker } from "@stack-ai/file-picker";

# Basic usage
export default function App() {
  return <FilePicker onSelect={files => console.log(files)} />;
}
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
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card dropdown-menu
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

## 🏗 Architecture

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── page.tsx           # Main page
├── components/            # React components
├── lib/                   # Utilities & services
└── types/                # TypeScript definitions
```

### Key Technologies

- Next.js 14+ (App Router)
- ShadcnUI Components
- TypeScript
- Stack AI API Integration

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

### Testing

```bash
npm run test        # Run tests
npm run test:watch  # Watch mode
```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**

   ```typescript
   // Check token expiration
   if (error.status === 401) {
     await apiClient.login(email, password);
   }
   ```

2. **File Selection Issues**

   - Ensure file types are supported
   - Check maxSelection limit
   - Verify connection ID is valid

3. **Indexing Problems**
   - Monitor sync status
   - Check file permissions
   - Verify file content is accessible

### Debug Mode

```typescript
<FilePicker debug={true} />
```

---
