import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';

interface Level10VoidProps {
  sessionId: string;
  onComplete: (idleTime: number) => void;
}

// The original philosophical texts from the design
const philosophicalTexts = [
  "You are still waiting.",
  "Are you waiting for a reward?",
  "There is no code for a reward here.",
  "Sometimes, the test isn't about ability. It's about knowing when to stop testing."
];

export function Level10Void({ sessionId, onComplete }: Level10VoidProps) {
  const [showButton, setShowButton] = useState(false);
  const [visibleTexts, setVisibleTexts] = useState<number[]>([]);
  const [idleTime, setIdleTime] = useState(0);
  const [isNearButton, setIsNearButton] = useState(false);
  const [researcherPhase, setResearcherPhase] = useState<'entering' | 'walking' | 'sitting'>('entering');
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  const { playClick } = useSound();
  const { submitResponse } = useQuizStats();

  // Phase 1: Show button after researcher animation
  useEffect(() => {
    // Researcher walks in and sits down
    const walkTimer = setTimeout(() => {
      setResearcherPhase('walking');
    }, 1500);
    
    const sitTimer = setTimeout(() => {
      setResearcherPhase('sitting');
    }, 3500);
    
    // Button appears after researcher sits
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 5000);

    return () => {
      clearTimeout(walkTimer);
      clearTimeout(sitTimer);
      clearTimeout(buttonTimer);
    };
  }, []);

  // Track mouse movement - only count idle time when cursor is AWAY from button
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current || !showButton) return;
      
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const padding = 100; // Extra padding around button
      
      const isNear = 
        e.clientX >= buttonRect.left - padding &&
        e.clientX <= buttonRect.right + padding &&
        e.clientY >= buttonRect.top - padding &&
        e.clientY <= buttonRect.bottom + padding;
      
      setIsNearButton(isNear);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showButton]);

  // Accumulate idle time when cursor is away from button
  useEffect(() => {
    if (showButton && !isNearButton) {
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
  }, [showButton, isNearButton]);

  // Reveal philosophical texts based on idle time
  // 10s: first text, 14s: second, 18s: third, 22s: fourth
  useEffect(() => {
    if (idleTime >= 10 && visibleTexts.length === 0) {
      setVisibleTexts([0]);
    }
    if (idleTime >= 14 && visibleTexts.length === 1) {
      setVisibleTexts([0, 1]);
    }
    if (idleTime >= 18 && visibleTexts.length === 2) {
      setVisibleTexts([0, 1, 2]);
    }
    if (idleTime >= 22 && visibleTexts.length === 3) {
      setVisibleTexts([0, 1, 2, 3]);
    }
  }, [idleTime, visibleTexts.length]);

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
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4"
    >
      {/* Zoomed out feeling - empty space */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Floor line */}
        <motion.div
          className="absolute bottom-1/3 left-1/4 right-1/4 h-px bg-foreground/10"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
      </div>

      {/* Chibi Researcher - walks in and sits */}
      <motion.div
        className="absolute"
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: researcherPhase === 'entering' ? -50 : 0,
          y: researcherPhase === 'sitting' ? 20 : 0,
          opacity: 1 
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{ 
          left: '35%', 
          top: '40%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <ChibiResearcherFinal phase={researcherPhase} />
      </motion.div>

      {/* Empty plate - no marshmallow */}
      <motion.div
        className="absolute"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        style={{ 
          left: '50%', 
          top: '55%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <svg viewBox="0 0 100 40" className="w-24 h-10">
          {/* Empty plate */}
          <ellipse cx="50" cy="30" rx="40" ry="8" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          <ellipse cx="50" cy="28" rx="32" ry="5" fill="hsl(var(--muted))" opacity="0.2" />
        </svg>
      </motion.div>

      {/* Lab coat on floor */}
      <AnimatePresence>
        {researcherPhase === 'sitting' && (
          <motion.div
            className="absolute"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{ 
              left: '30%', 
              top: '65%',
            }}
          >
            <svg viewBox="0 0 60 30" className="w-16 h-8">
              <path 
                d="M5 15 Q15 5 30 8 Q45 5 55 15 Q50 25 30 22 Q10 25 5 15Z" 
                fill="hsl(var(--muted))" 
                stroke="hsl(var(--foreground))" 
                strokeWidth="1" 
                opacity="0.5"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Philosophical texts - appear in the upper area */}
      <div className="absolute top-16 md:top-24 left-0 right-0 flex flex-col items-center px-4">
        <AnimatePresence>
          {visibleTexts.map((index) => (
            <motion.p
              key={index}
              className="font-serif text-base md:text-lg lg:text-xl text-muted-foreground text-center mb-3 leading-relaxed italic max-w-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              "{philosophicalTexts[index]}"
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      {/* LEAVE SIMULATION button - bottom area */}
      <div className="absolute bottom-24 md:bottom-32 left-0 right-0 flex flex-col items-center">
        <AnimatePresence>
          {showButton && (
            <motion.button
              ref={buttonRef}
              className="btn-choice text-sm md:text-base px-8 py-4 font-mono tracking-wider"
              onClick={handleLeave}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                boxShadow: allTextsShown 
                  ? ['0 0 0 0 hsl(var(--foreground) / 0)', '0 0 30px 8px hsl(var(--foreground) / 0.15)', '0 0 0 0 hsl(var(--foreground) / 0)']
                  : '0 0 0 0 transparent'
              }}
              transition={{ 
                duration: 1,
                boxShadow: allTextsShown ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : {}
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              [LEAVE SIMULATION]
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle idle timer - very bottom */}
      {showButton && (
        <motion.div
          className="absolute bottom-8 right-8 font-mono text-xs text-muted-foreground/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 10 }}
        >
          {idleTime > 0 && `${idleTime}s`}
        </motion.div>
      )}
    </motion.div>
  );
}

// Chibi Researcher for final scene - matches StartScreen style
function ChibiResearcherFinal({ phase }: { phase: 'entering' | 'walking' | 'sitting' }) {
  const isSitting = phase === 'sitting';
  
  return (
    <motion.svg
      viewBox="0 0 120 180"
      className="w-32 h-48 md:w-40 md:h-60"
    >
      {/* Chibi Head - large for chibi proportions */}
      <motion.g
        animate={{ 
          y: isSitting ? 30 : 0,
        }}
        transition={{ duration: 1 }}
      >
        <ellipse cx="60" cy="50" rx="34" ry="30" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair - FILLED like StartScreen */}
        <path 
          d="M28 42 Q32 18 60 12 Q88 18 92 42 Q88 28 60 22 Q35 28 30 42 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Hair highlights */}
        <path d="M38 28 Q50 20 62 26" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
        
        {/* Peaceful/knowing eyes */}
        <motion.g
          animate={{ 
            scaleY: isSitting ? [1, 0.1, 1] : 1,
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            repeatDelay: 4,
          }}
        >
          {isSitting ? (
            <>
              {/* Closed peaceful eyes - curved lines */}
              <path d="M42 52 Q52 46 62 52" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M58 52 Q68 46 78 52" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Open eyes - large like StartScreen */}
              <ellipse cx="46" cy="52" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              <ellipse cx="74" cy="52" rx="8" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
              {/* Pupils */}
              <ellipse cx="46" cy="54" rx="4" ry="5" className="stick-fill" />
              <ellipse cx="74" cy="54" rx="4" ry="5" className="stick-fill" />
              {/* Multiple eye shines */}
              <circle cx="44" cy="51" r="2" fill="hsl(var(--background))" />
              <circle cx="47" cy="56" r="1" fill="hsl(var(--background))" />
              <circle cx="72" cy="51" r="2" fill="hsl(var(--background))" />
              <circle cx="75" cy="56" r="1" fill="hsl(var(--background))" />
            </>
          )}
        </motion.g>
        
        {/* Peaceful smile */}
        <path d="M50 68 Q60 74 70 68" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Rosy cheeks - prominent */}
        <ellipse cx="32" cy="60" rx="6" ry="3.5" fill="hsl(0 60% 75%)" opacity="0.4" />
        <ellipse cx="88" cy="60" rx="6" ry="3.5" fill="hsl(0 60% 75%)" opacity="0.4" />
      </motion.g>
      
      {/* Body - transitions from standing to sitting */}
      <motion.g
        animate={{
          y: isSitting ? 40 : 0,
        }}
        transition={{ duration: 1 }}
      >
        {isSitting ? (
          <>
            {/* Sitting body - simple shirt (no lab coat) */}
            <ellipse cx="60" cy="115" rx="22" ry="15" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
            
            {/* Crossed legs */}
            <path d="M45 125 Q35 140 42 160" className="stick-line" strokeWidth="3" strokeLinecap="round" />
            <path d="M75 125 Q85 135 75 155 Q60 150 55 165" className="stick-line" strokeWidth="3" strokeLinecap="round" />
            
            {/* Arms resting on knees */}
            <path d="M42 112 Q28 120 32 140" className="stick-line" strokeWidth="3" strokeLinecap="round" />
            <path d="M78 112 Q92 120 88 140" className="stick-line" strokeWidth="3" strokeLinecap="round" />
            
            {/* Hands - ellipse shapes like StartScreen */}
            <ellipse cx="32" cy="143" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
            <ellipse cx="88" cy="143" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          </>
        ) : (
          <>
            {/* Standing body with lab coat */}
            <rect x="42" y="82" width="36" height="45" rx="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
            {/* Coat line */}
            <line x1="60" y1="85" x2="60" y2="122" className="stick-line" strokeWidth="1" opacity="0.3" />
            {/* Coat pockets */}
            <rect x="46" y="105" width="10" height="8" rx="2" className="stick-line" fill="none" strokeWidth="1" opacity="0.5" />
            <rect x="64" y="105" width="10" height="8" rx="2" className="stick-line" fill="none" strokeWidth="1" opacity="0.5" />
            
            {/* Arms */}
            <path d="M42 90 L28 110" className="stick-line" strokeWidth="3" strokeLinecap="round" />
            <path d="M78 90 L92 110" className="stick-line" strokeWidth="3" strokeLinecap="round" />
            
            {/* Hands */}
            <ellipse cx="26" cy="113" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
            <ellipse cx="94" cy="113" rx="5" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
            
            {/* Legs */}
            <path d="M50 127 L45 165" className="stick-line" strokeWidth="3" strokeLinecap="round" />
            <path d="M70 127 L75 165" className="stick-line" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </motion.g>
    </motion.svg>
  );
}
