import { useState, useCallback } from 'react';
import { 
  levels, 
  getArchetype, 
  getOpponentChoice, 
  getOutcome, 
  Archetype, 
  Choice, 
  RoundResult,
  Outcome 
} from '@/lib/gameData';

export type GamePhase = 'start' | 'playing' | 'thinking' | 'reveal' | 'results';
export type { Choice } from '@/lib/gameData';

interface GameState {
  phase: GamePhase;
  currentLevel: number;
  results: RoundResult[];
  sessionId: string;
  pendingChoice: Choice | null;
  pendingOpponentChoice: Choice | null;
  pendingOutcome: Outcome | null;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => ({
    phase: 'start',
    currentLevel: 0,
    results: [],
    sessionId: crypto.randomUUID(),
    pendingChoice: null,
    pendingOpponentChoice: null,
    pendingOutcome: null,
  }));

  const startGame = useCallback(() => {
    setState({
      phase: 'playing',
      currentLevel: 0,
      results: [],
      sessionId: crypto.randomUUID(),
      pendingChoice: null,
      pendingOpponentChoice: null,
      pendingOutcome: null,
    });
  }, []);

  const makeChoice = useCallback((choice: Choice) => {
    setState(prev => {
      // Get opponent choice based on previous player choice
      const previousChoice = prev.results.length > 0 
        ? prev.results[prev.results.length - 1].playerChoice 
        : null;
      
      const currentLevelData = levels[prev.currentLevel];
      const opponentChoice = getOpponentChoice(currentLevelData.id, previousChoice);
      const outcome = getOutcome(choice, opponentChoice);
      
      return {
        ...prev,
        phase: 'thinking',
        pendingChoice: choice,
        pendingOpponentChoice: opponentChoice,
        pendingOutcome: outcome,
      };
    });
  }, []);

  const completeThinking = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'reveal',
    }));
  }, []);

  const advanceToNextLevel = useCallback(() => {
    setState(prev => {
      if (!prev.pendingChoice || !prev.pendingOpponentChoice || !prev.pendingOutcome) {
        return prev;
      }

      const currentLevelData = levels[prev.currentLevel];
      const newResult: RoundResult = {
        levelId: currentLevelData.id,
        playerChoice: prev.pendingChoice,
        opponentChoice: prev.pendingOpponentChoice,
        outcome: prev.pendingOutcome,
      };

      const newResults = [...prev.results, newResult];
      const nextLevel = prev.currentLevel + 1;
      const isLastLevel = nextLevel >= levels.length;

      return {
        ...prev,
        results: newResults,
        currentLevel: isLastLevel ? prev.currentLevel : nextLevel,
        phase: isLastLevel ? 'results' : 'playing',
        pendingChoice: null,
        pendingOpponentChoice: null,
        pendingOutcome: null,
      };
    });
  }, []);

  const restartGame = useCallback(() => {
    setState({
      phase: 'start',
      currentLevel: 0,
      results: [],
      sessionId: crypto.randomUUID(),
      pendingChoice: null,
      pendingOpponentChoice: null,
      pendingOutcome: null,
    });
  }, []);

  const getCooperateCount = useCallback((): number => {
    return state.results.filter(r => r.playerChoice === 'cooperate').length;
  }, [state.results]);

  const getDefectCount = useCallback((): number => {
    return state.results.filter(r => r.playerChoice === 'defect').length;
  }, [state.results]);

  const getResult = useCallback((): Archetype => {
    return getArchetype(state.results);
  }, [state.results]);

  const getCurrentLevel = useCallback(() => {
    if (state.currentLevel < levels.length) {
      return levels[state.currentLevel];
    }
    return null;
  }, [state.currentLevel]);

  const getWinWinCount = useCallback((): number => {
    return state.results.filter(r => r.outcome === 'win-win').length;
  }, [state.results]);

  const getBetrayedCount = useCallback((): number => {
    return state.results.filter(r => r.outcome === 'they-betray').length;
  }, [state.results]);

  return {
    ...state,
    startGame,
    makeChoice,
    completeThinking,
    advanceToNextLevel,
    restartGame,
    getCooperateCount,
    getDefectCount,
    getResult,
    getCurrentLevel,
    getWinWinCount,
    getBetrayedCount,
  };
}
