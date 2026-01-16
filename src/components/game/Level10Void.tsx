import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';
import { philosophicalTexts } from '@/lib/gameData';

interface Level10VoidProps {
  sessionId: string;
  onComplete: (idleTime: number) => void;
}

type Phase = 'entering' | 'settling' | 'waiting' | 'revealing';

export function Level10Void({ sessionId, onComplete }: Level10VoidProps) {
  const [phase, setPhase] = useState<Phase>('entering');
  const [idleTime, setIdleTime] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [visibleTexts, setVisibleTexts] = useState<number[]>([]);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const { playClick } = useSound();
  const { submitResponse } = useQuizStats();

  // Phase progression
  useEffect(() => {
    // Phase 1: Entering (0-2s)
    const settlingTimer = setTimeout(() => {
      setPhase('settling');
    }, 2000);

    // Phase 2: Settling (2-5s) - researcher animation
    const waitingTimer = setTimeout(() => {
      setPhase('waiting');
      setShowButton(true);
    }, 5000);

    return () => {
      clearTimeout(settlingTimer);
      clearTimeout(waitingTimer);
    };
  }, []);

  // Track idle time when not hovering button
  useEffect(() => {
    if (phase === 'waiting' && !isHoveringButton) {
      idleTimerRef.current = setInterval(() => {
        setIdleTime(prev => prev + 1);
      }, 1000);
    } else {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    }

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [phase, isHoveringButton]);

  // Reveal philosophical texts after idle time
  useEffect(() => {
    if (idleTime >= 10 && visibleTexts.length === 0) {
      setPhase('revealing');
      setVisibleTexts([0]);
    }
    
    // Add new texts every 4 seconds
    if (phase === 'revealing') {
      const nextIndex = visibleTexts.length;
      if (nextIndex < philosophicalTexts.length && idleTime >= 10 + (nextIndex * 4)) {
        setVisibleTexts(prev => [...prev, nextIndex]);
      }
    }
  }, [idleTime, phase, visibleTexts.length]);

  const handleLeave = useCallback(async () => {
    playClick();
    
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    // Submit to database
    await submitResponse(10, 'now', sessionId, totalTime);
    
    onComplete(totalTime);
  }, [playClick, submitResponse, sessionId, onComplete]);

  const allTextsShown = visibleTexts.length >= philosophicalTexts.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col relative overflow-hidden"
    >
      {/* Chibi Researcher - animated through phases */}
      <motion.div
        className="absolute left-8 md:left-16 lg:left-24"
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          top: phase === 'entering' ? '30%' : phase === 'settling' ? '35%' : '40%'
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <ChibiResearcherFinal phase={phase} />
      </motion.div>

      {/* Empty center - where marshmallow would be */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <svg viewBox="0 0 120 50" className="w-32 opacity-30">
          {/* Empty plate */}
          <ellipse cx="60" cy="40" rx="50" ry="8" className="stick-line" fill="none" strokeWidth="1.5" strokeDasharray="4" />
          {/* Plate surface hint */}
          <ellipse cx="60" cy="38" rx="40" ry="5" fill="hsl(var(--muted))" opacity="0.2" />
        </svg>
      </motion.div>

      {/* Philosophical text zone - UPPER PORTION of screen */}
      <div className="flex-1 flex flex-col items-center justify-start pt-24 md:pt-32 px-4">
        <AnimatePresence>
          {visibleTexts.map((index) => (
            <motion.p
              key={index}
              className="font-serif text-lg md:text-xl lg:text-2xl text-muted-foreground text-center mb-4 leading-relaxed italic max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              {philosophicalTexts[index]}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      {/* Button zone - LOWER PORTION, never overlaps text */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center pb-24 md:pb-32 px-4">
        <AnimatePresence>
          {showButton && (
            <motion.button
              className="btn-choice text-base md:text-lg px-10 py-5 relative"
              onClick={handleLeave}
              onMouseEnter={() => setIsHoveringButton(true)}
              onMouseLeave={() => setIsHoveringButton(false)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                boxShadow: allTextsShown 
                  ? ['0 0 0 0 hsl(var(--foreground) / 0)', '0 0 20px 4px hsl(var(--foreground) / 0.1)', '0 0 0 0 hsl(var(--foreground) / 0)']
                  : '0 0 0 0 transparent'
              }}
              transition={{ 
                duration: 0.8,
                boxShadow: allTextsShown ? { duration: 2, repeat: Infinity } : {}
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Leave
            </motion.button>
          )}
        </AnimatePresence>

        {/* Idle timer - subtle at bottom */}
        <motion.div
          className="mt-8 font-mono text-xs text-muted-foreground/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 8 }}
        >
          {idleTime}s
        </motion.div>
      </div>
    </motion.div>
  );
}

// Chibi Researcher for final scene
function ChibiResearcherFinal({ phase }: { phase: Phase }) {
  const isSettled = phase === 'waiting' || phase === 'revealing';
  
  return (
    <motion.svg
      viewBox="0 0 100 160"
      className="w-24 h-36 md:w-32 md:h-48"
    >
      {/* Chibi Head - larger for chibi proportions */}
      <motion.g
        animate={{ 
          y: isSettled ? 15 : 0,
        }}
        transition={{ duration: 1.5 }}
      >
        <ellipse cx="50" cy="45" rx="28" ry="25" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M24 38 Q28 15 50 10 Q72 15 76 38 Q73 25 50 20 Q30 25 26 38 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        <path d="M32 26 Q42 18 52 24" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        
        {/* Peaceful/knowing eyes */}
        <motion.g
          animate={{ 
            scaleY: isSettled ? [1, 0.1, 1] : 1,
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          {isSettled ? (
            <>
              {/* Closed peaceful eyes */}
              <path d="M36 48 Q42 44 48 48" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M52 48 Q58 44 64 48" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Open eyes */}
              <ellipse cx="40" cy="48" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              <ellipse cx="60" cy="48" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              <ellipse cx="40" cy="49" rx="2.5" ry="3" className="stick-fill" />
              <ellipse cx="60" cy="49" rx="2.5" ry="3" className="stick-fill" />
              <circle cx="39" cy="47" r="1" fill="hsl(var(--background))" />
              <circle cx="59" cy="47" r="1" fill="hsl(var(--background))" />
            </>
          )}
        </motion.g>
        
        {/* Peaceful smile */}
        <path d="M44 60 Q50 64 56 60" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <ellipse cx="30" cy="54" rx="5" ry="3" fill="hsl(0 50% 80%)" opacity="0.4" />
        <ellipse cx="70" cy="54" rx="5" ry="3" fill="hsl(0 50% 80%)" opacity="0.4" />
      </motion.g>
      
      {/* Body - transitions from standing to sitting */}
      <motion.g
        animate={{
          y: isSettled ? 25 : 0,
        }}
        transition={{ duration: 1.5 }}
      >
        {isSettled ? (
          <>
            {/* Sitting body */}
            <ellipse cx="50" cy="100" rx="18" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
            {/* Crossed legs */}
            <path d="M38 108 Q30 120 35 135" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M62 108 Q70 115 60 130 Q50 125 45 135" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            {/* Arms resting */}
            <path d="M35 95 Q25 100 28 115" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M65 95 Q75 100 72 115" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            {/* Hands */}
            <ellipse cx="28" cy="118" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
            <ellipse cx="72" cy="118" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          </>
        ) : (
          <>
            {/* Standing body with lab coat */}
            <rect x="38" y="72" width="24" height="35" rx="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
            <line x1="50" y1="75" x2="50" y2="102" className="stick-line" strokeWidth="1" opacity="0.3" />
            {/* Arms */}
            <path d="M38 78 L28 95" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M62 78 L72 95" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            {/* Legs */}
            <path d="M44 107 L40 140" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M56 107 L60 140" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}
      </motion.g>

      {/* Lab coat on floor (when sitting) */}
      <AnimatePresence>
        {isSettled && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <path 
              d="M75 145 Q85 140 95 148 Q90 155 80 152 Z" 
              fill="hsl(var(--muted))" 
              stroke="hsl(var(--foreground))" 
              strokeWidth="1" 
              opacity="0.4" 
            />
          </motion.g>
        )}
      </AnimatePresence>
    </motion.svg>
  );
}
