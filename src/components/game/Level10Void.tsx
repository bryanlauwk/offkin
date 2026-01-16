import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';
import { philosophicalTexts } from '@/lib/gameData';

interface Level10VoidProps {
  sessionId: string;
  onComplete: (idleTime: number) => void;
}

export function Level10Void({ sessionId, onComplete }: Level10VoidProps) {
  const [idleTime, setIdleTime] = useState(0);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [showPhilosophicalText, setShowPhilosophicalText] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [hasStartedIdle, setHasStartedIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const { playClick } = useSound();
  const { submitResponse } = useQuizStats();

  // Track idle time when not hovering button
  useEffect(() => {
    if (!isHoveringButton) {
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
  }, [isHoveringButton]);

  // Start showing philosophical text after 10 seconds of idle
  useEffect(() => {
    if (idleTime >= 10 && !showPhilosophicalText && !hasStartedIdle) {
      setShowPhilosophicalText(true);
      setHasStartedIdle(true);
    }
  }, [idleTime, showPhilosophicalText, hasStartedIdle]);

  // Progress through philosophical texts
  useEffect(() => {
    if (showPhilosophicalText && currentTextIndex < philosophicalTexts.length - 1) {
      textTimerRef.current = setTimeout(() => {
        setCurrentTextIndex(prev => prev + 1);
      }, 4000);
    }

    return () => {
      if (textTimerRef.current) {
        clearTimeout(textTimerRef.current);
      }
    };
  }, [showPhilosophicalText, currentTextIndex]);

  const handleLeave = useCallback(async () => {
    playClick();
    
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    // Submit to database
    await submitResponse(10, 'now', sessionId, totalTime);
    
    onComplete(totalTime);
  }, [playClick, submitResponse, sessionId, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
    >
      {/* The researcher sits down - no lab coat */}
      <motion.div
        className="absolute top-24 left-8 md:left-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <svg viewBox="0 0 80 100" className="w-16 h-24 opacity-60">
          {/* Sitting researcher without lab coat */}
          <circle cx="40" cy="20" r="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Tired eyes */}
          <path d="M34 18 Q36 16 38 18" className="stick-line" fill="none" strokeWidth="2" />
          <path d="M42 18 Q44 16 46 18" className="stick-line" fill="none" strokeWidth="2" />
          {/* Small smile */}
          <path d="M36 26 Q40 28 44 26" className="stick-line" fill="none" strokeWidth="2" />
          {/* Body sitting */}
          <path d="M40 34 L40 55" className="stick-line" strokeWidth="2" />
          {/* Arms resting */}
          <path d="M40 42 L25 55" className="stick-line" strokeWidth="2" />
          <path d="M40 42 L55 55" className="stick-line" strokeWidth="2" />
          {/* Legs crossed */}
          <path d="M40 55 L30 75 L45 70" className="stick-line" strokeWidth="2" />
          <path d="M40 55 L50 75" className="stick-line" strokeWidth="2" />
          {/* Lab coat on floor */}
          <path d="M60 85 Q70 80 75 90" className="stick-line" fill="hsl(var(--muted))" strokeWidth="1.5" opacity="0.4" />
        </svg>
      </motion.div>

      {/* Empty space - no marshmallow */}
      <motion.div
        className="w-32 h-32 mb-12 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Just an empty plate outline, very faint */}
        <svg viewBox="0 0 100 40" className="w-full opacity-20">
          <ellipse cx="50" cy="30" rx="45" ry="8" className="stick-line" fill="none" strokeWidth="1" strokeDasharray="4" />
        </svg>
      </motion.div>

      {/* Philosophical text overlay */}
      <AnimatePresence>
        {showPhilosophicalText && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center max-w-md px-8">
              {philosophicalTexts.slice(0, currentTextIndex + 1).map((text, index) => (
                <motion.p
                  key={index}
                  className="font-mono text-lg md:text-xl text-muted-foreground mb-4 leading-relaxed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  {text}
                </motion.p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The single LEAVE button */}
      <motion.button
        className="btn-choice text-lg px-12 py-6 z-10"
        onClick={handleLeave}
        onMouseEnter={() => setIsHoveringButton(true)}
        onMouseLeave={() => setIsHoveringButton(false)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        LEAVE SIMULATION
      </motion.button>

      {/* Subtle timer in corner */}
      <motion.div
        className="absolute bottom-8 right-8 font-mono text-xs text-muted-foreground/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5 }}
      >
        {idleTime}s
      </motion.div>
    </motion.div>
  );
}
