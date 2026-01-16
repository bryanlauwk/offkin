import { useState, useCallback } from 'react';
import { levels, level10, getArchetype, Archetype, ChoiceRecord, Phase } from '@/lib/gameData';

export type GamePhase = 'start' | 'playing' | 'void' | 'results';
export type Choice = 'now' | 'later';

interface GameState {
  phase: GamePhase;
  currentLevel: number;
  choices: ChoiceRecord[];
  sessionId: string;
  level10IdleTime: number;
  level10Clicked: boolean;
}

export function useGameState() {
  const [state, setState] = useState<GameState>(() => ({
    phase: 'start',
    currentLevel: 0,
    choices: [],
    sessionId: crypto.randomUUID(),
    level10IdleTime: 0,
    level10Clicked: false,
  }));

  const startGame = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'playing',
      currentLevel: 0,
      choices: [],
      sessionId: crypto.randomUUID(),
      level10IdleTime: 0,
      level10Clicked: false,
    }));
  }, []);

  const makeChoice = useCallback((choice: Choice) => {
    setState(prev => {
      const currentLevelData = levels[prev.currentLevel];
      const newChoices = [...prev.choices, { levelId: currentLevelData.id, choice }];
      
      const nextLevel = prev.currentLevel + 1;
      const isLastLevel = nextLevel >= levels.length;
      
      return {
        ...prev,
        choices: newChoices,
        currentLevel: isLastLevel ? prev.currentLevel : nextLevel,
        phase: isLastLevel ? 'void' : 'playing',
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
        phase: isLastLevel ? 'void' : 'playing',
      };
    });
  }, []);

  const completeLevel10 = useCallback((idleTime: number) => {
    setState(prev => ({
      ...prev,
      level10IdleTime: idleTime,
      level10Clicked: true,
      phase: 'results',
    }));
  }, []);

  const restartGame = useCallback(() => {
    setState({
      phase: 'start',
      currentLevel: 0,
      choices: [],
      sessionId: crypto.randomUUID(),
      level10IdleTime: 0,
      level10Clicked: false,
    });
  }, []);

  const getLaterCount = useCallback((): number => {
    return state.choices.filter(c => c.choice === 'later').length;
  }, [state.choices]);

  const getNowCount = useCallback((): number => {
    return state.choices.filter(c => c.choice === 'now').length;
  }, [state.choices]);

  const getResult = useCallback((): Archetype => {
    return getArchetype(state.choices, state.level10IdleTime, state.level10Clicked);
  }, [state.choices, state.level10IdleTime, state.level10Clicked]);

  const getCurrentLevel = useCallback(() => {
    if (state.currentLevel < levels.length) {
      return levels[state.currentLevel];
    }
    return null;
  }, [state.currentLevel]);

  const getCurrentPhase = useCallback((): Phase | null => {
    const level = getCurrentLevel();
    return level ? level.phase : null;
  }, [getCurrentLevel]);

  return {
    ...state,
    startGame,
    makeChoice,
    advanceToNextLevel,
    completeLevel10,
    restartGame,
    getLaterCount,
    getNowCount,
    getResult,
    getCurrentLevel,
    getCurrentPhase,
    level10Data: level10,
  };
}
