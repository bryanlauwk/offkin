import { AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { GameHeader } from './GameHeader';
import { StartScreen } from './StartScreen';
import { ScenarioCard } from './ScenarioCard';
import { ThinkingPhase, RevealCard } from './ThinkingPhase';
import { ResultsCard } from './ResultsCard';
import { useQuizStats } from '@/hooks/useQuizStats';
import { levels } from '@/lib/gameData';

export function GameContainer() {
  const {
    phase,
    sessionId,
    currentLevel,
    pendingOutcome,
    startGame,
    makeChoice,
    completeThinking,
    advanceToNextLevel,
    restartGame,
    getResult,
    getCurrentLevel,
    getCooperateCount,
    getDefectCount,
    getWinWinCount,
    getBetrayedCount,
    pendingChoice,
    pendingOpponentChoice,
  } = useGameState();

  const { submitResponse } = useQuizStats();

  const levelData = getCurrentLevel();

  // Submit to database when choice is made
  const handleChoice = async (choice: Parameters<typeof makeChoice>[0]) => {
    makeChoice(choice);
  };

  // Handle thinking complete - also submit to database
  const handleThinkingComplete = async () => {
    if (pendingChoice && pendingOpponentChoice && pendingOutcome && levelData) {
      await submitResponse(
        levelData.id,
        pendingChoice,
        sessionId,
        pendingOpponentChoice,
        pendingOutcome
      );
    }
    completeThinking();
  };

  // Determine level info for header
  const getLevelInfo = () => {
    if ((phase === 'playing' || phase === 'thinking' || phase === 'reveal') && levelData) {
      return {
        current: levelData.id,
        total: 10,
        title: levelData.title,
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

        {phase === 'playing' && levelData && (
          <ScenarioCard
            key={`level-${levelData.id}`}
            level={levelData}
            sessionId={sessionId}
            onChoice={handleChoice}
          />
        )}

        {phase === 'thinking' && (
          <ThinkingPhase
            key="thinking"
            onComplete={handleThinkingComplete}
          />
        )}

        {phase === 'reveal' && pendingOutcome && levelData && (
          <RevealCard
            key="reveal"
            outcome={pendingOutcome}
            levelId={levelData.id}
            statText={levelData.statText}
            onAdvance={advanceToNextLevel}
          />
        )}

        {phase === 'results' && (
          <ResultsCard
            key="results"
            archetype={getResult()}
            cooperateCount={getCooperateCount()}
            defectCount={getDefectCount()}
            winWinCount={getWinWinCount()}
            betrayedCount={getBetrayedCount()}
            onRestart={restartGame}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
