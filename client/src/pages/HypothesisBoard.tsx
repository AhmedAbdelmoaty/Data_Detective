import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { EliminationModal } from "@/components/EliminationModal";
import { Hypothesis } from "@shared/schema";
import {
  Lightbulb,
  XCircle,
  CheckCircle,
  FileText,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function HypothesisBoard() {
  const {
    currentCase,
    getRemainingHypotheses,
    eliminations,
    isHypothesisEliminated,
    eliminateHypothesis,
    restoreHypothesis,
    resetGame,
  } = useGameStore();

  const remaining = getRemainingHypotheses();
  const remainingCount = remaining.length;
  const eliminatedCount = eliminations.length;
  const total = currentCase.hypotheses.length;

  const [activeModalHypothesis, setActiveModalHypothesis] = useState<Hypothesis | null>(null);
  const [showEliminated, setShowEliminated] = useState(false);

  const eliminatedHypotheses = useMemo(() => {
    const eliminatedIds = new Set(eliminations.map((e) => e.hypothesisId));
    return currentCase.hypotheses.filter((h) => eliminatedIds.has(h.id));
  }, [currentCase.hypotheses, eliminations]);

  const canOpenReport = remainingCount === 1;

  const openEliminateModal = (h: Hypothesis) => setActiveModalHypothesis(h);

  const onConfirmElimination = (justifications: { type: "evidence" | "interview" | "data"; id: string }[]) => {
    if (!activeModalHypothesis) return;
    eliminateHypothesis(activeModalHypothesis.id, justifications);
    setActiveModalHypothesis(null);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-primary" />
            لوحة الفرضيات
          </h1>
          <p className="text-muted-foreground mt-2">
            استبعد الفرضيات بمعلومات واضحة… لحد ما تفضّل فرضية واحدة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetGame}
            className="px-4 py-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-2"
            data-testid="button-reset-game"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة</span>
          </button>

          <Link
            href={canOpenReport ? "/report" : "/hypotheses"}
            className={cn(
              "px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors",
              canOpenReport
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            data-testid="button-go-report"
          >
            <FileText className="w-4 h-4" />
            <span>التقرير</span>
          </Link>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-muted-foreground">
            المتبقي:{" "}
            <span className="font-mono text-foreground font-bold">{remainingCount}</span> / {total}
          </div>

          <div className="text-sm text-muted-foreground">
            المستبعد:{" "}
            <span className="font-mono text-foreground font-bold">{eliminatedCount}</span> / {total}
          </div>

          <div className={cn("text-sm font-medium", canOpenReport ? "text-emerald-400" : "text-amber-400")}>
            {canOpenReport ? "جاهز للتقرير ✅" : "لسه محتاج تستبعد فرضيات"}
          </div>
        </div>

        <div className="mt-4 h-2 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.round((eliminatedCount / total) * 100)}%` }}
          />
        </div>

        {!canOpenReport && (
          <div className="mt-4 text-xs text-muted-foreground">
            التقرير مش هيفتح غير لما تفضل فرضية واحدة.
          </div>
        )}
      </div>

      {/* Remaining hypotheses (main list) */}
      <div className="flex-1 space-y-4 pb-24">
        <AnimatePresence mode="popLayout">
          {remaining.map((h) => (
            <motion.div
              key={h.id}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="bg-card border border-border/50 rounded-2xl p-6 flex items-start justify-between gap-6"
            >
              <div className="min-w-0">
                <div className="font-bold text-lg text-foreground">{h.title}</div>
                <div className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {h.description}
                </div>
              </div>

              <button
                onClick={() => openEliminateModal(h)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex-shrink-0"
                data-testid={`button-eliminate-${h.id}`}
              >
                <XCircle className="w-4 h-4" />
                <span>استبعاد</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* If only one left, show a strong callout */}
        {canOpenReport && remaining[0] && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5" />
              <div className="min-w-0">
                <div className="font-bold text-foreground mb-1">فضِلت فرضية واحدة</div>
                <div className="text-sm text-muted-foreground">
                  دلوقتي تقدر تفتح التقرير وتدعم الفرضية بمعلومة أو اتنين (اختياري).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Eliminated hypotheses (optional panel) */}
        {eliminatedHypotheses.length > 0 && (
          <div className="bg-secondary/20 border border-border/40 rounded-2xl">
            <button
              onClick={() => setShowEliminated((v) => !v)}
              className="w-full flex items-center justify-between p-5 text-right"
              data-testid="toggle-eliminated-panel"
            >
              <div>
                <div className="font-bold text-foreground">الفرضيات المستبعدة</div>
                <div className="text-xs text-muted-foreground mt-1">
                  لو حابب تعدّل، تقدر ترجع فرضية واحدة من هنا
                </div>
              </div>

              {showEliminated ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {showEliminated && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-5 space-y-3"
                >
                  {eliminatedHypotheses.map((h) => (
                    <div
                      key={h.id}
                      className="bg-card border border-border/50 rounded-xl p-4 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{h.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {h.description}
                        </div>
                      </div>

                      <button
                        onClick={() => restoreHypothesis(h.id)}
                        className="px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm flex-shrink-0"
                        data-testid={`button-restore-${h.id}`}
                      >
                        رجّع
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      {activeModalHypothesis && !isHypothesisEliminated(activeModalHypothesis.id) && (
        <EliminationModal
          hypothesis={activeModalHypothesis}
          onClose={() => setActiveModalHypothesis(null)}
          onConfirm={onConfirmElimination}
        />
      )}
    </div>
  );
}
