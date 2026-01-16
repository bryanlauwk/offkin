import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { useQuizStats } from '@/hooks/useQuizStats';
import { ToastingMarshmallowVisual } from './visuals/ToastingMarshmallowVisual';

interface ToastChallengeProps {
  sessionId: string;
  onComplete: (waitTime: number, passed: boolean) => void;
}

const REQUIRED_TIME = 60;

function getButtonLabel(seconds: number): string {
  if (seconds >= 60) return "Perfect Toast ✓";
  if (seconds >= 50) return "Almost There...";
  if (seconds >= 30) return "Still Toasting";
  if (seconds >= 10) return "Too Soon!";
  return "Way Too Soon!";
}

export function ToastChallenge({ sessionId, onComplete }: ToastChallengeProps) {
  const [seconds, setSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { playTick, playVictory, playFail } = useSound();
  const { submitResponse } = useQuizStats();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1;
        
        // Play tick every 15 seconds
        if (newSeconds % 15 === 0 && newSeconds < REQUIRED_TIME) {
          playTick();
        }
        
        // Play victory sound at 60 seconds
        if (newSeconds === REQUIRED_TIME) {
          playVictory();
        }
        
        return newSeconds;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playTick, playVictory]);

  const handleComplete = async (waitTime: number, passed: boolean) => {
    if (isComplete) return;
    
    setIsComplete(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Play appropriate sound
    if (!passed) {
      playFail();
    }
    
    // Submit to database (using level 11 for toast challenge)
    await submitResponse(11, passed ? 'later' : 'now', sessionId, waitTime);
    
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

  const toastProgress = Math.max(0, Math.min(1, (seconds - 30) / 30));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12"
    >
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-serif text-2xl md:text-3xl font-bold mb-2 text-center"
      >
        The Final Test
      </motion.h2>
      
      <p className="font-serif text-lg text-muted-foreground italic mb-6 text-center">
        Wait for the perfect toast.
      </p>

      {/* Toasting marshmallow visual */}
      <ToastingMarshmallowVisual seconds={seconds} maxSeconds={REQUIRED_TIME} />

      {/* Timer - Large and centered */}
      <motion.div 
        className="my-6"
        animate={seconds >= 50 && seconds < REQUIRED_TIME ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <span className="font-mono text-5xl md:text-6xl lg:text-7xl font-bold">
          {formatTime(seconds)}
        </span>
      </motion.div>

      {/* The Finish Button */}
      {!isComplete ? (
        <motion.button
          className="btn-choice text-lg md:text-xl px-12 py-6"
          onClick={handleButtonClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={seconds >= REQUIRED_TIME ? { 
            boxShadow: ['0 0 0 0 hsl(var(--primary) / 0)', '0 0 20px 10px hsl(var(--primary) / 0.3)', '0 0 0 0 hsl(var(--primary) / 0)']
          } : seconds < 10 ? { 
            x: [0, -2, 2, -2, 2, 0],
          } : {}}
          transition={{ duration: seconds >= REQUIRED_TIME ? 1.5 : 0.5, repeat: Infinity }}
        >
          {getButtonLabel(seconds)}
        </motion.button>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="font-serif text-2xl md:text-3xl font-bold italic">
            {seconds >= REQUIRED_TIME ? "Perfectly Toasted." : "You rushed it."}
          </p>
          <p className="font-serif text-lg text-muted-foreground mt-2 italic">
            {seconds >= REQUIRED_TIME 
              ? "Patience has its rewards." 
              : `You only waited ${seconds} seconds.`}
          </p>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="mt-12 w-full max-w-md">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full transition-colors duration-500"
            style={{
              background: toastProgress > 0 
                ? `linear-gradient(90deg, hsl(40 30% 80%), hsl(${30 - toastProgress * 20} ${40 + toastProgress * 30}% ${70 - toastProgress * 30}%))` 
                : 'hsl(var(--foreground))'
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((seconds / REQUIRED_TIME) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-muted-foreground">
          <span>Raw</span>
          <span>Golden</span>
          <span>Perfect</span>
        </div>
      </div>
    </motion.div>
  );
}