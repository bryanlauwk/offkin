import { AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
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

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {phase === 'start' && (
          <StartScreen key="start" onStart={startGame} />
        )}

        {phase === 'playing' && getCurrentLevel() && (
          <ScenarioCard
            key={`level-${getCurrentLevel()!.id}`}
            level={getCurrentLevel()!}
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
