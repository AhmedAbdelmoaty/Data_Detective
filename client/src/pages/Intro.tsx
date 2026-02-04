import { Link } from "wouter";
import { motion } from "framer-motion";
import { Play, ShieldAlert } from "lucide-react";

export default function Intro() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 grid grid-cols-12 gap-4 opacity-[0.03] pointer-events-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="h-full border-l border-white/20" />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl relative z-10"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-2xl mb-8 border border-primary/30 shadow-2xl shadow-primary/20">
          <ShieldAlert className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
          محلل <span className="text-primary">البيانات</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed">
          لعبة تحليل تعتمد على البيانات. راجع الأدلة، تناقش مع الأشخاص، واكشف
          السبب الحقيقي للمشكلة.
        </p>

        <div className="bg-card/50 backdrop-blur-sm border border-border p-8 rounded-2xl mb-12 text-right">
          <h3 className="font-bold text-lg mb-4 text-accent">
            القضية 001: لغز شركة الأمل العقارية
          </h3>
          <p className="text-sm text-slate-300 leading-7">
            شركة عقارية كبرى تواجه هبوطًا مفاجئًا في المبيعات خلال الأسابيع
            الأخيرة. بصفتك محلل بيانات، مهمتك هي الغوص في البيانات لتحديد السبب
            الحقيقي قبل إفلاس الشركة.
          </p>
        </div>

        <Link href="/office">
          <button
            className="
            group relative px-10 py-5 bg-primary text-primary-foreground text-xl font-bold rounded-xl 
            shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-10px_rgba(59,130,246,0.7)]
            transition-all duration-300 hover:scale-105 active:scale-95
          "
            data-testid="button-start-game"
          >
            <span className="flex items-center gap-3">
              قبول المهمة
              <Play className="w-6 h-6 fill-current" />
            </span>
          </button>
        </Link>
      </motion.div>

      <footer className="absolute bottom-8 text-xs text-muted-foreground opacity-50">
        محاكي تدريب تحليل البيانات - الإصدار التجريبي
      </footer>
    </div>
  );
}
