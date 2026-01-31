import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useGameStore, ReportResult } from "@/store/gameStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileText, Users, Database, CheckCircle2, AlertTriangle } from "lucide-react";

type InfoItem = {
  key: string;
  type: "evidence" | "interview" | "data";
  id: string;
  title: string;
  detail: string;
};

function levelBadge(level: string) {
  switch (level) {
    case "strong":
      return { label: "قوي", variant: "default" as const, icon: CheckCircle2 };
    case "good":
      return { label: "مقبول", variant: "secondary" as const, icon: CheckCircle2 };
    case "mixed":
      return { label: "مختلط", variant: "secondary" as const, icon: AlertTriangle };
    case "weak":
      return { label: "ضعيف", variant: "outline" as const, icon: AlertTriangle };
    case "trap":
      return { label: "مضلل", variant: "destructive" as const, icon: AlertTriangle };
    case "irrelevant":
      return { label: "بعيد", variant: "destructive" as const, icon: AlertTriangle };
    default:
      return { label: "غير واضح", variant: "outline" as const, icon: AlertTriangle };
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
  } = useGameStore();

  const [result, setResult] = useState<ReportResult | null>(null);

  useEffect(() => {
    if (!hasVisitedOffice || gameStatus === "briefing") setLocation("/office");
  }, [gameStatus, hasVisitedOffice, setLocation]);

  const remainingHypotheses = getRemainingHypotheses();
  const isReadyToReport = remainingHypotheses.length === 1;
  const finalHypothesis = isReadyToReport ? remainingHypotheses[0] : null;

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
      detail: `سؤال: ${i.text}\nإجابة: ${i.response}`,
    }));

    const dataItems: InfoItem[] = discoveredInsights.map((ins) => ({
      key: `data:${ins.id}`,
      type: "data",
      id: ins.id,
      title: ins.datasetName,
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
    // reset any previous run support choices
    setFinalSupportJustifications([]);
  };

  const handleSubmit = () => {
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
          اكتب تقريرك بشكل مقنع: استبعاد الفرضيات لازم يكون له أسباب واضحة، وكمان دعم الفرضية النهائية.
        </p>
      </header>

      {/* Locked state (page still visible) */}
      {!isReadyToReport && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>التقرير غير جاهز بعد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                لازم تفضل <b>فرضية واحدة فقط</b> قبل ما تقدّم التقرير.
                <br />
                ارجع للوحة الفرضيات واستبعد الباقي بمعلومات واضحة.
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

      {/* Ready state */}
      {isReadyToReport && finalHypothesis && (
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

                <Button
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={finalSupportJustifications.length === 0}
                >
                  تقديم التقرير
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>رد المدير</span>
              <Badge variant={result.accepted ? "default" : "destructive"}>
                {result.accepted ? "مقبول" : "غير مقبول"}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="whitespace-pre-line text-sm leading-7 bg-secondary/20 border border-border/40 rounded-xl p-5">
              {result.managerMessage}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold">تقييم عام</div>
                <div className="text-sm text-muted-foreground">{result.scorePercent}%</div>
              </div>
              <Progress value={result.scorePercent} />
              <p className="text-xs text-muted-foreground">
                التقييم هنا بيقيس “قوة التفكير” بشكل عام (من غير ما يديك الإجابة الجاهزة).
              </p>
            </div>

            <div className="space-y-3">
              <div className="font-bold">ملخص نقاط القوة/الضعف</div>

              <div className="space-y-3">
                {Object.entries(result.breakdown.eliminations).map(([hid, ev]) => {
                  const h = currentCase.hypotheses.find((x) => x.id === hid);
                  const meta = levelBadge(ev.level);
                  const Icon = meta.icon;
                  return (
                    <div key={hid} className="p-4 rounded-xl border border-border/40 bg-secondary/10">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <div className="font-bold text-sm">{h?.title || hid}</div>
                        </div>
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">{ev.note}</div>
                    </div>
                  );
                })}

                <div className="p-4 rounded-xl border border-border/40 bg-secondary/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <div className="font-bold text-sm">دعم الفرضية النهائية</div>
                    </div>
                    {(() => {
                      const ev = result.breakdown.finalSupport;
                      const meta = ev ? levelBadge(ev.level) : levelBadge("irrelevant");
                      return <Badge variant={meta.variant}>{meta.label}</Badge>;
                    })()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {result.breakdown.finalSupport?.note || "مافيش أسباب دعم كفاية في التقرير."}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setLocation("/hypotheses")}>
                الرجوع للوحة الفرضيات
              </Button>
              <Button variant="outline" onClick={handleRestart}>
                إعادة المحاولة من البداية
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History summary */}
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
