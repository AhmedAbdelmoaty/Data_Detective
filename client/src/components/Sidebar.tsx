import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Search,
  Database,
  Users,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Clock,
  Lock,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";

export function Sidebar() {
  const [location] = useLocation();
  const { time, trust, getRemainingHypotheses, currentCase, eliminations } =
    useGameStore();

  const remainingHypotheses = getRemainingHypotheses();
  const totalHypotheses = currentCase.hypotheses.length;
  const eliminatedCount = eliminations.length;

  const initialTime = currentCase.resources.initialTime || 100;
  const timePct = Math.max(0, Math.min(100, Math.round((time / initialTime) * 100)));

  const canOpenReport = remainingHypotheses.length === 1;

  const navItems = [
    { name: "لوحة الفرضيات", icon: Lightbulb, path: "/hypotheses" },
    { name: "غرفة الأدلة", icon: Search, path: "/evidence" },
    { name: "مركز البيانات", icon: Database, path: "/data" },
    { name: "المقابلات", icon: Users, path: "/interviews" },
  ];

  return (
    <div className="h-screen w-64 bg-card border-l border-border flex flex-col shadow-2xl z-50">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-primary">محقق البيانات</h1>
            <p className="text-xs text-muted-foreground">{currentCase.title}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* الوقت + الثقة (عرض بسيط) */}
        <div className="bg-secondary/50 rounded-xl p-4 border border-white/5 space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                الوقت
              </span>
              <span
                className={cn(
                  "font-mono font-bold",
                  time <= 15 ? "text-destructive" : "text-primary"
                )}
              >
                {time} دقيقة
              </span>
            </div>

            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  time <= 15 ? "bg-destructive" : "bg-primary"
                )}
                style={{ width: `${timePct}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">ثقة الإدارة</span>
              <span className="font-mono font-bold text-foreground">{trust}</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${trust}%` }} />
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">استبعدت</span>
              <span className="font-mono text-foreground">
                {eliminatedCount}/{totalHypotheses}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-md"
                    : "hover:bg-white/5 text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* التقرير النهائي (يتقفل لو لسه في أكتر من فرضية) */}
          <Link
            href={canOpenReport ? "/report" : "/hypotheses"}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              location === "/report"
                ? "bg-primary/20 text-primary border border-primary/30 shadow-md"
                : canOpenReport
                ? "hover:bg-white/5 text-muted-foreground"
                : "opacity-60 cursor-not-allowed text-muted-foreground"
            )}
          >
            {canOpenReport ? (
              <FileText className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            <span className="font-medium">التقرير النهائي</span>
          </Link>

          {!canOpenReport && (
            <div className="text-xs text-muted-foreground px-4">
              لازم تفضّل فرضية واحدة عشان التقرير يفتح.
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
