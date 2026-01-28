import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import { ArrowRight, Clock, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Office() {
  const { currentCase, time, startGame } = useGameStore();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">مكتب المدير</h1>
        <p className="text-muted-foreground">هنا بتاخد التكليف وتبدأ التحقيق</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 relative overflow-hidden border border-border/50"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />

        <div className="flex items-start gap-6 relative z-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/10 shadow-xl">
            <span className="text-lg font-bold">CEO</span>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentCase.briefing.sender}</h2>
                <p className="text-sm text-primary">ملف عاجل: {currentCase.title}</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span>دلوقتي</span>
              </div>
            </div>

            <div className="bg-secondary/30 p-6 rounded-xl border border-white/5 space-y-4">
              <p className="text-base leading-relaxed text-slate-200">
                {currentCase.briefing.text}
              </p>

              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-2">
                  إحنا شايفين كام احتمال… بس مش عايزين نحكم بدري:
                </div>
                <ul className="space-y-2">
                  {currentCase.hypotheses.map((h) => (
                    <li key={h.id} className="flex items-start gap-2 text-slate-200">
                      <span className="mt-2 w-2 h-2 rounded-full bg-primary/70" />
                      <div>
                        <div className="font-semibold">{h.title}</div>
                        <div className="text-sm text-muted-foreground">{h.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-sm text-muted-foreground pt-2">
                اجمع معلومات… شوف اللي يثبت واللي ينفي… وبعدين ارجعلي بتقرير واضح.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                href="/hypotheses"
                onClick={startGame}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-xl border border-border/50">
          <h3 className="font-bold text-lg mb-4 text-accent">ملاحظات سريعة</h3>
          <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
            <li>مش كل معلومة تنفع تثبت سبب… ركّز على اللي يفرّق بين الفرضيات.</li>
            <li>استبعاد فرضية بدليل “بعيد” ممكن يبوّظ التقرير حتى لو وصلت للسبب الصح.</li>
            <li>لو محتاج تعدّل، ارجع للوحة الفرضيات بسهولة.</li>
          </ul>
        </div>

        <div className="glass-card p-6 rounded-xl border border-border/50">
          <h3 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            الحالة
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>الوقت المتبقي</span>
              <span className="text-foreground font-mono">{time} دقيقة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
