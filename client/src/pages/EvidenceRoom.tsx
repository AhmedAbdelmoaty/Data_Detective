import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGameStore } from "@/store/gameStore";
import { EvidenceCard } from "@/components/EvidenceCard";
import { Search } from "lucide-react";

export default function EvidenceRoom() {
  const [_, setLocation] = useLocation();
  const { gameStatus, currentCase, visitedEvidenceIds, visitEvidence, hasVisitedOffice } = useGameStore();

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
