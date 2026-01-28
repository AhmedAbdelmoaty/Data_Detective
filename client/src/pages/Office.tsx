import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Office() {
  const { currentCase, time, startGame } = useGameStore();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">مكتب المدير</h1>
        <p className="text-muted-foreground">
          اجتماع سريع… وبعدها تبدأ تجمع المعلومات.
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />

        <div className="flex items-start gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/10 shadow-xl">
            <span className="text-2xl font-bold">CEO</span>
          </div>

          <div className="flex-1 space-y-5">
            <div className="flex justify-between items-center border-b border-border/50 pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {currentCase.briefing.sender}
                </h2>
                <p className="text-sm text-primary">
                  مهمة عاجلة: {currentCase.title}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span>دلوقتي</span>
              </div>
            </div>

            <div className="bg-secondary/30 p-6 rounded-xl border border-white/5">
              <Mail className="w-5 h-5 text-muted-foreground mb-3" />
              <p className="text-lg leading-relaxed text-slate-200">
                {currentCase.briefing.text}
              </p>
            </div>

            {/* عرض الفرضيات "أول مرة" بسرد وسياق — زي اللي اتفقنا عليه */}
            <div className="bg-card/40 border border-border/60 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-foreground">
                إحنا شاكين في كذا احتمال:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCase.hypotheses.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-xl border border-border/50 bg-background/40 p-4"
                  >
                    <div className="font-bold text-foreground mb-1">
                      {h.title}
                    </div>
                    <div className="text-sm text-muted-foreground leading-6">
                      {h.description}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-6">
                المطلوب منك بسيط: روح شوف اللي يثبت واللي ينفي… وبعدها ارجعلي
                بتقرير.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-muted-foreground">
                الوقت المتاح للتحقيق:{" "}
                <span className="text-foreground font-mono">{time}</span>
              </div>

              <Link
                href="/hypotheses"
                onClick={() => startGame()}
                className="
                  px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold 
                  hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 
                  active:scale-95 transition-all flex items-center gap-2
                "
              >
                <span>ابدأ التحقيق</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
