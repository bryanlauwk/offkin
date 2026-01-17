import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Level, Choice } from '@/lib/gameData';
import { LevelVisual } from './LevelVisual';
import { ChoiceButtons } from './ChoiceButtons';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';

interface ScenarioCardProps {
  level: Level;
  sessionId: string;
  onChoice: (choice: Choice) => void;
}

export function ScenarioCard({ level, sessionId, onChoice }: ScenarioCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { playCooperate, playDefect } = useSound();
  const { getStatsForLevel } = useQuizStats();

  const handleChoice = async (choice: Choice) => {
    if (selectedChoice) return;
    
    setSelectedChoice(choice);
    
    // Play sound
    if (choice === 'cooperate') {
      playCooperate();
    } else {
      playDefect();
    }
    
    // Show stats after a brief delay
    setTimeout(() => {
      setShowStats(true);
    }, 300);
    
    // Advance after showing stats
    setTimeout(() => {
      onChoice(choice);
    }, 1500);
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
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12"
    >
      {/* Level title */}
      <div className="text-center mb-6">
        <p className="font-mono text-xs text-muted-foreground tracking-widest mb-2">
          SCENARIO {level.id}/10
        </p>
        <h2 className="font-serif text-2xl md:text-3xl font-bold italic">
          {level.title}
        </h2>
      </div>

      {/* Visual - Large and prominent */}
      <div className="w-full max-w-md md:max-w-lg mb-6">
        <LevelVisual levelId={level.id} />
      </div>

      {/* Description - Italic serif style */}
      <p className="font-serif text-lg md:text-xl text-center italic text-muted-foreground mb-8 max-w-lg leading-relaxed">
        {level.description}
      </p>

      {/* Choice buttons */}
      <ChoiceButtons
        choiceA={level.choiceA}
        choiceB={level.choiceB}
        onChoice={handleChoice}
        disabled={selectedChoice !== null}
        stats={stats}
        showStats={showStats}
      />
    </motion.div>
  );
}
