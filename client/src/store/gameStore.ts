import { create } from 'zustand';
import { Case, Evidence, Stakeholder } from '@shared/schema';
import { case001 } from '../content/cases/case001';

interface GameState {
  currentCase: Case;
  time: number;
  trust: number;
  visitedEvidenceIds: string[];
  pinnedEvidenceIds: string[];
  interviewedIds: string[]; // combination of stakeholderId_questionId
  gameStatus: 'briefing' | 'playing' | 'solved' | 'failed';
  
  // Actions
  startGame: () => void;
  visitEvidence: (id: string, cost: number) => void;
  togglePinEvidence: (id: string) => void;
  askQuestion: (questionId: string, cost: number) => void;
  submitSolution: (optionId: string) => { correct: boolean; feedback: string };
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentCase: case001,
  time: case001.resources.initialTime,
  trust: case001.resources.initialTrust,
  visitedEvidenceIds: [],
  pinnedEvidenceIds: [],
  interviewedIds: [],
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
        if (state.pinnedEvidenceIds.length >= 5) return state; // Max 5 pins
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

  submitSolution: (optionId) => {
    const state = get();
    const solution = state.currentCase.solution;
    const selectedOption = solution.options.find((o) => o.id === optionId);
    
    // Check if required evidence is pinned
    const hasRequiredEvidence = solution.requiredEvidenceIds.every((reqId) => 
      state.pinnedEvidenceIds.includes(reqId)
    );

    const isCorrect = selectedOption?.isCorrect && hasRequiredEvidence;

    set({ gameStatus: isCorrect ? 'solved' : 'failed' });

    return {
      correct: !!isCorrect,
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
      gameStatus: 'briefing',
    });
  },
}));
