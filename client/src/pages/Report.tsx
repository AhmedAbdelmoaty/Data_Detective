import { useGameStore } from "@/store/gameStore";
import {
  FileText,
  AlertTriangle,
  Send,
  Target,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  BarChart3,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";

type PickRef = { type: "evidence" | "interview" | "data"; id: string };

export default function Report() {
  const {
    currentCase,
    submitConclusion,
    getRemainingHypotheses,
    eliminations,
    selectedHypothesisId,
    selectFinalHypothesis,
    resetGame,
    getDiscoveredEvidence,
    getCompletedInterviews,
    getDiscoveredInsights,
    finalSupport,
    setFinalSupport,
  } = useGameStore();

  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [showSupport, setShowSupport] = useState(true);

  const remainingHypotheses = getRemainingHypotheses();
  const eliminatedCount = eliminations.length;
  const totalHypotheses = currentCase.hypotheses.length;

  const remaining = remainingHypotheses[0] ?? null;

  const discoveredEvidence = getDiscoveredEvidence();
  const completedInterviews = getCompletedInterviews();
  const discoveredInsights = getDiscoveredInsights();

  const supportPicked = finalSupport as PickRef[];

  const canOpenReport = remainingHypotheses.length === 1;

  const supportCountLabel = useMemo(() => {
    if (supportPicked.length === 0) return "اختياري (0/2)";
    if (supportPicked.length === 1) return "مختار 1/2";
    return "مختار 2/2";
  }, [supportPicked.length]);

  const isPicked = (type: PickRef["type"], id: string) =>
    supportPicked.some((x) => x.type === type && x.id === id);

  const toggleSupport = (type: PickRef["type"], id: string) => {
    const exists = isPicked(type, id);
    if (exists) {
      setFinalSupport(supportPicked.filter((x) => !(x.type === type && x.id === id)));
      return;
    }
    if (supportPicked.length >= 2) return;
    setFinalSupport([...supportPicked, { type, id }]);
  };

  const handleSubmit = () => {
    if (!remaining) return;

    // ✅ السبب النهائي اتحسم بالاستبعاد، فبنثبته تلقائيًا للتوافق مع الـstore الحالي
    selectFinalHypothesis(remaining.id);

    const res = submitConclusion();
    setResult(res);
  };

  // ====== RESULT SCREEN ======
  if (result) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "max-w-2xl w-full rounded-2xl p-8 text-center",
            result.correct
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30"
              : "bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30"
          )}
        >
          <div
            className={cn(
              "w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center",
              result.correct ? "bg-green-500/20" : "bg-red-500/20"
            )}
          >
            {result.correct ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-red-500" />
            )}
          </div>

          <h2
            className={cn(
              "text-2xl font-bold mb-4",
              result.correct ? "text-green-500" : "text-red-500"
            )}
          >
            {result.correct ? "التقرير اتقبل" : "التقرير محتاج مراجعة"}
          </h2>

          <p className="text-muted-foreground leading-relaxed mb-8">{result.feedback}</p>

          <button
            onClick={() => {
              resetGame();
              setResult(null);
            }}
            className="flex items-center gap-2 px-6 py-3 mx-auto rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            data-testid="button-play-again"
          >
            <RotateCcw className="w-5 h-5" />
            <span>ابدأ من جديد</span>
          </button>
        </motion.div>
      </div>
    );
  }

  // ====== LOCKED REPORT (NOT READY) ======
  if (!canOpenReport) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="glass-card rounded-2xl p-8 border border-border/50">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">التقرير لسه مقفول</h1>
              <p className="text-muted-foreground leading-7">
                مينفعش تسلّم تقرير دلوقتي. لازم تفضّل{" "}
                <span className="font-bold text-foreground">فرضية واحدة</span> بس.
              </p>

              <div className="mt-4 bg-secondary/30 rounded-xl p-4 border border-border/40">
                <div className="text-sm text-muted-foreground">
                  استبعدت: <span className="font-mono text-foreground">{eliminatedCount}</span> /{" "}
                  {totalHypotheses}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  المتبقي:{" "}
                  <span className="font-mono text-foreground">{remainingHypotheses.length}</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/hypotheses"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  <span>ارجع للفرضيات</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====== READY REPORT ======
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          التقرير النهائي
        </h1>
        <p className="text-muted-foreground">
          السبب اتحسم بالاستبعاد. لو حابب… اختار معلومة أو اتنين تسند بيهم تقريرك.
        </p>
      </header>

      {/* Final hypothesis only */}
      {remaining && (
        <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Target className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1">
              <div className="text-sm text-muted-foreground">السبب اللي وصلتله:</div>
              <div className="text-xl font-bold text-foreground mt-1">{remaining.title}</div>
              <div className="text-sm text-muted-foreground mt-2 leading-6">
                {remaining.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support section */}
      <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
        <button
          onClick={() => setShowSupport((v) => !v)}
          className="w-full flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors"
          data-testid="toggle-support-section"
        >
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-500" />
            <div className="text-right">
              <div className="font-bold text-foreground">دعم التقرير (اختياري)</div>
              <div className="text-sm text-muted-foreground">{supportCountLabel}</div>
            </div>
          </div>

          {showSupport ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {showSupport && (
          <div className="p-6 border-t border-border/40 space-y-6">
            <p className="text-sm text-muted-foreground leading-6">
              اختار <span className="font-medium text-foreground">0–2</span> معلومات تساعد المدير
              يفهم ليه أنت مقتنع بالسبب ده.
            </p>

            {/* Evidence */}
            {discoveredEvidence.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  أدلة
                </h3>
                <div className="space-y-2">
                  {discoveredEvidence.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => toggleSupport("evidence", ev.id)}
                      className={cn(
                        "w-full text-right p-4 rounded-xl border-2 transition-all",
                        isPicked("evidence", ev.id)
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/30"
                      )}
                      data-testid={`support-evidence-${ev.id}`}
                    >
                      <div className="font-medium text-foreground">{ev.title}</div>
                      <div className="text-sm text-muted-foreground mt-1 leading-6">
                        {ev.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interviews as info */}
            {completedInterviews.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  معلومات من المقابلات
                </h3>
                <div className="space-y-2">
                  {completedInterviews.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => toggleSupport("interview", it.id)}
                      className={cn(
                        "w-full text-right p-4 rounded-xl border-2 transition-all",
                        isPicked("interview", it.id)
                          ? "border-accent bg-accent/10"
                          : "border-border/50 hover:border-accent/30"
                      )}
                      data-testid={`support-interview-${it.id}`}
                    >
                      <div className="text-xs text-muted-foreground mb-1">{it.stakeholderName}</div>
                      <div className="text-sm text-muted-foreground leading-6">{it.response}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Data */}
            {discoveredInsights.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  معلومات من البيانات
                </h3>
                <div className="space-y-2">
                  {discoveredInsights.map((ins) => (
                    <button
                      key={ins.id}
                      onClick={() => toggleSupport("data", ins.id)}
                      className={cn(
                        "w-full text-right p-4 rounded-xl border-2 transition-all",
                        isPicked("data", ins.id)
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-border/50 hover:border-emerald-500/30"
                      )}
                      data-testid={`support-data-${ins.id}`}
                    >
                      <div className="text-xs text-muted-foreground mb-1">{ins.datasetName}</div>
                      <div className="text-sm text-muted-foreground leading-6">{ins.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {discoveredEvidence.length === 0 &&
              completedInterviews.length === 0 &&
              discoveredInsights.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  مفيش معلومات مسجلة لحد دلوقتي… تقدر تسلّم التقرير بدون دعم.
                </div>
              )}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/hypotheses"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
        >
          <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          <span>رجوع للفرضيات</span>
        </Link>

        <button
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold"
          data-testid="button-submit-report"
        >
          <Send className="w-5 h-5" />
          <span>تقديم التقرير النهائي</span>
        </button>
      </div>
    </div>
  );
}
