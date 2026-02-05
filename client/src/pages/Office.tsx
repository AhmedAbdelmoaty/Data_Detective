import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight, Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useGameStore, ReportResult } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Office() {
  const [_, setLocation] = useLocation();
  const {
    currentCase,
    startGame,
    visitOffice,
    gameStatus,
    lastReportResult,
    clearLastReportResult,
    resetGame,
    reportAttemptsLeft,
  } = useGameStore();

  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    visitOffice();
  }, [visitOffice]);

  const isBriefing = gameStatus === "briefing";
  const hasResult = !!lastReportResult;

  const badgeForOutcome = (outcome: ReportResult["outcome"]) => {
    if (outcome === "accepted") return { label: "مقبول", variant: "default" as const };
    if (outcome === "review") return { label: "راجع التقرير", variant: "secondary" as const };
    return { label: "غير مقبول", variant: "destructive" as const };
  };

  const statusMeta = (status: string) => {
    switch (status) {
      case "ok":
        return { label: "مقبول", variant: "default" as const, icon: CheckCircle2 };
      case "ok_noisy":
        return { label: "مقبول مع ملاحظة", variant: "secondary" as const, icon: AlertTriangle };
      case "trap":
        return { label: "فخ", variant: "destructive" as const, icon: AlertTriangle };
      case "invalid":
      default:
        return { label: "غير مقبول", variant: "destructive" as const, icon: XCircle };
    }
  };

  const handleRestart = () => {
    resetGame();
    setShowFeedback(false);
    setLocation("/");
  };

  const handleBackToAnalyst = () => {
    // رجوع طبيعي لمكتب المحلل
    clearLastReportResult();
    setShowFeedback(false);
    setLocation("/analyst");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full"
      >
        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 rounded-xl bg-primary/10 text-primary">
              <Briefcase className="w-8 h-8" />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">مكتب المدير</h1>
              <p className="text-muted-foreground leading-relaxed">
                عندنا مشكلة حصلت في الشركة، وعايزينك تراجع المعلومات بسرعة وتطلع بتفسير مقنع.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* 1) Briefing يظهر مرة واحدة فقط */}
            {isBriefing && (
              <>
                <div className="p-6 rounded-xl bg-secondary/20 border border-white/5">
                  <h2 className="text-xl font-bold text-foreground mb-3">{currentCase.title}</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {currentCase.managerBriefing}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Link
                    href="/analyst"
                    onClick={startGame}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>البدء في التحليل</span>
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </Link>
                </div>
              </>
            )}

            {/* 2) بعد التسليم: رد المدير فقط (منفصل عن الفيدباك) */}
            {!isBriefing && hasResult && lastReportResult && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-foreground">رد المدير</h2>
                  <Badge variant={badgeForOutcome(lastReportResult.outcome).variant}>
                    {badgeForOutcome(lastReportResult.outcome).label}
                  </Badge>
                </div>

                <div className="whitespace-pre-line text-sm leading-7 bg-secondary/20 border border-border/40 rounded-xl p-6">
                  {lastReportResult.managerMessage}
                </div>

                <div className="flex flex-wrap gap-3 justify-end">
                  {/* زر منفصل لعرض الفيدباك */}
                  <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        عرض التقييم
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                          <span>تقييم أدائك</span>
                          <div className="text-sm text-muted-foreground">{lastReportResult.scorePercent}%</div>
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Progress value={lastReportResult.scorePercent} />
                          <div className="text-sm text-muted-foreground">
                            المحاولات المتبقية: <span className="font-bold text-foreground">{reportAttemptsLeft}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="font-bold">سجل القرارات</div>
                          <div className="space-y-3">
                            {lastReportResult.ledger.map((s) => {
                              const title = currentCase.hypotheses.find((h) => h.id === s.hypothesisId)?.title || s.hypothesisId;
                              const meta = statusMeta(s.status);
                              const Icon = meta.icon;
                              const label =
                                s.kind === "support"
                                  ? `دعم الفرضية النهائية: ${title}`
                                  : `استبعاد فرضية: ${title}`;
                              return (
                                <div key={s.stepKey} className="p-4 rounded-xl border border-border/40 bg-secondary/10">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4" />
                                      <div className="font-bold text-sm">{label}</div>
                                    </div>
                                    <Badge variant={meta.variant}>{meta.label}</Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-2">{s.note}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {lastReportResult.learningCards.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {lastReportResult.learningCards.map((text, idx) => (
                              <div key={`${text}-${idx}`} className="p-4 rounded-xl border border-border/40 bg-secondary/10 text-sm">
                                {text}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3 justify-end">
                          {reportAttemptsLeft > 0 && (
                            <Button variant="secondary" onClick={handleBackToAnalyst}>
                              الرجوع لمكتب المحلل
                            </Button>
                          )}
                          <Button variant={reportAttemptsLeft > 0 ? "outline" : "default"} onClick={handleRestart}>
                            إعادة المحاولة من البداية
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" onClick={handleBackToAnalyst}>
                    الرجوع لمكتب المحلل
                  </Button>
                </div>
              </>
            )}

            {/* 3) أثناء اللعب: مكتب المدير بدون إعادة briefing */}
            {!isBriefing && !hasResult && (
              <>
                <div className="p-6 rounded-xl bg-secondary/20 border border-white/5">
                  <h2 className="text-xl font-bold text-foreground mb-2">المدير حالياً مشغول</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    ارجع لمكتب المحلل وكمّل تجميع المعلومات وتحليل الفرضيات.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setLocation("/analyst")} className="gap-2">
                    <span>الرجوع لمكتب المحلل</span>
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
