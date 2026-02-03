import { create } from "zustand";
import { Case, Hypothesis, EliminationJustification } from "@shared/schema";
import { case001 } from "../content/cases/case001";
import { evaluateCase001Report, ReportEvaluation, JustificationItem } from "@/lib/reportEvaluator";

export type ReportResult = ReportEvaluation;

interface GameState {
  currentCase: Case;
  time: number;
  trust: number;
  reportAttemptsLeft: number;

  visitedEvidenceIds: string[];
  interviewedIds: string[]; // question ids
  discoveredDataInsightIds: string[];

  eliminations: EliminationJustification[];
  selectedHypothesisId: string | null; // confirmation step on Report page
  finalSupportJustifications: JustificationItem[];

  gameStatus: "briefing" | "playing" | "solved" | "failed";
  hasVisitedOffice: boolean;

  // Actions
  startGame: () => void;
  resetGame: () => void;
  visitOffice: () => void;

  visitEvidence: (evidenceId: string) => void;
  askQuestion: (questionId: string) => void;
  discoverDataInsight: (insightId: string) => void;

  eliminateHypothesis: (hypothesisId: string, justifications: JustificationItem[]) => void;
  restoreHypothesis: (hypothesisId: string) => void;
  selectFinalHypothesis: (hypothesisId: string) => void;

  setFinalSupportJustifications: (items: JustificationItem[]) => void;

  submitConclusion: () => ReportResult;

  // Helpers
  getRemainingHypotheses: () => Hypothesis[];
  isHypothesisEliminated: (hypothesisId: string) => boolean;
  getEliminationJustification: (hypothesisId: string) => EliminationJustification | undefined;

  getDiscoveredEvidence: () => Case["evidence"];
  getCompletedInterviews: () => {
    id: string;
    stakeholderName: string;
    text: string;
    response: string;
    infoSummary: string;
  }[];
  getDiscoveredInsights: () => { id: string; datasetName: string; title: string; description: string }[];
}

