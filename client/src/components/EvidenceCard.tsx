import { Evidence } from "@shared/schema";
import { cn } from "@/lib/utils";
import { FileText, Mail, FileBarChart, Search } from "lucide-react";
import { motion } from "framer-motion";

interface EvidenceCardProps {
  evidence: Evidence;
  isVisited: boolean;
  onVisit: () => void;
}

const icons = {
  document: FileText,
  email: Mail,
  report: FileBarChart,
  clue: Search,
};

export function EvidenceCard({ evidence, isVisited, onVisit }: EvidenceCardProps) {
  const Icon = (icons as any)[evidence.type] || FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative flex flex-col h-full rounded-xl border transition-all duration-300 overflow-hidden group",
        isVisited
          ? "bg-card border-border/50 hover:border-primary/50 shadow-lg"
          : "bg-secondary/20 border-border/30 hover:bg-secondary/40 cursor-pointer"
      )}
      onClick={!isVisited ? onVisit : undefined}
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "p-3 rounded-lg",
              isVisited ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="w-6 h-6" />
          </div>

          {!isVisited && (
            <span className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-1 rounded">
              -{evidence.cost} دقيقة
            </span>
          )}
        </div>

        <h3 className={cn("font-bold text-lg mb-2 line-clamp-2", !isVisited && "blur-sm select-none")}>
          {evidence.title}
        </h3>

        <div className="flex-1">
          <p className={cn("text-sm text-muted-foreground leading-relaxed", !isVisited && "blur-sm select-none")}>
            {isVisited
              ? evidence.description
              : "انقر للكشف عن هذا الدليل وتحليله. سيستهلك ذلك وقتاً من موارد التحقيق."}
          </p>
        </div>
      </div>

      {!isVisited && (
        <div className="p-4 bg-primary/5 border-t border-primary/10 text-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          تحليل الدليل
        </div>
      )}
    </motion.div>
  );
}
