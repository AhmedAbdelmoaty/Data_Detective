import { useEffect } from "react";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useGameStore } from "@/store/gameStore";

export default function Office() {
  const { currentCase, startGame, visitOffice } = useGameStore();

  useEffect(() => {
    visitOffice();
  }, [visitOffice]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-secondary/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full"
      >
        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 rounded-xl bg-primary/10 text-primary">
              <Briefcase className="w-8 h-8" />
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">مكتب المدير</h1>
              <p className="text-muted-foreground leading-relaxed">
                عندنا مشكلة حصلت في الشركة، وعايزينك تراجع المعلومات بسرعة وتطلع بتفسير مقنع.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-secondary/20 border border-white/5">
              <h2 className="text-xl font-bold text-foreground mb-3">{currentCase.title}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {currentCase.managerBriefing}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                href="/hypotheses"
                onClick={startGame}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>البدء في التحليل</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
