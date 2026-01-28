import { create } from 'zustand';
import { Case, Hypothesis, EliminationJustification } from '@shared/schema';
import { case001 } from '../content/cases/case001';

type RefType = 'evidence' | 'interview' | 'data';
export type SupportRef = { type: RefType; id: string };

interface GameState {
  currentCase: Case;
  time: number;
  trust: number;
  visitedEvidenceIds: string[];
  interviewedIds: string[];
  discoveredDataInsightIds: string[];
  eliminations: EliminationJustification[];
  selectedHypothesisId: string | null;
  finalSupport: SupportRef[];
  gameStatus: 'briefing' | 'playing' | 'solved' | 'failed';

  // Actions
  startGame: () => void;
  visitEvidence: (id: string, cost: number) => void;
  askQuestion: (questionId: string, cost: number) => void;
  discoverDataInsight: (insightId: string) => void;
  eliminateHypothesis: (hypothesisId: string, justifications: SupportRef[]) => void;
  restoreHypothesis: (hypothesisId: string) => void;
  selectFinalHypothesis: (hypothesisId: string) => void;
  setFinalSupport: (refs: SupportRef[]) => void;
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

type Assessment = {
  isConvincing: boolean;
  usedMisleading: boolean;
};

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function toMinutesCost(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
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
  finalSupport: [],
  gameStatus: 'briefing',

  startGame: () => set({ gameStatus: 'playing' }),

  visitEvidence: (id, cost) => {
    const state = get();
    if (state.visitedEvidenceIds.includes(id)) return;

    set((s) => ({
      visitedEvidenceIds: [...s.visitedEvidenceIds, id],
      time: Math.max(0, s.time - toMinutesCost(cost)),
    }));
  },

  askQuestion: (questionId, cost) => {
    const state = get();
    if (state.interviewedIds.includes(questionId)) return;

    set((s) => ({
      interviewedIds: [...s.interviewedIds, questionId],
      time: Math.max(0, s.time - toMinutesCost(cost)),
    }));
  },

  discoverDataInsight: (insightId) => {
    const state = get();
    if (state.discoveredDataInsightIds.includes(insightId)) return;

    set((s) => ({
      discoveredDataInsightIds: [...s.discoveredDataInsightIds, insightId],
    }));
  },

  eliminateHypothesis: (hypothesisId, justifications) => {
    const state = get();
    const alreadyEliminated = state.eliminations.some((e) => e.hypothesisId === hypothesisId);
    if (alreadyEliminated) return;

    // تكلفة بسيطة تمنع الاستبعاد العشوائي
    const eliminationTimeCost = 2;

    set((s) => ({
      eliminations: [
        ...s.eliminations,
        { hypothesisId, justifications, timestamp: Date.now() },
      ],
      time: Math.max(0, s.time - eliminationTimeCost),
    }));
  },

  restoreHypothesis: (hypothesisId) => {
    set((s) => ({
      eliminations: s.eliminations.filter((e) => e.hypothesisId !== hypothesisId),
    }));
  },

  selectFinalHypothesis: (hypothesisId) => {
    set({ selectedHypothesisId: hypothesisId });
  },

  setFinalSupport: (refs) => {
    set({ finalSupport: refs });
  },

  submitConclusion: () => {
    const state = get();
    const solution = state.currentCase.solution;
    const selectedId = state.selectedHypothesisId;

    const selectedHyp = state.currentCase.hypotheses.find((h) => h.id === selectedId) || null;

    // ====== تقييم بسيط (Level 1)
    // الهدف: "استبعاد مقنع" vs "استبعاد بعيد/مضلل"
    // + "الدعم بيوضح" vs "الدعم بيشوّش"

    const strongRefsByHypothesis: Record<string, string[]> = {
      // H1 (المبيعات): ملف أداء المبيعات + تصريح أحمد إن الفريق ما اتغيرش
      h1: ['ev1', 'q2_2'],
      // H2 (التسويق جاب ناس مش مناسبة): جودة الاستفسارات + كلام من أحمد/سارة
      h2: ['insight_b', 'q2_2', 'q1_2'],
      // H3 (ركود): ملخص السوق
      h3: ['ev2'],
      // H4 (منافس): (هندعمه لاحقًا بسؤال منافس واضح)
      h4: ['q2_3'],
    };

    const misleadingRefs: string[] = [
      // وجود منافس/إعلان منافس لوحده فخ مشهور
      'ev3',
      // "الضغط زاد" ممكن يشفط اللاعب ناحية H1
      'q2_1',
    ];

    const assess = (hypothesisId: string, refs: SupportRef[]): Assessment => {
      const ids = uniq(refs.map((r) => r.id));
      const strong = strongRefsByHypothesis[hypothesisId] || [];

      const hasStrong = ids.some((id) => strong.includes(id));
      const usedMisleading = ids.some((id) => misleadingRefs.includes(id));

      // مستوى 1: "مقنع" = فيه على الأقل حاجة قوية مرتبطة.
      return {
        isConvincing: hasStrong,
        usedMisleading,
      };
    };

    const badEliminations: { hypothesisId: string; title: string; usedMisleading: boolean }[] = [];
    const goodEliminations: { hypothesisId: string; title: string; usedMisleading: boolean }[] = [];

    state.eliminations.forEach((e) => {
      const h = state.currentCase.hypotheses.find((x) => x.id === e.hypothesisId);
      if (!h) return;

      const a = assess(e.hypothesisId, e.justifications as SupportRef[]);
      if (a.isConvincing) {
        goodEliminations.push({ hypothesisId: e.hypothesisId, title: h.title, usedMisleading: a.usedMisleading });
      } else {
        badEliminations.push({ hypothesisId: e.hypothesisId, title: h.title, usedMisleading: a.usedMisleading });
      }
    });

    const supportAssessment = selectedId
      ? assess(selectedId, state.finalSupport)
      : { isConvincing: false, usedMisleading: false };

    // قرار قبول التقرير (Level 1):
    // - لازم السبب النهائي صحيح
    // - ولازم مافيش استبعاد "بعيد" واضح
    const isCorrectHyp = selectedId === solution.correctHypothesisId;
    const hasBadElims = badEliminations.length > 0;
    const accepted = Boolean(selectedId) && isCorrectHyp && !hasBadElims;

    // تعديل الثقة بشكل خفيف (من غير تعقيد)
    let trustDelta = 0;
    trustDelta -= badEliminations.length * 12;
    if (supportAssessment.usedMisleading) trustDelta -= 8;
    if (state.finalSupport.length === 0) trustDelta -= 2;
    if (accepted) trustDelta += 5;

    const newTrust = Math.max(0, Math.min(100, state.trust + trustDelta));

    // ====== رد مدير بشري (مش قالب نقاط)
    const lines: string[] = [];

    lines.push(`تمام… خليني أراجع تقريرك.`);
    if (selectedHyp) {
      lines.push(`إنت ماشي على إن السبب هو: "${selectedHyp.title}".`);
    }

    // الاستبعادات
    if (goodEliminations.length > 0) {
      goodEliminations.forEach((g) => {
        if (g.usedMisleading) {
          lines.push(`استبعاد "${g.title}" كان ماشي… بس في جزء من مبرراتك كان ممكن يشتّت.`);
        } else {
          lines.push(`استبعاد "${g.title}" كان مقنع.`);
        }
      });
    }

    if (badEliminations.length > 0) {
      badEliminations.forEach((b) => {
        if (b.usedMisleading) {
          lines.push(`استبعاد "${b.title}" مش مقنع… واضح إنك اتسحبت ورا معلومة بتشوّش.`);
        } else {
          lines.push(`استبعاد "${b.title}" مش مقنع… المعلومة اللي استخدمتها مش مرتبطة قوي.`);
        }
      });
    }

    // الدعم
    if (state.finalSupport.length === 0) {
      lines.push(`ملاحظة صغيرة: كان ناقصني سطرين يسندوا قرارك… بس تمام.`);
    } else {
      if (supportAssessment.usedMisleading) {
        lines.push(`بالنسبة للدعم اللي اخترته… في جزء منه حسّيته بيشوّش أكتر ما بيوضح.`);
      } else {
        lines.push(`والدعم اللي اخترته ساعد يوضح ليه أنت مقتنع.`);
      }
    }

    // القرار النهائي
    if (accepted) {
      lines.push(`تمام… كده التقرير مقبول، وهنمشي على ده.`);
    } else {
      if (!selectedId) {
        lines.push(`بس أنا مش قادر أمشي على التقرير بالشكل ده… راجع الفرضيات وارجعلي.`);
      } else if (!isCorrectHyp) {
        lines.push(`بس كده أنا مش مقتنع إن ده هو السبب الحقيقي… راجع الفرضيات المنافسة وارجعلي.`);
      } else {
        lines.push(`أنا مش قادر أقفل القرار دلوقتي… فيه استبعادات لسه مش محسومة.`);
      }
    }

    const feedback = lines.join('\n\n');

    set({ gameStatus: accepted ? 'solved' : 'failed', trust: newTrust });

    return {
      correct: accepted,
      feedback,
    };
  },

  resetGame: () => {
    set({
      currentCase: case001,
      time: case001.resources.initialTime,
      trust: case001.resources.initialTrust,
      visitedEvidenceIds: [],
      interviewedIds: [],
      discoveredDataInsightIds: [],
      eliminations: [],
      selectedHypothesisId: null,
      finalSupport: [],
      gameStatus: 'briefing',
    });
  },

  getRemainingHypotheses: () => {
    const state = get();
    const eliminated = state.eliminations.map((e) => e.hypothesisId);
    return state.currentCase.hypotheses.filter((h) => !eliminated.includes(h.id));
  },

  isHypothesisEliminated: (id) => {
    const state = get();
    return state.eliminations.some((e) => e.hypothesisId === id);
  },

  getEliminationJustification: (hypothesisId) => {
    const state = get();
    return state.eliminations.find((e) => e.hypothesisId === hypothesisId);
  },

  getDiscoveredEvidence: () => {
    const state = get();
    return state.currentCase.evidence
      .filter((ev) => state.visitedEvidenceIds.includes(ev.id))
      .map((ev) => ({ id: ev.id, title: ev.title, description: ev.description }));
  },

  getCompletedInterviews: () => {
    const state = get();
    const interviews: { id: string; text: string; response: string; stakeholderName: string }[] = [];

    // صياغة "معلومة" بسيطة (بدون ما نعرض سؤال/جواب كنص طويل)
    const infoOverrides: Record<string, string> = {
      // سارة
      q1_1: 'الحملة كانت هدفها توصل لناس أكتر… وفعلاً عدد الاستفسارات زاد بسرعة.',
      q1_2: 'الاستفسارات زادت… بس كتير منها كان عام ومش جاد.',
      // أحمد
      q2_1: 'بعد زيادة الاستفسارات الضغط زاد جدًا… التليفونات شغالة طول اليوم والفريق بيحاول يلحق.',
      q2_2: 'مافيش تغيير في الفريق أو طريقة المتابعة… بس أغلب اللي بيتواصلوا دلوقتي مش جاد وأسئلتهم عامة.',
      // (هيتضاف لاحقًا)
      q2_3: 'نادراً ما حد يذكر منافس… فمفيش مؤشر واضح إن منافس خطف العملاء.',
    };

    state.currentCase.stakeholders.forEach((s) => {
      s.questions.forEach((q) => {
        if (state.interviewedIds.includes(q.id)) {
          interviews.push({
            id: q.id,
            text: q.text,
            response: infoOverrides[q.id] || q.response,
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
}));
