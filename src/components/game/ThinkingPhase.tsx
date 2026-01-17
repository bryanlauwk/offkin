import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Outcome, getOutcomeText } from '@/lib/gameData';
import { useSound } from '@/hooks/useSound';

interface ThinkingPhaseProps {
  onComplete: () => void;
}

export function ThinkingPhase({ onComplete }: ThinkingPhaseProps) {
  const { playTick } = useSound();
  const [dots, setDots] = useState(1);

  useEffect(() => {
    // Animate thinking dots
    const dotInterval = setInterval(() => {
      setDots(prev => (prev % 3) + 1);
      playTick();
    }, 400);

    // Complete after 1.5 seconds
    const timer = setTimeout(() => {
      clearInterval(dotInterval);
      onComplete();
    }, 1500);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(timer);
    };
  }, [onComplete, playTick]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4"
    >
      {/* Thinking chibi opponent */}
      <motion.svg
        viewBox="0 0 140 160"
        className="w-48 h-56 mb-8"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Thinking bubble */}
        <motion.g
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <ellipse cx="105" cy="35" rx="25" ry="20" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <circle cx="85" cy="55" r="5" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <circle cx="78" cy="65" r="3" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="1" />
          
          {/* Thinking dots */}
          <text x="105" y="40" textAnchor="middle" fontSize="16" fill="hsl(var(--foreground))">
            {'.'.repeat(dots)}
          </text>
        </motion.g>

        {/* Chibi head */}
        <ellipse cx="70" cy="85" rx="35" ry="32" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Hair - Purple/mysterious */}
        <path 
          d="M38 75 Q42 48 70 40 Q98 48 102 75 Q98 58 70 52 Q45 58 40 75 Z" 
          fill="hsl(270 40% 60%)"
          stroke="hsl(var(--foreground))"
          strokeWidth="2"
        />
        
        {/* Thinking eyes - looking up */}
        <ellipse cx="58" cy="82" rx="6" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="82" cy="82" rx="6" ry="7" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        <ellipse cx="58" cy="79" rx="3" ry="4" fill="hsl(var(--foreground))" />
        <ellipse cx="82" cy="79" rx="3" ry="4" fill="hsl(var(--foreground))" />
        <circle cx="56" cy="77" r="1.5" fill="hsl(var(--background))" />
        <circle cx="80" cy="77" r="1.5" fill="hsl(var(--background))" />
        
        {/* Thoughtful expression */}
        <path d="M62 98 Q70 96 78 98" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        
        {/* Cheeks */}
        <ellipse cx="46" cy="92" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.4" />
        <ellipse cx="94" cy="92" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.4" />
        
        {/* Body */}
        <ellipse cx="70" cy="135" rx="20" ry="16" fill="hsl(270 30% 85%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        
        {/* Hand on chin thinking pose */}
        <path d="M52 125 Q40 115 45 105" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="45" cy="103" r="5" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
      </motion.svg>

      <p className="font-serif text-xl md:text-2xl italic text-muted-foreground text-center">
        Your opponent is thinking{'.'.repeat(dots)}
      </p>
    </motion.div>
  );
}

interface RevealCardProps {
  outcome: Outcome;
  levelId: number;
  statText: string;
  onAdvance: () => void;
}

