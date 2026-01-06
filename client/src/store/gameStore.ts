import { create } from 'zustand';
import { Case, Evidence, Hypothesis } from '@shared/schema';
import { case001 } from '../content/cases/case001';

interface EvidenceLink {
  evidenceId: string;
  hypothesisId: string;
  linkType: 'support' | 'refute';
}

interface GameState {
  currentCase: Case;
  time: number;
  trust: number;
  visitedEvidenceIds: string[];
  pinnedEvidenceIds: string[];
  interviewedIds: string[];
  eliminatedHypothesisIds: string[];
  confirmedHypothesisId: string | null;
  evidenceLinks: EvidenceLink[];
  gameStatus: 'briefing' | 'playing' | 'solved' | 'failed';
  
  startGame: () => void;
  visitEvidence: (id: string, cost: number) => void;
  togglePinEvidence: (id: string) => void;
  askQuestion: (questionId: string, cost: number) => void;
  eliminateHypothesis: (hypothesisId: string) => void;
  restoreHypothesis: (hypothesisId: string) => void;
  confirmHypothesis: (hypothesisId: string) => void;
  linkEvidenceToHypothesis: (evidenceId: string, hypothesisId: string, linkType: 'support' | 'refute') => void;
  unlinkEvidence: (evidenceId: string, hypothesisId: string) => void;
  submitSolution: () => { correct: boolean; feedback: string; detailedExplanation?: string };
  resetGame: () => void;
  
  getHypothesisEvidence: (hypothesisId: string) => { supporting: Evidence[]; refuting: Evidence[] };
  getEvidenceStrength: (hypothesisId: string) => { supportScore: number; refuteScore: number };
  canConfirmHypothesis: (hypothesisId: string) => boolean;
  getMissingRequiredEvidence: (hypothesisId: string) => Evidence[];
}

