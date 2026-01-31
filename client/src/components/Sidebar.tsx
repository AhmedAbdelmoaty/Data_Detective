import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Database, 
  Users, 
  FileText, 
  LayoutDashboard,
  Lightbulb,
  Briefcase
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";

const items = [
  { name: "مكتب المدير", icon: Briefcase, path: "/office" },
  { name: "لوحة الفرضيات", icon: Lightbulb, path: "/hypotheses", isHub: true },
  { name: "غرفة الأدلة", icon: Search, path: "/evidence" },
  { name: "مركز البيانات", icon: Database, path: "/data" },
  { name: "المقابلات", icon: Users, path: "/interviews" },
  { name: "التقرير النهائي", icon: FileText, path: "/report" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { time, trust, getRemainingHypotheses, currentCase, eliminations } = useGameStore();
  const remainingHypotheses = getRemainingHypotheses();
  const totalHypotheses = currentCase.hypotheses.length;
  const eliminatedCount = eliminations.length;

  return (
    <div className="h-screen w-64 bg-card border-l border-border flex flex-col shadow-2xl z-50">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">محقق البيانات</h1>
            <p className="text-xs text-muted-foreground">الإصدار 1.0</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Resource Monitor */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-white/5 space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">الوقت المتبقي</span>
              <span className={cn("font-mono font-bold", time < 20 ? "text-destructive" : "text-primary")}>
                {time}%
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", time < 20 ? "bg-destructive" : "bg-primary")} 
                style={{ width: `${time}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">الثقة</span>
              <span className="font-mono font-bold text-accent">{trust}%</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500" 
                style={{ width: `${trust}%` }}
              />
            </div>
          </div>
          
          <div className="pt-3 border-t border-border/30">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">الفرضيات المتبقية</span>
              <span className={cn("font-mono font-bold", remainingHypotheses.length === 1 ? "text-green-500" : "text-foreground")}>
                {remainingHypotheses.length} / {totalHypotheses}
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", remainingHypotheses.length === 1 ? "bg-green-500" : "bg-muted-foreground")} 
                style={{ width: `${(eliminatedCount / totalHypotheses) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {items.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              )} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-orange-500 flex items-center justify-center font-bold text-black text-xs">
            أنت
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">المحقق</p>
            <p className="text-xs text-muted-foreground">متصل الآن</p>
          </div>
        </div>
      </div>
    </div>
  );
}
