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
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12"
    >
      {/* Timer - Large and centered */}
      <motion.div 
        className="mb-8"
        animate={seconds >= 50 && seconds < REQUIRED_TIME ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <span className="font-mono text-7xl md:text-8xl lg:text-9xl font-bold">
          {formatTime(seconds)}
        </span>
      </motion.div>

      {/* Instructions - Italic serif */}
      <p className="font-serif text-xl md:text-2xl text-center italic text-muted-foreground mb-12">
        Do not press the button for 60 seconds.
      </p>

      {/* The Big Button */}
      {!isComplete ? (
        <motion.button
          className="btn-choice text-lg md:text-xl px-12 py-6"
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
          className="text-center"
        >
          <p className="font-serif text-2xl md:text-3xl font-bold italic">
            {seconds >= REQUIRED_TIME ? "Impressive." : "You pressed it."}
          </p>
          <p className="font-serif text-lg text-muted-foreground mt-2 italic">
            {seconds >= REQUIRED_TIME 
              ? "60 seconds of pure restraint." 
              : `You lasted ${seconds} seconds.`}
          </p>
        </motion.div>
      )}

      {/* Progress bar - minimal */}
      <div className="mt-12 w-full max-w-md h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((seconds / REQUIRED_TIME) * 100, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}
