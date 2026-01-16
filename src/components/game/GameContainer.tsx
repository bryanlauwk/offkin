import { AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { GameHeader } from './GameHeader';
import { StartScreen } from './StartScreen';
import { ScenarioCard } from './ScenarioCard';
import { Level10Void } from './Level10Void';
import { ResultsCard } from './ResultsCard';

export function GameContainer() {
  const {
    phase,
    sessionId,
    choices,
    level10IdleTime,
    startGame,
    makeChoice,
    advanceToNextLevel,
    completeLevel10,
    restartGame,
    getResult,
    getCurrentLevel,
    getCurrentPhase,
    getLaterCount,
    getNowCount,
  } = useGameState();

  const currentLevel = getCurrentLevel();

  // Determine level info for header
  const getLevelInfo = () => {
    if (phase === 'playing' && currentLevel) {
      return {
        current: currentLevel.id,
        total: 10,
        title: currentLevel.title,
      };
    }
    if (phase === 'void') {
      return {
        current: 10,
        total: 10,
        title: 'The Pause',
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

        {phase === 'void' && (
          <Level10Void
            key="void"
            sessionId={sessionId}
            onComplete={completeLevel10}
          />
        )}

        {phase === 'results' && (
          <ResultsCard
            key="results"
            archetype={getResult()}
            laterCount={getLaterCount()}
            nowCount={getNowCount()}
            level10IdleTime={level10IdleTime}
            onRestart={restartGame}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
