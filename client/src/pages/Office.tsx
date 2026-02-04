import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useGameStore, ReportResult } from "@/store/gameStore";
import { cn } from "@/lib/utils";

function outcomeBadge(outcome: ReportResult["outcome"]) {
  if (outcome === "accepted") return { label: "مقبول", className: "bg-emerald-500/15 text-emerald-400" };
  if (outcome === "review") return { label: "راجع التقرير", className: "bg-amber-500/15 text-amber-400" };
  return { label: "غير مقبول", className: "bg-destructive/15 text-destructive" };
}

export default function Office() {
  const [_, setLocation] = useLocation();
  const {
    currentCase,
    startGame,
    visitOffice,
    gameStatus,
    hasVisitedOffice,
    getRemainingHypotheses,
    selectedHypothesisId,
    finalSupportJustifications,
    eliminations,
    reportAttemptsLeft,
    submitConclusion,
    resetGame,
    lastReportResult,
  } = useGameStore();

  const [showTraining, setShowTraining] = useState(false);

  useEffect(() => {
    visitOffice();
  }, [visitOffice]);

  // في حالة رجع هنا وهو لسه في intro (قبل زيارة المكتب) — نخليه طبيعي
  useEffect(() => {
    if (!hasVisitedOffice && gameStatus === "briefing") {
      // لا حاجة لعمل redirect، دي أول محطة
      return;
    }
  }, [hasVisitedOffice, gameStatus]);

  const remainingHypotheses = getRemainingHypotheses();

  const isReadyToSubmit = useMemo(() => {
    if (reportAttemptsLeft <= 0) return false;
    if (remainingHypotheses.length !== 1) return false;
    const finalId = remainingHypotheses[0].id;
    if (selectedHypothesisId !== finalId) return false;
    if (finalSupportJustifications.length < 1) return false;
    return true;
  }, [remainingHypotheses, selectedHypothesisId, finalSupportJustifications, reportAttemptsLeft]);

  // ملخص الاستبعادات (سطر لكل فرضية مستبعدة)
  const eliminationSummary = useMemo(() => {
    const mapTitle = new Map(currentCase.hypotheses.map((h) => [h.id, h.title] as const));
    return eliminations
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e) => {
        const title = mapTitle.get(e.hypothesisId) || e.hypothesisId;
        const firstReason = e.justifications[0];
        const reasonText = firstReason
          ? firstReason.type === "evidence"
            ? "دليل"
            : firstReason.type === "interview"
              ? "مقابلة"
              : "بيانات"
          : "";
        return { title, reasonText };
      });
  }, [eliminations, currentCase.hypotheses]);

  const handleStart = () => {
    startGame();
    setLocation("/hypotheses");
  };

  const handleBackToAnalyst = () => {
    setLocation("/hypotheses");
  };

  const handleSubmit = () => {
    setShowTraining(false);
    submitConclusion();
  };

  const handleRestart = () => {
    resetGame();
    setShowTraining(false);
    setLocation("/");
  };

  const result = lastReportResult;
  const showResult = !!result && (gameStatus === "solved" || gameStatus === "failed" || gameStatus === "playing");
  const attemptsDepleted = reportAttemptsLeft <= 0;

  // عنوان مختصر للتقدم
  const progressLine = useMemo(() => {
    if (remainingHypotheses.length === 1) return "باقي فرضية واحدة.";
    return `الفرضيات المتبقية: ${remainingHypotheses.length} / ${currentCase.hypotheses.length}`;
  }, [remainingHypotheses.length, currentCase.hypotheses.length]);

  const badge = result ? outcomeBadge(result.outcome) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-secondary/20">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl w-full">
        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-xl bg-primary/10 text-primary">
              <Briefcase className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-3xl font-bold text-foreground">مكتب المدير</h1>
                {badge && (
                  <div className={cn("px-3 py-1 rounded-full text-xs font-bold", badge.className)}>
                    {badge.label}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed mt-2">
                {gameStatus === "briefing"
                  ? "عايزينك تراجع المعلومات وتطلع بتفسير واحد واضح مبني على معلومات."
                  : "لو محتاج ترجع للبريف أو تشوف تقدمك… أنت في المكان الصح."}
              </p>
            </div>
          </div>

          {/* بطاقة التكليف */}
          <div className="p-6 rounded-xl bg-secondary/20 border border-white/5">
            <h2 className="text-xl font-bold text-foreground mb-3">{currentCase.title}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{currentCase.managerBriefing}</p>
            <div className="mt-4 text-sm text-muted-foreground flex flex-wrap items-center gap-3">
              <div className="px-3 py-1 rounded-lg bg-card/50 border border-border/40">
                {progressLine}
              </div>
              <div className="px-3 py-1 rounded-lg bg-card/50 border border-border/40">
                المحاولات المتبقية: <span className="font-bold text-foreground">{reportAttemptsLeft}</span>
              </div>
            </div>
          </div>

          {/* قبل البدء */}
          {gameStatus === "briefing" && (
            <div className="flex justify-end">
              <button
                onClick={handleStart}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>ابدأ التحليل</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>
          )}

          {/* أثناء اللعب: رجوع لمكتب المحلل */}
          {gameStatus !== "briefing" && !showResult && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-muted-foreground">
                {remainingHypotheses.length !== 1
                  ? "لسه مش جاهز للتقرير. كمل استبعاد فرضيات بأسباب واضحة." 
                  : selectedHypothesisId !== remainingHypotheses[0].id
                    ? "باقي خطوة: أكد الفرضية المتبقية من مكتب المحلل." 
                    : finalSupportJustifications.length === 0
                      ? "باقي خطوة: اختر 1–2 معلومات تدعم الفرضية النهائية من مكتب المحلل." 
                      : "ممتاز… تقدر تجهز التقرير للتسليم."}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={handleBackToAnalyst}
                  className="px-5 py-3 rounded-xl bg-card hover:bg-secondary/40 border border-border/40 font-bold transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>الرجوع لمكتب المحلل</span>
                </button>

                {isReadyToSubmit && (
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-3 rounded-xl bg-accent text-accent-foreground font-bold hover:bg-accent/90 transition-colors"
                  >
                    تسليم التقرير الآن
                  </button>
                )}
              </div>

              {/* ملخص بسيط للاستبعادات (للمحاكاة) */}
              {eliminationSummary.length > 0 && (
                <div className="mt-2 bg-card/30 border border-border/40 rounded-xl p-5">
                  <div className="font-bold mb-2">ملخص قراراتك حتى الآن</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {eliminationSummary.map((e, idx) => (
                      <div key={`${e.title}-${idx}`}>• استبعدت: <span className="font-medium text-foreground">{e.title}</span></div>
                    ))}
                    {remainingHypotheses.length === 1 && (
                      <div className="pt-2">• السبب المتبقي: <span className="font-medium text-foreground">{remainingHypotheses[0].title}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* بعد التسليم: رد المدير + ملاحظات التدريب منفصلة */}
          {showResult && result && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-secondary/20 border border-border/40 whitespace-pre-line leading-7">
                <div className="font-bold mb-2">رد المدير</div>
                <div className="text-sm text-muted-foreground">{result.managerMessage}</div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => setShowTraining((v) => !v)}
                  className="px-5 py-3 rounded-xl bg-card hover:bg-secondary/40 border border-border/40 font-bold transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{showTraining ? "إخفاء ملاحظات التدريب" : "عرض ملاحظات التدريب"}</span>
                </button>
                <button
                  onClick={handleRestart}
                  className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>

              {showTraining && (
                <div className="bg-card/30 border border-border/40 rounded-xl p-5 space-y-4">
                  <div className="font-bold">ملاحظات التدريب</div>
                  <div className="text-sm text-muted-foreground">
                    النتيجة: <span className="font-bold text-foreground">{result.scorePercent}%</span>
                    {attemptsDepleted ? " (انتهت المحاولات)" : ""}
                  </div>

                  {result.learningCards.length > 0 ? (
                    <div className="space-y-3">
                      {result.learningCards.map((c, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-secondary/10 border border-border/40">
                          <div className="font-bold text-sm mb-1">{c.title}</div>
                          <div className="text-sm text-muted-foreground whitespace-pre-line">{c.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">لا توجد ملاحظات إضافية.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* لو المحاولات خلصت بدون نتيجة ظاهرة */}
          {attemptsDepleted && !showResult && gameStatus !== "briefing" && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-5">
              <div className="font-bold text-destructive mb-1">انتهت المحاولات</div>
              <div className="text-sm text-muted-foreground">علشان تكمل، لازم تعيد البدء.</div>
              <div className="mt-4">
                <button onClick={handleRestart} className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
                  إعادة البدء
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
