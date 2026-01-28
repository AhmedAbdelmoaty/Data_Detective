import { create } from 'zustand';
import { Case, Hypothesis, EliminationJustification, CaseScoringItem, ItemStrength, ReportItemKind } from '@shared/schema';
import { case001 } from '../content/cases/case001';

type ReportJustification = { type: 'evidence' | 'interview' | 'data'; id: string };

export type ReportDecision = 'approved' | 'partial' | 'rejected';

export interface ManagerReportResult {
  decision: ReportDecision;
  // One human message (manager voice) shown to the player
  managerReply: string;
  // For UI: per-hypothesis short comments (also manager voice)
  perHypothesis: { hypothesisId: string; text: string }[];
  // Internal flags (not shown as "scores" to the player)
  meta: {
    correctFinal: boolean;
    openHypotheses: string[]; // hypotheses that were not convincingly closed
  };
}

interface GameState {
  currentCase: Case;
  time: number;
  trust: number;
  visitedEvidenceIds: string[];
  pinnedEvidenceIds: string[];
  interviewedIds: string[];
  discoveredDataInsightIds: string[];
  eliminations: EliminationJustification[];
  selectedHypothesisId: string | null;
  finalSupports: ReportJustification[];
  reportResult: ManagerReportResult | null;
  gameStatus: 'briefing' | 'playing' | 'solved' | 'failed';
  
  // Actions
  startGame: () => void;
  visitEvidence: (id: string, cost: number) => void;
  togglePinEvidence: (id: string) => void;
  askQuestion: (questionId: string, cost: number) => void;
  discoverDataInsight: (insightId: string) => void;
  eliminateHypothesis: (hypothesisId: string, justifications: { type: 'evidence' | 'interview' | 'data'; id: string }[]) => void;
  restoreHypothesis: (hypothesisId: string) => void;
  selectFinalHypothesis: (hypothesisId: string) => void;
  setFinalSupports: (items: ReportJustification[]) => void;
  submitReport: (payload: {
    finalHypothesisId: string;
    finalSupports: ReportJustification[];
    eliminationsByHypothesis: Record<string, ReportJustification[]>;
  }) => ManagerReportResult;
  // Legacy (older flow)
  submitConclusion: () => { correct: boolean; feedback: string };
  resetGame: () => void;
  
  // Computed helpers
  getRemainingHypotheses: () => Hypothesis[];
  isHypothesisEliminated: (id: string) => boolean;
  getEliminationJustification: (hypothesisId: string) => EliminationJustification | undefined;
  getDiscoveredEvidence: () => { id: string; title: string; description: string }[];
  getCompletedInterviews: () => { id: string; text: string; response: string; stakeholderName: string }[];
  getDiscoveredInsights: () => { id: string; description: string; datasetName: string }[];
}

