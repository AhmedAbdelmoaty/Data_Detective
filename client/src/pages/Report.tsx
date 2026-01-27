import { useEffect, useMemo, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";
import { FileText, CheckCircle2, ClipboardList } from "lucide-react";

type J = { type: 'evidence' | 'interview' | 'data'; id: string };

type Selectable = {
  type: J['type'];
  id: string;
  title: string;
  text: string;
};

function useSelectableItems() {
  const { currentCase, visitedEvidenceIds, interviewedIds, discoveredDataInsightIds } = useGameStore();

  return useMemo<Selectable[]>(() => {
    const items: Selectable[] = [];

    currentCase.evidence
      .filter((e) => visitedEvidenceIds.includes(e.id))
      .forEach((e) => {
        items.push({
          type: 'evidence',
          id: e.id,
          title: e.title,
          text: e.reportNote || e.description,
        });
      });

    currentCase.stakeholders.forEach((s) => {
      s.questions
        .filter((q) => interviewedIds.includes(q.id))
        .forEach((q) => {
          items.push({
            type: 'interview',
            id: q.id,
            title: s.name,
            text: q.reportNote || `${s.name}: ${q.response}`,
          });
        });
    });

    currentCase.dataSets.forEach((ds) => {
      (ds.insights || [])
        .filter((i) => discoveredDataInsightIds.includes(i.id))
        .forEach((i) => {
          items.push({
            type: 'data',
            id: i.id,
            title: ds.name,
            text: i.reportNote || i.description,
          });
        });
    });

    return items;
  }, [currentCase, visitedEvidenceIds, interviewedIds, discoveredDataInsightIds]);
}

function PickList({
  items,
  value,
  onChange,
  max,
}: {
  items: Selectable[];
  value: J[];
  onChange: (next: J[]) => void;
  max: number;
}) {
  const isSelected = (t: J['type'], id: string) => value.some((x) => x.type === t && x.id === id);

  const toggle = (t: J['type'], id: string) => {
    const exists = isSelected(t, id);
    if (exists) return onChange(value.filter((x) => !(x.type === t && x.id === id)));
    if (value.length >= max) return;
    onChange([...value, { type: t, id }]);
  };

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground bg-secondary/30 border border-border/40 rounded-xl p-4">
        لسه ماجمعتش معلومات كفاية… افتح شوية أدلة أو اسأل حد، وبعدين ارجع.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((it) => {
        const picked = isSelected(it.type, it.id);
        return (
          <button
            key={`${it.type}:${it.id}`}
            onClick={() => toggle(it.type, it.id)}
            className={cn(
              "w-full text-right p-4 rounded-xl border transition-all",
              picked ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/30"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5",
                  picked ? "border-primary bg-primary" : "border-muted-foreground"
                )}
              >
                {picked && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">{it.title}</div>
                <div className="font-medium text-foreground leading-relaxed">{it.text}</div>
              </div>
            </div>
          </button>
        );
      })}
      <div className="text-xs text-muted-foreground pt-1">اختر {max} على الأكثر. (اخترت {value.length})</div>
    </div>
  );
}

export default function Report() {
  const {
    currentCase,
    submitReport,
    reportResult,
    setFinalSupports,
    finalSupports,
    selectedHypothesisId,
    selectFinalHypothesis,
    eliminations,
  } = useGameStore();

  const selectableItems = useSelectableItems();

  const initialElim = useMemo(() => {
    const m: Record<string, J[]> = {};
    eliminations.forEach((e) => {
      m[e.hypothesisId] = (e.justifications || []) as J[];
    });
    return m;
  }, [eliminations]);

  const [elim, setElim] = useState<Record<string, J[]>>(initialElim);

  useEffect(() => {
    // Keep report UI in sync if player used the elimination modal أثناء اللعب
    setElim(initialElim);
  }, [initialElim]);

  const finalHypothesisId = selectedHypothesisId;

  const otherHypotheses = currentCase.hypotheses.filter((h) => h.id !== finalHypothesisId);
  const canSubmit = (() => {
    if (!finalHypothesisId) return false;
    if (finalSupports.length < 1 || finalSupports.length > 2) return false;
    for (const h of currentCase.hypotheses) {
      if (h.id === finalHypothesisId) continue;
      const list = elim[h.id] || [];
      if (list.length < 1 || list.length > 2) return false;
    }
    return true;
  })();

  const handleSubmit = () => {
    if (!finalHypothesisId) return;
    submitReport({
      finalHypothesisId,
      finalSupports,
      eliminationsByHypothesis: elim,
    });
  };

  if (reportResult) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            رد الإدارة
          </h1>
          <p className="text-muted-foreground">ده رد المدير بعد ما قرأ التقرير اللي قدمته.</p>
        </header>

        <div className="bg-card border border-border rounded-2xl p-6 leading-relaxed whitespace-pre-line text-foreground">
          {reportResult.managerReply}
        </div>

        <div className="text-sm text-muted-foreground">
          تقدر ترجع للغرف وتعمل تقرير جديد لو حبيت.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-primary" />
          التقرير
        </h1>
        <p className="text-muted-foreground">
          اختر السبب اللي شايفه صح، وادعمه بمعلومة أو اتنين… وبعدها اقفل باقي الاحتمالات.
        </p>
      </header>

      {/* Final hypothesis */}
      <section className="space-y-3">
        <h2 className="font-bold text-foreground">1) السبب اللي ترجّحه</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentCase.hypotheses.map((h) => {
            const active = finalHypothesisId === h.id;
            return (
              <button
                key={h.id}
                onClick={() => selectFinalHypothesis(h.id)}
                className={cn(
                  "text-right rounded-xl border p-4 transition-all",
                  active ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/30"
                )}
              >
                <div className="font-bold text-foreground">{h.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{h.description}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Support final */}
      <section className="space-y-3">
        <h2 className="font-bold text-foreground">2) ادعمه بمعلومة أو اتنين</h2>
        <PickList
          items={selectableItems}
          value={finalSupports}
          onChange={(next) => setFinalSupports(next)}
          max={2}
        />
      </section>

      {/* Close others */}
      <section className="space-y-4">
        <h2 className="font-bold text-foreground">3) اقفل باقي الاحتمالات</h2>
        <div className="space-y-4">
          {otherHypotheses.map((h) => (
            <div key={h.id} className="bg-card/60 border border-border/40 rounded-2xl p-5">
              <div className="font-bold text-foreground mb-1">{h.title}</div>
              <div className="text-sm text-muted-foreground mb-4">اختر 1–2 سبب يقفلوا الاحتمال ده</div>
              <PickList
                items={selectableItems}
                value={elim[h.id] || []}
                onChange={(next) => setElim((s) => ({ ...s, [h.id]: next }))}
                max={2}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "px-6 py-3 rounded-xl font-bold transition-all",
            canSubmit
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          سلّم التقرير
        </button>
      </div>
    </div>
  );
}
