import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Level } from '@/lib/gameData';
import { Choice } from '@/hooks/useGameState';
import { ScenarioVisual } from './ScenarioVisual';
import { ChoiceButtons } from './ChoiceButtons';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';

interface ScenarioCardProps {
  level: Level;
  sessionId: string;
  onChoice: (choice: Choice) => void;
  onAdvance: () => void;
}

export function ScenarioCard({ level, sessionId, onChoice, onAdvance }: ScenarioCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { playChoiceNow, playChoiceLater } = useSound();
  const { submitResponse, getStatsForLevel } = useQuizStats();

  const handleChoice = async (choice: Choice) => {
    if (selectedChoice) return;
    
    setSelectedChoice(choice);
    
    // Play sound
    if (choice === 'now') {
      playChoiceNow();
    } else {
      playChoiceLater();
    }
    
    // Submit to database
    await submitResponse(level.id, choice, sessionId);
    
    // Show stats after a brief delay
    setTimeout(() => {
      setShowStats(true);
    }, 300);
    
    // Advance after showing stats
    setTimeout(() => {
      onChoice(choice);
      onAdvance();
    }, 2500);
  };

  // Reset state when level changes
  useEffect(() => {
    setSelectedChoice(null);
    setShowStats(false);
  }, [level.id]);

  const stats = getStatsForLevel(level.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="paper-container max-w-2xl mx-auto"
    >
      {/* Level indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-sm text-muted-foreground">
          Level {level.id} of 6
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 border border-foreground ${
                i <= level.id ? 'bg-foreground' : 'bg-background'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-center">
        {level.title}
      </h2>

      {/* Description */}
      <p className="font-sans text-center text-muted-foreground mb-6">
        {level.description}
      </p>

      {/* Visual */}
      <div className="mb-8 border-2 border-foreground bg-secondary/30">
        <ScenarioVisual level={level} />
      </div>

      {/* Choice buttons */}
      <ChoiceButtons
        choiceNow={level.choiceNow}
        choiceLater={level.choiceLater}
        onChoice={handleChoice}
        disabled={selectedChoice !== null}
        stats={stats}
        showStats={showStats}
      />
    </motion.div>
  );
}
