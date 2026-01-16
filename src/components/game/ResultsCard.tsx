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

// Improved chibi avatar based on archetype with filled hair
function ChibiAvatar({ archetypeId }: { archetypeId: string }) {
  if (archetypeId === 'toddler') {
    // Impulsive - fallen/chaotic chibi
    return (
      <svg viewBox="0 0 80 80" className="w-24 h-24">
        {/* Fallen body - twisted */}
        <ellipse cx="48" cy="55" rx="16" ry="11" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" transform="rotate(-25 48 55)" />
        {/* Legs splayed */}
        <path d="M58 62 Q70 56 75 65" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M62 68 Q70 75 72 80" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arms flailing */}
        <path d="M38 50 Q25 42 18 48" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 60 Q28 65 22 62" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        {/* Head */}
        <ellipse cx="32" cy="36" rx="18" ry="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Hair - FILLED */}
        <path 
          d="M16 28 Q20 14 32 10 Q44 14 48 28 L45 26 Q40 18 32 16 Q24 18 19 26 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Messy strands from fall */}
        <path d="M18 24 Q14 18 20 14" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 22 Q52 16 48 12" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Dizzy spiral eyes */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '26px 34px' }}
        >
          <path d="M24 34 Q26 32 28 34 Q26 36 24 34" className="stick-line" fill="none" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '38px 34px' }}
        >
          <path d="M36 34 Q38 32 40 34 Q38 36 36 34" className="stick-line" fill="none" strokeWidth="1.5" />
        </motion.g>
        {/* Dazed wavy mouth */}
        <path d="M26 46 Q29 44 32 46 Q35 44 38 46" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        {/* Stars spinning */}
        <motion.text 
          x="50" y="22" 
          className="stick-fill" 
          fontSize="10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '50px 22px' }}
        >✱</motion.text>
        <motion.text 
          x="10" y="50" 
          className="stick-fill" 
          fontSize="8"
          animate={{ rotate: [0, -360] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '10px 50px' }}
        >✱</motion.text>
        {/* Cheek blush */}
        <ellipse cx="22" cy="40" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.5" />
        <ellipse cx="42" cy="40" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.5" />
      </svg>
    );
  }

  if (archetypeId === 'monk') {
    // Zen master - peaceful meditation pose with glow
    return (
      <svg viewBox="0 0 80 80" className="w-24 h-24">
        {/* Peaceful glow behind */}
        <motion.circle 
          cx="40" cy="40" r="35" 
          fill="hsl(var(--muted))" 
          opacity="0.15"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Sitting body */}
        <ellipse cx="40" cy="58" rx="20" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Crossed legs */}
        <path d="M26 64 Q22 72 28 76" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M54 64 Q58 72 52 76" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arms in meditation mudra pose */}
        <path d="M24 55 Q16 62 22 70" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M56 55 Q64 62 58 70" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Hands together in lap */}
        <ellipse cx="40" cy="66" rx="8" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        {/* Head */}
        <ellipse cx="40" cy="35" rx="18" ry="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Hair - FILLED, neat and calm */}
        <path 
          d="M24 28 Q28 14 40 10 Q52 14 56 28 L53 26 Q48 18 40 16 Q32 18 27 26 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        {/* Serene closed eyes - upward curves showing contentment */}
        <path d="M32 33 Q36 29 40 33" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 33 Q44 29 48 33" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Peaceful serene smile */}
        <path d="M34 43 Q40 48 46 43" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Halo/enlightenment circle */}
        <motion.circle 
          cx="40" cy="5" r="8" 
          className="stick-line" 
          fill="none" 
          strokeWidth="1.5" 
          strokeDasharray="3"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '40px 5px' }}
        />
        {/* Cheek blush - subtle peace */}
        <ellipse cx="28" cy="38" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.35" />
        <ellipse cx="52" cy="38" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.35" />
        {/* Small sparkles of zen */}
        <motion.text 
          x="12" y="25" 
          className="stick-fill" 
          fontSize="6"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >✦</motion.text>
        <motion.text 
          x="62" y="22" 
          className="stick-fill" 
          fontSize="5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >✦</motion.text>
      </svg>
    );
  }

  // Default - balanced/normal happy chibi
  return (
    <svg viewBox="0 0 80 80" className="w-24 h-24">
      {/* Body standing confidently */}
      <ellipse cx="40" cy="56" rx="16" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      {/* Legs */}
      <path d="M32 65 Q28 74 32 80" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 65 Q52 74 48 80" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arms - one up in friendly wave, one at side */}
      <path d="M26 52 Q18 48 14 38" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M54 52 Q62 58 60 68" className="stick-line" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      {/* Waving hand */}
      <motion.ellipse 
        cx="12" cy="36" rx="5" ry="4" 
        className="stick-line" 
        fill="hsl(var(--background))" 
        strokeWidth="2"
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ transformOrigin: '12px 36px' }}
      />
      {/* Head */}
      <ellipse cx="40" cy="32" rx="20" ry="18" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
      {/* Hair - FILLED */}
      <path 
        d="M22 24 Q26 8 40 5 Q54 8 58 24 L55 22 Q50 14 40 12 Q30 14 25 22 Z" 
        className="hair-fill"
        strokeWidth="2"
      />
      {/* Hair highlights */}
      <path d="M30 14 Q38 8 46 12" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      {/* Hair tuft */}
      <path d="M40 5 Q42 0 46 4" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
      {/* Happy bright eyes */}
      <ellipse cx="32" cy="30" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
      <ellipse cx="48" cy="30" rx="6" ry="7" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
      <circle cx="32" cy="31" r="3" className="stick-fill" />
      <circle cx="48" cy="31" r="3" className="stick-fill" />
      {/* Eye shines */}
      <circle cx="30" cy="29" r="1.5" fill="hsl(var(--background))" />
      <circle cx="46" cy="29" r="1.5" fill="hsl(var(--background))" />
      {/* Happy eyebrows */}
      <path d="M26 22 Q32 20 38 23" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 23 Q48 20 54 22" className="stick-line" fill="none" strokeWidth="1.5" strokeLinecap="round" />
      {/* Big happy smile */}
      <path d="M32 42 Q40 50 48 42" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
      {/* Cheek blush */}
      <ellipse cx="24" cy="36" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.4" />
      <ellipse cx="56" cy="36" rx="4" ry="2.5" fill="hsl(0 60% 75%)" opacity="0.4" />
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
