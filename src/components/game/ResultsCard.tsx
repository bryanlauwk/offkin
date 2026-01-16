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

// Chibi archetype avatars matching StartScreen style
function ArchetypeAvatar({ archetypeId }: { archetypeId: string }) {
  if (archetypeId === 'stoic') {
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-32">
        {/* Peaceful glow */}
        <motion.circle 
          cx="50" cy="55" r="40" 
          fill="hsl(var(--muted))" 
          opacity="0.15"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Chibi head - meditating */}
        <ellipse cx="50" cy="40" rx="28" ry="25" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M24 32 Q28 12 50 8 Q72 12 76 32 Q73 20 50 16 Q30 20 26 32 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        <path d="M32 22 Q42 14 52 20" stroke="hsl(var(--background))" strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
        
        {/* Serene closed eyes */}
        <path d="M36 40 Q42 36 48 40" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 40 Q58 36 64 40" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Peaceful smile */}
        <path d="M42 52 Q50 58 58 52" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <ellipse cx="32" cy="46" rx="5" ry="3" fill="hsl(0 50% 80%)" opacity="0.4" />
        <ellipse cx="68" cy="46" rx="5" ry="3" fill="hsl(0 50% 80%)" opacity="0.4" />
        
        {/* Sitting body - lotus position */}
        <ellipse cx="50" cy="82" rx="18" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Crossed legs */}
        <path d="M35 88 Q28 95 35 105" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M65 88 Q72 95 65 105" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M35 105 Q50 95 65 105" className="stick-line" strokeWidth="2" strokeLinecap="round" />
        
        {/* Hands in meditation pose */}
        <path d="M35 78 Q25 82 30 92" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M65 78 Q75 82 70 92" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="30" cy="94" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="70" cy="94" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
      </svg>
    );
  }

  if (archetypeId === 'hedonist') {
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-32">
        {/* Floating marshmallows */}
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ellipse cx="20" cy="50" rx="7" ry="10" fill="hsl(40 30% 96%)" stroke="hsl(30 20% 60%)" strokeWidth="1" />
          <circle cx="18" cy="48" r="1" fill="hsl(30 25% 25%)" />
          <circle cx="22" cy="48" r="1" fill="hsl(30 25% 25%)" />
        </motion.g>
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <ellipse cx="80" cy="45" rx="6" ry="9" fill="hsl(40 30% 96%)" stroke="hsl(30 20% 60%)" strokeWidth="1" />
          <circle cx="78" cy="43" r="1" fill="hsl(30 25% 25%)" />
          <circle cx="82" cy="43" r="1" fill="hsl(30 25% 25%)" />
        </motion.g>
        
        {/* Dancing chibi */}
        <motion.g
          animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '50px 70px' }}
        >
          {/* Chibi head */}
          <ellipse cx="50" cy="40" rx="26" ry="24" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Hair */}
          <path 
            d="M26 34 Q30 14 50 10 Q70 14 74 34 Q71 22 50 18 Q32 22 28 34 Z" 
            className="hair-fill"
            strokeWidth="2"
          />
          
          {/* Happy sparkly eyes */}
          <ellipse cx="40" cy="38" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="60" cy="38" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="40" cy="39" rx="3" ry="4" className="stick-fill" />
          <ellipse cx="60" cy="39" rx="3" ry="4" className="stick-fill" />
          <circle cx="38" cy="36" r="1.5" fill="hsl(var(--background))" />
          <circle cx="58" cy="36" r="1.5" fill="hsl(var(--background))" />
          
          {/* Big happy smile */}
          <path d="M40 50 Q50 60 60 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
          
          {/* Rosy cheeks */}
          <ellipse cx="30" cy="45" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.5" />
          <ellipse cx="70" cy="45" rx="5" ry="3" fill="hsl(350 70% 75%)" opacity="0.5" />
          
          {/* Body */}
          <ellipse cx="50" cy="78" rx="14" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
          
          {/* Arms up celebrating */}
          <path d="M38 72 L25 55" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62 72 L75 55" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="23" cy="53" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          <ellipse cx="77" cy="53" rx="4" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
          
          {/* Legs */}
          <path d="M44 88 L40 108" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M56 88 L60 108" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>
      </svg>
    );
  }

  if (archetypeId === 'skeptic') {
    return (
      <svg viewBox="0 0 100 120" className="w-28 h-32">
        {/* Chibi with arms crossed, eyebrow raised */}
        <ellipse cx="50" cy="40" rx="26" ry="24" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M26 34 Q30 14 50 10 Q70 14 74 34 Q71 22 50 18 Q32 22 28 34 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        
        {/* One raised eyebrow */}
        <path d="M32 28 L44 26" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        <path d="M56 30 L68 32" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Skeptical eyes */}
        <ellipse cx="40" cy="38" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="60" cy="38" rx="5" ry="6" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="41" cy="39" rx="3" ry="4" className="stick-fill" />
        <ellipse cx="61" cy="39" rx="3" ry="4" className="stick-fill" />
        <circle cx="40" cy="37" r="1.5" fill="hsl(var(--background))" />
        <circle cx="60" cy="37" r="1.5" fill="hsl(var(--background))" />
        
        {/* Smirk */}
        <path d="M42 52 Q50 54 60 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Rosy cheeks */}
        <ellipse cx="30" cy="46" rx="4" ry="2.5" fill="hsl(0 50% 80%)" opacity="0.35" />
        <ellipse cx="70" cy="46" rx="4" ry="2.5" fill="hsl(0 50% 80%)" opacity="0.35" />
        
        {/* Body - arms crossed */}
        <ellipse cx="50" cy="78" rx="14" ry="12" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Crossed arms */}
        <path d="M38 72 L62 82" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M62 72 L38 82" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Legs standing firm */}
        <path d="M44 88 L40 110" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M56 88 L60 110" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="38" cy="112" rx="5" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="62" cy="112" rx="5" ry="3" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
      </svg>
    );
  }

  // Nihilist - walking away with empty plate behind
  return (
    <svg viewBox="0 0 100 120" className="w-28 h-32">
      {/* Empty plate left behind */}
      <ellipse cx="25" cy="105" rx="15" ry="4" className="stick-line" fill="none" strokeWidth="1.5" opacity="0.3" strokeDasharray="4" />
      
      {/* Chibi walking away, looking back */}
      <motion.g
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Chibi head - looking back over shoulder */}
        <ellipse cx="60" cy="40" rx="24" ry="22" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Hair */}
        <path 
          d="M38 34 Q42 16 60 12 Q78 16 82 34 Q79 24 60 20 Q44 24 40 34 Z" 
          className="hair-fill"
          strokeWidth="2"
        />
        
        {/* Knowing eyes looking back */}
        <ellipse cx="52" cy="38" rx="4" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="68" cy="38" rx="4" ry="5" className="stick-line" fill="hsl(var(--background))" strokeWidth="1.5" />
        <ellipse cx="50" cy="39" rx="2" ry="3" className="stick-fill" />
        <ellipse cx="66" cy="39" rx="2" ry="3" className="stick-fill" />
        <circle cx="49" cy="37" r="1" fill="hsl(var(--background))" />
        <circle cx="65" cy="37" r="1" fill="hsl(var(--background))" />
        
        {/* Slight knowing smile */}
        <path d="M54 50 Q60 52 66 50" className="stick-line" fill="none" strokeWidth="2" strokeLinecap="round" />
        
        {/* Subtle cheeks */}
        <ellipse cx="44" cy="44" rx="4" ry="2.5" fill="hsl(0 50% 80%)" opacity="0.25" />
        <ellipse cx="76" cy="44" rx="4" ry="2.5" fill="hsl(0 50% 80%)" opacity="0.25" />
        
        {/* Body walking */}
        <ellipse cx="60" cy="74" rx="12" ry="10" className="stick-line" fill="hsl(var(--background))" strokeWidth="2" />
        
        {/* Arms relaxed at sides */}
        <path d="M50 68 L45 82" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M70 68 L75 82" className="stick-line" strokeWidth="2.5" strokeLinecap="round" />
        
        {/* Walking legs */}
        <motion.path 
          d="M54 82 L48 105" 
          className="stick-line" 
          strokeWidth="2.5" 
          strokeLinecap="round"
          animate={{ d: ["M54 82 L48 105", "M54 82 L52 105", "M54 82 L48 105"] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.path 
          d="M66 82 L72 105" 
          className="stick-line" 
          strokeWidth="2.5" 
          strokeLinecap="round"
          animate={{ d: ["M66 82 L72 105", "M66 82 L68 105", "M66 82 L72 105"] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
        />
      </motion.g>
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
    const shareText = `I got ${archetype.name} on The Absurd Marshmallow Test`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: 'The Absurd Marshmallow Test', text: shareText, url: shareUrl }).catch(() => {});
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
      <div 
        ref={cardRef} 
        className="bg-background p-8 md:p-12 max-w-md w-full mb-8 border-2 border-foreground rounded-lg"
        style={{ borderRadius: '12px' }}
      >
        <div className="text-center mb-4">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">SUBJECT PROFILE</p>
        </div>

        <div className="flex justify-center mb-4">
          <ArchetypeAvatar archetypeId={archetype.id} />
        </div>

        <div className="text-center mb-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold italic mb-2">{archetype.name}</h2>
          <p className="font-mono text-sm text-muted-foreground">{archetype.title}</p>
        </div>

        <p className="font-serif text-center text-sm text-muted-foreground mb-8 leading-relaxed italic">
          "{archetype.description}"
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