function uniqueJustifications(items: JustificationItem[]): JustificationItem[] {
  const seen = new Set<string>();
  const out: JustificationItem[] = [];
  for (const it of items) {
    const key = `${it.type}:${it.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function resetReportDraft(state: Pick<GameState, "selectedHypothesisId" | "finalSupportJustifications">) {
  return {
    selectedHypothesisId: null,
    finalSupportJustifications: [],
  } as const;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentCase: case001,
  time: case001.resources.initialTime,
  trust: case001.resources.initialTrust,
  reportAttemptsLeft: 3,

  visitedEvidenceIds: [],
  interviewedIds: [],
  discoveredDataInsightIds: [],

  eliminations: [],
  selectedHypothesisId: null,
  finalSupportJustifications: [],

  gameStatus: "briefing",
  hasVisitedOffice: false,

  startGame: () => set({ gameStatus: "playing", reportAttemptsLeft: 3 }),

  visitOffice: () => set({ hasVisitedOffice: true }),

  resetGame: () =>
    set({
      time: case001.resources.initialTime,
      trust: case001.resources.initialTrust,
      reportAttemptsLeft: 3,
      visitedEvidenceIds: [],
      interviewedIds: [],
      discoveredDataInsightIds: [],
      eliminations: [],
      selectedHypothesisId: null,
      finalSupportJustifications: [],
      gameStatus: "briefing",
      hasVisitedOffice: false,
    }),

  visitEvidence: (evidenceId) =>
    set((state) => {
      if (state.visitedEvidenceIds.includes(evidenceId)) return state;
      return { visitedEvidenceIds: [...state.visitedEvidenceIds, evidenceId] };
    }),

  askQuestion: (questionId) =>
    set((state) => {
      if (state.interviewedIds.includes(questionId)) return state;
      return { interviewedIds: [...state.interviewedIds, questionId] };
    }),

  discoverDataInsight: (insightId) =>
    set((state) => {
      if (state.discoveredDataInsightIds.includes(insightId)) return state;
      return { discoveredDataInsightIds: [...state.discoveredDataInsightIds, insightId] };
    }),

  eliminateHypothesis: (hypothesisId, justifications) =>
    set((state) => {
      // Replace existing elimination if any
      const filteredElims = state.eliminations.filter((e) => e.hypothesisId !== hypothesisId);

      const elimination: EliminationJustification = {
        hypothesisId,
        justifications,
        timestamp: Date.now(),
      };

      // أي تعديل في الاستبعادات لازم يصفّر مسودة التقرير النهائي
      return {
        eliminations: [...filteredElims, elimination],
        ...resetReportDraft(state),
      };
    }),

  restoreHypothesis: (hypothesisId) =>
    set((state) => ({
      eliminations: state.eliminations.filter((e) => e.hypothesisId !== hypothesisId),
      ...resetReportDraft(state),
    })),

  selectFinalHypothesis: (hypothesisId) =>
    set((state) => ({
      selectedHypothesisId: hypothesisId,
      // تأكيد الفرضية يعيد اختيار الدعم (علشان مايبقاش في دعم قديم)
      finalSupportJustifications: [],
    })),

  setFinalSupportJustifications: (items) =>
    set(() => ({
      finalSupportJustifications: uniqueJustifications(items),
    })),

  submitConclusion: () => {
    const state = get();

    if (state.reportAttemptsLeft <= 0) {
      return {
        outcome: "rejected",
        accepted: false,
        scorePercent: 0,
        correctHypothesis: false,
        remainingHypothesisId: "",
        ledger: [],
        learningCards: [],
        managerMessage: "المحاولات خلصت. لازم تعيد البدء.",
      };
    }

    const remaining = state.currentCase.hypotheses.filter(
      (h) => !state.eliminations.some((e) => e.hypothesisId === h.id)
    );

    if (remaining.length !== 1) {
      return {
        outcome: "review",
        accepted: false,
        scorePercent: 0,
        correctHypothesis: false,
        remainingHypothesisId: remaining[0]?.id ?? "",
        ledger: [],
        learningCards: [],
        managerMessage: "لازم تسيب فرضية واحدة بس قبل ما تقدّم التقرير.",
      };
    }

    const finalHypothesisId = remaining[0].id;

    // لازم المستخدم يكون أكد الفرضية المتبقية (خطوة UX)
    if (state.selectedHypothesisId !== finalHypothesisId) {
      return {
        outcome: "review",
        accepted: false,
        scorePercent: 0,
        correctHypothesis: false,
        remainingHypothesisId: finalHypothesisId,
        ledger: [],
        learningCards: [],
        managerMessage: "قبل ما تقدّم التقرير، أكد الفرضية المتبقية كسبب رئيسي.",
      };
    }

    const evalResult = evaluateCase001Report({
      eliminations: state.eliminations.map((e) => ({
        hypothesisId: e.hypothesisId,
        justifications: e.justifications as JustificationItem[],
      })),
      finalHypothesisId,
      finalSupportJustifications: state.finalSupportJustifications,
    });

    const nextAttemptsLeft = evalResult.accepted
      ? state.reportAttemptsLeft
      : Math.max(0, state.reportAttemptsLeft - 1);

    const nextStatus: GameState["gameStatus"] = evalResult.accepted
      ? "solved"
      : nextAttemptsLeft <= 0
        ? "failed"
        : "playing";

    set({
      reportAttemptsLeft: nextAttemptsLeft,
      gameStatus: nextStatus,
    });

    return evalResult;
  },

  getRemainingHypotheses: () => {
    const state = get();
    return state.currentCase.hypotheses.filter((h) => !state.eliminations.some((e) => e.hypothesisId === h.id));
  },

  isHypothesisEliminated: (hypothesisId) => get().eliminations.some((e) => e.hypothesisId === hypothesisId),

  getEliminationJustification: (hypothesisId) => get().eliminations.find((e) => e.hypothesisId === hypothesisId),

  getDiscoveredEvidence: () => {
    const state = get();
    return state.currentCase.evidence.filter((ev) => state.visitedEvidenceIds.includes(ev.id));
  },

  getCompletedInterviews: () => {
    const state = get();
    const results: {
      id: string;
      stakeholderName: string;
      text: string;
      response: string;
      infoSummary: string;
    }[] = [];

    for (const s of state.currentCase.stakeholders) {
      for (const q of s.questions) {
        if (state.interviewedIds.includes(q.id)) {
          results.push({
            id: q.id,
            stakeholderName: s.name,
            text: q.text,
            response: q.response,
            infoSummary: q.infoSummary || `${s.name}: ${q.response}`,
          });
        }
      }
    }
    return results;
  },

  getDiscoveredInsights: () => {
    const state = get();
    const res: { id: string; datasetName: string; title: string; description: string }[] = [];
    for (const ds of state.currentCase.dataSets) {
      for (const ins of ds.insights) {
        if (state.discoveredDataInsightIds.includes(ins.id)) {
          res.push({ id: ins.id, datasetName: ds.name, title: ins.title, description: ins.description });
        }
      }
    }
    return res;
  },
}));
