import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGameStore, ReportResult } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileText, Users, Database, CheckCircle2, AlertTriangle, XCircle, Sparkles } from "lucide-react";

type InfoItem = {
  key: string;
  type: "evidence" | "interview" | "data";
  id: string;
  title: string;
  detail: string;
};

function outcomeBadge(outcome: ReportResult["outcome"]) {
  if (outcome === "accepted") return { label: "مقبول", variant: "default" as const };
  if (outcome === "review") return { label: "راجع التقرير", variant: "secondary" as const };
  return { label: "غير مقبول", variant: "destructive" as const };
}

function statusMeta(status: string) {
  switch (status) {
    case "ok":
      return { label: "صح", variant: "default" as const, icon: CheckCircle2 };
    case "ok_noisy":
      return { label: "صح بس فيه زيادة", variant: "secondary" as const, icon: AlertTriangle };
    case "trap":
      return { label: "فخ", variant: "destructive" as const, icon: AlertTriangle };
    case "invalid":
    default:
      return { label: "غير صحيح", variant: "destructive" as const, icon: XCircle };
  }
}

export default function Report() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    gameStatus,
    currentCase,
    getRemainingHypotheses,
    selectedHypothesisId,
    selectFinalHypothesis,
    finalSupportJustifications,
    setFinalSupportJustifications,
    getDiscoveredEvidence,
    getCompletedInterviews,
    getDiscoveredInsights,
    getEliminationJustification,
    submitConclusion,
    resetGame,
    hasVisitedOffice,
    reportAttemptsLeft,
    eliminations,
  } = useGameStore();

  const [result, setResult] = useState<ReportResult | null>(null);

  useEffect(() => {
    if (!hasVisitedOffice || gameStatus === "briefing") setLocation("/office");
  }, [gameStatus, hasVisitedOffice, setLocation]);

  const remainingHypotheses = getRemainingHypotheses();
  const isReadyToReport = remainingHypotheses.length === 1;
  const finalHypothesis = isReadyToReport ? remainingHypotheses[0] : null;
  const attemptsDepleted = reportAttemptsLeft <= 0;

  // أي تغيير في المسودة يلغي نتيجة التقرير السابقة (عشان ما يحصلش "محاولة تانية مش بتتحدث")
  const draftKey = useMemo(() => {
    return JSON.stringify({
      selectedHypothesisId,
      finalSupportJustifications,
      eliminations: eliminations.map((e) => ({ hypothesisId: e.hypothesisId, justifications: e.justifications })),
    });
  }, [selectedHypothesisId, finalSupportJustifications, eliminations]);

  useEffect(() => {
    setResult(null);
  }, [draftKey]);

  const discoveredEvidence = getDiscoveredEvidence();
  const completedInterviews = getCompletedInterviews();
  const discoveredInsights = getDiscoveredInsights();

  const infoItems: InfoItem[] = useMemo(() => {
    const evItems: InfoItem[] = discoveredEvidence.map((ev) => ({
      key: `evidence:${ev.id}`,
      type: "evidence",
      id: ev.id,
      title: ev.title,
      detail: ev.description,
    }));

    const ivItems: InfoItem[] = completedInterviews.map((i) => ({
      key: `interview:${i.id}`,
      type: "interview",
      id: i.id,
      title: i.stakeholderName,
      detail: i.infoSummary,
    }));

    const dataItems: InfoItem[] = discoveredInsights.map((ins) => ({
      key: `data:${ins.id}`,
      type: "data",
      id: ins.id,
      title: ins.title,
      detail: ins.description,
    }));

    return [...evItems, ...ivItems, ...dataItems];
  }, [discoveredEvidence, completedInterviews, discoveredInsights]);

  const selectedSupportKeys = new Set(finalSupportJustifications.map((j) => `${j.type}:${j.id}`));

  const toggleSupport = (item: InfoItem) => {
    const key = item.key;
    const exists = selectedSupportKeys.has(key);

    if (!exists && finalSupportJustifications.length >= 2) {
      toast({
        title: "حد الأسباب",
        description: "اختر سبب واحد أو اثنين فقط لدعم الفرضية النهائية.",
      });
      return;
    }

    const next = exists
      ? finalSupportJustifications.filter((j) => `${j.type}:${j.id}` !== key)
      : [...finalSupportJustifications, { type: item.type, id: item.id }];

    setFinalSupportJustifications(next);
  };

  const handleConfirmHypothesis = () => {
    if (!finalHypothesis) return;
    selectFinalHypothesis(finalHypothesis.id);
  };

  const handleSubmit = () => {
    if (attemptsDepleted) return;
    const res = submitConclusion();
    setResult(res);
  };

  const handleRestart = () => {
    resetGame();
    setResult(null);
    setLocation("/");
  };

  const iconFor = (type: InfoItem["type"]) => {
    if (type === "evidence") return FileText;
    if (type === "interview") return Users;
    return Database;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">التقرير النهائي</h1>
        <p className="text-muted-foreground">
          هدف التقرير إنك تثبت إنك قفلت الاحتمالات بهدوء… من غير حشو، ومن غير قفزات.
        </p>
        <div className="text-sm text-muted-foreground">
          المحاولات المتبقية: <span className="font-bold text-foreground">{reportAttemptsLeft}</span>
        </div>
      </header>

      {attemptsDepleted && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>انتهت المحاولات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>خلصت كل محاولات التقرير. علشان تكمل، لازم تعيد البداية.</AlertDescription>
            </Alert>
            <Button onClick={handleRestart} className="w-full">
              إعادة المحاولة من البداية
            </Button>
          </CardContent>
        </Card>
      )}

      {!isReadyToReport && !attemptsDepleted && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>التقرير غير جاهز بعد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                لازم تسيب <b>فرضية واحدة فقط</b> قبل ما تقدّم التقرير.
                <br />
                ارجع للوحة الفرضيات واستبعد الباقي بأسباب واضحة.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-muted-foreground">
              المتبقي الآن: <b>{remainingHypotheses.length}</b> فرضيات
            </div>
            <Button variant="secondary" onClick={() => setLocation("/hypotheses")}> 
              الرجوع للوحة الفرضيات
            </Button>
          </CardContent>
        </Card>
      )}

      {isReadyToReport && finalHypothesis && !attemptsDepleted && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>الفرضية المتبقية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-5 rounded-xl bg-secondary/30 border border-white/5">
              <div className="font-bold text-lg">{finalHypothesis.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{finalHypothesis.description}</div>
            </div>

            {!selectedHypothesisId ? (
              <Button onClick={handleConfirmHypothesis} className="w-full">
                تأكيد هذه الفرضية كسبب رئيسي
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">اختر 1–2 معلومات تدعم الفرضية</h3>
                  <Badge variant="secondary">{finalSupportJustifications.length} / 2</Badge>
                </div>

                {infoItems.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      لسه ما جمعتش معلومات كفاية. ارجع للأدلة/المقابلات/البيانات وسجّل اللي اكتشفته.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {infoItems.map((item) => {
                      const Icon = iconFor(item.type);
                      const checked = selectedSupportKeys.has(item.key);
                      return (
                        <button
                          key={item.key}
                          onClick={() => toggleSupport(item)}
                          className={
                            "text-right p-4 rounded-xl border transition-all " +
                            (checked
                              ? "border-primary/60 bg-primary/10"
                              : "border-border/40 bg-secondary/20 hover:bg-secondary/30")
                          }
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-primary">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm">{item.title}</div>
                              <div className="text-xs text-muted-foreground whitespace-pre-line mt-1">
                                {item.detail}
                              </div>
                            </div>
                            <div className="mt-1">
                              {checked ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-border/60" />
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <Button onClick={handleSubmit} className="w-full" disabled={finalSupportJustifications.length === 0}>
                  تقديم التقرير
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>رد المدير</span>
              <Badge variant={outcomeBadge(result.outcome).variant}>{outcomeBadge(result.outcome).label}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="whitespace-pre-line text-sm leading-7 bg-secondary/20 border border-border/40 rounded-xl p-5">
              {result.managerMessage}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  جودة التقرير
                </div>
                <div className="text-sm text-muted-foreground">{result.scorePercent}%</div>
              </div>
              <Progress value={result.scorePercent} />
              <p className="text-xs text-muted-foreground">
                دي جودة تقريرك (مش "حل صح/غلط" بس). كل ضوضاء أو قرار غير صحيح بيأثر.
              </p>
            </div>

            <div className="space-y-3">
              <div className="font-bold">سجل القرارات</div>
              <div className="space-y-3">
                {result.ledger.map((s) => {
                  const title = currentCase.hypotheses.find((h) => h.id === s.hypothesisId)?.title || s.hypothesisId;
                  const meta = statusMeta(s.status);
                  const Icon = meta.icon;
                  const label = s.kind === "support" ? `دعم: ${title}` : `استبعاد: ${title}`;
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

            {result.issues.length > 0 && (
              <div className="space-y-3">
                <div className="font-bold">ملاحظات تساعدك تتحسن (بدون كشف الحل)</div>
                <div className="space-y-3">
                  {result.issues.map((g) => (
                    <div key={g.type} className="p-4 rounded-xl border border-border/40 bg-secondary/10">
                      <div className="font-bold text-sm mb-2">{g.title}</div>
                      <ul className="list-disc pr-5 space-y-1 text-xs text-muted-foreground">
                        {g.items.map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {reportAttemptsLeft > 0 && (
                <Button variant="secondary" onClick={() => setLocation("/hypotheses")}>
                  الرجوع للوحة الفرضيات
                </Button>
              )}
              <Button variant={reportAttemptsLeft > 0 ? "outline" : "default"} onClick={handleRestart}>
                إعادة المحاولة من البداية
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>ملخص تقريرك حتى الآن</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-secondary/20 border border-border/40">
              <div className="text-muted-foreground text-xs mb-1">الأدلة التي فتحتها</div>
              <div className="font-bold">{discoveredEvidence.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/20 border border-border/40">
              <div className="text-muted-foreground text-xs mb-1">الأسئلة التي سألتها</div>
              <div className="font-bold">{completedInterviews.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-secondary/20 border border-border/40">
              <div className="text-muted-foreground text-xs mb-1">رؤى البيانات المسجلة</div>
              <div className="font-bold">{discoveredInsights.length}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-bold">الفرضيات المستبعدة</div>
            {currentCase.hypotheses
              .filter((h) => h.id !== finalHypothesis?.id)
              .map((h) => {
                const elim = getEliminationJustification(h.id);
                if (!elim) return null;
                const count = elim.justifications.length;
                return (
                  <div key={h.id} className="p-4 rounded-xl bg-secondary/10 border border-border/40">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm">{h.title}</div>
                      <Badge variant="secondary">{count} سبب</Badge>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
