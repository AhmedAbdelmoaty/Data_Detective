import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { Lightbulb, Check, X, ThumbsUp, ThumbsDown, AlertCircle, ChevronDown, ChevronUp, Unlink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function HypothesisRoom() {
  const { 
    currentCase, 
    eliminatedHypothesisIds, 
    confirmedHypothesisId,
    visitedEvidenceIds,
    pinnedEvidenceIds,
    evidenceLinks,
    eliminateHypothesis,
    restoreHypothesis,
    confirmHypothesis,
    linkEvidenceToHypothesis,
    unlinkEvidence,
    getHypothesisEvidence,
    getEvidenceStrength,
    canConfirmHypothesis,
    getMissingRequiredEvidence,
  } = useGameStore();

  const [expandedHypothesis, setExpandedHypothesis] = useState<string | null>(null);
  const [linkingMode, setLinkingMode] = useState<{ hypothesisId: string; type: 'support' | 'refute' } | null>(null);

  const activeHypotheses = currentCase.hypotheses.filter(
    h => !eliminatedHypothesisIds.includes(h.id)
  );
  
  const eliminatedHypotheses = currentCase.hypotheses.filter(
    h => eliminatedHypothesisIds.includes(h.id)
  );

  const visitedEvidence = currentCase.evidence.filter(e => visitedEvidenceIds.includes(e.id));

  const handleLinkEvidence = (evidenceId: string) => {
    if (!linkingMode) return;
    linkEvidenceToHypothesis(evidenceId, linkingMode.hypothesisId, linkingMode.type);
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-primary" />
          غرفة التحليل والفرضيات
        </h1>
        <p className="text-muted-foreground mt-2">
          حلل الأدلة، ابنِ فرضياتك، واستبعد الأسباب غير المحتملة حتى تصل للحقيقة.
        </p>
      </header>

      <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-accent" />
          <span className="text-muted-foreground">
            <strong className="text-foreground">تلميح:</strong> اجمع الأدلة من غرفة الأدلة والاستجواب، ثم اربطها بالفرضيات هنا. 
            استبعد الفرضيات الخاطئة وأكد الفرضية الصحيحة بناءً على الأدلة القوية.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-foreground">الفرضيات المحتملة</h2>
          
          <div className="space-y-4">
            {activeHypotheses.map((hypothesis) => {
              const { supporting, refuting } = getHypothesisEvidence(hypothesis.id);
              const { supportScore, refuteScore } = getEvidenceStrength(hypothesis.id);
              const isExpanded = expandedHypothesis === hypothesis.id;
              const isConfirmed = confirmedHypothesisId === hypothesis.id;
              const canConfirm = canConfirmHypothesis(hypothesis.id);
              const missingEvidence = getMissingRequiredEvidence(hypothesis.id);
              
              return (
                <motion.div
                  key={hypothesis.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-xl border transition-all overflow-hidden",
                    isConfirmed 
                      ? "bg-green-950/30 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                      : "bg-card border-border/50 hover:border-primary/30"
                  )}
                >
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedHypothesis(isExpanded ? null : hypothesis.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isConfirmed && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-bold">
                              الفرضية المؤكدة
                            </span>
                          )}
                          <h3 className="font-bold text-lg text-foreground">{hypothesis.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">{hypothesis.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-green-400">
                            <ThumbsUp className="w-4 h-4" />
                            <span className="font-mono text-sm">{supporting.length}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">تدعم</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-red-400">
                            <ThumbsDown className="w-4 h-4" />
                            <span className="font-mono text-sm">{refuting.length}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">تنفي</div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                          style={{ width: `${Math.min(100, supportScore * 15)}%` }}
                        />
                      </div>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all"
                          style={{ width: `${Math.min(100, refuteScore * 15)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50"
                      >
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-bold text-sm text-green-400 mb-2 flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4" />
                                أدلة داعمة ({supporting.length})
                              </h4>
                              <div className="space-y-2">
                                {supporting.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">لا توجد أدلة مربوطة</p>
                                ) : (
                                  supporting.map(ev => (
                                    <div key={ev.id} className="text-xs bg-green-950/30 p-2 rounded border border-green-500/20 flex items-center justify-between gap-2">
                                      <span>{ev.title}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          unlinkEvidence(ev.id, hypothesis.id);
                                        }}
                                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                        title="إلغاء الربط"
                                      >
                                        <X className="w-3 h-3 text-red-400" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-red-400 mb-2 flex items-center gap-2">
                                <ThumbsDown className="w-4 h-4" />
                                أدلة نافية ({refuting.length})
                              </h4>
                              <div className="space-y-2">
                                {refuting.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">لا توجد أدلة مربوطة</p>
                                ) : (
                                  refuting.map(ev => (
                                    <div key={ev.id} className="text-xs bg-red-950/30 p-2 rounded border border-red-500/20 flex items-center justify-between gap-2">
                                      <span>{ev.title}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          unlinkEvidence(ev.id, hypothesis.id);
                                        }}
                                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                        title="إلغاء الربط"
                                      >
                                        <X className="w-3 h-3 text-red-400" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 border-t border-border/30">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLinkingMode(
                                  linkingMode?.hypothesisId === hypothesis.id && linkingMode?.type === 'support'
                                    ? null
                                    : { hypothesisId: hypothesis.id, type: 'support' }
                                );
                              }}
                              className={cn(
                                "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                                linkingMode?.hypothesisId === hypothesis.id && linkingMode?.type === 'support'
                                  ? "bg-green-500 text-white"
                                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              )}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              ربط دليل داعم
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLinkingMode(
                                  linkingMode?.hypothesisId === hypothesis.id && linkingMode?.type === 'refute'
                                    ? null
                                    : { hypothesisId: hypothesis.id, type: 'refute' }
                                );
                              }}
                              className={cn(
                                "flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                                linkingMode?.hypothesisId === hypothesis.id && linkingMode?.type === 'refute'
                                  ? "bg-red-500 text-white"
                                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              )}
                            >
                              <ThumbsDown className="w-4 h-4" />
                              ربط دليل نافٍ
                            </button>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmHypothesis(hypothesis.id);
                              }}
                              disabled={!canConfirm && !isConfirmed}
                              className={cn(
                                "flex-1 px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2",
                                isConfirmed
                                  ? "bg-green-500 text-white"
                                  : canConfirm
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                              )}
                            >
                              <Check className="w-4 h-4" />
                              {isConfirmed ? "تم التأكيد" : "تأكيد هذه الفرضية"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                eliminateHypothesis(hypothesis.id);
                              }}
                              className="px-4 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              استبعاد
                            </button>
                          </div>
                          
                          {!canConfirm && !isConfirmed && (
                            <div className="text-center space-y-2">
                              <p className="text-xs text-muted-foreground">
                                تحتاج {hypothesis.minSupportingEvidenceCount} أدلة داعمة على الأقل لتأكيد هذه الفرضية
                              </p>
                              {missingEvidence.length > 0 && (
                                <div className="text-xs text-yellow-400 bg-yellow-950/20 p-2 rounded border border-yellow-500/20">
                                  <span className="font-bold">أدلة مطلوبة مفقودة: </span>
                                  {missingEvidence.map((ev, i) => (
                                    <span key={ev.id}>
                                      {ev.title}{i < missingEvidence.length - 1 ? '، ' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {eliminatedHypotheses.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-muted-foreground mb-4">الفرضيات المستبعدة</h3>
              <div className="space-y-2">
                {eliminatedHypotheses.map((hypothesis) => (
                  <div
                    key={hypothesis.id}
                    className="p-4 rounded-lg bg-secondary/20 border border-border/30 opacity-60 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm line-through">{hypothesis.title}</h4>
                      <p className="text-xs text-muted-foreground">{hypothesis.description}</p>
                    </div>
                    <button
                      onClick={() => restoreHypothesis(hypothesis.id)}
                      className="px-3 py-1 text-xs bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-all"
                    >
                      استعادة
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">الأدلة المتاحة</h2>
          
          {linkingMode && (
            <div className={cn(
              "p-3 rounded-lg text-sm font-bold text-center animate-pulse",
              linkingMode.type === 'support' 
                ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                : "bg-red-500/20 text-red-400 border border-red-500/50"
            )}>
              اختر دليلاً {linkingMode.type === 'support' ? 'داعماً' : 'نافياً'}
              <button 
                onClick={() => setLinkingMode(null)}
                className="block mx-auto mt-2 text-xs opacity-70 hover:opacity-100"
              >
                إلغاء
              </button>
            </div>
          )}
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {visitedEvidence.length === 0 ? (
              <p className="text-sm text-muted-foreground italic p-4 text-center">
                لم تجمع أي أدلة بعد. توجه لغرفة الأدلة أو الاستجواب.
              </p>
            ) : (
              visitedEvidence.map((evidence) => {
                const linkedTo = evidenceLinks.filter(l => l.evidenceId === evidence.id);
                const isLinkedToCurrentHypothesis = linkingMode && linkedTo.some(l => l.hypothesisId === linkingMode.hypothesisId);
                
                return (
                  <button
                    key={evidence.id}
                    onClick={() => linkingMode && handleLinkEvidence(evidence.id)}
                    disabled={!linkingMode}
                    className={cn(
                      "w-full text-right p-3 rounded-lg border transition-all",
                      linkingMode
                        ? "cursor-pointer hover:border-primary bg-card"
                        : "bg-secondary/20 border-border/30 cursor-default",
                      pinnedEvidenceIds.includes(evidence.id) && "border-accent/50",
                      isLinkedToCurrentHypothesis && "ring-2 ring-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm">{evidence.title}</div>
                      {linkedTo.length > 0 && (
                        <span className="text-xs text-primary">مربوط ({linkedTo.length})</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {evidence.description.substring(0, 80)}...
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        evidence.strengthLevel === 'strong' ? "bg-green-500/20 text-green-400" :
                        evidence.strengthLevel === 'medium' ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}>
                        {evidence.strengthLevel === 'strong' ? 'قوي' :
                         evidence.strengthLevel === 'medium' ? 'متوسط' : 'ضعيف'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
