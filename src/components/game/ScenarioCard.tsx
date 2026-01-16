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
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12"
    >
      {/* Visual - Large and prominent */}
      <div className="w-full max-w-md md:max-w-lg mb-8">
        <ScenarioVisual level={level} />
      </div>

      {/* Description - Italic serif style */}
      <p className="font-serif text-xl md:text-2xl text-center italic text-muted-foreground mb-10 max-w-lg leading-relaxed">
        {level.description}
      </p>

      {/* Choice buttons - minimal style, side by side */}
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
