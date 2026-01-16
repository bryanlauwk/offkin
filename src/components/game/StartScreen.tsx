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
      {/* Child staring at marshmallow illustration */}
      <motion.svg 
        viewBox="0 0 200 140" 
        className="w-64 h-44 md:w-80 md:h-56 lg:w-96 lg:h-64 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Table/Surface */}
        <ellipse cx="100" cy="125" rx="85" ry="12" fill="hsl(var(--muted))" opacity="0.3" />
        
        {/* Plate */}
        <ellipse cx="70" cy="115" rx="28" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="70" cy="113" rx="22" ry="4" fill="hsl(var(--muted))" opacity="0.2" />
        
        {/* Marshmallow on plate - with subtle bounce */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx="70" cy="108" rx="10" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <rect x="62" y="95" width="16" height="13" rx="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="70" cy="95" rx="10" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Marshmallow shine */}
          <ellipse cx="66" cy="100" rx="2" ry="4" fill="hsl(var(--muted))" opacity="0.3" />
        </motion.g>
        
        {/* Child's arms resting on table */}
        <path d="M95 115 Q110 108 130 112 Q145 115 155 118" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M95 115 Q100 120 110 118" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Child's hands */}
        <ellipse cx="130" cy="108" rx="8" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        <ellipse cx="148" cy="110" rx="7" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Child's head resting on hands */}
        <ellipse cx="140" cy="75" rx="32" ry="28" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - messy/cute style */}
        <path d="M112 55 Q115 35 135 30 Q160 28 172 45 Q178 55 175 70" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M115 50 Q120 42 130 38" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M165 48 Q168 42 172 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Hair tuft */}
        <path d="M140 30 Q142 22 145 28" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Face - looking at marshmallow */}
        <motion.g
          animate={{ x: [0, -1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Eyes looking left at marshmallow */}
          <ellipse cx="128" cy="72" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="148" cy="72" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          {/* Pupils looking at marshmallow */}
          <circle cx="125" cy="73" r="3" className="stick-fill" />
          <circle cx="145" cy="73" r="3" className="stick-fill" />
          {/* Eye shine */}
          <circle cx="124" cy="71" r="1" fill="hsl(var(--background))" />
          <circle cx="144" cy="71" r="1" fill="hsl(var(--background))" />
        </motion.g>
        
        {/* Eyebrows - slightly worried/longing */}
        <path d="M122 63 Q128 61 134 64" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M142 64 Q148 61 154 63" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Small nose */}
        <path d="M138 78 Q140 82 138 84" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Mouth - slight pout */}
        <path d="M133 92 Q140 90 147 92" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cheek blush */}
        <ellipse cx="120" cy="82" rx="5" ry="3" fill="hsl(var(--muted))" opacity="0.3" />
        <ellipse cx="158" cy="82" rx="5" ry="3" fill="hsl(var(--muted))" opacity="0.3" />
        
        {/* Chin resting indication */}
        <path d="M125 100 Q140 105 155 100" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
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
