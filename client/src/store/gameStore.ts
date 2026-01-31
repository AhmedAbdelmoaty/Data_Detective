import { create } from "zustand";
import { Case, Hypothesis, EliminationJustification } from "@shared/schema";
import { case001 } from "../content/cases/case001";
import { case001Rules, ReasonRef, SupportRule } from "../content/cases/case001Rules";

type JustificationItem = { type: "evidence" | "interview" | "data"; id: string };

type EliminationLabel = "very_convincing" | "convincing" | "weak" | "misleading";
type SupportLabel = "very_strong" | "strong" | "weak" | "misleading";

export type EliminationEvaluation = {
  label: EliminationLabel;
  note: string;
  coverage: number;
  selectedLocks: number;
  totalLocks: number;
  hasTrap: boolean;
};

export type SupportEvaluation = {
  label: SupportLabel;
  note: string;
  primaryCount: number;
  secondaryCount: number;
  hasMisleading: boolean;
};

export type ReportResult = {
  accepted: boolean;
  managerMessage: string;
  progress: {
    alternativesClosure: number;
    reasoningQuality: number;
    supportStrength: number;
  };
  breakdown: {
    eliminations: Record<string, EliminationEvaluation>;
    finalSupport: SupportEvaluation | null;
  };
};

interface GameState {
  currentCase: Case;
  time: number;
  trust: number;

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

