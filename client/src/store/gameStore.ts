import { create } from 'zustand';
import { Case, Hypothesis, EliminationJustification } from '@shared/schema';
import { case001 } from '../content/cases/case001';

// --- Shared small types (client-only) ---
export type InfoRef = { type: 'evidence' | 'interview' | 'data'; id: string };

export type InfoItem = {
  ref: InfoRef;
  /**
   * نص مختصر جاهز للاستخدام كمعلومة (يظهر في الاستبعاد/الدعم)
   * لازم يكون مفهوم لوحده بدون سؤال/جواب.
   */
  text: string;
  /** مصدر المعلومة (ملف / مقابلة / بيانات) */
  source: string;
};

type GameStatus = 'briefing' | 'playing' | 'solved' | 'failed';

interface GameState {
  // --- Core ---
  currentCase: Case;
  time: number;
  trust: number;
  gameStatus: GameStatus;

  // --- Tracking ---
  visitedEvidenceIds: string[];
  interviewedIds: string[];
  discoveredDataInsightIds: string[];
  eliminations: EliminationJustification[];

  /** دعم الفرضية النهائية (0–2) - لا يظهر إلا في التقرير */
  finalSupport: InfoRef[];

  /** آخر نتيجة/رد مدير (نص بشري) */
  lastManagerFeedback: string | null;
  lastResultCorrect: boolean | null;

  // --- Legacy fields (to keep the app compiling while we update UI in batches) ---
  /** @deprecated سيتم حذفه مع إزالة UI الخاص بالـPin */
  pinnedEvidenceIds: string[];
  /** @deprecated لن نعتمد عليه لاحقًا، لكن نتركه مؤقتًا لتوافق الصفحات القديمة */
  selectedHypothesisId: string | null;

  // --- Actions ---
  startGame: () => void;
  resetGame: () => void;

  visitEvidence: (id: string, cost: number) => void;
  askQuestion: (questionId: string, cost: number) => void;
  discoverDataInsight: (insightId: string, cost?: number) => void;

  eliminateHypothesis: (hypothesisId: string, justifications: InfoRef[]) => void;
  restoreHypothesis: (hypothesisId: string) => void;

  /** @deprecated مؤقتًا */
  togglePinEvidence: (id: string) => void;
  /** @deprecated مؤقتًا */
  selectFinalHypothesis: (hypothesisId: string) => void;

  // New
  setFinalSupport: (refs: InfoRef[]) => void;

  /** النتيجة/المدير (النسخة الجديدة لاحقًا). حاليًا نحافظ على نفس التوقيع للنسخة القديمة */
  submitConclusion: () => { correct: boolean; feedback: string };

  // --- Helpers ---
  getRemainingHypotheses: () => Hypothesis[];
  isHypothesisEliminated: (id: string) => boolean;
  getEliminationJustification: (hypothesisId: string) => EliminationJustification | undefined;

  /** Helpers قديمة - لازمة للـUI الحالي */
  getDiscoveredEvidence: () => { id: string; title: string; description: string }[];
  getCompletedInterviews: () => { id: string; text: string; response: string; stakeholderName: string }[];
  getDiscoveredInsights: () => { id: string; description: string; datasetName: string }[];

  /** Helper جديد - قائمة واحدة للمعلومات بصيغة "معلومة" */
  getDiscoveredInfoItems: () => InfoItem[];
}

