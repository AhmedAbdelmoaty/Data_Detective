import { create } from 'zustand';
import { Case, Hypothesis, EliminationJustification } from '@shared/schema';
import { case001 } from '../content/cases/case001';

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
