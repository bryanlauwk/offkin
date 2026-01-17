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
      {/* Two chibi characters facing each other - trust/distrust standoff */}
      <motion.svg 
        viewBox="0 0 240 140" 
        className="w-72 h-40 md:w-96 md:h-52 lg:w-[28rem] lg:h-60 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Background gradient - soft pastel */}
        <defs>
          <radialGradient id="trustGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(150 50% 90%)" />
            <stop offset="100%" stopColor="hsl(200 60% 92%)" />
          </radialGradient>
        </defs>
        <ellipse cx="120" cy="120" rx="110" ry="20" fill="url(#trustGlow)" opacity="0.5" />
        
        {/* Left Chibi - Friendly/Trusting */}
        <motion.g
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Head */}
          <ellipse cx="60" cy="65" rx="28" ry="26" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          
          {/* Hair - Mint colored */}
          <path 
            d="M34 55 Q38 32 60 26 Q82 32 86 55 Q83 42 60 38 Q40 42 36 55 Z" 
            fill="hsl(150 45% 65%)"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <path d="M60 26 Q63 18 68 24" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          
          {/* Happy open eyes */}
          <ellipse cx="50" cy="62" rx="5" ry="6" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="70" cy="62" rx="5" ry="6" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="51" cy="63" rx="3" ry="4" fill="hsl(var(--foreground))" />
          <ellipse cx="71" cy="63" rx="3" ry="4" fill="hsl(var(--foreground))" />
          <circle cx="49" cy="61" r="1.5" fill="hsl(var(--background))" />
          <circle cx="69" cy="61" r="1.5" fill="hsl(var(--background))" />
          
          {/* Rosy cheeks */}
          <ellipse cx="40" cy="72" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.5" />
          <ellipse cx="80" cy="72" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.5" />
          
          {/* Friendly smile */}
          <path d="M52 78 Q60 84 68 78" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Body */}
          <ellipse cx="60" cy="108" rx="16" ry="14" fill="hsl(150 40% 85%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          
          {/* Arms reaching out */}
          <motion.path 
            d="M75 100 Q90 95 100 100" 
            stroke="hsl(var(--foreground))" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            fill="none"
            animate={{ d: ["M75 100 Q90 95 100 100", "M75 100 Q90 92 102 98", "M75 100 Q90 95 100 100"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <circle cx="100" cy="100" r="5" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          
          {/* Legs */}
          <path d="M50 120 L46 135" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M70 120 L74 135" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>
        
        {/* Right Chibi - Suspicious/Calculating */}
        <motion.g
          animate={{ x: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          {/* Head */}
          <ellipse cx="180" cy="65" rx="28" ry="26" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          
          {/* Hair - Pink colored */}
          <path 
            d="M154 55 Q158 32 180 26 Q202 32 206 55 Q203 42 180 38 Q160 42 156 55 Z" 
            fill="hsl(350 60% 75%)"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          <path d="M180 26 Q177 18 172 24" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          
          {/* Narrowed suspicious eyes */}
          <path d="M166 60 Q172 56 178 60" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M182 60 Q188 56 194 60" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="172" cy="64" rx="3" ry="4" fill="hsl(var(--foreground))" />
          <ellipse cx="188" cy="64" rx="3" ry="4" fill="hsl(var(--foreground))" />
          
          {/* Rosy cheeks */}
          <ellipse cx="160" cy="72" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.4" />
          <ellipse cx="200" cy="72" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.4" />
          
          {/* Smirk */}
          <path d="M172 78 Q180 76 188 80" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          
          {/* Body */}
          <ellipse cx="180" cy="108" rx="16" ry="14" fill="hsl(350 50% 90%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          
          {/* Arms crossed / hidden behind */}
          <path d="M165 100 Q155 105 145 100" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="145" cy="100" r="5" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          
          {/* Legs */}
          <path d="M170 120 L166 135" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M190 120 L194 135" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>
        
        {/* Question mark / tension between them */}
        <motion.text
          x="120"
          y="90"
          textAnchor="middle"
          className="text-2xl font-bold"
          fill="hsl(var(--foreground))"
          animate={{ opacity: [0.3, 1, 0.3], y: [90, 85, 90] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ?
        </motion.text>
      </motion.svg>

      {/* Title - Italic serif like neal.fun */}
      <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold italic text-center mb-4">
        The Trust Fall
      </h1>

      {/* Subtitle */}
      <p className="font-serif text-lg md:text-xl text-muted-foreground text-center mb-12 italic max-w-md">
        A Prisoner's Dilemma Simulation
      </p>

      {/* Start button - minimal style */}
      <motion.button
        className="btn-choice text-lg"
        onClick={handleStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Begin Simulation
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
