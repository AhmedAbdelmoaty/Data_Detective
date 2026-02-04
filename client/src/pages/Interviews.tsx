import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { Users, MessageSquare, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Interviews() {
  const { gameStatus, currentCase, interviewedIds, askQuestion, hasVisitedOffice, getRemainingHypotheses } = useGameStore();
  const [_, setLocation] = useLocation();

  const remaining = getRemainingHypotheses();

  useEffect(() => {
    if (!hasVisitedOffice || gameStatus === "briefing") setLocation("/office");
  }, [gameStatus, hasVisitedOffice, setLocation]);
  const [selectedStakeholderId, setSelectedStakeholderId] = useState(currentCase.stakeholders[0].id);

  const activeStakeholder = currentCase.stakeholders.find(s => s.id === selectedStakeholderId)!;

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          غرفة المقابلات
        </h1>
        <p className="text-muted-foreground mt-2">ناقش الموظفين الرئيسيين واختر الأسئلة المفيدة.</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="px-3 py-2 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
            الفرضيات المتبقية: <span className="font-bold text-foreground">{remaining.length}</span>
          </div>
          <Link href="/hypotheses">
            <div className="px-3 py-2 rounded-lg bg-card hover:bg-secondary/40 border border-border/40 text-sm font-medium cursor-pointer flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              الرجوع لمكتب المحلل
            </div>
          </Link>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Stakeholder List */}
        <div className="w-full lg:w-1/4 space-y-4">
          {currentCase.stakeholders.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelectedStakeholderId(person.id)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-right",
                selectedStakeholderId === person.id
                  ? "bg-primary/20 border-primary shadow-md"
                  : "bg-card border-border hover:bg-white/5"
              )}
            >
              <img 
                src={person.avatar} 
                alt={person.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
              <div>
                <div className="font-bold">{person.name}</div>
                <div className="text-xs text-muted-foreground">{person.role}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Interaction Area */}
        <div className="flex-1 glass-card rounded-2xl p-8 flex flex-col border border-border/50">
          <div className="flex items-center gap-6 mb-8 border-b border-border/50 pb-6">
            <div className="relative">
              <img 
                src={activeStakeholder.avatar} 
                alt={activeStakeholder.name} 
                className="w-24 h-24 rounded-2xl object-cover shadow-2xl border-2 border-primary/20"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-4 h-4 rounded-full border-2 border-background" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{activeStakeholder.name}</h2>
              <p className="text-primary">{activeStakeholder.role}</p>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {activeStakeholder.questions.map((q) => {
                const isAsked = interviewedIds.includes(q.id);
                return (
                  <motion.div 
                    key={q.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "rounded-xl border p-4 transition-all",
                      isAsked 
                        ? "bg-secondary/40 border-border" 
                        : "bg-card border-border/50 hover:border-primary/50 cursor-pointer"
                    )}
                    onClick={() => !isAsked && askQuestion(q.id)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className={cn("w-4 h-4", isAsked ? "text-muted-foreground" : "text-primary")} />
                          <h4 className={cn("font-medium", isAsked ? "text-muted-foreground" : "text-foreground")}>
                            {q.text}
                          </h4>
                        </div>
                        
                        {isAsked && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pr-6 text-sm text-foreground leading-relaxed bg-primary/10 p-3 rounded-lg"
                          >
                            "{q.response}"
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
