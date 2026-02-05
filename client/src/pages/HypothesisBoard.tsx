import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useGameStore } from "@/store/gameStore";
import { Hypothesis } from "@shared/schema";
import { EliminationModal } from "@/components/EliminationModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  UserX,
  ServerCrash,
  Target,
  TrendingDown,
  Users,
  RotateCcw,
  X,
  Lightbulb,
  FileSearch,
  BarChart3,
  FileText,
  Check,
  Database,
  TrendingUp,
  Eye,
} from "lucide-react";
import { DataTable } from "@/components/DataTable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type InfoItem = {
  key: string;
  type: "evidence" | "interview" | "data";
  id: string;
  title: string;
  detail: string;
};

const iconMap: Record<string, typeof UserX> = {
  UserX,
  ServerCrash,
  Target,
  TrendingDown,
  Users,
};

export default function HypothesisBoard({
  initialTab,
}: {
  initialTab?: "hypotheses" | "data" | "report";
}) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    gameStatus,
    currentCase,
    eliminateHypothesis,
    restoreHypothesis,
    isHypothesisEliminated,
    getEliminationJustification,
    getDiscoveredEvidence,
    getCompletedInterviews,
    getDiscoveredInsights,
    getRemainingHypotheses,
    hasVisitedOffice,
    discoverDataInsight,
    discoveredDataInsightIds,
    // تقرير
    selectedHypothesisId,
    selectFinalHypothesis,
    finalSupportJustifications,
    setFinalSupportJustifications,
    submitConclusion,
    resetGame,
    reportAttemptsLeft,
  } = useGameStore();

  useEffect(() => {
    if (!hasVisitedOffice || gameStatus === "briefing") setLocation("/office");
  }, [gameStatus, hasVisitedOffice, setLocation]);

  const [tab, setTab] = useState<string>(initialTab ?? "hypotheses");
  const [selectedHypothesis, setSelectedHypothesis] =
    useState<Hypothesis | null>(null);

  const hypotheses = currentCase.hypotheses;
  const remaining = getRemainingHypotheses();
  const remainingCount = remaining.length;
  const discoveredEvidence = getDiscoveredEvidence();
  const completedInterviews = getCompletedInterviews();
  const discoveredInsights = getDiscoveredInsights();
  const discoveredCount =
    discoveredEvidence.length +
    completedInterviews.length +
    discoveredInsights.length;
  const isReadyToReport = remainingCount === 1;
  const finalHypothesis = isReadyToReport ? remaining[0] : null;
  const attemptsDepleted = reportAttemptsLeft <= 0;

  // لو المستخدم فتح /data نخليه على تبويب البيانات
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // لو المستخدم على تبويب التقرير وراح يعمل restore/Eliminate ورجع عدد الفرضيات > 1
  useEffect(() => {
    if (tab === "report" && !isReadyToReport) {
      // نخليه في الفرضيات بدل ما يحس إنه "اتقفل"
      setTab("hypotheses");
    }
  }, [tab, isReadyToReport]);

  const handleEliminate = (hypothesis: Hypothesis) =>
    setSelectedHypothesis(hypothesis);

  const handleConfirmElimination = (
    justifications: { type: "evidence" | "interview" | "data"; id: string }[],
  ) => {
    if (!selectedHypothesis) return;
    eliminateHypothesis(selectedHypothesis.id, justifications);
    setSelectedHypothesis(null);
  };

  const getJustificationSummary = (hypothesisId: string) => {
    const justification = getEliminationJustification(hypothesisId);
    if (!justification) return null;

    const evidenceCount = justification.justifications.filter(
      (j) => j.type === "evidence",
    ).length;
    const interviewCount = justification.justifications.filter(
      (j) => j.type === "interview",
    ).length;
    const dataCount = justification.justifications.filter(
      (j) => j.type === "data",
    ).length;

    const parts = [];
    if (evidenceCount > 0) parts.push(`${evidenceCount} دليل`);
    if (interviewCount > 0) parts.push(`${interviewCount} مقابلة`);
    if (dataCount > 0) parts.push(`${dataCount} رؤية`);

    return parts.join(" + ");
  };

  // --- Report draft (نفس المنطق + نفس النصوص) ---
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

  const selectedSupportKeys = new Set(
    finalSupportJustifications.map((j) => `${j.type}:${j.id}`),
  );

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

  const handleSubmitReport = () => {
    if (attemptsDepleted) return;
    // submitConclusion يحافظ على نفس المنطق ويخزن النتيجة لعرضها في مكتب المدير
    submitConclusion();
    setLocation("/office");
  };

  const handleRestart = () => {
    resetGame();
    setLocation("/");
  };

  // --- Data panel (لوحة البيانات داخل مكتب المحلل) ---
  const salesData =
    currentCase.dataSets.find((d) => d.name.includes("الاستفسارات"))?.rows ||
    [];
  const qualityData =
    currentCase.dataSets.find((d) => d.name.includes("جودة"))?.rows || [];
  const isInsightDiscovered = (id: string) =>
    discoveredDataInsightIds.includes(id);

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-primary" />
          مكتب المحلل
        </h1>
        <p className="text-muted-foreground mt-2">
          اجمع المعلومات، قارن الفرضيات، واستبعد ما لا يتوافق مع الحقائق.
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

        {remainingCount === 1 && (
          <button
            onClick={() => setTab("report")}
            className="bg-accent/35 text-foreground px-5 py-3 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-accent/45 transition-colors font-semibold ring-2 ring-accent/50 shadow-[0_0_18px_rgba(250,204,21,0.3)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent/60 opacity-75 animate-pulse" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <Check className="w-4 h-4" />
            <span className="font-medium">
              فرضية واحدة متبقية - جهّز التقرير
            </span>
          </button>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="w-fit rounded-xl bg-muted/70 p-2 shadow-sm border border-border/40">
          <TabsTrigger
            value="hypotheses"
            className="gap-2 px-5 py-3 text-base font-semibold border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:shadow-md data-[state=active]:border-primary/60"
          >
            <Lightbulb className="w-4 h-4" />
            الفرضيات
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="gap-2 px-5 py-3 text-base font-semibold border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:shadow-md data-[state=active]:border-primary/60"
          >
            <BarChart3 className="w-4 h-4" />
            لوحة البيانات
            {discoveredDataInsightIds.length === 0 && (
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="report"
            className="gap-2 px-5 py-3 text-base font-semibold border border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:ring-2 data-[state=active]:ring-primary/40 data-[state=active]:shadow-md data-[state=active]:border-primary/60"
            disabled={!isReadyToReport && !attemptsDepleted}
          >
            <FileText className="w-4 h-4" />
            التقرير
          </TabsTrigger>
        </TabsList>

        {/* --- Hypotheses --- */}
        <TabsContent
          value="hypotheses"
          className="flex-1 min-h-0 mt-6 text-right"
          dir="rtl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-auto min-h-0">
            <AnimatePresence mode="popLayout">
              {hypotheses.map((hypothesis, index) => {
                const isEliminated = isHypothesisEliminated(hypothesis.id);
                const IconComponent = iconMap[hypothesis.icon] || Target;
                const justificationSummary = getJustificationSummary(
                  hypothesis.id,
                );

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
                        : "bg-card border-border/50 hover:border-primary/30",
                    )}
                  >
                    {isEliminated && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <X
                          className="w-24 h-24 text-destructive/15"
                          strokeWidth={3}
                        />
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-start gap-4 flex-row-reverse">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                              isEliminated ? "bg-muted" : "bg-primary/10",
                            )}
                          >
                            <IconComponent
                              className={cn(
                                "w-6 h-6",
                                isEliminated
                                  ? "text-muted-foreground"
                                  : "text-primary",
                              )}
                            />
                          </div>

                          <div className="flex-1 min-w-0 text-right">
                            <h3
                              className={cn(
                                "text-lg font-bold mb-1",
                                isEliminated
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground",
                              )}
                            >
                              {hypothesis.title}
                            </h3>
                            <p
                              className={cn(
                                "text-sm",
                                isEliminated
                                  ? "text-muted-foreground/60"
                                  : "text-muted-foreground",
                              )}
                            >
                              {hypothesis.description}
                            </p>

                            {isEliminated && justificationSummary && (
                              <div className="mt-2 text-xs text-muted-foreground/80 flex items-center gap-1 justify-end flex-row-reverse">
                                <FileText className="w-3 h-3" />
                                <span>
                                  تم الاستبعاد بناءً على: {justificationSummary}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="self-stretch w-px bg-border/40"
                        aria-hidden="true"
                      />

                      <div className="mt-1 flex justify-start">
                        {isEliminated ? (
                          <button
                            onClick={() => restoreHypothesis(hypothesis.id)}
                            className="flex items-center gap-2 flex-row-reverse px-4 py-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors text-sm"
                            data-testid={`button-restore-${hypothesis.id}`}
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>استعادة</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEliminate(hypothesis)}
                            className="flex items-center gap-2 flex-row-reverse px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                            data-testid={`button-eliminate-${hypothesis.id}`}
                          >
                            <X className="w-4 h-4" />
                            <span>استبعاد</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div
            className="mt-6 p-4 bg-secondary/30 rounded-xl border border-border/30 text-right"
            dir="rtl"
          >
            <p className="text-sm text-muted-foreground mb-3">
              <span className="font-medium text-foreground">للاستبعاد:</span>{" "}
              يجب تحديد الأدلة أو المقابلات أو البيانات التي أقنعتك بأن الفرضية
              غير صحيحة.
            </p>
            <div className="flex flex-wrap gap-3 justify-end flex-row-reverse">
              <Link href="/archive">
                <div className="flex items-center gap-2 flex-row-reverse px-5 py-3 rounded-lg bg-card/80 hover:bg-primary/10 transition-colors cursor-pointer text-base font-medium border border-border/40 shadow-sm">
                  <FileSearch className="w-4 h-4 text-primary" />
                  <span>أرشيف الملفات</span>
                </div>
              </Link>
              <Link href="/meetings">
                <div className="flex items-center gap-2 flex-row-reverse px-5 py-3 rounded-lg bg-card/80 hover:bg-accent/10 transition-colors cursor-pointer text-base font-medium border border-border/40 shadow-sm">
                  <Users className="w-4 h-4 text-accent" />
                  <span>غرفة الاجتماعات</span>
                </div>
              </Link>
              <button
                onClick={() => setTab("data")}
                className="flex items-center gap-2 flex-row-reverse px-5 py-3 rounded-lg bg-card/80 hover:bg-emerald-500/10 transition-colors text-base font-medium border border-border/40 shadow-sm"
              >
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>لوحة البيانات</span>
              </button>
            </div>
          </div>
        </TabsContent>

        {/* --- Data --- */}
        <TabsContent
          value="data"
          className="flex-1 min-h-0 mt-6 overflow-auto text-right"
          dir="rtl"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-row-reverse justify-end">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold">لوحة البيانات</div>
                <div className="text-sm text-muted-foreground">
                  حلل الرسوم البيانية والجداول. عند اكتشاف نمط مهم، سجله كرؤية.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2 flex-row-reverse text-right">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    تحليل الاستفسارات مقابل المبيعات
                  </h3>
                </div>
                <div className="h-[300px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#eab308"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          borderColor: "#334155",
                          color: "#f8fafc",
                        }}
                        itemStyle={{ color: "#f8fafc" }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="leads"
                        name="الاستفسارات"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="sales"
                        name="المبيعات (Sales)"
                        stroke="#eab308"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2 flex-row-reverse text-right">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    جودة الاستفسارات
                  </h3>
                </div>
                <div className="h-[300px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={qualityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis
                        dataKey="category"
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        cursor={{ fill: "#ffffff05" }}
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          borderColor: "#334155",
                          color: "#f8fafc",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="count"
                        name="العدد"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6">
              <h2 className="font-bold text-lg flex items-center gap-2 mb-4 flex-row-reverse text-right">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                الرؤى المتاحة
              </h2>
              <p className="text-sm text-muted-foreground mb-4 text-right">
                ادرس الرسوم البيانية أعلاه. عندما تلاحظ نمطاً مهماً، اضغط على
                "تسجيل" لحفظه كدليل.
              </p>

              <div className="space-y-3">
                {currentCase.dataSets.map((ds) =>
                  ds.insights?.map((insight) => {
                    const discovered = isInsightDiscovered(insight.id);
                    return (
                      <div
                        key={insight.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border-2 transition-all",
                          discovered
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-secondary/30 border-border/50 hover:border-amber-500/30",
                        )}
                      >
                        {!discovered && (
                          <button
                            onClick={() => discoverDataInsight(insight.id)}
                            className="flex items-center gap-2 flex-row-reverse px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
                            data-testid={`button-discover-${insight.id}`}
                          >
                            <Lightbulb className="w-4 h-4" />
                            <span>تسجيل</span>
                          </button>
                        )}

                        <div className="flex items-start gap-3 flex-row-reverse text-right flex-1 min-w-0 ml-auto">
                          {discovered ? (
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-500" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                              <Eye className="w-4 h-4 text-amber-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {ds.name}
                            </div>
                            <div
                              className={cn(
                                "font-medium",
                                discovered
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {insight.title}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                              {insight.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>

            <div className="space-y-6">
              {currentCase.dataSets.map((ds) => (
                <DataTable
                  key={ds.name}
                  title={ds.name}
                  data={ds.rows}
                  columns={Object.keys(ds.rows[0]).filter((k) => k !== "id")}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --- Report --- */}
        <TabsContent
          value="report"
          className="flex-1 min-h-0 mt-6 overflow-auto"
        >
          <div className="space-y-8 pb-24">
            <header className="space-y-2">
              <h2 className="text-2xl font-bold">التقرير النهائي</h2>
              <p className="text-muted-foreground">
                اكتب قرارك النهائي بالشكل اللي ينفع نتحرك عليه.
              </p>
              <div className="text-sm text-muted-foreground">
                المحاولات المتبقية:{" "}
                <span className="font-bold text-foreground">
                  {reportAttemptsLeft}
                </span>
              </div>
            </header>

            {attemptsDepleted && (
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle>انتهت المحاولات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      خلصت كل محاولات التقرير. علشان تكمل، لازم تعيد البداية.
                    </AlertDescription>
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
                    المتبقي الآن: <b>{remainingCount}</b> فرضيات
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setTab("hypotheses")}
                  >
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
                    <div className="font-bold text-lg">
                      {finalHypothesis.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {finalHypothesis.description}
                    </div>
                  </div>

                  {!selectedHypothesisId ? (
                    <Button
                      onClick={handleConfirmHypothesis}
                      className="w-full"
                    >
                      تأكيد هذه الفرضية كسبب رئيسي
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">
                          اختر 1–2 معلومات تدعم الفرضية
                        </h3>
                        <Badge variant="secondary">
                          {finalSupportJustifications.length} / 2
                        </Badge>
                      </div>

                      {infoItems.length === 0 ? (
                        <Alert>
                          <AlertDescription>
                            لسه ما جمعتش معلومات كفاية. ارجع
                            للأدلة/المقابلات/البيانات وسجّل اللي اكتشفته.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {infoItems.map((item) => {
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
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-bold text-sm">
                                      {item.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-pre-line mt-1">
                                      {item.detail}
                                    </div>
                                  </div>
                                  <div className="mt-1">
                                    {checked ? (
                                      <Check className="w-5 h-5 text-primary" />
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
                        onClick={handleSubmitReport}
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

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>ملخص تقريرك حتى الآن</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/40">
                    <div className="text-muted-foreground text-xs mb-1">
                      الأدلة التي فتحتها
                    </div>
                    <div className="font-bold">{discoveredEvidence.length}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/40">
                    <div className="text-muted-foreground text-xs mb-1">
                      الأسئلة التي سألتها
                    </div>
                    <div className="font-bold">
                      {completedInterviews.length}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/40">
                    <div className="text-muted-foreground text-xs mb-1">
                      رؤى البيانات المسجلة
                    </div>
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
                        <div
                          key={h.id}
                          className="p-4 rounded-xl bg-secondary/10 border border-border/40"
                        >
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
        </TabsContent>
      </Tabs>

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
