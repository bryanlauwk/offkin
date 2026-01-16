import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const { playClick } = useSound();
  const { totalResponses } = useQuizStats();

  const handleStart = () => {
    playClick();
    onStart();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12"
    >
      {/* Marshmallow illustration - Large and centered */}
      <motion.svg 
        viewBox="0 0 120 120" 
        className="w-40 h-40 md:w-56 md:h-56 mb-8"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="60" cy="75" rx="42" ry="32" className="stick-line" fill="hsl(var(--background))" />
        <ellipse cx="60" cy="62" rx="42" ry="32" className="stick-line" fill="hsl(var(--background))" />
        <ellipse cx="60" cy="48" rx="34" ry="24" className="stick-line" fill="hsl(var(--background))" />
        {/* Simple face */}
        <circle cx="50" cy="48" r="3" className="stick-fill" />
        <circle cx="70" cy="48" r="3" className="stick-fill" />
        <path d="M52 58 Q60 64 68 58" className="stick-line" strokeWidth="2" />
      </motion.svg>

      {/* Title - Italic serif like neal.fun */}
      <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold italic text-center mb-4">
        The Absurd Marshmallow Test
      </h1>

      {/* Subtitle */}
      <p className="font-serif text-lg md:text-xl text-muted-foreground text-center mb-12 italic max-w-md">
        A scientific examination of your impulse control.
      </p>

      {/* Start button - minimal style */}
      <motion.button
        className="btn-choice text-lg"
        onClick={handleStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Begin Experiment
      </motion.button>

      {/* Counter - subtle at bottom */}
      <div className="mt-12">
        <p className="font-mono text-sm text-muted-foreground">
          <span className="font-bold">{totalResponses.toLocaleString()}</span> people tested
        </p>
      </div>
    </motion.div>
  );
}
