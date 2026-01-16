import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';

interface TimerChallengeProps {
  sessionId: string;
  onComplete: (waitTime: number, passed: boolean) => void;
}

const REQUIRED_TIME = 60;

function getButtonLabel(seconds: number): string {
  if (seconds >= 59) return "ALMOST THERE";
  if (seconds >= 30) return "Get a Silver Result";
  if (seconds >= 10) return "Get a Bronze Result";
  return "Finish Quiz";
}

export function TimerChallenge({ sessionId, onComplete }: TimerChallengeProps) {
  const [seconds, setSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { playTick, playVictory, playFail } = useSound();
  const { submitResponse } = useQuizStats();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1;
        
        // Play tick every 10 seconds
        if (newSeconds % 10 === 0 && newSeconds < REQUIRED_TIME) {
          playTick();
        }
        
        // Auto-complete at 60 seconds
        if (newSeconds >= REQUIRED_TIME && !isComplete) {
          handleComplete(newSeconds, true);
        }
        
        return newSeconds;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleComplete = async (waitTime: number, passed: boolean) => {
    if (isComplete) return;
    
    setIsComplete(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Play appropriate sound
    if (passed) {
      playVictory();
    } else {
      playFail();
    }
    
    // Submit to database
    await submitResponse(7, passed ? 'later' : 'now', sessionId, waitTime);
    
    // Delay before showing results
    setTimeout(() => {
      onComplete(waitTime, passed);
    }, 1500);
  };

  const handleButtonClick = () => {
    if (!isComplete) {
      handleComplete(seconds, seconds >= REQUIRED_TIME);
    }
  };

  const formatTime = (s: number): string => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="paper-container max-w-lg text-center">
        {/* Level indicator */}
        <div className="flex items-center justify-center mb-4">
          <span className="font-mono text-sm text-muted-foreground">
            Level 7 of 7 - THE FINAL TEST
          </span>
        </div>

        {/* Title */}
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
          The Meta-Test
        </h2>

        {/* Instructions */}
        <p className="font-sans text-muted-foreground mb-8">
          Do not press the button for 60 seconds.
        </p>

        {/* Timer */}
        <motion.div 
          className="mb-8"
          animate={seconds >= 50 && seconds < REQUIRED_TIME ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className="font-mono text-6xl md:text-7xl font-bold">
            {formatTime(seconds)}
          </span>
        </motion.div>

        {/* The Big Red Button */}
        {!isComplete ? (
          <motion.button
            className="btn-now px-12 py-6 text-xl font-bold"
            onClick={handleButtonClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={seconds < 10 ? { 
              x: [0, -2, 2, -2, 2, 0],
            } : {}}
            transition={{ duration: 0.5, repeat: seconds < 10 ? Infinity : 0 }}
          >
            {getButtonLabel(seconds)}
          </motion.button>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-6"
          >
            <p className="font-serif text-2xl font-bold">
              {seconds >= REQUIRED_TIME ? "Impressive." : "You pressed it."}
            </p>
            <p className="font-sans text-muted-foreground mt-2">
              {seconds >= REQUIRED_TIME 
                ? "60 seconds of pure restraint." 
                : `You lasted ${seconds} seconds.`}
            </p>
          </motion.div>
        )}

        {/* Progress bar */}
        <div className="mt-8 h-2 border border-foreground bg-background">
          <motion.div
            className="h-full bg-foreground"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((seconds / REQUIRED_TIME) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="font-mono text-xs mt-2 text-muted-foreground">
          {Math.min(seconds, REQUIRED_TIME)} / {REQUIRED_TIME} seconds
        </p>
      </div>
    </motion.div>
  );
}
