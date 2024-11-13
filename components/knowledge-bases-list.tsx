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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function KnowledgeBasesList() {
  const { toast } = useToast();
  const [kbs, setKbs] = useState<KnowledgeBaseList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadKnowledgeBases = async () => {
    try {
      setIsLoading(true);
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

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Knowledge Bases</CardTitle>
            <CardDescription>Your indexed documents and files</CardDescription>
          </div>
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : kbs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No knowledge bases found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
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
