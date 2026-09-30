import { useCallback, useRef, useEffect } from 'react';

// Audio context for generating sounds programmatically
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function useSound() {
  const isEnabledRef = useRef(true);

  // Resume audio context on first user interaction
  useEffect(() => {
    const resumeAudio = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
    };
    
    document.addEventListener('click', resumeAudio, { once: true });
    return () => document.removeEventListener('click', resumeAudio);
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!isEnabledRef.current) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not available
    }
  }, []);

  const playClick = useCallback(() => {
    playTone(800, 0.1, 'square', 0.2);
  }, [playTone]);

  // Cooperate sound - satisfying "Pop!" / "Ding!"
  const playCooperate = useCallback(() => {
    playTone(880, 0.15, 'sine', 0.3);  // A5
    setTimeout(() => playTone(1108, 0.2, 'sine', 0.25), 80); // C#6
  }, [playTone]);

  // Defect sound - comical "Bonk"
  const playDefect = useCallback(() => {
    playTone(200, 0.1, 'square', 0.3);
    setTimeout(() => playTone(150, 0.15, 'sawtooth', 0.25), 50);
  }, [playTone]);

  // Win-Win outcome - confetti celebration
  const playWinWin = useCallback(() => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 100);
    });
  }, [playTone]);

  // You Betray - evil laugh
  const playYouBetray = useCallback(() => {
    playTone(349, 0.15, 'sawtooth', 0.2);
    setTimeout(() => playTone(440, 0.15, 'sawtooth', 0.2), 100);
    setTimeout(() => playTone(349, 0.2, 'sawtooth', 0.15), 200);
  }, [playTone]);

  // They Betray - sad trombone
  const playTheyBetray = useCallback(() => {
    playTone(392, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playTone(370, 0.3, 'sawtooth', 0.2), 300);
    setTimeout(() => playTone(349, 0.3, 'sawtooth', 0.2), 600);
    setTimeout(() => playTone(330, 0.5, 'sawtooth', 0.2), 900);
  }, [playTone]);

  // Both Betray - explosion chaos
  const playBothBetray = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(100 + Math.random() * 200, 0.1, 'sawtooth', 0.15);
      }, i * 50);
    }
    setTimeout(() => playTone(80, 0.3, 'square', 0.2), 250);
  }, [playTone]);

  // Gloop eating sound (Level 9)
  const playGloop = useCallback(() => {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        playTone(150 + Math.random() * 100, 0.15, 'sine', 0.2);
      }, i * 100);
    }
  }, [playTone]);

  // Thinking suspense tick
  const playTick = useCallback(() => {
    playTone(600, 0.05, 'square', 0.1);
  }, [playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
  }, []);

  return {
    playClick,
    playCooperate,
    playDefect,
    playWinWin,
    playYouBetray,
    playTheyBetray,
    playBothBetray,
    playGloop,
    playTick,
    setEnabled,
  };
}
