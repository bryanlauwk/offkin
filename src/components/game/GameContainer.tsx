import { AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { GameHeader } from './GameHeader';
import { StartScreen } from './StartScreen';
import { ScenarioCard } from './ScenarioCard';
import { Level10Void } from './Level10Void';
import { ToastChallenge } from './ToastChallenge';
import { ResultsCard } from './ResultsCard';

export function GameContainer() {
  const {
    phase,
    sessionId,
    choices,
    level10IdleTime,
    toastWaitTime,
    toastPassed,
    startGame,
    makeChoice,
    advanceToNextLevel,
    completeLevel10,
    completeToastChallenge,
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
        total: 11,
        title: currentLevel.title,
      };
    }
    if (phase === 'void') {
      return {
        current: 10,
        total: 11,
        title: 'The Pause',
      };
    }
    if (phase === 'toast') {
      return {
        current: 11,
        total: 11,
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

        {phase === 'void' && (
          <Level10Void
            key="void"
            sessionId={sessionId}
            onComplete={completeLevel10}
          />
        )}

        {phase === 'toast' && (
          <ToastChallenge
            key="toast"
            sessionId={sessionId}
            onComplete={completeToastChallenge}
          />
        )}

        {phase === 'results' && (
          <ResultsCard
            key="results"
            archetype={getResult()}
            laterCount={getLaterCount()}
            nowCount={getNowCount()}
            level10IdleTime={level10IdleTime}
            toastWaitTime={toastWaitTime}
            toastPassed={toastPassed}
            onRestart={restartGame}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