  visitEvidence: (evidenceId: string, cost: number) => void;
  askQuestion: (questionId: string, cost: number) => void;
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

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function toReasonRef(item: JustificationItem): ReasonRef {
  return `${item.type}:${item.id}` as ReasonRef;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function evaluateElimination(hypothesisId: string, items: JustificationItem[]): EliminationEvaluation {
  const rule = (case001Rules as Record<string, { locks: ReasonRef[]; traps: ReasonRef[]; supports: SupportRule }>)[
    hypothesisId
  ];

  const refs = unique(items.map(toReasonRef));
  const selectedLocks = rule?.locks?.filter((r) => refs.includes(r)).length ?? 0;
  const totalLocks = rule?.locks?.length ?? 0;
  const hasTrap = !!rule?.traps?.some((r) => refs.includes(r));
  const coverage = totalLocks > 0 ? selectedLocks / totalLocks : 0;

  let label: EliminationLabel;
  if (hasTrap) label = "misleading";
  else if (coverage === 1 && totalLocks > 0) label = "very_convincing";
  else if (coverage > 0) label = "convincing";
  else label = "weak";

  const noteMap: Record<EliminationLabel, string> = {
    very_convincing: "الأسباب المختارة أقفلت الاحتمال من نقاط فاصلة.",
    convincing: "في أسباب فارقة، لكن الصورة ما اتقفلتش بالكامل.",
    weak: "الأسباب الحالية لا تقفل هذا الاحتمال.",
    misleading: "في الاعتماد على سبب لا يغلق الاحتمال فعليًا.",
  };

  return {
    label,
    note: noteMap[label],
    coverage,
    selectedLocks,
    totalLocks,
    hasTrap,
  };
}

function evaluateSupport(hypothesisId: string, items: JustificationItem[]): SupportEvaluation {
  const rule = (case001Rules as Record<string, { locks: ReasonRef[]; traps: ReasonRef[]; supports: SupportRule }>)[
    hypothesisId
  ];

  const refs = unique(items.map(toReasonRef));
  const support = rule?.supports || { primary: [], secondary: [], misleading: [] };

  const primaryCount = support.primary.filter((r) => refs.includes(r)).length;
  const secondaryCount = support.secondary.filter((r) => refs.includes(r)).length;
  const misleadingCount = support.misleading.filter((r) => refs.includes(r)).length;
  const otherSelected = refs.filter(
    (r) => !support.primary.includes(r) && !support.secondary.includes(r) && !support.misleading.includes(r)
  );
  const hasMisleading = misleadingCount > 0 || otherSelected.length > 0;

  let label: SupportLabel;
  if (refs.length === 0) {
    label = "weak";
  } else if (primaryCount > 0) {
    const hasAdditional = primaryCount + secondaryCount > 1;
    label = hasAdditional ? "very_strong" : "strong";
  } else if (secondaryCount > 0) {
    label = "weak";
  } else {
    label = "misleading";
  }

  const noteMap: Record<SupportLabel, string> = {
    very_strong: "الدعم اعتمد على سبب فارق ومعه دعم إضافي يثبّت الاتجاه.",
    strong: "الدعم اعتمد على سبب فارق واضح.",
    weak: "الدعم جاء من أسباب ثانوية لا تميز بين البدائل.",
    misleading: "الدعم اعتمد على معلومات لا تفرّق بين البدائل.",
  };

  const note =
    hasMisleading && (label === "strong" || label === "very_strong")
      ? "في دعم فارق، لكن بعض الاختيارات لا تميز بين البدائل."
      : noteMap[label];

  return {
    label,
    note,
    primaryCount,
    secondaryCount,
    hasMisleading,
  };
}

function pickBySeed<T>(seed: string, options: T[]): T {
  const h = hashlib(seed);
  return options[h % options.length];
}

function hashlib(s: string): number {
  const hash = cryptoHash(s);
  return hash;
}

function cryptoHash(s: string): number {
  // small deterministic hash (no crypto dependency)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function managerMessageFrom(
  params: {
    accepted: boolean;
    currentCase: Case;
    evals: Record<string, EliminationEvaluation>;
    finalSupport: SupportEvaluation | null;
  }
): string {
  const { accepted, evals, finalSupport, currentCase } = params;

  const opener = pickBySeed(
    JSON.stringify(params),
    [
      "قرأت تقريرك كويس.",
      "اطلّعت على تقريرك بالكامل.",
      "راجعت اللي كتبته في التقرير.",
    ]
  );

  const lineFor = (hid: string, ev?: EliminationEvaluation) => {
    const title = currentCase.hypotheses.find((h) => h.id === hid)?.title || "فرضية";
    if (!ev) return `بالنسبة لـ${title}… محتاج أشوف سند أوضح.`;

    const convincingLines = [
      `بالنسبة لـ${title}، الاتجاه واضح بس لسه محتاج قفل كامل.`,
      `في ${title} قربتني من الإغلاق، لكن فيه باب لسه مفتوح.`,
      `جزء ${title} مقروء، بس محتاج توضيح أكتر عشان يتقفل.`,
    ];

    const veryConvincingLines = [
      `بالنسبة لـ${title}، ده مقفول عندي من أكثر من اتجاه.`,
      `جزء ${title} اتقفل بشكل واضح في التقرير.`,
    ];

    const weakLines = [
      `في ${title} لسه الباب مفتوح قدامي.`,
      `جزء ${title} محتاج سند أكتر قبل ما نقفله.`,
    ];

    const misleadingLines = [
      `في ${title} السبب اللي اتبني عليه الإغلاق ما بيقفلش الباب فعليًا.`,
      `جزء ${title} محتاج مراجعة لأن السبب مش كافي للإغلاق.`,
    ];

    switch (ev.label) {
      case "very_convincing":
        return pickBySeed(title + "very" + JSON.stringify(ev), veryConvincingLines);
      case "convincing":
        return pickBySeed(title + "conv" + JSON.stringify(ev), convincingLines);
      case "weak":
        return pickBySeed(title + "weak" + JSON.stringify(ev), weakLines);
      case "misleading":
        return pickBySeed(title + "mis" + JSON.stringify(ev), misleadingLines);
      default:
        return pickBySeed(title + "def" + JSON.stringify(ev), weakLines);
    }
  };

  const finalLine = (() => {
    if (!finalSupport) {
      return "بالنسبة للفرضية الأساسية… محتاج أشوف أسباب دعم واضحة في التقرير.";
    }
    if (finalSupport.label === "very_strong" || finalSupport.label === "strong") {
      return "وبالنسبة للفرضية الأساسية، الطرح قابل للحركة على أرض الواقع.";
    }
    if (finalSupport.label === "misleading") {
      return "الفرضية الأساسية محتاجة دعم مختلف قبل ما نتحرك.";
    }
    return "الفرضية الأساسية لسه محتاجة سند أوضح علشان نتحرك عليها.";
  })();

  const ending = accepted
    ? pickBySeed(
        "accepted" + JSON.stringify(params),
        [
          "الخلاصة: التقرير كافي للحركة. هنمشي بالاتجاه ده ونبدأ إجراءات المراجعة والتصحيح.",
          "الخلاصة: أقدر أعتمد ده كاتجاه عمل. خلّينا نتحرك ونراجع التنفيذ بسرعة.",
        ]
      )
    : pickBySeed(
        "rejected" + JSON.stringify(params),
        [
          "الخلاصة: مش هقدر أمشي بقرار كبير بالتقرير بالشكل ده. ارجعلي بعد ما تقفل الأبواب المفتوحة.",
          "الخلاصة: لسه فيه مساحات مفتوحة. محتاجين نقفل الاحتمالات قبل ما ناخد خطوة… راجع وحاول تاني.",
        ]
      );

  const lines = currentCase.hypotheses
    .filter((h) => evals[h.id])
    .map((h) => lineFor(h.id, evals[h.id]));

  return [opener, ...lines, finalLine, ending].join("\n");
}

function eliminationScore(label: EliminationLabel): number {
  switch (label) {
    case "very_convincing":
      return 1;
    case "convincing":
      return 0.7;
    case "weak":
      return 0.35;
    case "misleading":
      return 0.1;
    default:
      return 0.35;
  }
}

function supportScore(label: SupportLabel): number {
  switch (label) {
    case "very_strong":
      return 1;
    case "strong":
      return 0.75;
    case "weak":
      return 0.35;
    case "misleading":
      return 0.1;
    default:
      return 0.35;
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  currentCase: case001,
  time: case001.resources.initialTime,
  trust: case001.resources.initialTrust,

  visitedEvidenceIds: [],
  interviewedIds: [],
  discoveredDataInsightIds: [],

  eliminations: [],
  selectedHypothesisId: null,
  finalSupportJustifications: [],

  gameStatus: "briefing",
  hasVisitedOffice: false,

  startGame: () => set({ gameStatus: "playing" }),

  visitOffice: () => set({ hasVisitedOffice: true }),

  resetGame: () =>
    set({
      time: case001.resources.initialTime,
      trust: case001.resources.initialTrust,
      visitedEvidenceIds: [],
      interviewedIds: [],
      discoveredDataInsightIds: [],
      eliminations: [],
      selectedHypothesisId: null,
      finalSupportJustifications: [],
      gameStatus: "briefing",
      hasVisitedOffice: false,
    }),

  visitEvidence: (evidenceId, cost) =>
    set((state) => {
      if (state.time <= 0) return state;
      if (state.visitedEvidenceIds.includes(evidenceId)) return state;
      const newTime = Math.max(0, state.time - cost);
      return { visitedEvidenceIds: [...state.visitedEvidenceIds, evidenceId], time: newTime };
    }),

  askQuestion: (questionId, cost) =>
    set((state) => {
      if (state.time <= 0) return state;
      if (state.interviewedIds.includes(questionId)) return state;
      const newTime = Math.max(0, state.time - cost);
      return { interviewedIds: [...state.interviewedIds, questionId], time: newTime };
    }),

  discoverDataInsight: (insightId) =>
    set((state) => {
      if (state.time <= 0) return state;
      if (state.discoveredDataInsightIds.includes(insightId)) return state;
      // تسجيل رؤية البيانات يكلف وقت بسيط (علشان ما تبقاش "زر مكافأة")
      const newTime = Math.max(0, state.time - 5);
      return { discoveredDataInsightIds: [...state.discoveredDataInsightIds, insightId], time: newTime };
    }),

  eliminateHypothesis: (hypothesisId, justifications) =>
    set((state) => {
      if (state.time <= 0) return state;
      // time cost for making a decision
      const newTime = Math.max(0, state.time - 5);

      const evaluation = evaluateElimination(hypothesisId, justifications);
      let trustDelta = 0;
      if (evaluation.label === "very_convincing") trustDelta = +2;
      else if (evaluation.label === "convincing") trustDelta = +1;
      else if (evaluation.label === "weak") trustDelta = -2;
      else if (evaluation.label === "misleading") trustDelta = -8;

      const newTrust = Math.max(0, Math.min(100, state.trust + trustDelta));

      // Remove existing elimination if any
      const filteredElims = state.eliminations.filter((e) => e.hypothesisId !== hypothesisId);

      const elimination: EliminationJustification = {
        hypothesisId,
        justifications,
        timestamp: Date.now(),
      };

      return { eliminations: [...filteredElims, elimination], time: newTime, trust: newTrust };
    }),

  restoreHypothesis: (hypothesisId) =>
    set((state) => ({
      eliminations: state.eliminations.filter((e) => e.hypothesisId !== hypothesisId),
      selectedHypothesisId: state.selectedHypothesisId === hypothesisId ? null : state.selectedHypothesisId,
    })),

  selectFinalHypothesis: (hypothesisId) => set({ selectedHypothesisId: hypothesisId }),

  setFinalSupportJustifications: (items) => set({ finalSupportJustifications: items }),

  submitConclusion: () => {
    const state = get();
    const selectedId = state.selectedHypothesisId;

    // Evaluate eliminations for the other hypotheses in this case (Level 1 expects 4 hypotheses)
    const evals: Record<string, EliminationEvaluation> = {};
    for (const h of state.currentCase.hypotheses) {
      if (h.id === selectedId) continue;
      const elim = state.eliminations.find((e) => e.hypothesisId === h.id);
      evals[h.id] = evaluateElimination(h.id, elim?.justifications || []);
    }

    const finalSupport = selectedId ? evaluateSupport(selectedId, state.finalSupportJustifications) : null;

    // Acceptance rule (reasoning quality only):
    // - all eliminations at least convincing (no misleading)
    // - final support at least strong
    const eliminationsOk = Object.values(evals).every(
      (e) => e.label === "very_convincing" || e.label === "convincing"
    );
    const supportOk = finalSupport ? finalSupport.label === "very_strong" || finalSupport.label === "strong" : false;

    const accepted = Boolean(eliminationsOk && supportOk);

    const closureValues = Object.values(evals).map((ev) => (ev.label === "misleading" ? 0 : ev.coverage));
    const alternativesClosure = Math.round(
      clamp01(closureValues.reduce((a, v) => a + v, 0) / Math.max(1, closureValues.length)) * 100
    );

    const reasoningValues = [
      ...Object.values(evals).map((ev) => eliminationScore(ev.label)),
      finalSupport ? supportScore(finalSupport.label) : 0.1,
    ];
    const reasoningQuality = Math.round(
      clamp01(reasoningValues.reduce((a, v) => a + v, 0) / Math.max(1, reasoningValues.length)) * 100
    );

    const supportStrength = Math.round(clamp01(finalSupport ? supportScore(finalSupport.label) : 0) * 100);

    const message = managerMessageFrom({ accepted, evals, finalSupport, currentCase: state.currentCase });

    // Set status
    set({ gameStatus: accepted ? "solved" : "failed" });

    return {
      accepted,
      managerMessage: message,
      progress: {
        alternativesClosure,
        reasoningQuality,
        supportStrength,
      },
      breakdown: { eliminations: evals, finalSupport },
    };
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
      for (const ins of ds.insights ?? []) {
        if (state.discoveredDataInsightIds.includes(ins.id)) {
          res.push({ id: ins.id, datasetName: ds.name, title: ins.title, description: ins.description });
        }
      }
    }
    return res;
  },
}));
