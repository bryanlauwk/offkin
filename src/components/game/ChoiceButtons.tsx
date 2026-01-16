import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Choice } from '@/hooks/useGameState';

interface ChoiceButtonsProps {
  choiceNow: string;
  choiceLater: string;
  onChoice: (choice: Choice) => void;
  disabled: boolean;
  stats: { nowPercent: number; laterPercent: number } | null;
  showStats: boolean;
}

export function ChoiceButtons({ 
  choiceNow, 
  choiceLater, 
  onChoice, 
  disabled,
  stats,
  showStats,
}: ChoiceButtonsProps) {
  const [hoveringNow, setHoveringNow] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
      {/* NOW Button */}
      <motion.button
        className={`relative btn-choice flex-1 min-h-[80px] flex items-center justify-center text-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && onChoice('now')}
        disabled={disabled}
        onMouseEnter={() => setHoveringNow(true)}
        onMouseLeave={() => setHoveringNow(false)}
        animate={hoveringNow && !disabled ? { 
          x: [0, -2, 2, -2, 2, 0],
        } : {}}
        transition={{ duration: 0.4, repeat: hoveringNow ? Infinity : 0 }}
        whileHover={!disabled ? { scale: 1.01 } : {}}
      >
        <span className="font-sans text-sm md:text-base font-medium leading-tight px-2">
          {choiceNow}
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
                {stats.nowPercent}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* LATER Button */}
      <motion.button
        className={`relative btn-choice flex-1 min-h-[80px] flex items-center justify-center text-center ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && onChoice('later')}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.01 } : {}}
      >
        <span className="font-sans text-sm md:text-base font-medium leading-tight px-2">
          {choiceLater}
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
                {stats.laterPercent}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