export function RevealCard({ outcome, levelId, statText, onAdvance }: RevealCardProps) {
  const { playWinWin, playYouBetray, playTheyBetray, playBothBetray, playGloop } = useSound();

  useEffect(() => {
    // Play outcome sound
    if (levelId === 9 && outcome === 'you-betray') {
      playGloop(); // Special gloop sound for eating the gloop
    } else {
      switch (outcome) {
        case 'win-win':
          playWinWin();
          break;
        case 'you-betray':
          playYouBetray();
          break;
        case 'they-betray':
          playTheyBetray();
          break;
        case 'both-betray':
          playBothBetray();
          break;
      }
    }

    // Auto advance after showing outcome
    const timer = setTimeout(() => {
      onAdvance();
    }, 2500);

    return () => clearTimeout(timer);
  }, [outcome, levelId, onAdvance, playWinWin, playYouBetray, playTheyBetray, playBothBetray, playGloop]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4"
    >
      {/* Outcome visual */}
      <OutcomeVisual outcome={outcome} />

      {/* Outcome text */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="font-serif text-2xl md:text-3xl font-bold italic text-center mb-4"
      >
        {getOutcomeText(outcome)}
      </motion.h2>

      {/* Stat text */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="font-mono text-sm text-muted-foreground text-center max-w-md"
      >
        {statText}
      </motion.p>
    </motion.div>
  );
}

function OutcomeVisual({ outcome }: { outcome: Outcome }) {
  if (outcome === 'win-win') {
    return (
      <motion.svg
        viewBox="0 0 200 140"
        className="w-64 h-44 mb-8"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        {/* Confetti particles */}
        {[...Array(12)].map((_, i) => (
          <motion.circle
            key={i}
            cx={100 + Math.cos(i * 30 * Math.PI / 180) * 70}
            cy={70 + Math.sin(i * 30 * Math.PI / 180) * 50}
            r={4}
            fill={i % 3 === 0 ? 'hsl(350 70% 60%)' : i % 3 === 1 ? 'hsl(200 70% 60%)' : 'hsl(50 70% 60%)'}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0, 1.5, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
        
        {/* Two happy chibis high-fiving */}
        <g>
          {/* Left chibi */}
          <ellipse cx="70" cy="70" rx="25" ry="23" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M48 62 Q52 42 70 38 Q88 42 92 62 Q88 52 70 48 Q54 52 50 62 Z" fill="hsl(150 45% 65%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Closed happy eyes */}
          <path d="M60 68 Q66 62 72 68" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M80 68 Q74 62 68 68" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M62 82 Q70 90 78 82" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="56" cy="76" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.5" />
          <ellipse cx="84" cy="76" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.5" />
        </g>
        
        <g>
          {/* Right chibi */}
          <ellipse cx="130" cy="70" rx="25" ry="23" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M108 62 Q112 42 130 38 Q148 42 152 62 Q148 52 130 48 Q114 52 110 62 Z" fill="hsl(350 60% 75%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Closed happy eyes */}
          <path d="M120 68 Q126 62 132 68" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M140 68 Q134 62 128 68" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M122 82 Q130 90 138 82" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="116" cy="76" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.5" />
          <ellipse cx="144" cy="76" rx="4" ry="2.5" fill="hsl(350 70% 75%)" opacity="0.5" />
        </g>
        
        {/* High-five hands */}
        <motion.g
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <circle cx="100" cy="55" r="8" fill="hsl(50 80% 65%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <text x="100" y="59" textAnchor="middle" fontSize="10">✋</text>
        </motion.g>
      </motion.svg>
    );
  }

  if (outcome === 'you-betray') {
    return (
      <motion.svg
        viewBox="0 0 200 140"
        className="w-64 h-44 mb-8"
      >
        {/* You - evil grin with devil horns */}
        <g>
          <ellipse cx="70" cy="70" rx="28" ry="26" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M46 60 Q50 38 70 32 Q90 38 94 60 Q90 48 70 44 Q52 48 48 60 Z" fill="hsl(0 60% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Devil horns */}
          <path d="M50 38 L45 22 L55 35" fill="hsl(0 60% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M90 38 L95 22 L85 35" fill="hsl(0 60% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Narrow evil eyes */}
          <path d="M58 65 L68 62 L78 65" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M82 65 L72 62 L62 65" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="63" cy="68" rx="2" ry="3" fill="hsl(var(--foreground))" />
          <ellipse cx="77" cy="68" rx="2" ry="3" fill="hsl(var(--foreground))" />
          {/* Evil grin */}
          <path d="M58 82 Q70 92 82 82" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        
        {/* Them - crying */}
        <g>
          <ellipse cx="140" cy="75" rx="25" ry="23" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M118 67 Q122 47 140 43 Q158 47 162 67 Q158 57 140 53 Q124 57 120 67 Z" fill="hsl(200 60% 70%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Crying eyes */}
          <ellipse cx="132" cy="72" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="148" cy="72" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="132" cy="73" rx="2" ry="3" fill="hsl(var(--foreground))" />
          <ellipse cx="148" cy="73" rx="2" ry="3" fill="hsl(var(--foreground))" />
          {/* Sad mouth */}
          <path d="M134 88 Q140 82 146 88" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Anime tears */}
          <motion.path
            d="M128 78 L126 95"
            stroke="hsl(200 80% 70%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.path
            d="M152 78 L154 95"
            stroke="hsl(200 80% 70%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
        </g>
        
        {/* Loot/treasure going to evil side */}
        <motion.g
          animate={{ x: [20, -20, -20], opacity: [0, 1, 1] }}
          transition={{ duration: 1 }}
        >
          <circle cx="105" cy="100" r="10" fill="hsl(50 80% 60%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <text x="105" y="104" textAnchor="middle" fontSize="10">💰</text>
        </motion.g>
      </motion.svg>
    );
  }

  if (outcome === 'they-betray') {
    return (
      <motion.svg
        viewBox="0 0 200 140"
        className="w-64 h-44 mb-8"
      >
        {/* You - crying */}
        <g>
          <ellipse cx="60" cy="75" rx="25" ry="23" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M38 67 Q42 47 60 43 Q78 47 82 67 Q78 57 60 53 Q44 57 40 67 Z" fill="hsl(150 45% 65%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Crying eyes */}
          <ellipse cx="52" cy="72" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="68" cy="72" rx="4" ry="5" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <ellipse cx="52" cy="73" rx="2" ry="3" fill="hsl(var(--foreground))" />
          <ellipse cx="68" cy="73" rx="2" ry="3" fill="hsl(var(--foreground))" />
          {/* Sad mouth */}
          <path d="M54 88 Q60 82 66 88" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Anime tears */}
          <motion.path
            d="M48 78 L46 95"
            stroke="hsl(200 80% 70%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.path
            d="M72 78 L74 95"
            stroke="hsl(200 80% 70%)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5], y: [0, 5, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
        </g>
        
        {/* Them - evil laugh */}
        <g>
          <ellipse cx="130" cy="70" rx="28" ry="26" fill="hsl(40 50% 95%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M106 60 Q110 38 130 32 Q150 38 154 60 Q150 48 130 44 Q112 48 108 60 Z" fill="hsl(0 60% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Devil horns */}
          <path d="M110 38 L105 22 L115 35" fill="hsl(0 60% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          <path d="M150 38 L155 22 L145 35" fill="hsl(0 60% 50%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
          {/* Narrow evil eyes */}
          <path d="M118 65 L128 62 L138 65" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M142 65 L132 62 L122 65" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="123" cy="68" rx="2" ry="3" fill="hsl(var(--foreground))" />
          <ellipse cx="137" cy="68" rx="2" ry="3" fill="hsl(var(--foreground))" />
          {/* Evil grin */}
          <path d="M118 82 Q130 92 142 82" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        
        {/* Loot going to them */}
        <motion.g
          animate={{ x: [-20, 20, 20], opacity: [0, 1, 1] }}
          transition={{ duration: 1 }}
        >
          <circle cx="95" cy="100" r="10" fill="hsl(50 80% 60%)" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <text x="95" y="104" textAnchor="middle" fontSize="10">💰</text>
        </motion.g>
      </motion.svg>
    );
  }

  // Both betray - chaos explosion
  return (
    <motion.svg
      viewBox="0 0 200 140"
      className="w-64 h-44 mb-8"
    >
      {/* Explosion background */}
      <motion.circle
        cx="100"
        cy="70"
        r="50"
        fill="hsl(30 90% 60%)"
        opacity="0.5"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
      
      {/* Both burnt/sad chibis */}
      <g>
        {/* Left chibi - burnt */}
        <ellipse cx="65" cy="75" rx="22" ry="20" fill="hsl(30 20% 60%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <ellipse cx="57" cy="72" rx="3" ry="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" />
        <ellipse cx="73" cy="72" rx="3" ry="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" />
        <ellipse cx="57" cy="73" rx="1.5" ry="2" fill="hsl(var(--foreground))" />
        <ellipse cx="73" cy="73" rx="1.5" ry="2" fill="hsl(var(--foreground))" />
        <path d="M60 85 Q65 80 70 85" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Smoke puffs */}
        <motion.circle cx="55" cy="55" r="5" fill="hsl(0 0% 60%)" opacity="0.6" animate={{ y: [-5, -15], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="75" cy="58" r="4" fill="hsl(0 0% 60%)" opacity="0.5" animate={{ y: [-5, -15], opacity: [0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
      </g>
      
      <g>
        {/* Right chibi - burnt */}
        <ellipse cx="135" cy="75" rx="22" ry="20" fill="hsl(30 20% 60%)" stroke="hsl(var(--foreground))" strokeWidth="2" />
        <ellipse cx="127" cy="72" rx="3" ry="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" />
        <ellipse cx="143" cy="72" rx="3" ry="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="1" />
        <ellipse cx="127" cy="73" rx="1.5" ry="2" fill="hsl(var(--foreground))" />
        <ellipse cx="143" cy="73" rx="1.5" ry="2" fill="hsl(var(--foreground))" />
        <path d="M130 85 Q135 80 140 85" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Smoke puffs */}
        <motion.circle cx="125" cy="55" r="5" fill="hsl(0 0% 60%)" opacity="0.6" animate={{ y: [-5, -15], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} />
        <motion.circle cx="145" cy="58" r="4" fill="hsl(0 0% 60%)" opacity="0.5" animate={{ y: [-5, -15], opacity: [0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 }} />
      </g>
      
      {/* Explosion lines */}
      {[...Array(8)].map((_, i) => (
        <motion.line
          key={i}
          x1="100"
          y1="70"
          x2={100 + Math.cos(i * 45 * Math.PI / 180) * 60}
          y2={70 + Math.sin(i * 45 * Math.PI / 180) * 45}
          stroke="hsl(50 90% 60%)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </motion.svg>
  );
}
