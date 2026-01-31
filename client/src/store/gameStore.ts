import { create } from "zustand";
import { Case, Hypothesis, EliminationJustification } from "@shared/schema";
import { case001 } from "../content/cases/case001";
import { case001Rules, ReasonRef } from "../content/cases/case001Rules";

type JustificationItem = { type: "evidence" | "interview" | "data"; id: string };

type EvaluationLevel = "strong" | "good" | "mixed" | "weak" | "trap" | "irrelevant";

export type StepEvaluation = {
  level: EvaluationLevel;
  points: number; // internal scoring only
  note: string; // simple, non-technical feedback
};

export type ReportResult = {
  accepted: boolean;
  correctHypothesis: boolean;
  managerMessage: string;
  scorePercent: number;
  breakdown: {
    eliminations: Record<string, StepEvaluation>;
    finalSupport: StepEvaluation | null;
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
  getCompletedInterviews: () => { id: string; stakeholderName: string; text: string; response: string }[];
  getDiscoveredInsights: () => { id: string; datasetName: string; description: string }[];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function toReasonRef(item: JustificationItem): ReasonRef {
  return `${item.type}:${item.id}` as ReasonRef;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function evaluateStep(
  hypothesisId: string,
  items: JustificationItem[],
  mode: "eliminate" | "support"
): StepEvaluation {
  const rule = (case001Rules as any)[hypothesisId] as { locks: ReasonRef[]; traps: ReasonRef[]; supports: ReasonRef[] } | undefined;

  const refs = unique(items.map(toReasonRef));
  const hasLock = !!rule?.locks?.some(r => refs.includes(r));
  const hasTrap = !!rule?.traps?.some(r => refs.includes(r));
  const hasSupport = !!rule?.supports?.some(r => refs.includes(r));
  const hasAnyRelevant = hasLock || hasTrap || hasSupport;
  const hasIrrelevant = refs.length > 0 && !hasAnyRelevant;

  // Level 1 logic (simple)
  if (mode === "support") {
    if (refs.length === 0) return { level: "irrelevant", points: -1, note: "مافيش أسباب دعم كفاية في التقرير." };
    if (hasTrap && !hasSupport) return { level: "trap", points: -2, note: "السبب اللي اخترته هنا مضلل ومش بيدعم الفكرة." };
    if (hasSupport && !hasTrap) {
      const strong = refs.length >= 2 && rule?.supports?.filter(r => refs.includes(r)).length >= 2;
      return strong
        ? { level: "strong", points: 2, note: "دعمك واضح ومبني على معلومات مرتبطة." }
        : { level: "good", points: 1, note: "الدعم مقبول وبيخلي الفكرة أقوى." };
    }
    if (hasSupport && hasTrap) return { level: "mixed", points: 0, note: "فيه سبب كويس… بس خلطت معاه سبب مضلل." };
    return { level: "weak", points: 0, note: "الأسباب هنا عامة ومش بتقوي الفكرة بشكل كافي." };
  }

  // Elimination mode
  if (refs.length === 0) return { level: "irrelevant", points: -1, note: "استبعاد بدون أسباب واضح." };

  if (hasLock && !hasTrap) {
    const strong = refs.length === 2 && rule?.locks?.filter(r => refs.includes(r)).length === 2;
    return strong
      ? { level: "strong", points: 2, note: "استبعاد مقنع جدًا… قفلت الفرضية من أكثر من زاوية." }
      : { level: "good", points: 1, note: "استبعاد مقنع ومبني على سبب مرتبط." };
  }

  if (hasTrap && !hasLock) {
    return { level: "trap", points: -2, note: "السبب اللي اعتمدت عليه هنا ممكن يكون مضلل." };
  }

  if (hasLock && hasTrap) {
    return { level: "mixed", points: 0, note: "فيه سبب قوي… لكن خلطت معاه سبب ممكن يضللك." };
  }

  if (hasSupport && !hasTrap && !hasLock) {
    return { level: "weak", points: 0, note: "السبب مرتبط جزئيًا، بس مش كفاية لقفل الفرضية بثقة." };
  }

  if (hasIrrelevant) {
    return { level: "irrelevant", points: -1, note: "السبب اللي اخترته بعيد عن الفرضية." };
  }

  return { level: "weak", points: 0, note: "استبعاد محتاج سند أوضح." };
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
    correctHypothesis: boolean;
    evals: Record<string, StepEvaluation>;
    finalSupport: StepEvaluation | null;
  }
): string {
  const { accepted, correctHypothesis, evals, finalSupport } = params;

  const opener = pickBySeed(
    JSON.stringify(params),
    [
      "قرأت تقريرك كويس.",
      "اطلّعت على تقريرك بالكامل.",
      "راجعت اللي كتبته في التقرير.",
    ]
  );

  const h1 = evals["h1"];
  const h3 = evals["h3"];
  const h4 = evals["h4"];

  const lineFor = (hid: string, ev?: StepEvaluation) => {
    const title = case001.hypotheses.find(h => h.id === hid)?.title || "فرضية";
    if (!ev) return `بالنسبة لـ${title}… محتاج أشوف سند أوضح.`;

    const goodLines = [
      `استبعادك لـ${title} كان منطقي ومطمّن.`,
      `اللي كتبته عن ${title} خلّاني أقفلها بنسبة كبيرة.`,
      `نقطة ${title} اتقفلت عندي بشكل كويس.`,
    ];

    const strongLines = [
      `استبعادك لـ${title} كان قوي جدًا… قفلتها من أكثر من زاوية.`,
      `في ${title} شغلك كان ممتاز وواضح.`,
    ];

    const weakLines = [
      `في ${title} لسه الحجة مش قوية كفاية.`,
      `جزء ${title} محتاج سند أقوى قبل ما نقفله.`,
    ];

    const mixedLines = [
      `في ${title} فيه سبب كويس… بس فيه حاجة خلتني متردد.`,
      `جزء ${title} متلخبط شوية: فيه نقطة قوية ونقطة تانية مش في مكانها.`,
    ];

    const badLines = [
      `في ${title} السبب اللي بنيت عليه الاستبعاد مش مريحني.`,
      `جزء ${title} مش مقنع لحد دلوقتي.`,
    ];

    switch (ev.level) {
      case "strong":
        return pickBySeed(title + "strong" + JSON.stringify(ev), strongLines);
      case "good":
        return pickBySeed(title + "good" + JSON.stringify(ev), goodLines);
      case "weak":
        return pickBySeed(title + "weak" + JSON.stringify(ev), weakLines);
      case "mixed":
        return pickBySeed(title + "mixed" + JSON.stringify(ev), mixedLines);
      case "trap":
      case "irrelevant":
        return pickBySeed(title + "bad" + JSON.stringify(ev), badLines);
      default:
        return pickBySeed(title + "def" + JSON.stringify(ev), weakLines);
    }
  };

  const finalTitle = case001.hypotheses.find(h => h.id === case001.solution.correctHypothesisId)?.title || "الفرضية";
  const finalLine = (() => {
    if (!correctHypothesis) {
      return "أما الفرضية اللي اخترتها كسبب رئيسي… أنا مش شايفها ماشية مع الصورة كاملة.";
    }
    if (!finalSupport) {
      return `بالنسبة للفرضية اللي اخترتها (${finalTitle})… محتاج أشوف أسباب دعم واضحة في التقرير.`;
    }
    if (finalSupport.level === "strong" || finalSupport.level === "good") {
      return `وبالنسبة للفرضية الأساسية، الطرح بتاعك راكب على اللي شفناه في المعلومات.`;
    }
    if (finalSupport.level === "mixed") {
      return `الفرضية الأساسية ممكن… بس الدعم اللي حطيته متلخبط شوية.`;
    }
    return `الفرضية الأساسية محتاجة دعم أقوى علشان نتحرك عليها.`;
  })();

  const ending = accepted
    ? pickBySeed(
        "accepted" + JSON.stringify(params),
        [
          "الخلاصة: التقرير مترابط. هنمشي بالاتجاه ده ونبدأ إجراءات تصحيح الاستهداف وتأهيل العملاء قبل ما يوصلوا للمبيعات.",
          "الخلاصة: أنا موافق نمشي بالتقرير ده. خلّينا نراجع الاستهداف ومعايير التأهيل، وعايز متابعة سريعة للنتائج.",
        ]
      )
    : pickBySeed(
        "rejected" + JSON.stringify(params),
        [
          "الخلاصة: مش هقدر أخد قرار كبير بتقرير بالشكل ده. ارجعلي بمراجعة أقوى للنقط اللي لسه مش مقفولة.",
          "الخلاصة: لسه في أجزاء مش مقنعة. محتاجين نقفل الاحتمالات قبل ما ناخد خطوة… راجع وحاول تاني.",
        ]
      );

  return [opener, lineFor("h1", h1), lineFor("h3", h3), lineFor("h4", h4), finalLine, ending].join("\n");
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

      const evaluation = evaluateStep(hypothesisId, justifications, "eliminate");
      let trustDelta = 0;
      if (evaluation.level === "strong") trustDelta = +2;
      else if (evaluation.level === "good") trustDelta = +1;
      else if (evaluation.level === "mixed") trustDelta = -3;
      else if (evaluation.level === "weak") trustDelta = -2;
      else if (evaluation.level === "trap") trustDelta = -10;
      else if (evaluation.level === "irrelevant") trustDelta = -8;

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

    const correctHypothesis = selectedId === state.currentCase.solution.correctHypothesisId;

    // Evaluate eliminations for the other hypotheses in this case (Level 1 expects 4 hypotheses)
    const evals: Record<string, StepEvaluation> = {};
    for (const h of state.currentCase.hypotheses) {
      if (h.id === selectedId) continue;
      const elim = state.eliminations.find((e) => e.hypothesisId === h.id);
      evals[h.id] = evaluateStep(h.id, elim?.justifications || [], "eliminate");
    }

    const finalSupport =
      selectedId ? evaluateStep(selectedId, state.finalSupportJustifications, "support") : null;

    // Acceptance rule (Level 1):
    // - correct hypothesis
    // - all eliminations at least "good"
    // - final support at least "good"
    const eliminationsOk = Object.values(evals).every((e) => e.level === "good" || e.level === "strong");
    const supportOk = finalSupport ? finalSupport.level === "good" || finalSupport.level === "strong" : false;

    const accepted = Boolean(correctHypothesis && eliminationsOk && supportOk);

    // Score (simple)
    const maxPoints = 2 * (state.currentCase.hypotheses.length - 1) + 2; // eliminations + final support
    const gotPoints =
      Object.values(evals).reduce((a, e) => a + e.points, 0) + (finalSupport?.points || 0);
    const scorePercent = Math.round(clamp01(gotPoints / maxPoints) * 100);

    const message = managerMessageFrom({ accepted, correctHypothesis, evals, finalSupport });

    // Set status
    set({ gameStatus: accepted ? "solved" : "failed" });

    return {
      accepted,
      correctHypothesis,
      managerMessage: message,
      scorePercent,
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
    const results: { id: string; stakeholderName: string; text: string; response: string }[] = [];
    for (const s of state.currentCase.stakeholders) {
      for (const q of s.questions) {
        if (state.interviewedIds.includes(q.id)) {
          results.push({ id: q.id, stakeholderName: s.name, text: q.text, response: q.response });
        }
      }
    }
    return results;
  },

  getDiscoveredInsights: () => {
    const state = get();
    const res: { id: string; datasetName: string; description: string }[] = [];
    for (const ds of state.currentCase.dataSets) {
      for (const ins of ds.insights) {
        if (state.discoveredDataInsightIds.includes(ins.id)) {
          res.push({ id: ins.id, datasetName: ds.name, description: ins.description });
        }
      }
    }
    return res;
  },
}));
