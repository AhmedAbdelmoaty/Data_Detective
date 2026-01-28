import { useGameStore } from "@/store/gameStore";
import { FileText, CheckCircle, AlertTriangle, Send, Target, ArrowRight, RotateCcw, MessageSquare, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Report() {
  const { 
    currentCase, 
    pinnedEvidenceIds, 
    submitConclusion, 
    gameStatus,
    getRemainingHypotheses,
    eliminations,
    selectedHypothesisId,
    selectFinalHypothesis,
    resetGame,
    getDiscoveredEvidence,
    getCompletedInterviews,
    getDiscoveredInsights,
  } = useGameStore();
  
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);

  const remainingHypotheses = getRemainingHypotheses();
  const eliminatedCount = eliminations.length;
  const totalHypotheses = currentCase.hypotheses.length;

  const handleSubmit = () => {
    if (!selectedHypothesisId) return;
    const res = submitConclusion();
    setResult(res);
  };

  if (result) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "max-w-2xl w-full rounded-2xl p-8 text-center",
            result.correct 
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30" 
              : "bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30"
          )}
        >
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center",
            result.correct ? "bg-green-500/20" : "bg-red-500/20"
          )}>
            {result.correct 
              ? <CheckCircle className="w-10 h-10 text-green-500" />
              : <AlertTriangle className="w-10 h-10 text-red-500" />
            }
          </div>
          
          <h2 className={cn(
            "text-2xl font-bold mb-4",
            result.correct ? "text-green-500" : "text-red-500"
          )}>
            {result.correct ? "تحليل صحيح!" : "تحليل غير دقيق"}
          </h2>
          
          <p className="text-muted-foreground leading-relaxed mb-8">
            {result.feedback}
          </p>
          
          <button 
            onClick={() => {
              resetGame();
              setResult(null);
            }}
            className="flex items-center gap-2 px-6 py-3 mx-auto rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            data-testid="button-play-again"
          >
            <RotateCcw className="w-5 h-5" />
            <span>العب مرة أخرى</span>
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
          تقديم التقرير النهائي
        </h1>
        <p className="text-muted-foreground">
          بناءً على تحليلك للأدلة والمقابلات، حدد الفرضية التي تفسر المشكلة
        </p>
      </header>

      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          ملخص التحليل
        </h2>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{eliminatedCount}</div>
            <div className="text-sm text-muted-foreground">فرضيات مستبعدة</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-accent">{remainingHypotheses.length}</div>
            <div className="text-sm text-muted-foreground">فرضيات متبقية</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{pinnedEvidenceIds.length}</div>
            <div className="text-sm text-muted-foreground">أدلة مثبتة</div>
          </div>
        </div>

        {remainingHypotheses.length === 0 ? (
          <div className="bg-destructive/10 rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">
              لقد استبعدت جميع الفرضيات! يجب أن تبقى فرضية واحدة على الأقل.
            </p>
            <Link 
              href="/hypotheses"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <ArrowRight className="w-4 h-4" />
              العودة للوحة الفرضيات
            </Link>
          </div>
        ) : remainingHypotheses.length > 1 ? (
          <div className="space-y-4">
            <div className="bg-amber-500/10 rounded-xl p-6 text-center border border-amber-500/30">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-amber-600 dark:text-amber-400 font-medium mb-2">
                لا يزال هناك {remainingHypotheses.length} فرضيات متبقية
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                يجب استبعاد الفرضيات المتناقضة مع الأدلة حتى تبقى فرضية واحدة فقط.
                اجمع المزيد من الأدلة وقم بتحليلها لاستبعاد الفرضيات الخاطئة.
              </p>
              <Link 
                href="/hypotheses"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للوحة الفرضيات
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-accent/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-accent" />
              <span className="font-bold text-foreground">الفرضية المتبقية:</span>
            </div>
            <div className="bg-card rounded-lg p-4 border border-accent/30">
              <div className="font-bold text-lg text-foreground">{remainingHypotheses[0].title}</div>
              <div className="text-muted-foreground mt-1">{remainingHypotheses[0].description}</div>
            </div>
            {!selectedHypothesisId && (
              <button
                onClick={() => selectFinalHypothesis(remainingHypotheses[0].id)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                data-testid="button-confirm-hypothesis"
              >
                <CheckCircle className="w-5 h-5" />
                <span>تأكيد هذه الفرضية</span>
              </button>
            )}
          </div>
        )}
      </div>

      {eliminations.length > 0 && (
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-destructive" />
            مسار التفكير (الفرضيات المستبعدة)
          </h2>
          <div className="space-y-4">
            {eliminations.map((elimination) => {
              const hypothesis = currentCase.hypotheses.find(h => h.id === elimination.hypothesisId);
              if (!hypothesis) return null;
              
              const evidenceJustifications = elimination.justifications.filter(j => j.type === 'evidence');
              const interviewJustifications = elimination.justifications.filter(j => j.type === 'interview');
              const dataJustifications = elimination.justifications.filter(j => j.type === 'data');
              
              return (
                <div key={elimination.hypothesisId} className="bg-secondary/30 rounded-xl p-4 border border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                      <span className="text-destructive text-xs font-bold">X</span>
                    </div>
                    <span className="font-bold text-foreground line-through">{hypothesis.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-2">
                    {evidenceJustifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>{evidenceJustifications.length} دليل</span>
                      </div>
                    )}
                    {interviewJustifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-accent" />
                        <span>{interviewJustifications.length} مقابلة</span>
                      </div>
                    )}
                    {dataJustifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        <span>{dataJustifications.length} رؤية بيانات</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedHypothesisId && remainingHypotheses.length === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-lg font-bold"
            data-testid="button-submit-report"
          >
            <Send className="w-6 h-6" />
            <span>تقديم التقرير النهائي</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
