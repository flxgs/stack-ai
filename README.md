## Notes and some thought process

- here ill be taking some notes while i build this

- first create basic nextjs app with app router
- add basic folder structure for the api calls (api/knowledge-base, api/files, api/auth). this is the most important stuff
- add all the shadcn ui components for the frontend
- add global middleware to protect all api routes except for the auth endpoint
- add a basic auth endpoint that uses stack ai to authenticate the user
- add a dashboard page that has a sidebar and a header
- add files route that fetches the files from the stack ai api
- add knowledge base route that creates a knowledge base from the selected files and folders
- start documenting on readme so that i dont forget later and becomes a nightmare to maintain

---

# Stack AI File Picker

A custom File Picker implementation for Stack AI's Google Drive integration, built with Next.js 14+ App Router.

## 🚀 Features

- Google Drive file/folder browsing with nested navigation
- File/folder selection for knowledge base creation
- File indexing status tracking
- File deletion and de-indexing capabilities
- Sorting and filtering capabilities

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts         # Authentication endpoint
│   │   ├── files/
│   │   │   └── route.ts         # File operations endpoint
│   │   └── knowledge-base/
│   │       ├── sync/
│   │       │   └── route.ts     # KB synchronization endpoint
│   │       ├── [id]/
│   │       │   └── route.ts     # KB specific operations
│   │       └── route.ts         # KB creation endpoint
│   ├── middleware.ts            # API route protection
│   └── page.tsx                 # Main File Picker page
├── components/
│   └── file-picker/
│       └── index.tsx            # File Picker component
├── lib/
│   ├── api.ts                   # API client implementation
│   └── api-context.tsx          # React context for API client
└── types/
    └── api.ts                   # TypeScript interfaces
```

## 🔌 API Routes Documentation

### Authentication

**Endpoint:** `POST /api/auth`

```typescript
// Request body
{
  "email": string,
  "password": string
}

// Response
{
  "access_token": string
  // Other auth data...
}
```

Purpose: Authenticates user with Stack AI service and returns access token.

### File Operations

**Endpoint:** `GET /api/files`

```typescript
// Query parameters
{
  connectionId: string;       // Required: Google Drive connection ID
  resourceId?: string;       // Optional: Parent folder ID for navigation
}

// Response
{
  resource_id: string;
  inode_type: "file" | "directory";
  inode_path: {
    path: string;
  };
  status?: "pending" | "indexed" | "failed";
  // Other file metadata...
}[]
```

Purpose: Lists files and folders from connected Google Drive, supports nested navigation.

### Knowledge Base Operations

#### Create Knowledge Base

**Endpoint:** `POST /api/knowledge-base`

```typescript
// Request body
{
  "connection_id": string,
  "connection_source_ids": string[],  // File/folder IDs to index
  "indexing_params": {
    "ocr": boolean,
    "unstructured": boolean,
    "embedding_params": {
      "embedding_model": string,
      "api_key": string | null
    },
    "chunker_params": {
      "chunk_size": number,
      "chunk_overlap": number,
      "chunker": string
    }
  }
}

// Response
{
  "knowledge_base_id": string,
  // Other KB details...
}
```

Purpose: Creates a new knowledge base from selected files/folders.

#### Sync Knowledge Base

**Endpoint:** `POST /api/knowledge-base/sync`

```typescript
// Query parameters
{
  knowledgeBaseId: string;    // Required: KB to sync
  orgId: string;             // Required: Organization ID
}

// Response
{
  "success": boolean,
  "message": string
}
```

Purpose: Triggers indexing process for a knowledge base.

#### Delete from Knowledge Base

**Endpoint:** `DELETE /api/knowledge-base/[id]`

```typescript
// Query parameters
{
  resourcePath: string;      // Required: Path of file to remove
}

// Response
{
  "success": boolean
}
```

Purpose: Removes a file from knowledge base without deleting from Google Drive.

## 🔒 Security

The application implements several security measures:

1. **API Route Protection:**

   - Middleware checks for valid authentication token
   - All API routes (except /auth) require valid token
   - Sensitive data kept server-side

2. **Error Handling:**
   - Consistent error response format
   - Proper HTTP status codes
   - Detailed error messages for debugging
   - Input validation

## 💻 Key Components

### `ApiClient` Class

Located in `src/lib/api.ts`, handles all API communications:

- Authentication management
- File operations
- Knowledge base operations
- Error handling

```typescript
class ApiClient {
  async login(email: string, password: string): Promise<void>;
  async listFiles(parentId?: string): Promise<FileNode[]>;
  async createKnowledgeBase(resourceIds: string[]): Promise<KnowledgeBase>;
  async syncKnowledgeBase(knowledgeBaseId: string): Promise<void>;
  // ... other methods
}
```

### File Picker Component

Located in `src/components/file-picker/index.tsx`:

- File/folder navigation
- Selection management
- File status display
- Action menus for files

## 🛠 Setup & Installation

1. Clone the repository:

```bash
git clone [repository-url]
```

2. Install dependencies:

```bash
npm install
```

3. Install required shadcn components:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dropdown-menu
```

4. Add required environment variables:

```env
NEXT_PUBLIC_API_URL=https://api.stack-ai.com
NEXT_PUBLIC_AUTH_URL=https://sb.stack-ai.com/auth/v1/token
```

5. Run development server:

```bash
npm run dev
```

## 🧪 Usage Example

```typescript
// Example of using the File Picker component
import { FilePicker } from "@/components/file-picker";

export default function HomePage() {
  return (
    <main className="container mx-auto p-4">
      <FilePicker />
    </main>
  );
}
```

## 📝 Notes

- The API client uses Next.js App Router's new features like server components and route handlers
- All dates are in ISO 8601 format
- File paths are Unix-style with forward slashes
- Knowledge base sync is an asynchronous operation
- File statuses can be: "pending", "indexed", or "failed"
