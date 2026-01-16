import { useRef } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Archetype } from '@/lib/gameData';
import { useSound } from '@/hooks/useSound';

interface ResultsCardProps {
  archetype: Archetype;
  laterCount: number;
  nowCount: number;
  level10IdleTime: number;
  onRestart: () => void;
}

// Philosophical archetype avatars
function ArchetypeAvatar({ archetypeId }: { archetypeId: string }) {
  if (archetypeId === 'stoic') {
    return (
      <svg viewBox="0 0 80 80" className="w-24 h-24">
        {/* Peaceful glow */}
        <motion.circle cx="40" cy="40" r="35" fill="hsl(var(--muted))" opacity="0.15"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        {/* Standing firm */}
        <line x1="40" y1="45" x2="40" y2="70" className="stick-line" strokeWidth="2.5" />
        <path d="M40 70 L32 85" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 70 L48 85" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arms crossed */}
        <path d="M28 55 L52 55" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Head */}
        <circle cx="40" cy="32" r="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Serene closed eyes */}
        <path d="M32 30 Q36 26 40 30" className="stick-line" fill="none" strokeWidth="2" />
        <path d="M40 30 Q44 26 48 30" className="stick-line" fill="none" strokeWidth="2" />
        {/* Calm smile */}
        <path d="M34 40 Q40 44 46 40" className="stick-line" fill="none" strokeWidth="2" />
      </svg>
    );
  }

  if (archetypeId === 'hedonist') {
    return (
      <svg viewBox="0 0 80 80" className="w-24 h-24">
        {/* Joyful figure surrounded by marshmallows */}
        <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          {/* Body dancing */}
          <line x1="40" y1="45" x2="40" y2="65" className="stick-line" strokeWidth="2.5" />
          <path d="M40 65 L30 80" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M40 65 L50 80" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          {/* Arms up celebrating */}
          <path d="M40 50 L25 38" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M40 50 L55 38" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          {/* Head */}
          <circle cx="40" cy="32" r="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          {/* Happy eyes */}
          <circle cx="34" cy="30" r="3" className="stick-fill" />
          <circle cx="46" cy="30" r="3" className="stick-fill" />
          {/* Big smile */}
          <path d="M32 38 Q40 48 48 38" className="stick-line" fill="none" strokeWidth="2" />
        </motion.g>
        {/* Floating marshmallows */}
        <motion.ellipse cx="15" cy="50" rx="6" ry="8" fill="hsl(40 30% 96%)" stroke="hsl(30 20% 60%)" strokeWidth="1"
          animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.ellipse cx="65" cy="45" rx="5" ry="7" fill="hsl(40 30% 96%)" stroke="hsl(30 20% 60%)" strokeWidth="1"
          animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
      </svg>
    );
  }

  if (archetypeId === 'skeptic') {
    return (
      <svg viewBox="0 0 80 80" className="w-24 h-24">
        {/* Standing with arms crossed, eyebrow raised */}
        <line x1="40" y1="48" x2="40" y2="70" className="stick-line" strokeWidth="2.5" />
        <path d="M40 70 L32 85" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 70 L48 85" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arms crossed */}
        <path d="M28 58 L52 52" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 52 L52 58" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Head */}
        <circle cx="40" cy="32" r="16" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Skeptical eyes - one eyebrow raised */}
        <circle cx="34" cy="32" r="3" className="stick-fill" />
        <circle cx="46" cy="32" r="3" className="stick-fill" />
        <path d="M28 26 L38 24" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M42 28 L52 26" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        {/* Knowing smirk */}
        <path d="M34 42 Q40 44 48 40" className="stick-line" fill="none" strokeWidth="2" />
      </svg>
    );
  }

  // Nihilist - walking away
  return (
    <svg viewBox="0 0 80 80" className="w-24 h-24">
      <motion.g animate={{ x: [0, 5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        {/* Walking away figure */}
        <line x1="50" y1="45" x2="50" y2="65" className="stick-line" strokeWidth="2.5" />
        <path d="M50 65 L42 80" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M50 65 L58 78" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arms relaxed */}
        <path d="M50 50 L42 60" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M50 50 L60 55" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        {/* Head looking back slightly */}
        <circle cx="50" cy="32" r="14" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        {/* Knowing eyes */}
        <circle cx="45" cy="30" r="2" className="stick-fill" />
        <circle cx="53" cy="30" r="2" className="stick-fill" />
        {/* Slight smile */}
        <path d="M44 38 Q50 40 54 38" className="stick-line" fill="none" strokeWidth="2" />
      </motion.g>
      {/* Empty plate left behind */}
      <ellipse cx="20" cy="75" rx="12" ry="3" className="stick-line" fill="none" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

export function ResultsCard({ archetype, laterCount, nowCount, level10IdleTime, onRestart }: ResultsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { playClick } = useSound();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    playClick();
    try {
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `marshmallow-evolution-${archetype.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleShare = () => {
    playClick();
    const shareText = `I got ${archetype.name} on The Marshmallow Evolution`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'The Marshmallow Evolution', text: shareText, url: shareUrl }).catch(() => {});
    } else {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12"
    >
      <div ref={cardRef} className="bg-background p-8 md:p-12 max-w-md w-full mb-8 border-2 border-foreground">
        <div className="text-center mb-6">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">SUBJECT PROFILE</p>
        </div>

        <div className="flex justify-center mb-6">
          <ArchetypeAvatar archetypeId={archetype.id} />
        </div>

        <div className="text-center mb-6">
          <h2 className="font-mono text-2xl md:text-3xl font-bold mb-2">{archetype.name}</h2>
          <p className="font-mono text-sm text-muted-foreground italic">{archetype.title}</p>
        </div>

        <p className="font-mono text-center text-sm text-muted-foreground mb-8 leading-relaxed">
          {archetype.description}
        </p>

        <div className="flex justify-center gap-8 text-center font-mono">
          <div>
            <p className="text-2xl font-bold">{laterCount}/9</p>
            <p className="text-xs text-muted-foreground">Waited</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{nowCount}/9</p>
            <p className="text-xs text-muted-foreground">Ate</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{level10IdleTime}s</p>
            <p className="text-xs text-muted-foreground">Void</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={handleDownload} className="btn-choice px-6 py-3 text-sm font-mono">Download</button>
        <button onClick={handleShare} className="btn-choice px-6 py-3 text-sm font-mono">Share</button>
      </div>

      <button
        onClick={() => { playClick(); onRestart(); }}
        className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
      >
        Take Test Again
      </button>
    </motion.div>
  );
}
