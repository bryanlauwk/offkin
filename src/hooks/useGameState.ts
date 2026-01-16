import { useState, useCallback, useEffect } from 'react';
import { levels, getArchetype, Archetype } from '@/lib/gameData';

export type GamePhase = 'start' | 'playing' | 'timer' | 'results';
export type Choice = 'now' | 'later';

interface GameState {
  phase: GamePhase;
  currentLevel: number;
  choices: (Choice | null)[];
  sessionId: string;
  level7WaitTime: number | null;
  passedLevel7: boolean;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => ({
    phase: 'start',
    currentLevel: 0,
    choices: Array(6).fill(null),
    sessionId: crypto.randomUUID(),
    level7WaitTime: null,
    passedLevel7: false,
  }));

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'playing',
      currentLevel: 0,
      choices: Array(6).fill(null),
      sessionId: crypto.randomUUID(),
      level7WaitTime: null,
      passedLevel7: false,
    }));
  }, []);

  const makeChoice = useCallback((choice: Choice) => {
    setState(prev => {
      const newChoices = [...prev.choices];
      newChoices[prev.currentLevel] = choice;
      
      const nextLevel = prev.currentLevel + 1;
      const isLastLevel = nextLevel >= levels.length;
      
      return {
        ...prev,
        choices: newChoices,
        currentLevel: isLastLevel ? prev.currentLevel : nextLevel,
        phase: isLastLevel ? 'timer' : 'playing',
      };
    });
  }, []);

  const advanceToNextLevel = useCallback(() => {
    setState(prev => {
      const nextLevel = prev.currentLevel + 1;
      const isLastLevel = nextLevel >= levels.length;
      
      return {
        ...prev,
        currentLevel: isLastLevel ? prev.currentLevel : nextLevel,
        phase: isLastLevel ? 'timer' : 'playing',
      };
    });
  }, []);

  const completeLevel7 = useCallback((waitTime: number, passed: boolean) => {
    setState(prev => ({
      ...prev,
      level7WaitTime: waitTime,
      passedLevel7: passed,
      phase: 'results',
    }));
  }, []);

  const restartGame = useCallback(() => {
    setState({
      phase: 'start',
      currentLevel: 0,
      choices: Array(6).fill(null),
      sessionId: crypto.randomUUID(),
      level7WaitTime: null,
      passedLevel7: false,
    });
  }, []);

  const getLaterCount = useCallback((): number => {
    return state.choices.filter(c => c === 'later').length;
  }, [state.choices]);

  const getResult = useCallback((): Archetype => {
    return getArchetype(getLaterCount(), state.passedLevel7);
  }, [getLaterCount, state.passedLevel7]);

  const getCurrentLevel = useCallback(() => {
    if (state.currentLevel < levels.length) {
      return levels[state.currentLevel];
    }
    return null;
  }, [state.currentLevel]);

  return {
    ...state,
    startGame,
    makeChoice,
    advanceToNextLevel,
    completeLevel7,
    restartGame,
    getLaterCount,
    getResult,
    getCurrentLevel,
  };
}
