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
import {
  Loader2,
  FileIcon,
  FolderIcon,
  ChevronRight,
  Database,
  FileText,
  Slack,
} from "lucide-react";
import { SparkleIcon } from "lucide-react";

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
    icon: SparkleIcon,
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null
  );
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Handle integration selection
  const handleIntegrationSelect = async (integrationId: string) => {
    setSelectedIntegration(integrationId);
    setError(null);

    if (integrationId === "google-drive") {
      try {
        setIsLoading(true);
        await api.login("stackaitest@gmail.com", "!z4ZnxkyLYs#vR");
        const fileList = await api.listFiles();
        setFiles(fileList);
      } catch (err) {
        setError("Failed to connect to Google Drive. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("This integration is not yet available.");
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
      setError("Failed to load folder contents. Please try again.");
      console.error(err);
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
        // You'll need to implement logic to get the parent folder's ID
        const fileList = await api.listFiles(/* parent folder id */);
        setFiles(fileList);
      } catch (err) {
        setError("Failed to navigate back. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <div className="flex-1 p-4">
            <DialogHeader>
              <DialogTitle>Select Files</DialogTitle>
              <DialogDescription>
                Choose files to include in your knowledge base
              </DialogDescription>
            </DialogHeader>

            {/* Error Message */}
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

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
                      className={`flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer ${
                        selectedFiles.has(file.resource_id) ? "bg-blue-50" : ""
                      }`}
                      onClick={() =>
                        file.inode_type === "directory"
                          ? handleFolderClick(file)
                          : handleFileSelect(file)
                      }
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
            <div className="absolute bottom-0 right-0 p-4 flex space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={selectedFiles.size === 0}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const kb = await api.createKnowledgeBase(
                      Array.from(selectedFiles)
                    );
                    await api.syncKnowledgeBase(kb.knowledge_base_id);
                    setIsOpen(false);
                  } catch (err) {
                    setError(
                      "Failed to create knowledge base. Please try again."
                    );
                    console.error(err);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                Create Knowledge Base
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
