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
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="paper-container max-w-lg text-center">
        {/* Title */}
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
          The Absurd
        </h1>
        <h1 className="font-serif text-4xl md:text-5xl font-black mb-6">
          Marshmallow Test
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-muted-foreground mb-8">
          A scientific examination of your impulse control.
          <br />
          <span className="text-sm italic">Results may be judgmental.</span>
        </p>

        {/* Marshmallow illustration */}
        <div className="flex justify-center mb-8">
          <motion.svg 
            viewBox="0 0 80 80" 
            className="w-24 h-24"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="40" cy="50" rx="28" ry="22" className="stick-line" fill="hsl(var(--background))" />
            <ellipse cx="40" cy="42" rx="28" ry="22" className="stick-line" fill="hsl(var(--background))" />
            <ellipse cx="40" cy="32" rx="22" ry="16" className="stick-line" fill="hsl(var(--background))" />
          </motion.svg>
        </div>

        {/* Start button */}
        <motion.button
          className="btn-later px-8 py-4 text-lg font-semibold mb-6"
          onClick={handleStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Begin Experiment
        </motion.button>

        {/* Counter */}
        <div className="pt-4 border-t border-foreground">
          <p className="font-mono text-sm">
            <span className="font-bold">{totalResponses.toLocaleString()}</span> people tested
          </p>
        </div>
      </div>
    </motion.div>
  );
}
