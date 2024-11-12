"use client";
import { useState } from "react";
import { useApi } from "@/lib/api-context";
import { FileNode } from "@/types/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  FileIcon,
  FolderIcon,
  ChevronRight,
  Sparkle,
  Slack,
  Database,
  FileText,
} from "lucide-react";

// Integration type for sidebar
type Integration = {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
};

// Available integrations
const integrations: Integration[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    icon: Sparkle,
    enabled: true,
  },
  {
    id: "notion",
    name: "Notion",
    icon: Database,
    enabled: false,
  },
  {
    id: "confluence",
    name: "Confluence",
    icon: FileText,
    enabled: false,
  },
  {
    id: "slack",
    name: "Slack",
    icon: Slack,
    enabled: false,
  },
];

export default function FilePickerDialog() {
  const api = useApi();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  );
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to handle authentication
  const authenticate = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await api.login("stackaitest@gmail.com", "!z4ZnxkyLYs#vR");
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Failed to authenticate. Please try again.");
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Please try again later.",
      });
      return false;
    }
  };

  // Function to load files
  const loadFiles = async (parentId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // If not authenticated, try to authenticate first
      if (!isAuthenticated) {
        const authSuccess = await authenticate();
        if (!authSuccess) return;
      }

      const fileList = await api.listFiles(parentId);
      setFiles(fileList);
    } catch (err) {
      console.error("Error loading files:", err);
      setError("Failed to load files. Please try again.");
      toast({
        variant: "destructive",
        title: "Error Loading Files",
        description: "Could not load files. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle integration selection
  const handleIntegrationSelect = async (integrationId: string) => {
    setSelectedIntegration(integrationId);
    setError(null);
    setFiles([]);
    setCurrentPath([]);
    setSelectedFiles(new Set());

    if (integrationId === "google-drive") {
      await loadFiles();
    } else {
      setError("This integration is not yet available.");
      toast({
        variant: "destructive",
        title: "Integration Unavailable",
        description: "This integration is not yet available.",
      });
    }
  };

  // Handle folder navigation
  const handleFolderClick = async (folder: FileNode) => {
    try {
      setIsLoading(true);
      setError(null);

      const fileList = await api.listFiles(folder.resource_id);
      setFiles(fileList);
      setCurrentPath([...currentPath, folder.inode_path.path]);
    } catch (err) {
      console.error("Error navigating folder:", err);
      setError("Failed to load folder contents. Please try again.");
      toast({
        variant: "destructive",
        title: "Navigation Failed",
        description: "Could not open the folder. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: FileNode) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file.resource_id)) {
        next.delete(file.resource_id);
      } else {
        next.add(file.resource_id);
      }
      return next;
    });
  };

  // Handle going back in navigation
  const handleBack = async () => {
    if (currentPath.length > 0) {
      try {
        setIsLoading(true);
        setError(null);

        const newPath = [...currentPath];
        newPath.pop();
        setCurrentPath(newPath);

        // Get the last folder's ID from the path or undefined for root
        const lastFolderId =
          newPath.length > 0
            ? files.find(
                (f) => f.inode_path.path === newPath[newPath.length - 1]
              )?.resource_id
            : undefined;

        await loadFiles(lastFolderId);
      } catch (err) {
        console.error("Error navigating back:", err);
        setError("Failed to navigate back. Please try again.");
        toast({
          variant: "destructive",
          title: "Navigation Failed",
          description: "Could not go back. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle creating knowledge base
  const handleCreateKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const kb = await api.createKnowledgeBase(Array.from(selectedFiles));
      await api.syncKnowledgeBase(kb.knowledge_base_id);

      toast({
        title: "Success",
        description: "Knowledge base created successfully.",
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Error creating knowledge base:", err);
      setError("Failed to create knowledge base. Please try again.");
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: "Could not create knowledge base. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when dialog closes
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedIntegration(null);
      setFiles([]);
      setCurrentPath([]);
      setSelectedFiles(new Set());
      setError(null);
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline">Select Files</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[875px] h-[600px] p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r p-4 space-y-2">
            <h3 className="font-medium mb-4">Integrations</h3>
            {integrations.map((integration) => (
              <button
                key={integration.id}
                onClick={() => handleIntegrationSelect(integration.id)}
                className={`w-full flex items-center space-x-2 p-2 rounded hover:bg-gray-100 ${
                  selectedIntegration === integration.id ? "bg-gray-100" : ""
                } ${
                  !integration.enabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={!integration.enabled}
              >
                <integration.icon className="w-5 h-5" />
                <span>{integration.name}</span>
                {integration.enabled && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 relative">
            <DialogHeader>
              <DialogTitle>Select Files</DialogTitle>
              <DialogDescription>
                Choose files to include in your knowledge base
              </DialogDescription>
            </DialogHeader>

            {/* Error Message */}
            {error && (
              <div className="text-destructive text-sm mb-4">{error}</div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}

            {/* File List */}
            {!isLoading && selectedIntegration && (
              <div className="space-y-2 mt-4">
                {/* Breadcrumb Navigation */}
                {currentPath.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      Back
                    </Button>
                    <div className="flex items-center">
                      {currentPath.map((path, index) => (
                        <div key={path} className="flex items-center">
                          {index > 0 && (
                            <ChevronRight className="w-4 h-4 mx-1" />
                          )}
                          <span>{path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files and Folders */}
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.resource_id}
                      onClick={() =>
                        file.inode_type === "directory"
                          ? handleFolderClick(file)
                          : handleFileSelect(file)
                      }
                      className={`flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer ${
                        selectedFiles.has(file.resource_id) ? "bg-blue-50" : ""
                      }`}
                    >
                      {file.inode_type === "directory" ? (
                        <FolderIcon className="w-5 h-5 text-blue-500 mr-2" />
                      ) : (
                        <FileIcon className="w-5 h-5 text-gray-500 mr-2" />
                      )}
                      <span className="flex-1">
                        {file.inode_path.path.split("/").pop()}
                      </span>
                      {file.inode_type === "file" && (
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.resource_id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleFileSelect(file);
                          }}
                          className="ml-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute bottom-0 right-0 p-4 bg-white border-t w-full flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={selectedFiles.size === 0 || isLoading}
                onClick={handleCreateKnowledgeBase}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Knowledge Base"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
