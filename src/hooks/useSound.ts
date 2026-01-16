import { useCallback, useRef, useEffect } from 'react';

// Audio context for generating sounds programmatically
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  const playChoiceNow = useCallback(() => {
    // Buzzer sound - descending tones
    playTone(400, 0.15, 'sawtooth', 0.25);
    setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.2), 100);
    setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.15), 200);
  }, [playTone]);

  const playChoiceLater = useCallback(() => {
    // Heavenly choir - ascending tones
    playTone(523, 0.3, 'sine', 0.2); // C5
    setTimeout(() => playTone(659, 0.3, 'sine', 0.2), 100); // E5
    setTimeout(() => playTone(784, 0.4, 'sine', 0.2), 200); // G5
    setTimeout(() => playTone(1047, 0.5, 'sine', 0.15), 300); // C6
  }, [playTone]);

  const playTick = useCallback(() => {
    playTone(1000, 0.05, 'square', 0.1);
  }, [playTone]);

  const playVictory = useCallback(() => {
    // Fanfare
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'triangle', 0.25), i * 150);
    });
  }, [playTone]);

  const playFail = useCallback(() => {
    // Sad trombone
    playTone(392, 0.3, 'sawtooth', 0.2);
    setTimeout(() => playTone(370, 0.3, 'sawtooth', 0.2), 300);
    setTimeout(() => playTone(349, 0.3, 'sawtooth', 0.2), 600);
    setTimeout(() => playTone(330, 0.5, 'sawtooth', 0.2), 900);
  }, [playTone]);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
  }, []);

  return {
    playClick,
    playChoiceNow,
    playChoiceLater,
    playTick,
    playVictory,
    playFail,
    setEnabled,
  };
}
