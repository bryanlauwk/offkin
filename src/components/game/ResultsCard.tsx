import { useRef } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Archetype } from '@/lib/gameData';
import { Choice } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';

interface ResultsCardProps {
  archetype: Archetype;
  choices: (Choice | null)[];
  level7WaitTime: number | null;
  onRestart: () => void;
}

// Chibi avatar based on archetype
function ChibiAvatar({ archetypeId }: { archetypeId: string }) {
  if (archetypeId === 'toddler') {
    // Impulsive - fallen/chaotic chibi
    return (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        {/* Fallen body */}
        <ellipse cx="45" cy="55" rx="15" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" transform="rotate(-20 45 55)" />
        {/* Legs splayed */}
        <path d="M55 60 Q65 55 70 62" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 65 Q65 70 68 75" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Arms */}
        <path d="M35 50 Q25 45 20 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 58 Q30 62 25 60" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Head */}
        <ellipse cx="32" cy="38" rx="16" ry="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Hair */}
        <path d="M18 30 Q22 18 32 15 Q42 18 46 30" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Dizzy eyes */}
        <circle cx="26" cy="36" r="3" className="stick-line" fill="none" strokeWidth="1.5" />
        <circle cx="38" cy="36" r="3" className="stick-line" fill="none" strokeWidth="1.5" />
        {/* Swirl in eyes */}
        <path d="M25 35 Q27 37 25 37" className="stick-line" fill="none" strokeWidth="1" />
        <path d="M37 35 Q39 37 37 37" className="stick-line" fill="none" strokeWidth="1" />
        {/* Dazed mouth */}
        <path d="M28 46 Q32 44 36 46" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        {/* Stars */}
        <text x="48" y="25" className="stick-fill" fontSize="8">✱</text>
        <text x="12" y="50" className="stick-fill" fontSize="6">✱</text>
      </svg>
    );
  }

  if (archetypeId === 'monk') {
    // Zen master - peaceful meditation pose
    return (
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        {/* Sitting body */}
        <ellipse cx="40" cy="58" rx="18" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Crossed legs */}
        <path d="M28 62 Q25 68 30 72" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 62 Q55 68 50 72" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Arms in meditation pose */}
        <path d="M26 55 Q20 60 25 65" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 55 Q60 60 55 65" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Hands together */}
        <ellipse cx="40" cy="62" rx="6" ry="4" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        {/* Head */}
        <ellipse cx="40" cy="38" rx="16" ry="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Peaceful closed eyes */}
        <path d="M32 36 Q36 33 40 36" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M40 36 Q44 33 48 36" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        {/* Serene smile */}
        <path d="M35 44 Q40 47 45 44" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        {/* Halo/glow */}
        <circle cx="40" cy="20" r="8" className="stick-line" fill="none" strokeWidth="1" strokeDasharray="2" opacity="0.5" />
        {/* Cheek blush */}
        <ellipse cx="30" cy="40" rx="3" ry="2" fill="hsl(var(--muted))" opacity="0.35" />
        <ellipse cx="50" cy="40" rx="3" ry="2" fill="hsl(var(--muted))" opacity="0.35" />
      </svg>
    );
  }

  // Default - balanced/normal chibi
  return (
    <svg viewBox="0 0 80 80" className="w-20 h-20">
      {/* Body */}
      <ellipse cx="40" cy="58" rx="15" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      {/* Legs */}
      <path d="M32 66 Q28 74 32 78" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
      <path d="M48 66 Q52 74 48 78" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
      {/* Arms at sides */}
      <path d="M28 55 Q20 60 22 68" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 55 Q60 60 58 68" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
      {/* Head */}
      <ellipse cx="40" cy="35" rx="18" ry="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      {/* Hair */}
      <path d="M24 28 Q28 15 40 12 Q52 15 56 28" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 24 Q35 18 42 16" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      {/* Happy eyes */}
      <ellipse cx="33" cy="33" rx="4" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
      <ellipse cx="47" cy="33" rx="4" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
      <circle cx="33" cy="34" r="2" className="stick-fill" />
      <circle cx="47" cy="34" r="2" className="stick-fill" />
      <circle cx="32" cy="32" r="0.8" fill="hsl(var(--background))" />
      <circle cx="46" cy="32" r="0.8" fill="hsl(var(--background))" />
      {/* Smile */}
      <path d="M35 43 Q40 47 45 43" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      {/* Cheek blush */}
      <ellipse cx="27" cy="38" rx="3" ry="2" fill="hsl(var(--muted))" opacity="0.35" />
      <ellipse cx="53" cy="38" rx="3" ry="2" fill="hsl(var(--muted))" opacity="0.35" />
    </svg>
  );
}

export function ResultsCard({ archetype, choices, level7WaitTime, onRestart }: ResultsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { playClick } = useSound();

  const laterCount = choices.filter(c => c === 'later').length;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    playClick();
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `marshmallow-test-${archetype.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleShare = () => {
    playClick();
    
    const shareText = `I got ${archetype.name} on The Absurd Marshmallow Test`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'The Absurd Marshmallow Test',
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      // Fallback to Twitter
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    playClick();
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12"
    >
      {/* The shareable card */}
      <div 
        ref={cardRef}
        className="bg-background p-8 md:p-12 max-w-md w-full mb-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">
            THE ABSURD MARSHMALLOW TEST
          </p>
        </div>

        {/* Chibi avatar */}
        <div className="flex justify-center mb-8">
          <ChibiAvatar archetypeId={archetype.id} />
        </div>

        {/* Archetype */}
        <div className="text-center mb-6">
          <h2 className="font-serif text-3xl md:text-4xl font-bold italic mb-2">
            {archetype.name}
          </h2>
          <p className="font-mono text-sm text-muted-foreground">
            {archetype.title}
          </p>
        </div>

        {/* Description */}
        <p className="font-serif text-center text-base md:text-lg italic text-muted-foreground mb-8 leading-relaxed">
          {archetype.description}
        </p>

        {/* Stats */}
        <div className="flex justify-center gap-8 text-center">
          <div>
            <p className="font-mono text-3xl font-bold">{laterCount}/6</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">Delayed</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-bold">
              {level7WaitTime !== null ? `${level7WaitTime}s` : '-'}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-1">Timer</p>
          </div>
        </div>
      </div>

      {/* Action buttons - minimal */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleDownload}
          className="btn-choice px-6 py-3 text-sm"
        >
          Download
        </button>
        <button
          onClick={handleShare}
          className="btn-choice px-6 py-3 text-sm"
        >
          Share
        </button>
        <button
          onClick={handleCopyLink}
          className="btn-choice px-6 py-3 text-sm"
        >
          Copy Link
        </button>
      </div>

      {/* Restart */}
      <button
        onClick={() => {
          playClick();
          onRestart();
        }}
        className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
      >
        Take Test Again
      </button>
    </motion.div>
  );
}
