import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { EvidenceCard } from "@/components/EvidenceCard";
import { Search, ArrowLeft } from "lucide-react";

export default function EvidenceRoom() {
  const [_, setLocation] = useLocation();
  const { gameStatus, currentCase, visitedEvidenceIds, visitEvidence, hasVisitedOffice, getRemainingHypotheses } = useGameStore();

  const remaining = getRemainingHypotheses();

  useEffect(() => {
    if (!hasVisitedOffice || gameStatus === "briefing") setLocation("/office");
  }, [gameStatus, hasVisitedOffice, setLocation]);

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Search className="w-8 h-8 text-primary" />
          غرفة الأدلة
        </h1>
        <p className="text-muted-foreground mt-2">
          اجمع الأدلة، ادرسها، واستخدمها كـ“معلومات” لاستبعاد الفرضيات أو دعم الفرضية النهائية.
        </p>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
        {currentCase.evidence.map((ev) => (
          <EvidenceCard
            key={ev.id}
            evidence={ev}
            isVisited={visitedEvidenceIds.includes(ev.id)}
            onVisit={() => visitEvidence(ev.id)}
          />
        ))}
      </div>
    </div>
  );
}