function clampUnique(refs: InfoRef[], max: number): InfoRef[] {
  const seen = new Set<string>();
  const out: InfoRef[] = [];
  for (const r of refs) {
    const key = `${r.type}:${r.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= max) break;
  }
  return out;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentCase: case001,
  time: case001.resources.initialTime,
  trust: case001.resources.initialTrust,
  gameStatus: 'briefing',

  visitedEvidenceIds: [],
  interviewedIds: [],
  discoveredDataInsightIds: [],
  eliminations: [],
  finalSupport: [],
  lastManagerFeedback: null,
  lastResultCorrect: null,

  // legacy
  pinnedEvidenceIds: [],
  selectedHypothesisId: null,

  startGame: () => set({ gameStatus: 'playing' }),

  resetGame: () => {
    set({
      currentCase: case001,
      time: case001.resources.initialTime,
      trust: case001.resources.initialTrust,
      visitedEvidenceIds: [],
      interviewedIds: [],
      discoveredDataInsightIds: [],
      eliminations: [],
      finalSupport: [],
      lastManagerFeedback: null,
      lastResultCorrect: null,
      // legacy
      pinnedEvidenceIds: [],
      selectedHypothesisId: null,
      gameStatus: 'briefing',
    });
  },

  visitEvidence: (id, cost) => {
    const state = get();
    if (state.visitedEvidenceIds.includes(id)) return;
    set((s) => ({
      visitedEvidenceIds: [...s.visitedEvidenceIds, id],
      time: Math.max(0, s.time - Math.max(0, cost)),
    }));
  },

  askQuestion: (questionId, cost) => {
    const state = get();
    if (state.interviewedIds.includes(questionId)) return;
    set((s) => ({
      interviewedIds: [...s.interviewedIds, questionId],
      time: Math.max(0, s.time - Math.max(0, cost)),
    }));
  },

  discoverDataInsight: (insightId, cost = 0) => {
    const state = get();
    if (state.discoveredDataInsightIds.includes(insightId)) return;
    set((s) => ({
      discoveredDataInsightIds: [...s.discoveredDataInsightIds, insightId],
      time: Math.max(0, s.time - Math.max(0, cost)),
    }));
  },

  eliminateHypothesis: (hypothesisId, justifications) => {
    const state = get();
    const alreadyEliminated = state.eliminations.some((e) => e.hypothesisId === hypothesisId);
    if (alreadyEliminated) return;

    set((s) => ({
      eliminations: [
        ...s.eliminations,
        {
          hypothesisId,
          // نضمن 1–2 فقط لاحقًا من الـUI، بس هنا نحمي الداتا برضه
          justifications: clampUnique(justifications, 2),
          timestamp: Date.now(),
        },
      ],
    }));
  },

  restoreHypothesis: (hypothesisId) => {
    set((s) => ({
      eliminations: s.eliminations.filter((e) => e.hypothesisId !== hypothesisId),
    }));
  },

  // legacy pin (keep compiling; UI will be removed later)
  togglePinEvidence: (id) => {
    set((s) => {
      const isPinned = s.pinnedEvidenceIds.includes(id);
      if (isPinned) return { pinnedEvidenceIds: s.pinnedEvidenceIds.filter((eid) => eid !== id) };
      if (s.pinnedEvidenceIds.length >= 5) return s;
      return { pinnedEvidenceIds: [...s.pinnedEvidenceIds, id] };
    });
  },

  // legacy final selection (keep compiling; later: final = remaining hypothesis)
  selectFinalHypothesis: (hypothesisId) => set({ selectedHypothesisId: hypothesisId }),

  setFinalSupport: (refs) => set({ finalSupport: clampUnique(refs, 2) }),

  submitConclusion: () => {
    const state = get();
    const solution = state.currentCase.solution;
    const selectedId = state.selectedHypothesisId;

    const isCorrect = selectedId === solution.correctHypothesisId;
    const feedback = isCorrect ? solution.feedbackCorrect : solution.feedbackIncorrect;

    set({
      gameStatus: isCorrect ? 'solved' : 'failed',
      lastManagerFeedback: feedback,
      lastResultCorrect: isCorrect,
    });

    return { correct: isCorrect, feedback };
  },

  getRemainingHypotheses: () => {
    const state = get();
    const eliminatedIds = state.eliminations.map((e) => e.hypothesisId);
    return state.currentCase.hypotheses.filter((h) => !eliminatedIds.includes(h.id));
  },

  isHypothesisEliminated: (id) => get().eliminations.some((e) => e.hypothesisId === id),

  getEliminationJustification: (hypothesisId) =>
    get().eliminations.find((e) => e.hypothesisId === hypothesisId),

  getDiscoveredEvidence: () => {
    const state = get();
    return state.currentCase.evidence
      .filter((ev) => state.visitedEvidenceIds.includes(ev.id))
      .map((ev) => ({ id: ev.id, title: ev.title, description: ev.description }));
  },

  getCompletedInterviews: () => {
    const state = get();
    const interviews: { id: string; text: string; response: string; stakeholderName: string }[] = [];
    state.currentCase.stakeholders.forEach((s) => {
      s.questions.forEach((q) => {
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
    state.currentCase.dataSets.forEach((ds) => {
      ds.insights?.forEach((insight) => {
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

  getDiscoveredInfoItems: () => {
    const state = get();
    const items: InfoItem[] = [];

    // Evidence
    state.currentCase.evidence.forEach((ev) => {
      if (!state.visitedEvidenceIds.includes(ev.id)) return;
      items.push({
        ref: { type: 'evidence', id: ev.id },
        source: ev.title,
        text: `من ${ev.title}: ${ev.description}`,
      });
    });

    // Interviews (convert to a short info line with clear context)
    state.currentCase.stakeholders.forEach((sh) => {
      sh.questions.forEach((q) => {
        if (!state.interviewedIds.includes(q.id)) return;
        items.push({
          ref: { type: 'interview', id: q.id },
          source: `مقابلة: ${sh.name}`,
          text: `من مقابلة ${sh.name}: ${q.response}`,
        });
      });
    });

    // Data
    state.currentCase.dataSets.forEach((ds) => {
      ds.insights?.forEach((insight) => {
        if (!state.discoveredDataInsightIds.includes(insight.id)) return;
        items.push({
          ref: { type: 'data', id: insight.id },
          source: `البيانات: ${ds.name}`,
          text: `من البيانات (${ds.name}): ${insight.description}`,
        });
      });
    });

    return items;
  },
}));
