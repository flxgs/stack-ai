"use client";
import Image from "next/image";

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
  X,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import drive from "@/public/drive.svg";
import confluence from "@/public/confluence.svg";
import dropbox from "@/public/dropbox.svg";
import github from "@/public/github.svg";
import slack from "@/public/slack.svg";
import { Skeleton } from "./ui/skeleton";

// Integration type for sidebar
type Integration = {
  id: string;
  name: string;
  icon: string | React.ComponentType<{ className?: string }>;
  enabled: boolean;
};

// Available integrations
const integrations: Integration[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    icon: drive.src,
    enabled: true,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: dropbox.src,
    enabled: false,
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
    icon: confluence.src,
    enabled: false,
  },
  {
    id: "slack",
    name: "Slack",
    icon: slack.src,
    enabled: false,
  },
  {
    id: "github",
    name: "Github",
    icon: github.src,
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
  const [searchQuery, setSearchQuery] = useState("");

  // Filter files based on search query
  const filteredFiles = files.filter((file) =>
    file.inode_path.path.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Get selected file details
  const getSelectedFileDetails = () => {
    return Array.from(selectedFiles)
      .map((id) => files.find((f) => f.resource_id === id))
      .filter(Boolean) as FileNode[];
  };

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
      <DialogContent className="sm:max-w-7xl h-[750px] p-0">
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
                {typeof integration.icon === "string" ? (
                  <Image
                    src={integration.icon}
                    alt={integration.name}
                    width={20}
                    height={20}
                  />
                ) : (
                  <integration.icon className="w-5 h-5" />
                )}{" "}
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
              <DialogTitle className="flex items-center justify-between">
                <span>Select Files</span>
                {selectedFiles.size > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedFiles.size} file
                    {selectedFiles.size !== 1 ? "s" : ""} selected
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Choose files to include in your knowledge base
              </DialogDescription>
            </DialogHeader>

            {/* Selected Files Display */}
            {selectedFiles.size > 0 && (
              <div className="mb-4 mt-2">
                <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                <ScrollArea className="h-20 rounded-md border p-2">
                  <div className="space-y-2">
                    {getSelectedFileDetails().map((file) => (
                      <div
                        key={file.resource_id}
                        className="flex items-center justify-between bg-muted/50 rounded-sm px-2 py-1"
                      >
                        <div className="flex items-center space-x-2">
                          <FileIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">
                            {file.inode_path.path.split("/").pop()}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileSelect(file);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Search Input - show only when files are loaded and not loading */}
            {!isLoading && selectedIntegration && files.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-destructive text-sm mb-4">{error}</div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3 mb-16">
                {/* File Header Skeleton */}
                <div className="flex items-center space-x-2 mb-6">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>

                {/* File Row Skeletons */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-2">
                    <Skeleton className="h-5 w-5" /> {/* Icon */}
                    <Skeleton className="h-4 flex-grow" /> {/* Filename */}
                    <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                  </div>
                ))}
              </div>
            )}

            {/* File List */}
            {!isLoading && selectedIntegration && (
              <div
                className="space-y-2 mt-4 overflow-auto"
                style={{
                  maxHeight: `calc(100% - ${
                    selectedFiles.size > 0 ? "260px" : "180px"
                  })`,
                }}
              >
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
              </div>
            )}

            {/* File List - now using filteredFiles */}
            {!isLoading && selectedIntegration && (
              <div
                className="space-y-2 mt-4 overflow-auto"
                style={{
                  maxHeight: `calc(100% - ${
                    selectedFiles.size > 0 ? "320px" : "240px"
                  })`,
                }}
              >
                {/* Breadcrumb Navigation remains the same */}

                {/* No Results Message */}
                {filteredFiles.length === 0 && searchQuery && (
                  <div className="text-center text-muted-foreground py-8">
                    No files found matching "{searchQuery}"
                  </div>
                )}

                {/* Files and Folders - now using filteredFiles */}
                <div className="space-y-2 text-sm">
                  {filteredFiles.map((file) => (
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
                      {/* Highlight matching text */}
                      <span className="flex-1">
                        {highlightMatch(
                          file.inode_path.path.split("/").pop() || "",
                          searchQuery
                        )}
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
            <div className="absolute bottom-0 right-0 p-4 bg-white border-t w-full flex justify-end space-x-2 ">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={selectedFiles.size === 0 || isLoading}
                onClick={handleCreateKnowledgeBase}
                className="rounded-lg shadow flex flex-row items-center gap-2 bg-violet-600 font-bold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" fill="white" />
                    Create Knowledge Base
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to highlight matching text
function highlightMatch(text: string, query: string) {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-100 rounded px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