export const useGameStore = create<GameState>((set, get) => ({
  currentCase: case001,
  time: case001.resources.initialTime,
  trust: case001.resources.initialTrust,
  visitedEvidenceIds: [],
  pinnedEvidenceIds: [],
  interviewedIds: [],
  discoveredDataInsightIds: [],
  eliminations: [],
  selectedHypothesisId: null,
  finalSupports: [],
  reportResult: null,
  gameStatus: 'briefing',

  startGame: () => set({ gameStatus: 'playing' }),

  visitEvidence: (id, cost) => {
    const state = get();
    if (state.visitedEvidenceIds.includes(id)) return;
    
    set((state) => ({
      visitedEvidenceIds: [...state.visitedEvidenceIds, id],
      time: Math.max(0, state.time - cost),
    }));
  },

  togglePinEvidence: (id) => {
    set((state) => {
      const isPinned = state.pinnedEvidenceIds.includes(id);
      if (isPinned) {
        return { pinnedEvidenceIds: state.pinnedEvidenceIds.filter((eid) => eid !== id) };
      } else {
        if (state.pinnedEvidenceIds.length >= 5) return state;
        return { pinnedEvidenceIds: [...state.pinnedEvidenceIds, id] };
      }
    });
  },

  askQuestion: (questionId, cost) => {
    const state = get();
    if (state.interviewedIds.includes(questionId)) return;

    set((state) => ({
      interviewedIds: [...state.interviewedIds, questionId],
      time: Math.max(0, state.time - cost),
    }));
  },

  discoverDataInsight: (insightId) => {
    const state = get();
    if (state.discoveredDataInsightIds.includes(insightId)) return;
    
    set((state) => ({
      discoveredDataInsightIds: [...state.discoveredDataInsightIds, insightId],
    }));
  },

  eliminateHypothesis: (hypothesisId, justifications) => {
    const state = get();
    const alreadyEliminated = state.eliminations.some(e => e.hypothesisId === hypothesisId);
    if (alreadyEliminated) return;

    set((state) => ({
      eliminations: [
        ...state.eliminations,
        { hypothesisId, justifications, timestamp: Date.now() }
      ]
    }));
  },

  restoreHypothesis: (hypothesisId) => {
    set((state) => ({
      eliminations: state.eliminations.filter(e => e.hypothesisId !== hypothesisId)
    }));
  },

  selectFinalHypothesis: (hypothesisId) => {
    set({ selectedHypothesisId: hypothesisId });
  },

  setFinalSupports: (items) => {
    set({ finalSupports: items });
  },

  submitReport: ({ finalHypothesisId, finalSupports, eliminationsByHypothesis }) => {
    const state = get();
    const theCase = state.currentCase;
    const scoringItems = (theCase.scoringItems || []) as CaseScoringItem[];

    const key = (kind: ReportItemKind, id: string) => `${kind}:${id}`;
    const itemMap = new Map<string, CaseScoringItem>();
    scoringItems.forEach((it) => itemMap.set(key(it.kind, it.id), it));

    const strengthRank: Record<ItemStrength, number> = { none: 0, weak: 1, strong: 2 };
    const mergeStrength = (a: ItemStrength, b: ItemStrength): ItemStrength =>
      strengthRank[b] > strengthRank[a] ? b : a;

    const evalList = (
      items: ReportJustification[],
      hypId: string,
      mode: 'support' | 'eliminate'
    ): ItemStrength => {
      let s: ItemStrength = 'none';
      for (const it of items) {
        const kind: ReportItemKind = it.type === 'data' ? 'data' : it.type;
        const si = itemMap.get(key(kind, it.id));
        if (!si) continue;
        const v = mode === 'support' ? si.support[hypId] : si.eliminate[hypId];
        if (!v) continue;
        s = mergeStrength(s, v);
        if (s === 'strong') return 'strong';
      }
      return s;
    };

    // Normalize eliminations into store (keeps the "path" consistent)
    const newEliminations: EliminationJustification[] = Object.entries(eliminationsByHypothesis)
      .filter(([hid]) => hid !== finalHypothesisId)
      .map(([hid, justifications]) => ({ hypothesisId: hid, justifications, timestamp: Date.now() }));

    // Evaluate
    const correctFinal = finalHypothesisId === theCase.solution.correctHypothesisId;
    const finalSupportStrength = evalList(finalSupports, finalHypothesisId, 'support');

    const perHypothesis: { hypothesisId: string; text: string }[] = [];
    const openHypotheses: string[] = [];

    for (const h of theCase.hypotheses) {
      if (h.id === finalHypothesisId) continue;
      const chosen = eliminationsByHypothesis[h.id] || [];
      const st = evalList(chosen, h.id, 'eliminate');

      if (st !== 'strong') openHypotheses.push(h.id);

      if (st === 'strong') {
        perHypothesis.push({
          hypothesisId: h.id,
          text: `"${h.title}" اتقفلت بشكل مقنع.`
        });
      } else if (st === 'weak') {
        perHypothesis.push({
          hypothesisId: h.id,
          text: `"${h.title}" لسه مش مقفولة… اللي اتكتب مش كفاية يخليها تختفي.`
        });
      } else {
        perHypothesis.push({
          hypothesisId: h.id,
          text: `"${h.title}" المبرر اللي اتستخدم مش مرتبط قوي بالفرضية دي.`
        });
      }
    }

    // Decision rules (Level 1, simple but fair)
    const openCount = openHypotheses.length;
    let decision: ReportDecision = 'rejected';

    if (correctFinal) {
      if (openCount === 0 && finalSupportStrength !== 'none') decision = 'approved';
      else if (openCount <= 1) decision = 'partial';
      else decision = 'rejected';
    } else {
      // Wrong final, but we can still give partial credit if most things were closed well
      const strongClosed = theCase.hypotheses
        .filter(h => h.id !== finalHypothesisId)
        .filter(h => evalList(eliminationsByHypothesis[h.id] || [], h.id, 'eliminate') === 'strong')
        .length;
      if (strongClosed >= 2 && finalSupportStrength !== 'none') decision = 'partial';
      else decision = 'rejected';
    }

    const finalHyp = theCase.hypotheses.find(h => h.id === finalHypothesisId);
    const finalTitle = finalHyp?.title || 'السبب اللي اخترته';

    const managerIntro = "تمام… قريت تقريرك.";
    let managerFinalLine = "";
    if (correctFinal) {
      if (finalSupportStrength === 'strong') managerFinalLine = `اللي رجحته منطقي، و"${finalTitle}" واضح في الصورة.`;
      else if (finalSupportStrength === 'weak') managerFinalLine = `ممكن… بس "${finalTitle}" كان محتاج دعم أوضح.`;
      else managerFinalLine = `"${finalTitle}" ممكن يكون صحيح، بس مش شايف دعم كفاية في اللي اتقدم.`;
    } else {
      if (finalSupportStrength === 'strong') managerFinalLine = `فاهم ليه وصلت لـ"${finalTitle}"… بس لسه مش مقتنع إنها السبب الأساسي.`;
      else managerFinalLine = `مش قادر أمشي ورا "${finalTitle}" باللي اتقدم في التقرير.`;
    }

    let managerClose = "";
    if (decision === 'approved') managerClose = "ماشي… هنمشي على ده.";
    if (decision === 'partial') managerClose = "كويس كبداية… بس لسه في احتمالات محتاجة تتقفل قبل ما ناخد قرار نهائي.";
    if (decision === 'rejected') managerClose = "مش هقدر آخد قرار بالتقرير ده… راجع تاني واقفل الاحتمالات اللي لسه مفتوحة.";

    const managerReply = [
      managerIntro,
      managerFinalLine,
      "",
      ...perHypothesis.map(p => `- ${p.text}`),
      "",
      managerClose,
    ].join("\n");

    const result: ManagerReportResult = {
      decision,
      managerReply,
      perHypothesis,
      meta: { correctFinal, openHypotheses },
    };

    // Update state
    set({
      eliminations: newEliminations,
      selectedHypothesisId: finalHypothesisId,
      finalSupports,
      reportResult: result,
      gameStatus: decision === 'approved' ? 'solved' : decision === 'rejected' ? 'failed' : state.gameStatus,
      // Simple trust tweak (no UI "points")
      trust: Math.max(0, Math.min(100, state.trust + (decision === 'approved' ? 5 : decision === 'rejected' ? -10 : -2))),
    });

    return result;
  },

  submitConclusion: () => {
    const state = get();
    const solution = state.currentCase.solution;
    const selectedId = state.selectedHypothesisId;
    
    const isCorrect = selectedId === solution.correctHypothesisId;

    set({ gameStatus: isCorrect ? 'solved' : 'failed' });

    return {
      correct: isCorrect,
      feedback: isCorrect ? solution.feedbackCorrect : solution.feedbackIncorrect
    };
  },

  resetGame: () => {
    set({
      currentCase: case001,
      time: case001.resources.initialTime,
      trust: case001.resources.initialTrust,
      visitedEvidenceIds: [],
      pinnedEvidenceIds: [],
      interviewedIds: [],
      discoveredDataInsightIds: [],
      eliminations: [],
      selectedHypothesisId: null,
      finalSupports: [],
      reportResult: null,
      gameStatus: 'briefing',
    });
  },

  getRemainingHypotheses: () => {
    const state = get();
    const eliminatedIds = state.eliminations.map(e => e.hypothesisId);
    return state.currentCase.hypotheses.filter(h => !eliminatedIds.includes(h.id));
  },

  isHypothesisEliminated: (id) => {
    const state = get();
    return state.eliminations.some(e => e.hypothesisId === id);
  },

  getEliminationJustification: (hypothesisId) => {
    const state = get();
    return state.eliminations.find(e => e.hypothesisId === hypothesisId);
  },

  getDiscoveredEvidence: () => {
    const state = get();
    return state.currentCase.evidence
      .filter(ev => state.visitedEvidenceIds.includes(ev.id))
      .map(ev => ({ id: ev.id, title: ev.title, description: ev.description }));
  },

  getCompletedInterviews: () => {
    const state = get();
    const interviews: { id: string; text: string; response: string; stakeholderName: string }[] = [];
    
    state.currentCase.stakeholders.forEach(s => {
      s.questions.forEach(q => {
        if (state.interviewedIds.includes(q.id)) {
          interviews.push({
            id: q.id,
            text: q.text,
            response: q.response,
            stakeholderName: s.name,
          });
        }
      });
    });
    
    return interviews;
  },

  getDiscoveredInsights: () => {
    const state = get();
    const insights: { id: string; description: string; datasetName: string }[] = [];
    
    state.currentCase.dataSets.forEach(ds => {
      ds.insights?.forEach(insight => {
        if (state.discoveredDataInsightIds.includes(insight.id)) {
          insights.push({
            id: insight.id,
            description: insight.description,
            datasetName: ds.name,
          });
        }
      });
    });
    
    return insights;
  },
}));
