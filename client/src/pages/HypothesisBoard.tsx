import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { 
  UserX, 
  ServerCrash, 
  Target, 
  TrendingDown,
  Check,
  X,
  RotateCcw,
  Lightbulb,
  ArrowLeft,
  FileSearch,
  Users,
  BarChart3,
  FileText
} from "lucide-react";
import { Hypothesis } from "@shared/schema";
import { EliminationModal } from "@/components/EliminationModal";

const iconMap: Record<string, typeof UserX> = {
  UserX,
  ServerCrash,
  Target,
  TrendingDown,
  Users,
};

export default function HypothesisBoard() {
  const { 
    currentCase, 
    eliminateHypothesis, 
    restoreHypothesis,
    isHypothesisEliminated,
    getEliminationJustification,
    getDiscoveredEvidence,
    getCompletedInterviews,
    getDiscoveredInsights,
  } = useGameStore();

  const [selectedHypothesis, setSelectedHypothesis] = useState<Hypothesis | null>(null);

  const hypotheses = currentCase.hypotheses;
  const remainingCount = hypotheses.filter(h => !isHypothesisEliminated(h.id)).length;

  const discoveredCount = getDiscoveredEvidence().length + getCompletedInterviews().length + getDiscoveredInsights().length;

  const handleEliminate = (hypothesis: Hypothesis) => {
    setSelectedHypothesis(hypothesis);
  };

  const handleConfirmElimination = (justifications: { type: 'evidence' | 'interview' | 'data'; id: string }[]) => {
    if (selectedHypothesis) {
      eliminateHypothesis(selectedHypothesis.id, justifications);
      setSelectedHypothesis(null);
    }
  };

  const getJustificationSummary = (hypothesisId: string) => {
    const justification = getEliminationJustification(hypothesisId);
    if (!justification) return null;
    
    const evidenceCount = justification.justifications.filter(j => j.type === 'evidence').length;
    const interviewCount = justification.justifications.filter(j => j.type === 'interview').length;
    const dataCount = justification.justifications.filter(j => j.type === 'data').length;
    
    const parts = [];
    if (evidenceCount > 0) parts.push(`${evidenceCount} دليل`);
    if (interviewCount > 0) parts.push(`${interviewCount} مقابلة`);
    if (dataCount > 0) parts.push(`${dataCount} رؤية`);
    
    return parts.join(" + ");
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-primary" />
          لوحة الفرضيات
        </h1>
        <p className="text-muted-foreground mt-2">
          دي الاحتمالات المتاحة. تقدر تستبعد اللي مش ماشي مع المعلومات… وفي الآخر هتقدّم تقرير.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="bg-primary/10 px-4 py-2 rounded-lg">
          <span className="text-muted-foreground">المتبقية: </span>
          <span className="font-bold text-primary">{remainingCount}</span>
          <span className="text-muted-foreground"> / {hypotheses.length}</span>
        </div>
        
        <div className="bg-secondary/50 px-4 py-2 rounded-lg">
          <span className="text-muted-foreground">معلومات مكتشفة: </span>
          <span className="font-bold text-foreground">{discoveredCount}</span>
        </div>

        <Link href="/report">
          <div className="bg-accent/20 text-accent px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-accent/30 transition-colors">
            <Check className="w-4 h-4" />
            <span className="font-medium">افتح التقرير</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-auto">
        <AnimatePresence mode="popLayout">
          {hypotheses.map((hypothesis, index) => {
            const isEliminated = isHypothesisEliminated(hypothesis.id);
            const IconComponent = iconMap[hypothesis.icon] || Target;
            const justificationSummary = getJustificationSummary(hypothesis.id);
            
            return (
              <motion.div
                key={hypothesis.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative rounded-xl border-2 p-5 transition-all duration-300",
                  isEliminated 
                    ? "bg-card/30 border-border/30" 
                    : "bg-card border-border/50 hover:border-primary/30"
                )}
              >
                {isEliminated && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <X className="w-24 h-24 text-destructive/15" strokeWidth={3} />
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    isEliminated ? "bg-muted" : "bg-primary/10"
                  )}>
                    <IconComponent className={cn(
                      "w-6 h-6",
                      isEliminated ? "text-muted-foreground" : "text-primary"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-lg font-bold mb-1",
                      isEliminated ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {hypothesis.title}
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isEliminated ? "text-muted-foreground/60" : "text-muted-foreground"
                    )}>
                      {hypothesis.description}
                    </p>
                    
                    {isEliminated && justificationSummary && (
                      <div className="mt-2 text-xs text-muted-foreground/80 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>تم الاستبعاد بناءً على: {justificationSummary}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  {isEliminated ? (
                    <button
                      onClick={() => restoreHypothesis(hypothesis.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors text-sm"
                      data-testid={`button-restore-${hypothesis.id}`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>استعادة</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEliminate(hypothesis)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                      data-testid={`button-eliminate-${hypothesis.id}`}
                    >
                      <X className="w-4 h-4" />
                      <span>استبعاد</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-6 p-4 bg-secondary/30 rounded-xl border border-border/30">
        <p className="text-sm text-muted-foreground mb-3">
          افتح الأدلة، اسأل في المقابلات، وشوف البيانات… وبعدها استبعد اللي مش منطقي.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/evidence">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-primary/10 transition-colors cursor-pointer text-sm">
              <FileSearch className="w-4 h-4 text-primary" />
              <span>غرفة الأدلة</span>
            </div>
          </Link>
          <Link href="/interviews">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-accent/10 transition-colors cursor-pointer text-sm">
              <Users className="w-4 h-4 text-accent" />
              <span>المقابلات</span>
            </div>
          </Link>
          <Link href="/data">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-emerald-500/10 transition-colors cursor-pointer text-sm">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>مركز البيانات</span>
            </div>
          </Link>
        </div>
      </div>

      {selectedHypothesis && (
        <EliminationModal
          hypothesis={selectedHypothesis}
          onClose={() => setSelectedHypothesis(null)}
          onConfirm={handleConfirmElimination}
        />
      )}
    </div>
  );
}
