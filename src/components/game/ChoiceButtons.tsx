import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Choice } from '@/lib/gameData';

interface ChoiceButtonsProps {
  choiceA: string;  // Cooperate option
  choiceB: string;  // Defect option
  onChoice: (choice: Choice) => void;
  disabled: boolean;
  stats: { cooperatePercent: number; defectPercent: number } | null;
  showStats: boolean;
}

export function ChoiceButtons({ 
  choiceA, 
  choiceB, 
  onChoice, 
  disabled,
  stats,
  showStats,
}: ChoiceButtonsProps) {
  const [hoveringDefect, setHoveringDefect] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
      {/* COOPERATE Button - Green accent */}
      <motion.button
        className={`relative flex-1 min-h-[80px] flex items-center justify-center text-center
          bg-cooperate text-white font-semibold px-8 py-4 rounded-lg border-2 border-foreground
          transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}`}
        onClick={() => !disabled && onChoice('cooperate')}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <span className="font-sans text-sm md:text-base font-medium leading-tight px-2">
          {choiceA}
        </span>
        
        {/* Stats overlay */}
        <AnimatePresence>
          {showStats && stats && (
            <motion.div
              className="absolute inset-0 bg-foreground/90 flex items-center justify-center rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="font-mono text-2xl font-bold text-background">
                {stats.cooperatePercent}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* DEFECT Button - Red accent */}
      <motion.button
        className={`relative flex-1 min-h-[80px] flex items-center justify-center text-center
          bg-defect text-white font-semibold px-8 py-4 rounded-lg border-2 border-foreground
          transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChoice('defect')}
        disabled={disabled}
        onMouseEnter={() => setHoveringDefect(true)}
        onMouseLeave={() => setHoveringDefect(false)}
        animate={hoveringDefect && !disabled ? { 
          x: [0, -2, 2, -2, 2, 0],
        } : {}}
        transition={{ duration: 0.4, repeat: hoveringDefect ? Infinity : 0 }}
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
      >
        <span className="font-sans text-sm md:text-base font-medium leading-tight px-2">
          {choiceB}
        </span>
        
        {/* Stats overlay */}
        <AnimatePresence>
          {showStats && stats && (
            <motion.div
              className="absolute inset-0 bg-foreground/90 flex items-center justify-center rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="font-mono text-2xl font-bold text-background">
                {stats.defectPercent}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
