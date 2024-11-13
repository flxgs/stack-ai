// src/components/knowledge-bases.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { KnowledgeBaseList } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FilePickerDialog from "./file-picker";

export default function KnowledgeBases() {
  const { toast } = useToast();
  const [kbs, setKbs] = useState<KnowledgeBaseList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticate = async () => {
    try {
      setIsLoading(true);
      await apiClient.login("stackaitest@gmail.com", "!z4ZnxkyLYs#vR");
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Authentication error:", err);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Please try again later.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loadKnowledgeBases = async () => {
    try {
      setIsLoading(true);
      if (!isAuthenticated) {
        const success = await authenticate();
        if (!success) return;
      }
      const list = await apiClient.listKnowledgeBases();
      setKbs(list);
    } catch (error) {
      console.error("Error loading knowledge bases:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load knowledge bases",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load KBs on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadKnowledgeBases();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Bases</CardTitle>
          <CardDescription>
            Connect to view your knowledge bases
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Database className="h-12 w-12 mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Connect to Google Drive to view and manage your knowledge bases
          </p>
          <Button onClick={authenticate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect to Google Drive"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Knowledge Bases</CardTitle>
            <CardDescription>Your indexed documents and files</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadKnowledgeBases}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
            <FilePickerDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : kbs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No knowledge bases found</p>
            <p className="text-sm mt-2">
              Create one by clicking &apos;Select Files&apos;
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kbs.map((kb) => (
                <TableRow key={kb.knowledge_base_id}>
                  <TableCell className="font-medium">
                    {kb.name || "Unnamed Knowledge Base"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(kb.status)}>
                      <StatusIcon status={kb.status} className="mr-1 h-3 w-3" />
                      {kb.status || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>{kb.connection_source_ids.length} files</TableCell>
                  <TableCell>
                    {new Date(kb.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(kb.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function StatusIcon({
  status,
  className,
}: {
  status?: string;
  className?: string;
}) {
  switch (status) {
    case "indexed":
      return <CheckCircle className={className} />;
    case "pending":
      return <Clock className={className} />;
    case "failed":
      return <XCircle className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
}

function getStatusVariant(
  status?: string
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "indexed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}
