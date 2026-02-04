import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
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
  Database,
  BarChart3,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Hypothesis } from "@shared/schema";
import { EliminationModal } from "@/components/EliminationModal";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const iconMap: Record<string, typeof UserX> = {
  UserX,
  ServerCrash,
  Target,
  TrendingDown,
  Users,
};

type InfoItem = {
  key: string;
  type: "evidence" | "interview" | "data";
  id: string;
  title: string;
  detail: string;
};

export default function HypothesisBoard() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

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
    hasVisitedOffice,

    // تقرير نهائي (مسودة)
    getRemainingHypotheses,
    selectedHypothesisId,
    selectFinalHypothesis,
    finalSupportJustifications,
    setFinalSupportJustifications,

    // بيانات
    discoverDataInsight,
    discoveredDataInsightIds,
  } = useGameStore();

  useEffect(() => {
    if (!hasVisitedOffice || gameStatus === "briefing") setLocation("/office");
  }, [gameStatus, hasVisitedOffice, setLocation]);

  const [selectedHypothesis, setSelectedHypothesis] = useState<Hypothesis | null>(null);

  const hypotheses = currentCase.hypotheses;
  const remainingHypotheses = getRemainingHypotheses();
  const remainingCount = remainingHypotheses.length;
  const discoveredCount =
    getDiscoveredEvidence().length + getCompletedInterviews().length + getDiscoveredInsights().length;

  const finalHypothesis = remainingCount === 1 ? remainingHypotheses[0] : null;

  const handleEliminate = (hypothesis: Hypothesis) => {
    setSelectedHypothesis(hypothesis);
  };

  const handleConfirmElimination = (justifications: { type: "evidence" | "interview" | "data"; id: string }[]) => {
    if (!selectedHypothesis) return;
    eliminateHypothesis(selectedHypothesis.id, justifications);
    setSelectedHypothesis(null);
  };

  const getJustificationSummary = (hypothesisId: string) => {
    const justification = getEliminationJustification(hypothesisId);
    if (!justification) return null;

    const evidenceCount = justification.justifications.filter((j) => j.type === "evidence").length;
    const interviewCount = justification.justifications.filter((j) => j.type === "interview").length;
    const dataCount = justification.justifications.filter((j) => j.type === "data").length;

    const parts: string[] = [];
    if (evidenceCount > 0) parts.push(`${evidenceCount} دليل`);
    if (interviewCount > 0) parts.push(`${interviewCount} مقابلة`);
    if (dataCount > 0) parts.push(`${dataCount} رؤية`);

    return parts.join(" + ");
  };

  // بيانات (لـ Level 1)
  const salesData = currentCase.dataSets.find((d) => d.name.includes("الاستفسارات"))?.rows || [];
  const qualityData = currentCase.dataSets.find((d) => d.name.includes("جودة"))?.rows || [];

  const isInsightDiscovered = (id: string) => discoveredDataInsightIds.includes(id);

  // عناصر المعلومات المتاحة لدعم الفرضية النهائية
  const infoItems: InfoItem[] = useMemo(() => {
    const evItems: InfoItem[] = getDiscoveredEvidence().map((ev) => ({
      key: `evidence:${ev.id}`,
      type: "evidence",
      id: ev.id,
      title: ev.title,
      detail: ev.description,
    }));

    const ivItems: InfoItem[] = getCompletedInterviews().map((i) => ({
      key: `interview:${i.id}`,
      type: "interview",
      id: i.id,
      title: i.stakeholderName,
      detail: i.infoSummary,
    }));

    const dataItems: InfoItem[] = getDiscoveredInsights().map((ins) => ({
      key: `data:${ins.id}`,
      type: "data",
      id: ins.id,
      title: ins.title,
      detail: ins.description,
    }));

    return [...evItems, ...ivItems, ...dataItems];
  }, [getDiscoveredEvidence, getCompletedInterviews, getDiscoveredInsights]);

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

  const handleConfirmFinalHypothesis = () => {
    if (!finalHypothesis) return;
    selectFinalHypothesis(finalHypothesis.id);
  };

  const handleGoToManagerToSubmit = () => {
    setLocation("/office");
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-primary" />
          مكتب المحلل
        </h1>
        <p className="text-muted-foreground mt-2">
          هنا بتجمع الصورة الكبيرة: تقارن الفرضيات، تستبعد غير المنطقي، وتثبت السبب النهائي.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-primary/10 px-4 py-2 rounded-lg">
          <span className="text-muted-foreground">الفرضيات المتبقية: </span>
          <span className="font-bold text-primary">{remainingCount}</span>
          <span className="text-muted-foreground"> / {hypotheses.length}</span>
        </div>

        <div className="bg-secondary/50 px-4 py-2 rounded-lg">
          <span className="text-muted-foreground">معلومات مكتشفة: </span>
          <span className="font-bold text-foreground">{discoveredCount}</span>
        </div>

        <Link href="/office">
          <div className="bg-card hover:bg-secondary/40 border border-border/40 px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">الرجوع لمكتب المدير</span>
          </div>
        </Link>
      </div>

      {/* لوحة الفرضيات */}
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
                  isEliminated ? "bg-card/30 border-border/30" : "bg-card border-border/50 hover:border-primary/30"
                )}
              >
                {isEliminated && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <X className="w-24 h-24 text-destructive/15" strokeWidth={3} />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      isEliminated ? "bg-muted" : "bg-primary/10"
                    )}
                  >
                    <IconComponent
                      className={cn("w-6 h-6", isEliminated ? "text-muted-foreground" : "text-primary")}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "text-lg font-bold mb-1",
                        isEliminated ? "text-muted-foreground line-through" : "text-foreground"
                      )}
                    >
                      {hypothesis.title}
                    </h3>
                    <p className={cn("text-sm", isEliminated ? "text-muted-foreground/60" : "text-muted-foreground")}>
                      {hypothesis.description}
                    </p>

                    {isEliminated && justificationSummary && (
                      <div className="mt-2 text-xs text-muted-foreground/80 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
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

      {/* البيانات داخل مكتب المحلل */}
      <details className="bg-card rounded-xl border border-border/40 p-5">
        <summary className="cursor-pointer list-none flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Database className="w-5 h-5 text-primary" />
            ملفات البيانات
          </div>
          <span className="text-xs text-muted-foreground">افتح/اقفل</span>
        </summary>

        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-xl">
              <div className="font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-accent" />
                الاستفسارات مقابل المبيعات
              </div>
              <div className="h-[260px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData as any[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                      itemStyle={{ color: "#f8fafc" }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="leads" name="الاستفسارات" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="sales" name="المبيعات" stroke="#eab308" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5 rounded-xl">
              <div className="font-bold flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary" />
                جودة الاستفسارات
              </div>
              <div className="h-[260px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qualityData as any[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      cursor={{ fill: "#ffffff05" }}
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="العدد" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-secondary/20 border border-border/40 rounded-xl p-5">
            <div className="font-bold flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              الرؤى المتاحة
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              لما تلاحظ نمط مهم من الرسوم، سجله كرؤية علشان تقدر تستخدمه في الاستبعاد أو دعم القرار.
            </div>

            <div className="space-y-3">
              {currentCase.dataSets.flatMap((ds) =>
                (ds.insights || []).map((insight) => {
                  const discovered = isInsightDiscovered(insight.id);
                  return (
                    <div
                      key={insight.id}
                      className={cn(
                        "flex items-start justify-between gap-4 p-4 rounded-xl border-2 transition-all",
                        discovered
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-card/30 border-border/40 hover:border-amber-500/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
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
                          <div className="text-xs text-muted-foreground mb-1">{ds.name}</div>
                          <div className="font-medium">{insight.title}</div>
                          <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{insight.description}</div>
                        </div>
                      </div>

                      {!discovered && (
                        <button
                          onClick={() => discoverDataInsight(insight.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
                          data-testid={`button-discover-${insight.id}`}
                        >
                          <Lightbulb className="w-4 h-4" />
                          <span>تسجيل</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </details>

      {/* إنهاء الكيس (بعد بقاء فرضية واحدة) */}
      {finalHypothesis && (
        <div className="bg-card rounded-xl border border-border/40 p-5">
          <div className="flex items-center gap-2 font-bold mb-3">
            <Check className="w-5 h-5 text-emerald-500" />
            الفرضية المتبقية
          </div>

          <div className="p-4 rounded-xl bg-secondary/20 border border-border/40">
            <div className="font-bold text-lg">{finalHypothesis.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{finalHypothesis.description}</div>
          </div>

          <div className="mt-4 space-y-4">
            {selectedHypothesisId !== finalHypothesis.id ? (
              <button
                onClick={handleConfirmFinalHypothesis}
                className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
              >
                تأكيد هذه الفرضية كسبب رئيسي
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="font-bold">اختر 1–2 معلومات تدعم الفرضية</div>
                  <div className="text-sm text-muted-foreground">{finalSupportJustifications.length} / 2</div>
                </div>

                {infoItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-secondary/20 border border-border/40 rounded-xl p-4">
                    لسه ما جمعتش معلومات كفاية. افتح الأدلة/المقابلات/البيانات وسجّل اللي اكتشفته.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {infoItems.map((item) => {
                      const checked = selectedSupportKeys.has(item.key);
                      return (
                        <button
                          key={item.key}
                          onClick={() => toggleSupport(item)}
                          className={cn(
                            "text-right p-4 rounded-xl border transition-all",
                            checked ? "border-primary/60 bg-primary/10" : "border-border/40 bg-secondary/10 hover:bg-secondary/20"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {checked ? (
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-border/60" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm">{item.title}</div>
                              <div className="text-xs text-muted-foreground whitespace-pre-line mt-1">{item.detail}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handleGoToManagerToSubmit}
                  disabled={finalSupportJustifications.length === 0}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl font-bold transition-colors",
                    finalSupportJustifications.length === 0
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-accent text-accent-foreground hover:bg-accent/90"
                  )}
                >
                  قدّم التقرير للمدير
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* روابط سريعة */}
      <div className="p-4 bg-secondary/30 rounded-xl border border-border/30">
        <p className="text-sm text-muted-foreground mb-3">
          <span className="font-medium text-foreground">لجمع المعلومات:</span> افتح الأدلة أو المقابلات. البيانات موجودة داخل مكتب المحلل.
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
              <span>غرفة المقابلات</span>
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
