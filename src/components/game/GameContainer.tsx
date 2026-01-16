import { AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { GameHeader } from './GameHeader';
import { StartScreen } from './StartScreen';
import { ScenarioCard } from './ScenarioCard';
import { TimerChallenge } from './TimerChallenge';
import { ResultsCard } from './ResultsCard';

export function GameContainer() {
  const {
    phase,
    sessionId,
    choices,
    level7WaitTime,
    startGame,
    makeChoice,
    advanceToNextLevel,
    completeLevel7,
    restartGame,
    getResult,
    getCurrentLevel,
  } = useGameState();

  const currentLevel = getCurrentLevel();

  // Determine level info for header
  const getLevelInfo = () => {
    if (phase === 'playing' && currentLevel) {
      return {
        current: currentLevel.id,
        total: 6,
        title: currentLevel.title,
      };
    }
    if (phase === 'timer') {
      return {
        current: 7,
        total: 7,
        title: 'The Final Test',
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Persistent header */}
      <GameHeader 
        levelInfo={getLevelInfo()} 
        showTitle={phase !== 'start'}
      />

      <AnimatePresence mode="wait">
        {phase === 'start' && (
          <StartScreen key="start" onStart={startGame} />
        )}

        {phase === 'playing' && currentLevel && (
          <ScenarioCard
            key={`level-${currentLevel.id}`}
            level={currentLevel}
            sessionId={sessionId}
            onChoice={makeChoice}
            onAdvance={advanceToNextLevel}
          />
        )}

        {phase === 'timer' && (
          <TimerChallenge
            key="timer"
            sessionId={sessionId}
            onComplete={completeLevel7}
          />
        )}

        {phase === 'results' && (
          <ResultsCard
            key="results"
            archetype={getResult()}
            choices={choices}
            level7WaitTime={level7WaitTime}
            onRestart={restartGame}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
