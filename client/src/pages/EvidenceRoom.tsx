import { useGameStore } from "@/store/gameStore";
import { EvidenceCard } from "@/components/EvidenceCard";
import { Search, Clock } from "lucide-react";

export default function EvidenceRoom() {
  const { currentCase, visitedEvidenceIds, visitEvidence, time } = useGameStore();

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Search className="w-8 h-8 text-primary" />
            غرفة الأدلة
          </h1>
          <p className="text-muted-foreground mt-2">
            افتح الأدلة واقرأها كويس… وبعدها استخدم المعلومة في الاستبعاد أو دعم التقرير.
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2 justify-end">
            <Clock className="w-4 h-4" />
            الوقت المتبقي
          </div>
          <div className="font-mono text-2xl font-bold text-foreground">{time}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
        {currentCase.evidence.map((ev) => (
          <EvidenceCard
            key={ev.id}
            evidence={ev}
            isVisited={visitedEvidenceIds.includes(ev.id)}
            onVisit={() => visitEvidence(ev.id, ev.cost)}
          />
        ))}
      </div>
    </div>
  );
}