export const useGameStore = create<GameState>((set, get) => ({
  currentCase: case001,
  time: case001.resources.initialTime,
  trust: case001.resources.initialTrust,
  visitedEvidenceIds: [],
  pinnedEvidenceIds: [],
  interviewedIds: [],
  eliminatedHypothesisIds: [],
  confirmedHypothesisId: null,
  evidenceLinks: [],
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
        if (state.pinnedEvidenceIds.length >= 8) return state;
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

  eliminateHypothesis: (hypothesisId) => {
    set((state) => {
      if (state.eliminatedHypothesisIds.includes(hypothesisId)) return state;
      if (state.confirmedHypothesisId === hypothesisId) return state;
      
      return {
        eliminatedHypothesisIds: [...state.eliminatedHypothesisIds, hypothesisId],
      };
    });
  },

  restoreHypothesis: (hypothesisId) => {
    set((state) => ({
      eliminatedHypothesisIds: state.eliminatedHypothesisIds.filter(id => id !== hypothesisId),
    }));
  },

  confirmHypothesis: (hypothesisId) => {
    const state = get();
    if (state.eliminatedHypothesisIds.includes(hypothesisId)) return;
    
    if (state.confirmedHypothesisId === hypothesisId) {
      set({ confirmedHypothesisId: null });
      return;
    }
    
    if (!state.canConfirmHypothesis(hypothesisId)) return;
    
    set({ confirmedHypothesisId: hypothesisId });
  },

  linkEvidenceToHypothesis: (evidenceId, hypothesisId, linkType) => {
    const state = get();
    
    if (!state.visitedEvidenceIds.includes(evidenceId)) return;
    
    set((prevState) => {
      const existingLink = prevState.evidenceLinks.find(
        l => l.evidenceId === evidenceId && l.hypothesisId === hypothesisId
      );
      
      if (existingLink) {
        if (existingLink.linkType === linkType) {
          return {
            evidenceLinks: prevState.evidenceLinks.filter(
              l => !(l.evidenceId === evidenceId && l.hypothesisId === hypothesisId)
            ),
          };
        }
        return {
          evidenceLinks: prevState.evidenceLinks.map(l =>
            l.evidenceId === evidenceId && l.hypothesisId === hypothesisId
              ? { ...l, linkType }
              : l
          ),
        };
      }
      
      return {
        evidenceLinks: [...prevState.evidenceLinks, { evidenceId, hypothesisId, linkType }],
      };
    });
  },

  unlinkEvidence: (evidenceId, hypothesisId) => {
    const state = get();
    
    if (state.confirmedHypothesisId === hypothesisId) {
      const hypothesis = state.currentCase.hypotheses.find(h => h.id === hypothesisId);
      if (hypothesis?.requiredSupportingEvidence.includes(evidenceId)) {
        set({ confirmedHypothesisId: null });
      }
    }
    
    set((prevState) => ({
      evidenceLinks: prevState.evidenceLinks.filter(
        l => !(l.evidenceId === evidenceId && l.hypothesisId === hypothesisId)
      ),
    }));
  },

  getHypothesisEvidence: (hypothesisId) => {
    const state = get();
    const links = state.evidenceLinks.filter(l => l.hypothesisId === hypothesisId);
    
    const supporting = links
      .filter(l => l.linkType === 'support')
      .map(l => state.currentCase.evidence.find(e => e.id === l.evidenceId))
      .filter(Boolean) as Evidence[];
    
    const refuting = links
      .filter(l => l.linkType === 'refute')
      .map(l => state.currentCase.evidence.find(e => e.id === l.evidenceId))
      .filter(Boolean) as Evidence[];
    
    return { supporting, refuting };
  },

  getEvidenceStrength: (hypothesisId) => {
    const state = get();
    const { supporting, refuting } = state.getHypothesisEvidence(hypothesisId);
    
    const strengthValue = (level?: string) => {
      switch (level) {
        case 'strong': return 3;
        case 'medium': return 2;
        case 'weak': return 1;
        default: return 1;
      }
    };
    
    const supportScore = supporting.reduce((acc, ev) => acc + strengthValue(ev.strengthLevel), 0);
    const refuteScore = refuting.reduce((acc, ev) => acc + strengthValue(ev.strengthLevel), 0);
    
    return { supportScore, refuteScore };
  },

  canConfirmHypothesis: (hypothesisId) => {
    const state = get();
    const hypothesis = state.currentCase.hypotheses.find(h => h.id === hypothesisId);
    if (!hypothesis) return false;
    
    const { supporting } = state.getHypothesisEvidence(hypothesisId);
    
    if (supporting.length < hypothesis.minSupportingEvidenceCount) return false;
    
    const hasAllRequiredEvidence = hypothesis.requiredSupportingEvidence.every(reqId =>
      supporting.some(e => e.id === reqId)
    );
    
    return hasAllRequiredEvidence;
  },

  getMissingRequiredEvidence: (hypothesisId) => {
    const state = get();
    const hypothesis = state.currentCase.hypotheses.find(h => h.id === hypothesisId);
    if (!hypothesis) return [];
    
    const { supporting } = state.getHypothesisEvidence(hypothesisId);
    const supportingIds = supporting.map(e => e.id);
    
    const missingIds = hypothesis.requiredSupportingEvidence.filter(reqId => 
      !supportingIds.includes(reqId)
    );
    
    return missingIds
      .map(id => state.currentCase.evidence.find(e => e.id === id))
      .filter(Boolean) as Evidence[];
  },

  submitSolution: () => {
    const state = get();
    const solution = state.currentCase.solution;
    
    if (!state.confirmedHypothesisId) {
      return {
        correct: false,
        feedback: "لم تختر فرضية نهائية بعد. يجب تأكيد فرضية واحدة قبل تقديم التقرير.",
      };
    }
    
    const confirmedHypothesis = state.currentCase.hypotheses.find(
      h => h.id === state.confirmedHypothesisId
    );
    
    if (!confirmedHypothesis) {
      return {
        correct: false,
        feedback: "خطأ في تحديد الفرضية المؤكدة.",
      };
    }
    
    const isCorrectHypothesis = state.confirmedHypothesisId === solution.correctHypothesisId;
    
    const { supporting } = state.getHypothesisEvidence(state.confirmedHypothesisId);
    const supportingIds = supporting.map(e => e.id);
    
    const hasSolutionRequiredEvidence = solution.requiredEvidenceIds.every(reqId =>
      supportingIds.includes(reqId)
    );
    
    const hasHypothesisRequiredEvidence = confirmedHypothesis.requiredSupportingEvidence.every(reqId =>
      supportingIds.includes(reqId)
    );
    
    const isCorrect = isCorrectHypothesis && hasSolutionRequiredEvidence && hasHypothesisRequiredEvidence;
    
    if (isCorrect) {
      set({ gameStatus: 'solved' });
      return {
        correct: true,
        feedback: solution.feedbackCorrect,
        detailedExplanation: solution.detailedExplanation,
      };
    } else {
      set({ gameStatus: 'failed' });
      return {
        correct: false,
        feedback: confirmedHypothesis?.feedbackIfChosen || solution.feedbackIncorrect,
      };
    }
  },

  resetGame: () => {
    set({
      time: case001.resources.initialTime,
      trust: case001.resources.initialTrust,
      visitedEvidenceIds: [],
      pinnedEvidenceIds: [],
      interviewedIds: [],
      eliminatedHypothesisIds: [],
      confirmedHypothesisId: null,
      evidenceLinks: [],
      gameStatus: 'briefing',
    });
  },
}));
