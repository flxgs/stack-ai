"use client";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useState } from "react";
import { useApi } from "@/lib/api-context";
import {
  FileNode,
  KnowledgeBaseList,
  KnowledgeBaseResponse,
  SortOption,
  StatusVariant,
} from "@/types/api";
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
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
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
import KnowledgeBasesList from "./knowledge-bases-list";

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
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");
  const [showKBView, setShowKBView] = useState(false);
  const [kbs, setKbs] = useState<KnowledgeBaseResponse>({ admin: [] });
  const [viewingKB, setViewingKB] = useState<string | null>(null);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] =
    useState<KnowledgeBaseList | null>(null);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBaseList | null>(null);

  // Sort files based on sort option
  const sortFiles = (files: FileNode[]) => {
    return [...files].sort((a, b) => {
      const nameA = a.inode_path.path.split("/").pop() || "";
      const nameB = b.inode_path.path.split("/").pop() || "";

      switch (sortOption) {
        case "name_asc":
          return nameA.localeCompare(nameB);
        case "name_desc":
          return nameB.localeCompare(nameA);
        case "date_asc":
          return (a.modified_at || 0) - (b.modified_at || 0);
        case "date_desc":
          return (b.modified_at || 0) - (a.modified_at || 0);
        default:
          return 0;
      }
    });
  };

  // Filter files based on search query
  const filteredFiles = sortFiles(
    files.filter((file) =>
      file.inode_path.path.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
    if (integrationId === "google-drive") {
      try {
        setIsLoading(true);
        await authenticate();
        const fileList = await api.listFiles();
        setFiles(fileList);

        // Load existing KBs
        console.log("Fetching KBs in handleIntegrationSelect...");
        const knowledgeBases = await api.listKnowledgeBases();
        console.log("Received KBs:", knowledgeBases);
        setKbs(knowledgeBases);
        // Select the newest KB by default
        if (knowledgeBases.admin.length > 0) {
          const sortedKBs = [...knowledgeBases.admin].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setSelectedKB(sortedKBs[0]);
        }
      } catch (error) {
        console.error("Error in handleIntegrationSelect:", error);
        setError("Failed to load content");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load content",
        });
      } finally {
        setIsLoading(false);
      }
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

  // Add a warning when selecting a folder that contains already selected files
  const handleFileSelect = (file: FileNode) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);

      if (next.has(file.resource_id)) {
        // Removing selection
        next.delete(file.resource_id);
      } else {
        // Adding selection
        if (file.inode_type === "directory") {
          // Check if any selected files are children of this folder
          const hasSelectedChildren = Array.from(prev).some((selectedId) => {
            const selectedFile = files.find(
              (f) => f.resource_id === selectedId
            );
            return (
              selectedFile &&
              selectedFile.inode_path.path.startsWith(file.inode_path.path)
            );
          });

          if (hasSelectedChildren) {
            toast({
              title: "Warning",
              description:
                "You have already selected files from this folder. Selecting the folder will include all its contents.",
              className: "bg-yellow-500 text-white",
            });
          }
        }
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

  const refreshKBs = async () => {
    if (!isAuthenticated) return;
    try {
      const knowledgeBases = await api.listKnowledgeBases();
      setKbs({
        admin: Array.isArray(knowledgeBases) ? knowledgeBases : [],
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not refresh knowledge bases",
      });
    }
  };

  // Handle creating knowledge base
  const handleCreateKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const kb = await api.createKnowledgeBase(Array.from(selectedFiles));
      console.log("Knowledge base created:", kb);

      const syncResult = await api.syncKnowledgeBase(kb.knowledge_base_id);
      console.log("Sync result:", syncResult);

      if (syncResult.success) {
        toast({
          title: "Success",
          description: "Knowledge base created and sync started successfully.",
        });
        await refreshKBs(); // Refresh the KBs list
        setIsOpen(false);
      } else {
        throw new Error(`Sync failed: ${syncResult.message}`);
      }
    } catch (err) {
      console.error("Error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
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
      setShowKBView(false);
      setViewingKB(null);
      setKbs({ admin: [] });
    }
    setIsOpen(open);
  };

  const viewKBContents = async (kbId: string) => {
    try {
      setIsLoading(true);
      const resources = await api.getKnowledgeBaseResources(kbId);
      setFiles(Array.isArray(resources) ? resources : []);
      setViewingKB(kbId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load knowledge base contents",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status?: string): StatusVariant => {
    switch (status?.toLowerCase()) {
      case "indexed":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "indexed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case "indexed":
        return "text-green-500";
      case "pending":
        return "text-blue-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
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
            {isAuthenticated && (
              <div className="border-t pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-between"
                  onClick={() => setShowKBView(!showKBView)}
                >
                  <span className="flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Knowledge Bases
                  </span>
                  <Badge variant="secondary">{kbs.admin.length || 0}</Badge>
                </Button>

                {selectedKB && (
                  <div className="px-2 py-1 text-sm">
                    <div className="font-medium text-muted-foreground">
                      Selected KB:
                    </div>
                    <div className="truncate text-primary">
                      {selectedKB.name}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* In the main content area */}
          {showKBView ? (
            <div className="flex-1 p-4 relative">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Knowledge Bases</DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowKBView(false)}
                  >
                    Back to Files
                  </Button>
                </div>
              </DialogHeader>
              <KnowledgeBasesList
                knowledgeBases={kbs}
                selectedKB={selectedKB}
                onSelect={setSelectedKB}
              />{" "}
            </div>
          ) : (
            /* Main Content */
            <div className="flex-1 p-4 relative">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Select Files</span>
                  {selectedFiles.size > 0 && (
                    <Badge
                      variant="secondary"
                      className="mr-16 text-sm bg-blue-600 text-white"
                    >
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
                            {file.inode_type === "directory" ? (
                              <FolderIcon className="w-4 h-4 text-blue-500" />
                            ) : (
                              <FileIcon className="w-4 h-4 text-muted-foreground" />
                            )}
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
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
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
                  <Select
                    value={sortOption}
                    onValueChange={(value) =>
                      setSortOption(value as SortOption)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Name (A to Z)</SelectItem>
                      <SelectItem value="name_desc">Name (Z to A)</SelectItem>
                      <SelectItem value="date_asc">
                        Date (Oldest first)
                      </SelectItem>
                      <SelectItem value="date_desc">
                        Date (Newest first)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-destructive text-sm mb-4">{error}</div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="space-y-3 mb-24">
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
                      No files found matching &quot;{searchQuery}&quot;
                    </div>
                  )}

                  {/* Files and Folders - now using filteredFiles */}
                  <div className="space-y-2 text-sm">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.resource_id}
                        className={`flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer ${
                          selectedFiles.has(file.resource_id)
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        {/* Left side: Icon and Name - clickable for navigation */}
                        <div
                          className="flex items-center flex-1"
                          onClick={() =>
                            file.inode_type === "directory"
                              ? handleFolderClick(file)
                              : undefined
                          }
                        >
                          {file.inode_type === "directory" ? (
                            <FolderIcon className="w-5 h-5 text-blue-500 mr-2" />
                          ) : (
                            <FileIcon className="w-5 h-5 text-gray-500 mr-2" />
                          )}
                          <span className="flex-1">
                            {highlightMatch(
                              file.inode_path.path.split("/").pop() || "",
                              searchQuery
                            )}
                          </span>
                        </div>

                        {/* Right side: Actions */}
                        <div className="flex items-center gap-2">
                          {/* Show checkbox for both files and folders */}
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.resource_id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFileSelect(file);
                            }}
                            className="ml-2"
                          />
                          {/* Optional: Add folder navigation button */}
                          {file.inode_type === "directory" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFolderClick(file);
                              }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
          )}
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
