import { create } from "zustand";
import { Case, Hypothesis, EliminationJustification } from "@shared/schema";
import { case001 } from "../content/cases/case001";
import { ReasonRef } from "../content/cases/case001Rules";
import { evaluateElimination, evaluateReport, StepEvaluation, Verdict } from "../lib/reportEvaluator";

type JustificationItem = { type: "evidence" | "interview" | "data"; id: string };

export type ReportResult = {
  accepted: boolean;
  correctHypothesis: boolean;
  verdict: Verdict;
  managerMessage: string;
  scorePercent: number;
  breakdown: {
    eliminations: { hypothesisId: string; evaluation: StepEvaluation }[];
    finalSupport: StepEvaluation;
  };
};

interface GameState {
  currentCase: Case;
  time: number;
  trust: number;
  reportAttemptsLeft: number;

  visitedEvidenceIds: string[];
  interviewedIds: string[]; // question ids
  discoveredDataInsightIds: string[];

  eliminations: EliminationJustification[];
  selectedHypothesisId: string | null;
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

function toReasonRef(item: JustificationItem): ReasonRef {
  return `${item.type}:${item.id}` as ReasonRef;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function trustDeltaFromEvaluation(ev: StepEvaluation): number {
  // trust is not the main mechanic for Level 1, so keep it gentle.
  switch (ev.grade) {
    case "strong":
      return +2;
    case "medium":
      return +1;
    case "weak":
      return -2;
    case "trap":
      return -6;
    default:
      return 0;
  }
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
      // Replace existing elimination for the same hypothesis
      const filteredElims = state.eliminations.filter((e) => e.hypothesisId !== hypothesisId);

      const elimination: EliminationJustification = {
        hypothesisId,
        justifications,
        timestamp: Date.now(),
      };

      // Light trust feedback (internal only)
      const refs = unique(justifications.map(toReasonRef));
      const ev = evaluateElimination(hypothesisId, refs);

      const trustDelta = trustDeltaFromEvaluation(ev);
      const newTrust = Math.max(0, Math.min(100, state.trust + trustDelta));

      // IMPORTANT: any change in eliminations invalidates the final report draft.
      return {
        eliminations: [...filteredElims, elimination],
        trust: newTrust,
        selectedHypothesisId: null,
        finalSupportJustifications: [],
      };
    }),

  restoreHypothesis: (hypothesisId) =>
    set((state) => ({
      eliminations: state.eliminations.filter((e) => e.hypothesisId !== hypothesisId),
      selectedHypothesisId: null,
      finalSupportJustifications: [],
    })),

  selectFinalHypothesis: (hypothesisId) => set({ selectedHypothesisId: hypothesisId }),

  setFinalSupportJustifications: (items) => set({ finalSupportJustifications: items }),

  submitConclusion: () => {
    const state = get();

    if (state.reportAttemptsLeft <= 0) {
      return {
        accepted: false,
        correctHypothesis: false,
        verdict: "unconvincing",
        managerMessage: "المحاولات خلصت. لازم تعيد البدء.",
        scorePercent: 0,
        breakdown: { eliminations: [], finalSupport: { grade: "weak", points: 0, message: "" } },
      };
    }

    const remaining = state.currentCase.hypotheses.filter(
      (h) => !state.eliminations.some((e) => e.hypothesisId === h.id)
    );

    if (remaining.length !== 1) {
      return {
        accepted: false,
        correctHypothesis: false,
        verdict: "unconvincing",
        managerMessage: "لسه التقرير غير جاهز. لازم تفضل فرضية واحدة فقط قبل ما تقدّم التقرير.",
        scorePercent: 0,
        breakdown: { eliminations: [], finalSupport: { grade: "weak", points: 0, message: "" } },
      };
    }

    const finalHypothesisId = remaining[0].id;

    // Safety: if user confirmed something else (shouldn't happen after reset), force reconfirm.
    if (!state.selectedHypothesisId || state.selectedHypothesisId !== finalHypothesisId) {
      return {
        accepted: false,
        correctHypothesis: false,
        verdict: "unconvincing",
        managerMessage: "قبل ما تقدّم التقرير، لازم تأكد الفرضية المتبقية كسبب رئيسي.",
        scorePercent: 0,
        breakdown: { eliminations: [], finalSupport: { grade: "weak", points: 0, message: "" } },
      };
    }

    const eliminatedHypothesisIds = state.currentCase.hypotheses
      .filter((h) => h.id !== finalHypothesisId)
      .map((h) => h.id);

    const eliminationReasonsByHypothesis: Record<string, ReasonRef[]> = {};
    for (const hid of eliminatedHypothesisIds) {
      const elim = state.eliminations.find((e) => e.hypothesisId === hid);
      eliminationReasonsByHypothesis[hid] = unique((elim?.justifications ?? []).map(toReasonRef));
    }

    const finalSupportReasonRefs = unique(state.finalSupportJustifications.map(toReasonRef));

    const evaluation = evaluateReport({
      finalHypothesisId,
      eliminatedHypothesisIds,
      eliminationReasonsByHypothesis,
      finalSupportReasonRefs,
      correctHypothesisId: state.currentCase.solution.correctHypothesisId,
    });

    const nextAttemptsLeft = evaluation.accepted
      ? state.reportAttemptsLeft
      : Math.max(0, state.reportAttemptsLeft - 1);

    const nextStatus: GameState["gameStatus"] = evaluation.accepted
      ? "solved"
      : nextAttemptsLeft <= 0
        ? "failed"
        : "playing";

    set({ reportAttemptsLeft: nextAttemptsLeft, gameStatus: nextStatus });

    return {
      accepted: evaluation.accepted,
      correctHypothesis: evaluation.correctHypothesis,
      verdict: evaluation.verdict,
      managerMessage: evaluation.managerNarrative,
      scorePercent: evaluation.percent,
      breakdown: {
        eliminations: evaluation.eliminationFeedback,
        finalSupport: evaluation.finalSupport,
      },
    };
  },

  getRemainingHypotheses: () => {
    const state = get();
    return state.currentCase.hypotheses.filter(
      (h) => !state.eliminations.some((e) => e.hypothesisId === h.id)
    );
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
