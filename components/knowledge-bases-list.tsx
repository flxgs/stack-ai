import { KnowledgeBaseList, KnowledgeBaseResponse } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Check } from "lucide-react";

interface KnowledgeBasesListProps {
  knowledgeBases: KnowledgeBaseResponse;
  selectedKB?: KnowledgeBaseList | null;
  onSelect: (kb: KnowledgeBaseList) => void;
}

export default function KnowledgeBasesList({
  knowledgeBases,
  selectedKB,
  onSelect,
}: KnowledgeBasesListProps) {
  const kbList = knowledgeBases?.admin || [];

  return (
    <ScrollArea className="h-[600px] pr-4">
      <div className="space-y-4">
        {kbList.map((kb) => (
          <Card
            key={kb.knowledge_base_id}
            className={`transition-colors cursor-pointer hover:bg-accent ${
              selectedKB?.knowledge_base_id === kb.knowledge_base_id
                ? "border-primary"
                : ""
            }`}
            onClick={() => onSelect(kb)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{kb.name}</CardTitle>
                  {selectedKB?.knowledge_base_id === kb.knowledge_base_id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <Badge variant={kb.is_empty ? "secondary" : "default"}>
                  {kb.is_empty ? "Empty" : "Has Data"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="line-clamp-2">{kb.description}</p>
              <p className="mt-2">
                Created {formatDistanceToNow(new Date(kb.created_at))} ago
              </p>
            </CardContent>
          </Card>
        ))}

        {kbList.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No knowledge bases found
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
