import { useGameStore } from "@/store/gameStore";
import { FileText, CheckCircle, AlertTriangle, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Report() {
  const { currentCase, pinnedEvidenceIds, submitSolution, gameStatus } = useGameStore();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    const res = submitSolution(selectedOptionId);
    setResult(res);
  };

  if (result) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "max-w-2xl w-full p-12 rounded-3xl border-2 text-center shadow-2xl",
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
          
          <p className="text-xl leading-relaxed opacity-90 mb-8">
            {result.feedback}
          </p>

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
          اختر الاستنتاج الصحيح بناءً على الأدلة التي قمت بتثبيتها.
        </p>
      </header>

      {/* Pinned Evidence Review */}
      <div className="bg-secondary/20 p-6 rounded-xl border border-border/50">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-accent rounded-full"></span>
          الأدلة الداعمة (المثبتة)
        </h3>
        {pinnedEvidenceIds.length === 0 ? (
          <p className="text-destructive text-sm">لم تقم بتثبيت أي أدلة! عد إلى غرفة الأدلة واختر الحقائق المهمة.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {pinnedEvidenceIds.map(id => {
              const ev = currentCase.evidence.find(e => e.id === id);
              return (
                <div key={id} className="bg-card border border-accent/30 px-4 py-2 rounded-lg text-sm shadow-sm">
                  {ev?.title}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">ما هو السبب الرئيسي للمشكلة؟</h3>
        {currentCase.solution.options.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedOptionId(option.id)}
            className={cn(
              "w-full text-right p-6 rounded-xl border-2 transition-all duration-200",
              selectedOptionId === option.id
                ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                selectedOptionId === option.id ? "border-primary" : "border-muted-foreground"
              )}>
                {selectedOptionId === option.id && <div className="w-3 h-3 bg-primary rounded-full" />}
              </div>
              <span className={cn(
                "text-lg",
                selectedOptionId === option.id ? "font-bold text-primary" : "text-foreground"
              )}>
                {option.text}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-8">
        <button
          onClick={handleSubmit}
          disabled={!selectedOptionId || pinnedEvidenceIds.length === 0}
          className={cn(
            "px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all",
            !selectedOptionId || pinnedEvidenceIds.length === 0
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
