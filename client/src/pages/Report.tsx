import { useGameStore } from "@/store/gameStore";
import { FileText, CheckCircle, AlertTriangle, Send, Lightbulb, ThumbsUp, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Report() {
  const { 
    currentCase, 
    confirmedHypothesisId, 
    eliminatedHypothesisIds,
    getHypothesisEvidence,
    submitSolution 
  } = useGameStore();
  
  const [result, setResult] = useState<{ correct: boolean; feedback: string; detailedExplanation?: string } | null>(null);

  const confirmedHypothesis = currentCase.hypotheses.find(h => h.id === confirmedHypothesisId);
  const { supporting, refuting } = confirmedHypothesisId 
    ? getHypothesisEvidence(confirmedHypothesisId) 
    : { supporting: [], refuting: [] };

  const activeHypotheses = currentCase.hypotheses.filter(
    h => !eliminatedHypothesisIds.includes(h.id)
  );

  const handleSubmit = () => {
    const res = submitSolution();
    setResult(res);
  };

  if (result) {
    return (
      <div className="h-full flex items-center justify-center p-8 overflow-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "max-w-3xl w-full p-12 rounded-3xl border-2 text-center shadow-2xl",
            result.correct ? "bg-green-950/30 border-green-500/50" : "bg-red-950/30 border-destructive/50"
          )}
        >
          {result.correct ? (
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          ) : (
            <AlertTriangle className="w-24 h-24 text-destructive mx-auto mb-6" />
          )}
          
          <h1 className="text-4xl font-bold mb-4">
            {result.correct ? "القضية حُلّت بنجاح!" : "استنتاج خاطئ"}
          </h1>
          
          <p className="text-xl leading-relaxed opacity-90 mb-6">
            {result.feedback}
          </p>

          {result.detailedExplanation && (
            <div className="text-right bg-black/20 p-6 rounded-xl mb-8 border border-white/10">
              <h3 className="font-bold text-lg mb-3 text-accent">التفسير التفصيلي:</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line opacity-80">
                {result.detailedExplanation}
              </p>
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors"
          >
            العودة للقائمة الرئيسية
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          التقرير النهائي
        </h1>
        <p className="text-muted-foreground mt-2">
          راجع تحليلك وقدم استنتاجك النهائي لحل القضية.
        </p>
      </header>

      <div className="bg-secondary/30 rounded-xl p-6 border border-border/50 space-y-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          الفرضية المؤكدة
        </h3>
        
        {confirmedHypothesis ? (
          <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-6">
            <h4 className="font-bold text-xl text-green-400 mb-2">{confirmedHypothesis.title}</h4>
            <p className="text-muted-foreground">{confirmedHypothesis.description}</p>
            
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-400 mb-2">
                <ThumbsUp className="w-4 h-4" />
                <span>الأدلة الداعمة ({supporting.length})</span>
              </div>
              {supporting.length === 0 ? (
                <p className="text-destructive text-sm">لم تربط أي أدلة داعمة بهذه الفرضية!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {supporting.map(ev => (
                    <span key={ev.id} className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                      {ev.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-bold">لم تختر فرضية نهائية بعد!</p>
            <p className="text-muted-foreground text-sm mt-2">
              توجه إلى غرفة الفرضيات لتأكيد الفرضية التي تعتقد أنها السبب الحقيقي.
            </p>
            <Link href="/hypotheses">
              <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all">
                الذهاب لغرفة الفرضيات
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className="bg-secondary/20 p-6 rounded-xl border border-border/50">
        <h3 className="font-bold text-lg mb-4">ملخص التحليل</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-card p-4 rounded-lg border border-border/30">
            <div className="text-muted-foreground mb-1">الفرضيات المستبعدة</div>
            <div className="font-bold text-2xl text-foreground">{eliminatedHypothesisIds.length}</div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border/30">
            <div className="text-muted-foreground mb-1">الفرضيات المتبقية</div>
            <div className="font-bold text-2xl text-foreground">{activeHypotheses.length}</div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border/30">
            <div className="text-muted-foreground mb-1">أدلة داعمة للفرضية</div>
            <div className="font-bold text-2xl text-green-400">{supporting.length}</div>
          </div>
          <div className="bg-card p-4 rounded-lg border border-border/30">
            <div className="text-muted-foreground mb-1">أدلة نافية للفرضية</div>
            <div className="font-bold text-2xl text-red-400">{refuting.length}</div>
          </div>
        </div>
      </div>

      {activeHypotheses.length > 1 && confirmedHypothesis && (
        <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-bold">تنبيه</p>
              <p className="text-sm text-muted-foreground">
                لا يزال لديك {activeHypotheses.length - 1} فرضيات أخرى غير مستبعدة. 
                للحصول على تحليل أقوى، قم باستبعاد الفرضيات الخاطئة بالأدلة.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-8">
        <button
          onClick={handleSubmit}
          disabled={!confirmedHypothesisId}
          className={cn(
            "px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all",
            !confirmedHypothesisId
              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1"
          )}
        >
          <Send className="w-5 h-5 rtl:rotate-180" />
          تقديم التقرير وإنهاء القضية
        </button>
      </div>
    </div>
  );
}
