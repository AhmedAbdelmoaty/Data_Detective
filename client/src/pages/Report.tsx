import { useGameStore } from "@/store/gameStore";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Send,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  BarChart3,
} from "lucide-react";

type RefType = "evidence" | "interview" | "data";
type SupportRef = { type: RefType; id: string };

export default function Report() {
  const {
    currentCase,
    submitConclusion,
    resetGame,
    getRemainingHypotheses,
    eliminations,
    selectedHypothesisId,
    selectFinalHypothesis,
    getDiscoveredEvidence,
    getCompletedInterviews,
    getDiscoveredInsights,
    finalSupport,
    setFinalSupport,
  } = useGameStore();

  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const remaining = getRemainingHypotheses();

  const discoveredEvidence = getDiscoveredEvidence();
  const completedInterviews = getCompletedInterviews();
  const discoveredInsights = getDiscoveredInsights();

  const selectedSet = useMemo(
    () => new Set(finalSupport.map((x) => `${x.type}:${x.id}`)),
    [finalSupport]
  );

  const toggleSupport = (ref: SupportRef) => {
    const key = `${ref.type}:${ref.id}`;
    const exists = selectedSet.has(key);

    if (exists) {
      setFinalSupport(finalSupport.filter((x) => !(x.type === ref.type && x.id === ref.id)));
      return;
    }

    // Level 1: حد أقصى 2 دعم (بسيطة وواضحة)
    if (finalSupport.length >= 2) return;

    setFinalSupport([...finalSupport, ref]);
  };

  const handleSubmit = () => {
    if (!selectedHypothesisId) return;
    const res = submitConclusion();
    setResult(res);
  };

  if (result) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "max-w-2xl w-full rounded-2xl p-8 text-right",
            result.correct
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30"
              : "bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30"
          )}
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                result.correct ? "bg-green-500/20" : "bg-red-500/20"
              )}
            >
              {result.correct ? (
                <CheckCircle className="w-7 h-7 text-green-500" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-red-500" />
              )}
            </div>

            <div className="flex-1">
              <div className={cn("text-xl font-bold mb-2", result.correct ? "text-green-500" : "text-red-500")}>
                {result.correct ? "تمام" : "مش مكتمل"}
              </div>

              <div className="bg-card/40 border border-border/50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap text-slate-200">
                {result.feedback}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              resetGame();
              setResult(null);
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            data-testid="button-play-again"
          >
            <RotateCcw className="w-5 h-5" />
            <span>ابدأ من جديد</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          التقرير
        </h1>
        <p className="text-muted-foreground">
          قدّم السبب النهائي اللي وصلت له… و(لو تحب) اسنده بمعلومة أو اتنين.
        </p>
      </header>

      {/* لازم فرضية واحدة */}
      {remaining.length !== 1 ? (
        <div className="bg-amber-500/10 rounded-2xl border border-amber-500/30 p-6 text-right">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5" />
            <div>
              <div className="font-bold text-foreground mb-1">لسه ماينفعش تقدم تقرير</div>
              <div className="text-sm text-muted-foreground">
                لازم تفضل فرضية واحدة بس. ارجع للوحة الفرضيات وكمل الاستبعاد.
              </div>

              <Link
                href="/hypotheses"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للوحة الفرضيات
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-6">
          <div className="bg-accent/10 rounded-xl p-5 border border-accent/25">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-accent" />
              <span className="font-bold text-foreground">السبب النهائي</span>
            </div>

            <div className="bg-card rounded-lg p-4 border border-accent/20">
              <div className="font-bold text-lg text-foreground">{remaining[0].title}</div>
              <div className="text-muted-foreground mt-1">{remaining[0].description}</div>
            </div>

            {!selectedHypothesisId && (
              <button
                onClick={() => selectFinalHypothesis(remaining[0].id)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                data-testid="button-confirm-hypothesis"
              >
                <CheckCircle className="w-5 h-5" />
                <span>تأكيد السبب</span>
              </button>
            )}
          </div>

          {/* دعم اختياري بعد تأكيد السبب */}
          {selectedHypothesisId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">دعم القرار (اختياري)</div>
                  <div className="text-sm text-muted-foreground">
                    اختار معلومة أو اتنين بس… عشان يبقى التقرير واضح.
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  المختار: {finalSupport.length} / 2
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {discoveredEvidence.map((ev) => {
                  const on = selectedSet.has(`evidence:${ev.id}`);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => toggleSupport({ type: "evidence", id: ev.id })}
                      className={cn(
                        "text-right p-4 rounded-xl border-2 transition-all",
                        on ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-primary mt-1" />
                        <div>
                          <div className="font-medium text-foreground">{ev.title}</div>
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{ev.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {completedInterviews.map((i) => {
                  const on = selectedSet.has(`interview:${i.id}`);
                  return (
                    <button
                      key={i.id}
                      onClick={() => toggleSupport({ type: "interview", id: i.id })}
                      className={cn(
                        "text-right p-4 rounded-xl border-2 transition-all",
                        on ? "border-accent bg-accent/10" : "border-border/50 hover:border-accent/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-accent mt-1" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">{i.stakeholderName}</div>
                          <div className="font-medium text-foreground leading-relaxed">
                            {i.response}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {discoveredInsights.map((ins) => {
                  const on = selectedSet.has(`data:${ins.id}`);
                  return (
                    <button
                      key={ins.id}
                      onClick={() => toggleSupport({ type: "data", id: ins.id })}
                      className={cn(
                        "text-right p-4 rounded-xl border-2 transition-all",
                        on ? "border-emerald-500 bg-emerald-500/10" : "border-border/50 hover:border-emerald-500/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <BarChart3 className="w-4 h-4 text-emerald-500 mt-1" />
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">{ins.datasetName}</div>
                          <div className="font-medium text-foreground">{ins.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* مسار التفكير (مختصر) */}
              {eliminations.length > 0 && (
                <div className="bg-secondary/20 rounded-xl border border-border/40 p-4">
                  <div className="text-sm text-muted-foreground mb-2">استبعدت:</div>
                  <div className="flex flex-wrap gap-2">
                    {eliminations.map((e) => {
                      const h = currentCase.hypotheses.find((x) => x.id === e.hypothesisId);
                      if (!h) return null;
                      return (
                        <span key={e.hypothesisId} className="text-xs px-3 py-1 rounded-full bg-card border border-border/50 text-muted-foreground">
                          {h.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-lg font-bold"
                data-testid="button-submit-report"
              >
                <Send className="w-6 h-6" />
                <span>تقديم التقرير</span>
              </motion.button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
