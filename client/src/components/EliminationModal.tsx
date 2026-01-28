import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { X, FileText, MessageSquare, BarChart3, Check, AlertTriangle, ChevronLeft } from "lucide-react";
import { Hypothesis } from "@shared/schema";

interface EliminationModalProps {
  hypothesis: Hypothesis;
  onClose: () => void;
  onConfirm: (justifications: { type: "evidence" | "interview" | "data"; id: string }[]) => void;
}

export function EliminationModal({ hypothesis, onClose, onConfirm }: EliminationModalProps) {
  const { getDiscoveredEvidence, getCompletedInterviews, getDiscoveredInsights } = useGameStore();

  const [selectedItems, setSelectedItems] = useState<{ type: "evidence" | "interview" | "data"; id: string }[]>([]);
  const [limitHint, setLimitHint] = useState(false);

  const discoveredEvidence = getDiscoveredEvidence();
  const completedInterviews = getCompletedInterviews();
  const discoveredInsights = getDiscoveredInsights();

  const hasAnyDiscoveries = discoveredEvidence.length > 0 || completedInterviews.length > 0 || discoveredInsights.length > 0;

  const selectedKey = useMemo(
    () => new Set(selectedItems.map((i) => `${i.type}:${i.id}`)),
    [selectedItems]
  );

  const toggleItem = (type: "evidence" | "interview" | "data", id: string) => {
    const key = `${type}:${id}`;
    const exists = selectedKey.has(key);

    if (exists) {
      setSelectedItems(selectedItems.filter((item) => !(item.type === type && item.id === id)));
      setLimitHint(false);
      return;
    }

    // Level 1: حد أقصى 2 (عشان ما نزودش تعقيد)
    if (selectedItems.length >= 2) {
      setLimitHint(true);
      return;
    }

    setSelectedItems([...selectedItems, { type, id }]);
    setLimitHint(false);
  };

  const isSelected = (type: "evidence" | "interview" | "data", id: string) => selectedKey.has(`${type}:${id}`);

  const handleConfirm = () => {
    if (selectedItems.length > 0) onConfirm(selectedItems);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">استبعاد فرضية</h2>
                <p className="text-muted-foreground mt-1">
                  اختار 1 أو 2 معلومات بس تبرر بيهم الاستبعاد (عشان يبقى واضح ومش مشتت)
                </p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-close-modal">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
              <div className="font-bold text-foreground">{hypothesis.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{hypothesis.description}</div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[50vh] space-y-6">
            {!hasAnyDiscoveries ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">لسه ماجمعتش معلومات</p>
                <p className="text-muted-foreground text-sm">
                  ادخل غرفة الأدلة، اعمل مقابلات، وشوف البيانات… وبعدها استبعد.
                </p>
              </div>
            ) : (
              <>
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
                          onClick={() => toggleItem("evidence", ev.id)}
                          className={cn(
                            "w-full text-right p-4 rounded-xl border-2 transition-all",
                            isSelected("evidence", ev.id) ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"
                          )}
                          data-testid={`select-evidence-${ev.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                                isSelected("evidence", ev.id) ? "border-primary bg-primary" : "border-muted-foreground"
                              )}
                            >
                              {isSelected("evidence", ev.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{ev.title}</div>
                              <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{ev.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {completedInterviews.length > 0 && (
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-accent" />
                      معلومات من المقابلات
                    </h3>
                    <div className="space-y-2">
                      {completedInterviews.map((interview) => (
                        <button
                          key={interview.id}
                          onClick={() => toggleItem("interview", interview.id)}
                          className={cn(
                            "w-full text-right p-4 rounded-xl border-2 transition-all",
                            isSelected("interview", interview.id) ? "border-accent bg-accent/10" : "border-border/50 hover:border-accent/30"
                          )}
                          data-testid={`select-interview-${interview.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                                isSelected("interview", interview.id) ? "border-accent bg-accent" : "border-muted-foreground"
                              )}
                            >
                              {isSelected("interview", interview.id) && <Check className="w-3 h-3 text-accent-foreground" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground mb-1">{interview.stakeholderName}</div>
                              <div className="font-medium text-foreground leading-relaxed">
                                {interview.response}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {discoveredInsights.length > 0 && (
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-emerald-500" />
                      بيانات
                    </h3>
                    <div className="space-y-2">
                      {discoveredInsights.map((insight) => (
                        <button
                          key={insight.id}
                          onClick={() => toggleItem("data", insight.id)}
                          className={cn(
                            "w-full text-right p-4 rounded-xl border-2 transition-all",
                            isSelected("data", insight.id) ? "border-emerald-500 bg-emerald-500/10" : "border-border/50 hover:border-emerald-500/30"
                          )}
                          data-testid={`select-insight-${insight.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                                isSelected("data", insight.id) ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"
                              )}
                            >
                              {isSelected("data", insight.id) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">{insight.datasetName}</div>
                              <div className="font-medium text-foreground">{insight.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 border-t border-border flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              {limitHint ? <span className="text-amber-500">اختار بس 2 كحد أقصى.</span> : <span>المختار: {selectedItems.length} / 2</span>}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                data-testid="button-cancel-elimination"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>رجوع</span>
              </button>

              <button
                onClick={handleConfirm}
                disabled={selectedItems.length === 0}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium",
                  selectedItems.length > 0 ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                data-testid="button-confirm-elimination"
              >
                <X className="w-4 h-4" />
                <span>تأكيد الاستبعاد</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
